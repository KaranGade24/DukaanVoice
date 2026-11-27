import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import AgentConversation from "../../models/AgentConversation.js";
import Product from "../../models/Product.js";
import Customer from "../../models/Customer.js";
import { resolveShop, serviceError } from "../inventory/inventory.shared.js";
import { createSale, findSaleByIdempotencyKey } from "../sales/sale.service.js";
import { agentConfig } from "./config/agentConfig.js";
import {
  createAgentGraph,
  conversationMessages,
  systemMessage,
} from "./graph/agentGraph.js";
import { saveEditableDraft } from "./tools/draftPersistence.js";

const scoped = async (userId, id) => {
  const shopId = await resolveShop(userId);
  const conversation = await AgentConversation.findOne({
    _id: id,
    userId,
    shopId,
    archivedAt: null,
  });
  if (!conversation)
    throw serviceError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
  return { shopId, conversation };
};

const summarizeErrorChain = (error) => {
  const chain = [];
  const visited = new Set();
  let current = error;
  while (current && typeof current === "object" && !visited.has(current) && chain.length < 4) {
    visited.add(current);
    const providerError = current.response?.data?.error || current.error;
    const status = Number(
      current.statusCode ?? current.status ?? current.response?.status ?? providerError?.code,
    );
    const code = current.code || providerError?.status || providerError?.code;
    const name = current.name;
    const detail = [
      current.message,
      providerError?.message,
    ].filter((value) => typeof value === "string").join(" ").toLowerCase();
    const category = status === 503 || /overload|temporarily unavailable|server busy/.test(detail)
      ? "provider_overloaded"
      : /timeout|timed out|deadline/.test(detail)
        ? "provider_timeout"
        : /fetch failed|econnreset|econnrefused|enotfound|network error/.test(detail)
          ? "provider_network_error"
        : /invalid.argument|invalid request/.test(detail)
          ? "invalid_provider_request"
          : /quota|rate.limit|resource.exhausted/.test(detail)
            ? "provider_quota"
            : null;
    chain.push({
      ...(typeof name === "string" && /^[\w.-]{1,80}$/.test(name)
        ? { name }
        : {}),
      ...(typeof code === "string" && /^[\w.-]{1,80}$/.test(code)
        ? { code }
        : {}),
      ...(Number.isInteger(status) && status > 0 && status < 1000
        ? { status }
        : {}),
      ...(category ? { category } : {}),
    });
    current = current.cause || current.originalError || current.error || providerError;
  }
  return chain;
};

const billPreview = (draft) => {
  const subtotalMinor = draft.items.reduce(
    (sum, line) =>
      sum + Math.round(Math.round(line.sellingPrice * 100) * line.quantity),
    0,
  );
  const discountMinor = Math.round(draft.discount * 100);
  const totalMinor = Math.max(0, subtotalMinor - discountMinor);
  const receivedMinor = Math.round(draft.amountReceived * 100);
  return {
    subtotal: subtotalMinor / 100,
    discount: discountMinor / 100,
    taxAmount: 0,
    grandTotal: totalMinor / 100,
    paymentMethod: draft.paymentMethod,
    amountReceived: receivedMinor / 100,
    change:
      draft.paymentMethod === "CASH"
        ? Math.max(0, receivedMinor - totalMinor) / 100
        : 0,
    balanceDue: draft.paymentMethod === "UDHAR" ? totalMinor / 100 : 0,
  };
};

const draftSignature = (draft) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        items: draft.items.map((line) => ({
          productId: line.productId.toString(),
          quantity: line.quantity,
          sellingPriceMinor: Math.round(line.sellingPrice * 100),
        })),
        discountMinor: Math.round(draft.discount * 100),
        paymentMethod: draft.paymentMethod,
        amountReceivedMinor: Math.round(draft.amountReceived * 100),
        customerId: draft.customerId?.toString() || null,
      }),
    )
    .digest("hex");

const isReadyForSale = (draft, preview) => {
  if (
    !draft.items.length ||
    Math.round(draft.discount * 100) > Math.round(preview.subtotal * 100)
  )
    return false;
  const received = Math.round(draft.amountReceived * 100);
  const total = Math.round(preview.grandTotal * 100);
  if (draft.paymentMethod === "UDHAR") return received === 0;
  if (draft.paymentMethod === "CASH") return received >= total;
  return received === total;
};

const collectToolResults = (messages) => {
  const toolNamesById = new Map();
  for (const message of messages) {
    for (const call of message.tool_calls || []) {
      if (call.id && call.name) toolNamesById.set(call.id, call.name);
    }
  }

  return messages.flatMap((message) => {
    const isToolMessage = message.getType?.() === "tool" || message.type === "tool";
    const name = message.name || toolNamesById.get(message.tool_call_id);
    if (!isToolMessage || !name) return [];
    const content = Array.isArray(message.content)
      ? message.content.map((part) => part.text || "").join("")
      : message.content;
    if (typeof content !== "string") return [];
    try {
      return [{ name, data: JSON.parse(content) }];
    } catch {
      return [];
    }
  });
};

const syncDraftFromPos = async (shopId, conversation, input) => {
  const ids = input.items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length)
    throw serviceError(
      400,
      "DUPLICATE_DRAFT_PRODUCT",
      "Each product can appear only once in the billing draft",
    );
  const products = ids.length
    ? await Product.find({ _id: { $in: ids }, shopId, isArchived: false })
        .select("name unit sellingPrice quantity")
        .lean()
    : [];
  if (products.length !== ids.length)
    throw serviceError(
      400,
      "INVALID_DRAFT_PRODUCT",
      "Every draft product must be active in this shop",
    );
  const byId = new Map(
    products.map((product) => [product._id.toString(), product]),
  );
  const items = input.items.map((item) => {
    const product = byId.get(item.productId);
    if (item.quantity > product.quantity)
      throw serviceError(
        409,
        "INSUFFICIENT_STOCK",
        `${product.name} has only ${product.quantity} ${product.unit} available`,
      );
    return {
      productId: product._id,
      name: product.name,
      unit: product.unit,
      sellingPrice: product.sellingPrice,
      quantity: item.quantity,
      stock: product.quantity,
    };
  });
  const subtotalMinor = items.reduce(
    (sum, line) =>
      sum + Math.round(Math.round(line.sellingPrice * 100) * line.quantity),
    0,
  );
  if (Math.round(input.discount * 100) > subtotalMinor)
    throw serviceError(
      400,
      "DISCOUNT_EXCEEDS_SUBTOTAL",
      "Discount cannot exceed the current item subtotal",
    );
  let customer = null;
  if (input.customerId) {
    customer = await Customer.findOne({ _id: input.customerId, shopId })
      .select("name phone")
      .lean();
    if (!customer)
      throw serviceError(
        400,
        "INVALID_SALE_CUSTOMER",
        "Select a customer from this shop or remove the customer from the bill",
      );
  }
  conversation.draft.items = items;
  conversation.draft.discount = input.discount;
  conversation.draft.paymentMethod = input.paymentMethod;
  conversation.draft.amountReceived =
    input.paymentMethod === "UDHAR" ? 0 : input.amountReceived;
  conversation.draft.customerId = customer?._id || null;
  conversation.draft.customerName = customer?.name || "";
  conversation.pendingAction = {
    token: null,
    expiresAt: null,
    draftSignature: null,
  };
  await saveEditableDraft(conversation);
};

export const chat = async (userId, { conversationId, message, draft, responseLanguage }) => {
  const shopId = await resolveShop(userId);
  let conversation = conversationId
    ? await AgentConversation.findOne({
        _id: conversationId,
        userId,
        shopId,
        archivedAt: null,
      })
    : null;
  if (conversationId && !conversation)
    throw serviceError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
  if (!conversation)
    conversation = await AgentConversation.create({
      userId,
      shopId,
      title: message.slice(0, 80),
    });
  if (draft) await syncDraftFromPos(shopId, conversation, draft);
  if (conversation.confirmationClaimedAt)
    throw serviceError(
      409,
      "SALE_CONFIRMATION_IN_PROGRESS",
      "This bill is being confirmed. Wait for the sale result before continuing.",
    );
  const history = conversation.messages
    .slice(-agentConfig.historyLimit)
    .map(({ role, content }) => ({ role, content }));
  const graph = createAgentGraph({
    userId,
    shopId,
    conversationId: conversation._id,
  });
  let result;
  try {
    result = await graph.invoke(
      {
        messages: [
          systemMessage(responseLanguage),
          ...conversationMessages(history),
          { role: "user", content: message },
        ],
      },
      { recursionLimit: agentConfig.recursionLimit },
    );
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("AI agent request failed", {
      code: error.code || "AI_REQUEST_FAILED",
      errors: summarizeErrorChain(error),
    });
    throw serviceError(
      503,
      "AI_REQUEST_FAILED",
      "The assistant could not complete that request. Please try again.",
    );
  }
  const response = result.messages[result.messages.length - 1]?.content;
  const text =
    typeof response === "string"
      ? response
      : Array.isArray(response)
        ? response.map((part) => part.text || "").join("")
        : "I could not prepare a response. Please try again.";
  conversation = await AgentConversation.findOne({
    _id: conversation._id,
    userId,
    shopId,
    archivedAt: null,
  });
  if (!conversation || conversation.confirmationClaimedAt)
    throw serviceError(
      409,
      "SALE_CONFIRMATION_IN_PROGRESS",
      "This bill is being confirmed. Wait for the sale result before continuing.",
    );
  conversation.messages.push(
    { role: "user", content: message },
    { role: "assistant", content: text },
  );
  conversation.messages = conversation.messages.slice(
    -agentConfig.historyLimit,
  );
  const preview = billPreview(conversation.draft);
  const ready = isReadyForSale(conversation.draft, preview);
  const confirmationToken = ready ? randomBytes(32).toString("hex") : null;
  const signature = ready ? draftSignature(conversation.draft) : null;
  conversation.pendingAction = ready
    ? {
        token: createHash("sha256").update(confirmationToken).digest("hex"),
        expiresAt: new Date(Date.now() + 10 * 60_000),
        draftSignature: signature,
      }
    : { token: null, expiresAt: null, draftSignature: null };
  await conversation.save();
  return {
    conversationId: conversation._id.toString(),
    message: text,
    toolResults: collectToolResults(result.messages),
    data: {
      cart: conversation.draft.items,
      customer: conversation.draft.customerId
        ? {
            id: conversation.draft.customerId.toString(),
            name: conversation.draft.customerName,
          }
        : null,
      billingPreview: preview,
      requiresConfirmation: ready,
      pendingAction: ready
        ? {
            type: "COMPLETE_SALE",
            confirmationToken,
            expiresAt: conversation.pendingAction.expiresAt,
          }
        : null,
    },
  };
};

export const listConversations = async (userId) => {
  const shopId = await resolveShop(userId);
  const items = await AgentConversation.find({
    userId,
    shopId,
    archivedAt: null,
  })
    .select("title updatedAt")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  return items.map((item) => ({
    id: item._id.toString(),
    title: item.title,
    updatedAt: item.updatedAt,
  }));
};

export const getConversation = async (userId, id) => {
  const { conversation } = await scoped(userId, id);
  return {
    id: conversation._id.toString(),
    messages: conversation.messages,
    cart: conversation.draft.items,
    customer: conversation.draft.customerId
      ? {
          id: conversation.draft.customerId.toString(),
          name: conversation.draft.customerName,
        }
      : null,
    billingPreview: billPreview(conversation.draft),
  };
};

export const updateConversationDraft = async (userId, id, draft) => {
  const { shopId, conversation } = await scoped(userId, id);
  if (conversation.confirmationClaimedAt)
    throw serviceError(409, "SALE_CONFIRMATION_IN_PROGRESS", "This bill is being confirmed. Wait for the sale result before editing.");
  await syncDraftFromPos(shopId, conversation, draft);
  const preview = billPreview(conversation.draft);
  const ready = isReadyForSale(conversation.draft, preview);
  const confirmationToken = ready ? randomBytes(32).toString("hex") : null;
  conversation.pendingAction = ready ? {
    token: createHash("sha256").update(confirmationToken).digest("hex"),
    expiresAt: new Date(Date.now() + 10 * 60_000),
    draftSignature: draftSignature(conversation.draft),
  } : { token: null, expiresAt: null, draftSignature: null };
  await conversation.save();
  return {
    conversationId: conversation._id.toString(),
    data: {
      cart: conversation.draft.items,
      customer: conversation.draft.customerId ? { id: conversation.draft.customerId.toString(), name: conversation.draft.customerName } : null,
      billingPreview: preview,
      requiresConfirmation: ready,
      pendingAction: ready ? { type: "COMPLETE_SALE", confirmationToken, expiresAt: conversation.pendingAction.expiresAt } : null,
    },
  };
};

export const archiveConversation = async (userId, id) => {
  const { conversation } = await scoped(userId, id);
  conversation.archivedAt = new Date();
  conversation.pendingAction = {
    token: null,
    expiresAt: null,
    draftSignature: null,
  };
  await conversation.save();
  return { id: conversation._id.toString(), archived: true };
};

export const confirmAction = async (
  userId,
  { conversationId, confirmationToken },
) => {
  const { conversation } = await scoped(userId, conversationId);
  const confirmationHash = createHash("sha256")
    .update(confirmationToken)
    .digest("hex");
  const idempotencyKey =
    "agent-" +
    conversation._id.toString() +
    "-" +
    confirmationHash.slice(0, 24);
  // Let an owner safely retry after a lost response without creating a second sale.
  const existingSale = await findSaleByIdempotencyKey(userId, idempotencyKey);
  if (existingSale) {
    await AgentConversation.updateOne(
      {
        _id: conversation._id,
        userId,
        shopId: conversation.shopId,
        confirmationIdempotencyKey: idempotencyKey,
      },
      {
        $set: {
          draft: {
            items: [],
            discount: 0,
            paymentMethod: "CASH",
            amountReceived: 0,
            customerId: null,
            customerName: "",
          },
          pendingAction: { token: null, expiresAt: null, draftSignature: null },
        },
        $unset: { confirmationClaimedAt: 1, confirmationIdempotencyKey: 1 },
      },
    );
    return { sale: existingSale, conversationId: conversation._id.toString() };
  }
  const pending = conversation.pendingAction;
  const candidate = Buffer.from(confirmationHash, "hex");
  const expected = pending?.token
    ? Buffer.from(pending.token, "hex")
    : Buffer.alloc(candidate.length);
  if (
    !pending?.token ||
    expected.length !== candidate.length ||
    !timingSafeEqual(expected, candidate) ||
    !pending.expiresAt ||
    pending.expiresAt <= new Date()
  )
    throw serviceError(
      409,
      "CONFIRMATION_EXPIRED",
      "This bill confirmation expired. Review the bill and try again.",
    );
  if (!conversation.draft.items.length)
    throw serviceError(
      400,
      "EMPTY_BILL",
      "Add products before completing this bill",
    );
  const signature = draftSignature(conversation.draft);
  if (!pending.draftSignature || pending.draftSignature !== signature)
    throw serviceError(
      409,
      "STALE_BILL_CONFIRMATION",
      "The bill changed after it was shown. Review the current bill and confirm again.",
    );
  const preview = billPreview(conversation.draft);
  if (!isReadyForSale(conversation.draft, preview))
    throw serviceError(
      409,
      "PAYMENT_DETAILS_REQUIRED",
      "Set valid payment details and review the bill before completing it.",
    );
  const now = new Date();
  const claimed = await AgentConversation.findOneAndUpdate(
    {
      _id: conversation._id,
      userId,
      shopId: conversation.shopId,
      archivedAt: null,
      confirmationClaimedAt: null,
      "pendingAction.token": pending.token,
      "pendingAction.draftSignature": signature,
      "pendingAction.expiresAt": { $gt: now },
    },
    {
      $set: {
        pendingAction: { token: null, expiresAt: null, draftSignature: null },
        confirmationClaimedAt: now,
        confirmationIdempotencyKey: idempotencyKey,
      },
    },
    { returnDocument: "after" },
  );
  if (!claimed)
    throw serviceError(
      409,
      "CONFIRMATION_ALREADY_USED",
      "This confirmation was already used. Review the current bill before trying again.",
    );
  let sale;
  try {
    sale = await createSale(
      userId,
      {
        items: claimed.draft.items.map((line) => ({
          productId: line.productId.toString(),
          quantity: line.quantity,
        })),
        discount: claimed.draft.discount,
        paymentMethod: claimed.draft.paymentMethod,
        amountReceived:
          claimed.draft.paymentMethod === "UDHAR"
            ? 0
            : claimed.draft.amountReceived,
        ...(claimed.draft.customerId
          ? { customerId: claimed.draft.customerId.toString() }
          : {}),
      },
      idempotencyKey,
      {
        expectedPrices: claimed.draft.items.map((line) => ({
          productId: line.productId.toString(),
          sellingPrice: line.sellingPrice,
        })),
      },
    );
  } catch (error) {
    await AgentConversation.updateOne(
      {
        _id: claimed._id,
        userId,
        shopId: claimed.shopId,
        updatedAt: claimed.updatedAt,
        "pendingAction.token": null,
        "pendingAction.expiresAt": null,
        confirmationIdempotencyKey: idempotencyKey,
      },
      {
        $set: { pendingAction: pending },
        $unset: { confirmationClaimedAt: 1, confirmationIdempotencyKey: 1 },
      },
    );
    throw error;
  }
  claimed.draft.items = [];
  claimed.draft.discount = 0;
  claimed.draft.paymentMethod = "CASH";
  claimed.draft.amountReceived = 0;
  claimed.draft.customerId = null;
  claimed.draft.customerName = "";
  claimed.confirmationClaimedAt = null;
  claimed.confirmationIdempotencyKey = null;
  await claimed.save();
  return { sale, conversationId: conversation._id.toString() };
};

export const cancelAction = async (userId, { conversationId }) => {
  const { conversation } = await scoped(userId, conversationId);
  if (conversation.confirmationClaimedAt)
    throw serviceError(
      409,
      "SALE_CONFIRMATION_IN_PROGRESS",
      "This bill is being confirmed and cannot be cancelled now.",
    );
  conversation.pendingAction = {
    token: null,
    expiresAt: null,
    draftSignature: null,
  };
  await conversation.save();
  return { conversationId: conversation._id.toString(), cancelled: true };
};
