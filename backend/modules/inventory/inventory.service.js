import mongoose from "mongoose";
import Category from "../../models/Category.js";
import Product from "../../models/Product.js";
import StockMovement from "../../models/StockMovement.js";
import {
  getStockStatus,
  paginationMeta,
  parsePagination,
  resolveShop,
  serviceError,
} from "./inventory.shared.js";
import { initializeDefaultCategories } from "../categories/category.service.js";

const transactionUnsupported = (error) =>
  error.code === 20 ||
  /transaction numbers are only allowed|replica set|does not support transactions|transactions are not supported/i.test(
    error.message || "",
  );

const recordStockChange = async ({
  shopId,
  productId,
  performedBy,
  type,
  quantity,
  newQuantity,
  reason = "",
  reference = "",
  notes = "",
  purchaseCost,
}) => {
  const current = await Product.findOne({
    _id: productId,
    shopId,
    isArchived: false,
  });
  if (!current)
    throw serviceError(404, "PRODUCT_NOT_FOUND", "Active product not found");
  const previousQuantity = current.quantity;
  const changedQuantity =
    newQuantity === undefined
      ? type === "STOCK_IN"
        ? quantity
        : -quantity
      : newQuantity - previousQuantity;
  const resultingQuantity =
    newQuantity === undefined
      ? previousQuantity + changedQuantity
      : newQuantity;
  if (resultingQuantity < 0)
    throw serviceError(
      409,
      "INSUFFICIENT_STOCK",
      "Stock out quantity exceeds available inventory",
    );
  if (changedQuantity === 0)
    throw serviceError(
      400,
      "NO_STOCK_CHANGE",
      "The requested quantity matches current stock",
    );
  const filter = {
    _id: productId,
    shopId,
    isArchived: false,
    quantity: previousQuantity,
  };
  const update = { $set: { quantity: resultingQuantity } };
  if (purchaseCost !== undefined) update.$set.purchasePrice = purchaseCost;
  const movement = {
    shopId,
    productId,
    type,
    previousQuantity,
    changedQuantity,
    newQuantity: resultingQuantity,
    reason,
    reference,
    notes,
    performedBy,
    ...(purchaseCost === undefined ? {} : { purchaseCost }),
  };
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const result = await Product.updateOne(filter, update, { session });
        if (!result.modifiedCount)
          throw serviceError(
            409,
            "STOCK_CONFLICT",
            "Stock changed concurrently; refresh and retry",
          );
        await StockMovement.create([movement], { session });
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (!transactionUnsupported(error)) throw error;
    const result = await Product.updateOne(filter, update);
    if (!result.modifiedCount)
      throw serviceError(
        409,
        "STOCK_CONFLICT",
        "Stock changed concurrently; refresh and retry",
      );
    try {
      await StockMovement.create(movement);
    } catch (historyError) {
      const rollback = { $set: { quantity: previousQuantity } };
      if (purchaseCost !== undefined)
        rollback.$set.purchasePrice = current.purchasePrice;
      const compensated = await Product.updateOne(
        { _id: productId, shopId, quantity: resultingQuantity },
        rollback,
      );
      if (!compensated.modifiedCount)
        throw serviceError(
          500,
          "STOCK_HISTORY_INCONSISTENT",
          "Stock changed but its history could not be recorded; contact support",
        );
      throw historyError;
    }
  }
  return {
    productId: current._id.toString(),
    previousQuantity,
    changedQuantity,
    newQuantity: resultingQuantity,
    stockStatus: getStockStatus(resultingQuantity, current.minimumStock),
  };
};

export const addStock = async (userId, input) =>
  recordStockChange({
    ...input,
    shopId: await resolveShop(userId),
    performedBy: userId,
    type: "STOCK_IN",
  });

export const removeStock = async (userId, input) =>
  recordStockChange({
    ...input,
    shopId: await resolveShop(userId),
    performedBy: userId,
    type: "STOCK_OUT",
  });

export const adjustStock = async (userId, input) =>
  recordStockChange({
    ...input,
    shopId: await resolveShop(userId),
    performedBy: userId,
    type: "STOCK_ADJUSTMENT",
  });

export const getSummary = async (userId) => {
  const shopId = await resolveShop(userId);
  await initializeDefaultCategories(shopId);
  const [result, totalActiveCategories] = await Promise.all([
    Product.aggregate([
      { $match: { shopId, isArchived: false } },
      {
        $group: {
          _id: null,
          totalActiveProducts: { $sum: 1 },
          lowStockProductCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", "$minimumStock"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockProductCount: {
            $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] },
          },
          totalStockValuation: {
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
    Category.countDocuments({ shopId, isActive: true }),
  ]);
  const summary = result[0] || {};
  return {
    totalActiveProducts: summary.totalActiveProducts || 0,
    totalActiveCategories,
    totalStockValuation: summary.totalStockValuation || 0,
    productsMissingPurchasePrice: summary.productsMissingPurchasePrice || 0,
    lowStockProductCount: summary.lowStockProductCount || 0,
    outOfStockProductCount: summary.outOfStockProductCount || 0,
  };
};

const movementFilter = async (shopId, query, productId) => {
  const filter = { shopId };
  const selectedProduct = productId || query.productId;
  if (selectedProduct) {
    if (!(await Product.exists({ _id: selectedProduct, shopId })))
      throw serviceError(404, "PRODUCT_NOT_FOUND", "Product not found");
    filter.productId = selectedProduct;
  }
  if (query.type) filter.type = query.type;
  if (query.from || query.to)
    filter.createdAt = {
      ...(query.from ? { $gte: new Date(query.from) } : {}),
      ...(query.to ? { $lte: new Date(query.to) } : {}),
    };
  if (query.from && query.to && new Date(query.from) > new Date(query.to))
    throw serviceError(
      400,
      "INVALID_DATE_RANGE",
      "The from date must be earlier than the to date",
    );
  return filter;
};

const listHistory = async (shopId, query, productId) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = await movementFilter(shopId, query, productId);
  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .sort({ createdAt: query.sortOrder === "asc" ? 1 : -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate("productId", "name sku unit")
      .populate("performedBy", "fullName")
      .lean(),
    StockMovement.countDocuments(filter),
  ]);
  return {
    items: items.map((item) => ({
      id: item._id.toString(),
      productId: item.productId?._id.toString() || "",
      productName: item.productId?.name || "",
      unit: item.productId?.unit || "",
      type: item.type,
      previousQuantity: item.previousQuantity,
      changedQuantity: item.changedQuantity,
      newQuantity: item.newQuantity,
      reason: item.reason,
      reference: item.reference,
      notes: item.notes,
      performedByName: item.performedBy?.fullName || "",
      createdAt: item.createdAt,
    })),
    pagination: paginationMeta(page, limit, total),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

export const getHistory = async (userId, query) =>
  listHistory(await resolveShop(userId), query);

export const getProductHistory = async (userId, productId, query) =>
  listHistory(await resolveShop(userId), query, productId);

export const getAlerts = async (userId, query) => {
  const shopId = await resolveShop(userId);
  const { page, limit, skip } = parsePagination(query);
  const filter = {
    shopId,
    isArchived: false,
    $expr: { $lte: ["$quantity", "$minimumStock"] },
  };
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ quantity: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name")
      .lean(),
    Product.countDocuments(filter),
  ]);
  return {
    items: items.map((item) => ({
      ...item,
      id: item._id.toString(),
      categoryName: item.categoryId?.name || "",
      stockStatus: getStockStatus(item.quantity, item.minimumStock),
    })),
    pagination: paginationMeta(page, limit, total),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};
