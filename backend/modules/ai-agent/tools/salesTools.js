import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Customer from "../../../models/Customer.js";
import Product from "../../../models/Product.js";
import { escapeRegex } from "../../inventory/inventory.shared.js";
import {
  findEditableConversation,
  saveEditableDraft,
} from "./draftPersistence.js";

const clearPending = (conversation) => {
  conversation.pendingAction = {
    token: null,
    expiresAt: null,
    draftSignature: null,
  };
};

const subtotalMinor = (draft) =>
  draft.items.reduce(
    (total, line) =>
      total + Math.round(Math.round(line.sellingPrice * 100) * line.quantity),
    0,
  );

const currentPreview = (draft) => {
  const subtotal = subtotalMinor(draft);
  const total = Math.max(0, subtotal - Math.round(draft.discount * 100));
  const received = Math.round(draft.amountReceived * 100);
  return {
    items: draft.items.map((line) => ({
      productId: line.productId.toString(),
      name: line.name,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.sellingPrice,
      lineTotal:
        Math.round(Math.round(line.sellingPrice * 100) * line.quantity) / 100,
    })),
    customer: draft.customerId
      ? { id: draft.customerId.toString(), name: draft.customerName }
      : null,
    subtotal: subtotal / 100,
    discount: Math.round(draft.discount * 100) / 100,
    total: total / 100,
    paymentMethod: draft.paymentMethod,
    amountReceived: received / 100,
    change:
      draft.paymentMethod === "CASH" ? Math.max(0, received - total) / 100 : 0,
    balanceDue: draft.paymentMethod === "UDHAR" ? total / 100 : 0,
  };
};

export const createSalesTools = ({ userId, shopId, conversationId }) => {
  const getDraft = () =>
    findEditableConversation({ _id: conversationId, userId, shopId });
  const objectId = z.string().regex(/^[a-f\d]{24}$/i);
  return [
    tool(
      async () => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        return JSON.stringify({
          draftExists: true,
          ...currentPreview(conversation.draft),
        });
      },
      {
        name: "create_billing_draft",
        description:
          "Open or inspect the current uncommitted billing draft. This does not create a sale or change stock.",
        schema: z.object({}),
      },
    ),
    tool(
      async ({ productId, quantity }) => {
        const product = await Product.findOne({
          _id: productId,
          shopId,
          isArchived: false,
        })
          .select("name unit sellingPrice quantity")
          .lean();
        if (!product) return "Product not found in this shop.";
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        const line = conversation.draft.items.find(
          (item) => item.productId.toString() === productId,
        );
        const nextQuantity = (line?.quantity || 0) + quantity;
        if (nextQuantity > product.quantity)
          return JSON.stringify({
            error: "INSUFFICIENT_STOCK",
            product: product.name,
            available: product.quantity,
          });
        if (line) {
          line.quantity = nextQuantity;
          line.name = product.name;
          line.unit = product.unit;
          line.sellingPrice = product.sellingPrice;
          line.stock = product.quantity;
        } else {
          conversation.draft.items.push({
            productId: product._id,
            name: product.name,
            unit: product.unit,
            sellingPrice: product.sellingPrice,
            quantity,
            stock: product.quantity,
          });
        }
        clearPending(conversation);
        await saveEditableDraft(conversation);
        return JSON.stringify({
          added: product.name,
          quantity,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          currentQuantity: nextQuantity,
        });
      },
      {
        name: "add_product_to_cart",
        description:
          "Add a real active shop product to the uncommitted bill at its current database price. Search first and use a returned product ID.",
        schema: z.object({
          productId: objectId,
          quantity: z.number().finite().positive().max(1_000_000),
        }),
      },
    ),
    tool(
      async ({ productId, quantity }) => {
        const conversation = await getDraft();
        const line = conversation?.draft.items.find(
          (item) => item.productId.toString() === productId,
        );
        if (!line) return "That product is not in the current bill.";
        const product = await Product.findOne({
          _id: productId,
          shopId,
          isArchived: false,
        })
          .select("name quantity")
          .lean();
        if (!product)
          return "That product is no longer available in this shop.";
        if (quantity > product.quantity)
          return JSON.stringify({
            error: "INSUFFICIENT_STOCK",
            product: product.name,
            available: product.quantity,
          });
        if (quantity === 0)
          conversation.draft.items = conversation.draft.items.filter(
            (item) => item.productId.toString() !== productId,
          );
        else {
          line.quantity = quantity;
          line.stock = product.quantity;
        }
        clearPending(conversation);
        await saveEditableDraft(conversation);
        return JSON.stringify({ updated: product.name, quantity });
      },
      {
        name: "update_cart_quantity",
        description:
          "Set the exact quantity of a product already in the bill. Use zero to remove it.",
        schema: z.object({
          productId: objectId,
          quantity: z.number().finite().min(0).max(1_000_000),
        }),
      },
    ),
    tool(
      async ({ query }) => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        const term = query.trim().toLocaleLowerCase();
        const matches = conversation.draft.items.filter((line) =>
          line.name.toLocaleLowerCase().includes(term),
        );
        if (matches.length !== 1)
          return matches.length
            ? "More than one bill item matches. Ask which one to remove."
            : "No matching product is in the bill.";
        const removedName = matches[0].name;
        conversation.draft.items = conversation.draft.items.filter(
          (line) =>
            line.productId.toString() !== matches[0].productId.toString(),
        );
        clearPending(conversation);
        await saveEditableDraft(conversation);
        return JSON.stringify({ removed: removedName });
      },
      {
        name: "remove_product_from_cart",
        description:
          "Remove one unambiguous product from the current draft bill by name.",
        schema: z.object({ query: z.string().trim().min(1).max(100) }),
      },
    ),
    tool(
      async () => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        conversation.draft.items = [];
        conversation.draft.discount = 0;
        clearPending(conversation);
        await saveEditableDraft(conversation);
        return "Cleared the uncommitted bill. No sale was created and no stock was changed.";
      },
      {
        name: "clear_cart",
        description:
          "Clear all items and the discount from the current uncommitted bill without changing stock.",
        schema: z.object({}),
      },
    ),
    tool(
      async ({ amount, kind }) => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        const subtotal = subtotalMinor(conversation.draft);
        if (kind === "PERCENT" && amount > 100)
          return JSON.stringify({
            error: "INVALID_DISCOUNT",
            reason: "Percentage discount cannot exceed 100.",
          });
        const discount =
          kind === "PERCENT"
            ? Math.round((subtotal * amount) / 100)
            : Math.round(amount * 100);
        if (discount > subtotal)
          return JSON.stringify({
            error: "DISCOUNT_EXCEEDS_SUBTOTAL",
            subtotal: subtotal / 100,
          });
        conversation.draft.discount = discount / 100;
        clearPending(conversation);
        await saveEditableDraft(conversation);
        return JSON.stringify({ discount: conversation.draft.discount, kind });
      },
      {
        name: "apply_cart_discount",
        description:
          "Apply a fixed rupee or percentage discount to the current draft, within the item subtotal.",
        schema: z.object({
          amount: z.number().finite().min(0).max(1_000_000_000),
          kind: z.enum(["FIXED", "PERCENT"]).default("FIXED"),
        }),
      },
    ),
    tool(
      async ({ query }) => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        if (/^(walk.?in|none|clear|no customer)$/i.test(query.trim())) {
          conversation.draft.customerId = null;
          conversation.draft.customerName = "";
          clearPending(conversation);
          await saveEditableDraft(conversation);
          return JSON.stringify({ customer: null });
        }
        const regex = new RegExp(escapeRegex(query.trim()), "i");
        const matches = await Customer.find({
          shopId,
          $or: [{ name: regex }, { phone: regex }],
        })
          .select("name phone")
          .limit(3)
          .lean();
        if (!matches.length)
          return JSON.stringify({
            error: "CUSTOMER_NOT_FOUND",
            offerToAdd: true,
          });
        if (matches.length > 1)
          return JSON.stringify({
            ambiguous: true,
            matches: matches.map((item) => ({
              id: item._id.toString(),
              name: item.name,
              phone: item.phone,
            })),
          });
        conversation.draft.customerId = matches[0]._id;
        conversation.draft.customerName = matches[0].name;
        clearPending(conversation);
        await saveEditableDraft(conversation);
        return JSON.stringify({
          selected: { id: matches[0]._id.toString(), name: matches[0].name },
        });
      },
      {
        name: "select_billing_customer",
        description:
          "Select one unambiguous customer from this shop for the draft, or use 'walk-in' to clear the selection.",
        schema: z.object({ query: z.string().trim().min(1).max(100) }),
      },
    ),
    tool(
      async () => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        return JSON.stringify(currentPreview(conversation.draft));
      },
      {
        name: "calculate_billing_preview",
        description:
          "Calculate a server-side preview of the current draft, including discount, change, and any credit balance due.",
        schema: z.object({}),
      },
    ),
    tool(
      async ({ paymentMethod, amountReceived }) => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        const preview = currentPreview(conversation.draft);
        const receivedMinor = Math.round(amountReceived * 100);
        const totalMinor = Math.round(preview.total * 100);
        if (
          (paymentMethod === "UDHAR" && receivedMinor !== 0) ||
          (paymentMethod === "CASH" && receivedMinor < totalMinor) ||
          (["UPI", "CARD"].includes(paymentMethod) &&
            receivedMinor !== totalMinor)
        ) {
          return JSON.stringify({
            error: "INVALID_AMOUNT_RECEIVED",
            paymentMethod,
            total: preview.total,
          });
        }
        conversation.draft.paymentMethod = paymentMethod;
        conversation.draft.amountReceived = receivedMinor / 100;
        clearPending(conversation);
        await saveEditableDraft(conversation);
        return JSON.stringify({
          paymentMethod,
          amountReceived: receivedMinor / 100,
          total: preview.total,
        });
      },
      {
        name: "set_billing_payment_details",
        description:
          "Set and validate the payment method and amount received for the uncommitted bill. This does not complete the sale.",
        schema: z.object({
          paymentMethod: z.enum(["CASH", "UPI", "CARD", "UDHAR"]),
          amountReceived: z.number().finite().min(0).max(1_000_000_000),
        }),
      },
    ),
    tool(
      async () => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        return JSON.stringify(currentPreview(conversation.draft));
      },
      {
        name: "get_billing_draft",
        description:
          "Retrieve the current uncommitted bill, selected customer, prices, and payment details.",
        schema: z.object({}),
      },
    ),
    tool(
      async () => {
        const conversation = await getDraft();
        if (!conversation) return "Billing draft is unavailable.";
        const preview = currentPreview(conversation.draft);
        if (!preview.items.length)
          return "Add at least one product before requesting completion.";
        return JSON.stringify({
          requiresOwnerConfirmation: true,
          preview,
          message:
            "Ask the owner to review this bill and confirm it in the app. This tool never posts a sale.",
        });
      },
      {
        name: "complete_sale",
        description:
          "Request explicit owner confirmation for the current bill. Never posts the sale; only the app confirmation endpoint can do that.",
        schema: z.object({}),
      },
    ),
  ];
};
