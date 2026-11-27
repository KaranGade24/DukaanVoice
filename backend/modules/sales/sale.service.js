import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Sale from "../../models/Sale.js";
import StockMovement from "../../models/StockMovement.js";
import Customer from "../../models/Customer.js";
import Shop from "../../models/Shop.js";
import {
  escapeRegex,
  paginationMeta,
  parsePagination,
  resolveShop,
  serviceError,
} from "../inventory/inventory.shared.js";

const dateBounds = ({ from, to }) => {
  const now = new Date();
  const start = from
    ? new Date(`${from}T00:00:00.000Z`)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = to
    ? new Date(`${to}T00:00:00.000Z`)
    : new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
  end.setUTCDate(end.getUTCDate() + 1);
  return { from: start, to: end };
};

const transactionUnsupported = (error) =>
  error.code === 20 ||
  /replica set|transactions are not supported|transaction numbers are only allowed/i.test(
    error.message || "",
  );

const shape = (sale) => {
  const value = sale.toObject ? sale.toObject() : sale;
  return {
    ...value,
    id: value._id.toString(),
    subtotal: value.subtotalMinor / 100,
    discount: value.discountMinor / 100,
    total: value.totalMinor / 100,
    amountReceived: value.amountReceivedMinor / 100,
    change: value.changeMinor / 100,
    balanceDue: (value.balanceDueMinor ?? 0) / 100,
    customer: value.customerId
      ? {
          id: value.customerId.toString(),
          name: value.customerName || "",
          phone: value.customerPhone || "",
        }
      : null,
  };
};

const postSale = async ({
  shopId,
  userId,
  input,
  idempotencyKey,
  session,
  expectedPrices,
}) => {
  const ids = input.items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length)
    throw serviceError(
      400,
      "DUPLICATE_SALE_PRODUCT",
      "Each product can appear only once",
    );
  let query = Product.find({ _id: { $in: ids }, shopId, isArchived: false });
  if (session) query = query.session(session);
  const products = await query;
  if (products.length !== ids.length)
    throw serviceError(
      400,
      "INVALID_SALE_PRODUCT",
      "Every item must be an active product in this shop",
    );
  const byId = new Map(
    products.map((product) => [product._id.toString(), product]),
  );
  if (expectedPrices) {
    const expected = new Map(
      expectedPrices.map((item) => [
        item.productId,
        Math.round(item.sellingPrice * 100),
      ]),
    );
    if (
      expected.size !== ids.length ||
      ids.some(
        (id) =>
          expected.get(id) !== Math.round(byId.get(id).sellingPrice * 100),
      )
    ) {
      throw serviceError(
        409,
        "PRICE_CHANGED_REVIEW_BILL",
        "A product price changed. Review the updated bill before completing it.",
      );
    }
  }
  let customer = null;
  if (input.customerId) {
    let customerQuery = Customer.findOne({ _id: input.customerId, shopId });
    if (session) customerQuery = customerQuery.session(session);
    customer = await customerQuery;
    if (!customer)
      throw serviceError(
        400,
        "INVALID_SALE_CUSTOMER",
        "Select a customer from this shop or remove the customer from the bill",
      );
  }
  const lines = input.items.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (product.quantity < quantity)
      throw serviceError(
        409,
        "INSUFFICIENT_STOCK",
        `${product.name} has only ${product.quantity} ${product.unit} available`,
      );
    const unitPriceMinor = Math.round(product.sellingPrice * 100);
    const lineTotalMinor = Math.round(unitPriceMinor * quantity);
    if (!Number.isSafeInteger(lineTotalMinor))
      throw serviceError(
        400,
        "SALE_AMOUNT_TOO_LARGE",
        "Sale amount exceeds the supported range",
      );
    const purchaseCostMinor =
      product.purchasePrice == null
        ? null
        : Math.round(product.purchasePrice * 100);
    return {
      product,
      quantity,
      unitPriceMinor,
      purchaseCostMinor,
      lineTotalMinor,
    };
  });
  const subtotalMinor = lines.reduce(
    (sum, line) => sum + line.lineTotalMinor,
    0,
  );
  if (!Number.isSafeInteger(subtotalMinor))
    throw serviceError(
      400,
      "SALE_AMOUNT_TOO_LARGE",
      "Sale amount exceeds the supported range",
    );
  const discountMinor = Math.round(input.discount * 100);
  if (discountMinor > subtotalMinor)
    throw serviceError(
      400,
      "DISCOUNT_EXCEEDS_SUBTOTAL",
      "Discount cannot exceed the item subtotal",
    );
  const totalMinor = subtotalMinor - discountMinor;
  const amountReceivedMinor = Math.round(input.amountReceived * 100);
  if (
    (input.paymentMethod === "UDHAR" && amountReceivedMinor !== 0) ||
    (input.paymentMethod === "CASH" && amountReceivedMinor < totalMinor) ||
    (["UPI", "CARD"].includes(input.paymentMethod) &&
      amountReceivedMinor !== totalMinor)
  )
    throw serviceError(
      400,
      "INVALID_AMOUNT_RECEIVED",
      "Received amount must equal the total for UPI or card, and cover the total for cash",
    );
  const [sale] = await Sale.create(
    [
      {
        shopId,
        customerId: customer?._id || null,
        customerName: customer?.name || "",
        customerPhone: customer?.phone || "",
        saleNumber: `SAL-${new mongoose.Types.ObjectId().toString().toUpperCase()}`,
        items: lines.map(
          ({
            product,
            quantity,
            unitPriceMinor,
            purchaseCostMinor,
            lineTotalMinor,
          }) => ({
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            quantity,
            unit: product.unit,
            unitPriceMinor,
            purchaseCostMinor,
            lineTotalMinor,
          }),
        ),
        subtotalMinor,
        discountMinor,
        totalMinor,
        amountReceivedMinor,
        changeMinor:
          input.paymentMethod === "UDHAR"
            ? 0
            : amountReceivedMinor - totalMinor,
        balanceDueMinor: input.paymentMethod === "UDHAR" ? totalMinor : 0,
        paymentMethod: input.paymentMethod,
        idempotencyKey: idempotencyKey || null,
        createdBy: userId,
      },
    ],
    session ? { session } : {},
  );
  for (const { product, quantity } of lines) {
    const newQuantity = product.quantity - quantity;
    const updated = await Product.updateOne(
      { _id: product._id, shopId, quantity: product.quantity },
      { $set: { quantity: newQuantity } },
      session ? { session } : {},
    );
    if (!updated.modifiedCount)
      throw serviceError(
        409,
        "STOCK_CONFLICT",
        `${product.name} stock changed; retry the sale`,
      );
    await StockMovement.create(
      [
        {
          shopId,
          productId: product._id,
          type: "SALE",
          previousQuantity: product.quantity,
          changedQuantity: -quantity,
          newQuantity,
          unit: product.unit,
          reason: "Point of sale",
          reference: sale.saleNumber,
          notes: `Sale ${sale.saleNumber}`,
          performedBy: userId,
        },
      ],
      session ? { session } : {},
    );
  }
  return shape(sale);
};

export const createSale = async (
  userId,
  input,
  requestKey,
  { expectedPrices } = {},
) => {
  const shopId = await resolveShop(userId);
  const withShop = async (sale) => {
    const shop = await Shop.findById(shopId).select("shopName city").lean();
    return {
      ...sale,
      shop: shop ? { name: shop.shopName, city: shop.city } : null,
    };
  };
  const key = requestKey || null;
  if (key && (key.length < 8 || key.length > 100))
    throw serviceError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "Idempotency key must be between 8 and 100 characters",
    );
  if (key) {
    const existing = await Sale.findOne({ shopId, idempotencyKey: key });
    if (existing) return withShop(shape(existing));
  }
  try {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await postSale({
          shopId,
          userId,
          input,
          idempotencyKey: key,
          session,
          expectedPrices,
        });
      });
      return withShop(result);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (transactionUnsupported(error))
      throw serviceError(
        503,
        "TRANSACTIONS_REQUIRED",
        "Sale posting requires a transaction-capable MongoDB deployment to keep sale and stock records consistent",
      );
    if (error.code === 11000 && key) {
      const existing = await Sale.findOne({ shopId, idempotencyKey: key });
      if (existing) return withShop(shape(existing));
    }
    throw error;
  }
};

export const findSaleByIdempotencyKey = async (userId, idempotencyKey) => {
  const shopId = await resolveShop(userId);
  const [sale, shop] = await Promise.all([
    Sale.findOne({ shopId, idempotencyKey }).lean(),
    Shop.findById(shopId).select("shopName city").lean(),
  ]);
  return sale
    ? {
        ...shape(sale),
        shop: shop ? { name: shop.shopName, city: shop.city } : null,
      }
    : null;
};

const saleFilter = (shopId, query) => {
  const bounds = dateBounds(query);
  const filter = { shopId, createdAt: { $gte: bounds.from, $lt: bounds.to } };
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { saleNumber: search },
      { "items.productName": search },
      { "items.sku": search },
    ];
  }
  return { filter, bounds };
};

export const listSales = async (userId, query) => {
  const shopId = await resolveShop(userId);
  const { filter } = saleFilter(shopId, query);
  const { page, limit, skip } = parsePagination(query);
  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .select(
        "saleNumber customerName items.productName items.quantity subtotalMinor discountMinor totalMinor amountReceivedMinor changeMinor balanceDueMinor paymentMethod createdAt",
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Sale.countDocuments(filter),
  ]);
  return {
    items: sales.map((sale) => ({
      id: sale._id.toString(),
      saleNumber: sale.saleNumber,
      customerName: sale.customerName || "",
      itemCount: sale.items.length,
      itemNames: sale.items.slice(0, 3).map((item) => item.productName),
      subtotal: sale.subtotalMinor / 100,
      discount: sale.discountMinor / 100,
      total: sale.totalMinor / 100,
      amountReceived: sale.amountReceivedMinor / 100,
      change: sale.changeMinor / 100,
      paymentMethod: sale.paymentMethod,
      balanceDue:
        (sale.balanceDueMinor ??
          (sale.paymentMethod === "UDHAR" ? sale.totalMinor : 0)) / 100,
      createdAt: sale.createdAt,
      status: sale.status || "COMPLETED",
    })),
    pagination: paginationMeta(page, limit, total),
  };
};

export const getSaleDetails = async (userId, saleId) => {
  const shopId = await resolveShop(userId);
  const [sale, shop] = await Promise.all([
    Sale.findOne({ _id: saleId, shopId }).lean(),
    Shop.findById(shopId).select("shopName city").lean(),
  ]);
  if (!sale) throw serviceError(404, "SALE_NOT_FOUND", "Sale not found");
  return {
    id: sale._id.toString(),
    saleNumber: sale.saleNumber,
    createdAt: sale.createdAt,
    status: sale.status || "COMPLETED",
    shop: shop ? { name: shop.shopName, city: shop.city } : null,
    customer: sale.customerId
      ? {
          id: sale.customerId.toString(),
          name: sale.customerName || "",
          phone: sale.customerPhone || "",
        }
      : null,
    items: sale.items.map((item) => ({
      productId: item.productId.toString(),
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPriceMinor / 100,
      lineTotal: item.lineTotalMinor / 100,
    })),
    subtotal: sale.subtotalMinor / 100,
    discount: sale.discountMinor / 100,
    total: sale.totalMinor / 100,
    paymentMethod: sale.paymentMethod,
    amountReceived: sale.amountReceivedMinor / 100,
    change: sale.changeMinor / 100,
    balanceDue:
      (sale.balanceDueMinor ??
        (sale.paymentMethod === "UDHAR" ? sale.totalMinor : 0)) / 100,
    creditPayments: (sale.creditPayments || []).map((payment) => ({
      amount: payment.amountMinor / 100,
      receivedAt: payment.receivedAt,
    })),
  };
};

export const getFrequentlySoldProducts = async (
  userId,
  { periodDays = 30, limit = 8 } = {},
) => {
  const shopId = await resolveShop(userId);
  const since = new Date(Date.now() - Number(periodDays) * 86_400_000);
  const sold = await Sale.aggregate([
    { $match: { shopId, createdAt: { $gte: since } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        soldQuantity: { $sum: "$items.quantity" },
        lastSoldAt: { $max: "$createdAt" },
      },
    },
    { $sort: { soldQuantity: -1, lastSoldAt: -1 } },
    { $limit: Number(limit) },
  ]);
  if (!sold.length) return { items: [], periodDays: Number(periodDays) };
  const products = await Product.find({
    _id: { $in: sold.map((item) => item._id) },
    shopId,
    isArchived: false,
  })
    .select("name sku unit sellingPrice quantity imageUrl categoryId")
    .lean();
  const byId = new Map(
    products.map((product) => [product._id.toString(), product]),
  );
  return {
    periodDays: Number(periodDays),
    items: sold.flatMap((item) => {
      const product = byId.get(item._id.toString());
      return product
        ? [
            {
              id: product._id.toString(),
              name: product.name,
              sku: product.sku,
              unit: product.unit,
              sellingPrice: product.sellingPrice,
              quantity: product.quantity,
              imageUrl: product.imageUrl,
              categoryId: product.categoryId?.toString() || "",
              soldQuantity: item.soldQuantity,
              lastSoldAt: item.lastSoldAt,
            },
          ]
        : [];
    }),
  };
};

export const recordCreditPayment = async (userId, saleId, amount) => {
  const shopId = await resolveShop(userId);
  const amountMinor = Math.round(amount * 100);
  const receivedAt = new Date();
  const sale = await Sale.findOneAndUpdate(
    {
      _id: saleId,
      shopId,
      paymentMethod: "UDHAR",
      $expr: {
        $gte: [{ $ifNull: ["$balanceDueMinor", "$totalMinor"] }, amountMinor],
      },
    },
    [
      {
        $set: {
          balanceDueMinor: {
            $subtract: [
              { $ifNull: ["$balanceDueMinor", "$totalMinor"] },
              amountMinor,
            ],
          },
          creditPayments: {
            $concatArrays: [
              { $ifNull: ["$creditPayments", []] },
              [{ $literal: { amountMinor, receivedBy: userId, receivedAt } }],
            ],
          },
        },
      },
    ],
    { returnDocument: "after", updatePipeline: true },
  ).lean();
  if (!sale)
    throw serviceError(
      409,
      "CREDIT_PAYMENT_CONFLICT",
      "Credit bill was not found, is already paid, or payment exceeds the outstanding balance",
    );
  return {
    saleId: sale._id.toString(),
    saleNumber: sale.saleNumber,
    balanceDue: sale.balanceDueMinor / 100,
    creditPayments: sale.creditPayments.map((payment) => ({
      amount: payment.amountMinor / 100,
      receivedAt: payment.receivedAt,
    })),
  };
};

export const getSalesSummary = async (userId, query) => {
  const shopId = await resolveShop(userId);
  const { filter, bounds } = saleFilter(shopId, query);
  const [salesSummary, stockSummary, creditCollections, creditOutstanding] =
    await Promise.all([
      Sale.aggregate([
        { $match: filter },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  salesTotalMinor: { $sum: "$totalMinor" },
                  amountReceivedMinor: { $sum: "$amountReceivedMinor" },
                  changeMinor: { $sum: "$changeMinor" },
                  billCount: { $sum: 1 },
                },
              },
            ],
            payments: [
              {
                $group: {
                  _id: "$paymentMethod",
                  amountMinor: { $sum: "$totalMinor" },
                  billCount: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            hourly: [
              {
                $group: {
                  _id: { $hour: "$createdAt" },
                  salesMinor: { $sum: "$totalMinor" },
                  billCount: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            profit: [
              { $unwind: "$items" },
              {
                $group: {
                  _id: "$_id",
                  totalMinor: { $first: "$totalMinor" },
                  itemCount: { $sum: 1 },
                  knownCostCount: {
                    $sum: {
                      $cond: [
                        {
                          $ne: [
                            { $ifNull: ["$items.purchaseCostMinor", null] },
                            null,
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  costMinor: {
                    $sum: {
                      $cond: [
                        {
                          $ne: [
                            { $ifNull: ["$items.purchaseCostMinor", null] },
                            null,
                          ],
                        },
                        {
                          $round: [
                            {
                              $multiply: [
                                "$items.purchaseCostMinor",
                                "$items.quantity",
                              ],
                            },
                            0,
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  knownProfitMinor: {
                    $sum: {
                      $cond: [
                        { $eq: ["$itemCount", "$knownCostCount"] },
                        { $subtract: ["$totalMinor", "$costMinor"] },
                        0,
                      ],
                    },
                  },
                  fullyCostedBills: {
                    $sum: {
                      $cond: [{ $eq: ["$itemCount", "$knownCostCount"] }, 1, 0],
                    },
                  },
                  billsMissingCost: {
                    $sum: {
                      $cond: [{ $lt: ["$knownCostCount", "$itemCount"] }, 1, 0],
                    },
                  },
                },
              },
            ],
          },
        },
      ]),
      Product.aggregate([
        { $match: { shopId, isArchived: false } },
        {
          $group: {
            _id: null,
            activeProductCount: { $sum: 1 },
            stockValue: {
              $sum: {
                $cond: [
                  { $ne: [{ $ifNull: ["$purchasePrice", null] }, null] },
                  { $multiply: ["$quantity", "$purchasePrice"] },
                  0,
                ],
              },
            },
            productsMissingPurchasePrice: {
              $sum: {
                $cond: [
                  { $eq: [{ $ifNull: ["$purchasePrice", null] }, null] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Sale.aggregate([
        { $match: { shopId } },
        { $unwind: "$creditPayments" },
        {
          $match: {
            "creditPayments.receivedAt": { $gte: bounds.from, $lt: bounds.to },
          },
        },
        {
          $group: {
            _id: null,
            amountMinor: { $sum: "$creditPayments.amountMinor" },
          },
        },
      ]),
      Sale.aggregate([
        { $match: { ...filter, paymentMethod: "UDHAR" } },
        {
          $match: {
            $expr: {
              $gt: [{ $ifNull: ["$balanceDueMinor", "$totalMinor"] }, 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            amountMinor: {
              $sum: { $ifNull: ["$balanceDueMinor", "$totalMinor"] },
            },
            billCount: { $sum: 1 },
          },
        },
      ]),
    ]);
  const aggregate = salesSummary[0] || { totals: [], payments: [] };
  const total = aggregate.totals[0] || {
    salesTotalMinor: 0,
    amountReceivedMinor: 0,
    changeMinor: 0,
    billCount: 0,
  };
  const stock = stockSummary[0] || {};
  const salesTotal = total.salesTotalMinor / 100;
  const outstandingCredit = creditOutstanding[0] || {
    amountMinor: 0,
    billCount: 0,
  };
  const profit = aggregate.profit[0] || {};
  return {
    period: {
      from: bounds.from.toISOString().slice(0, 10),
      to: new Date(bounds.to.valueOf() - 86_400_000).toISOString().slice(0, 10),
    },
    salesTotal,
    billCount: total.billCount,
    amountCollected:
      (total.amountReceivedMinor -
        total.changeMinor +
        (creditCollections[0]?.amountMinor || 0)) /
      100,
    averageBill: total.billCount
      ? Math.round((salesTotal / total.billCount) * 100) / 100
      : 0,
    payments: aggregate.payments.map((payment) => ({
      method: payment._id,
      amount: payment.amountMinor / 100,
      billCount: payment.billCount,
    })),
    hourlySales: (aggregate.hourly || []).map((hour) => ({
      hour: hour._id,
      sales: hour.salesMinor / 100,
      bills: hour.billCount,
    })),
    creditSales: {
      amount: outstandingCredit.amountMinor / 100,
      billCount: outstandingCredit.billCount,
    },
    grossProfit: {
      amount: (profit.knownProfitMinor || 0) / 100,
      fullyCostedBills: profit.fullyCostedBills || 0,
      billsMissingCost: profit.billsMissingCost || 0,
    },
    inventory: {
      activeProductCount: stock.activeProductCount || 0,
      stockValue: stock.stockValue || 0,
      productsMissingPurchasePrice: stock.productsMissingPurchasePrice || 0,
    },
    accounting: { profitAvailable: false, expensesAvailable: false },
  };
};
