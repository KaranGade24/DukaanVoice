import mongoose from "mongoose";
import Category from "../../models/Category.js";
import Product from "../../models/Product.js";
import StockMovement from "../../models/StockMovement.js";
import {
  escapeRegex,
  getStockStatus,
  paginationMeta,
  parsePagination,
  resolveShop,
  serviceError,
} from "../inventory/inventory.shared.js";
import { initializeDefaultCategories } from "../categories/category.service.js";

const productForShop = async (shopId, id, includeArchived = true) => {
  const filter = { _id: id, shopId };
  if (!includeArchived) filter.isArchived = false;
  const product = await Product.findOne(filter);
  if (!product)
    throw serviceError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return product;
};

const validateCategory = async (shopId, categoryId) => {
  const category = await Category.findOne({
    _id: categoryId,
    shopId,
    isActive: true,
  })
    .select("_id")
    .lean();
  if (!category)
    throw serviceError(
      400,
      "INVALID_CATEGORY",
      "Category must be active and belong to this shop",
    );
};

const shapeProduct = (product) => {
  const item = product.toObject ? product.toObject() : product;
  const categoryId = item.categoryId?._id || item.categoryId;
  return {
    ...item,
    id: item._id.toString(),
    categoryId: categoryId?.toString(),
    categoryName: item.categoryId?.name || "",
    stockStatus: getStockStatus(item.quantity, item.minimumStock),
  };
};

export const createProduct = async (userId, input) => {
  const shopId = await resolveShop(userId);
  await initializeDefaultCategories(shopId);
  await validateCategory(shopId, input.categoryId);
  const { quantity, image, imageUrl, ...fields } = input;
  const product = await Product.create({
    ...fields,
    imageUrl: imageUrl || image || "",
    shopId,
    quantity: 0,
  });
  if (quantity > 0) {
    try {
      await recordInitialStock({
        shopId,
        product,
        quantity,
        performedBy: userId,
      });
    } catch (error) {
      await Product.deleteOne({ _id: product._id, shopId, quantity: 0 });
      throw error;
    }
    product.quantity = quantity;
  }
  return shapeProduct(product);
};

const recordInitialStock = async ({
  shopId,
  product,
  quantity,
  performedBy,
}) => {
  const movement = {
    shopId,
    productId: product._id,
    type: "OPENING_STOCK",
    previousQuantity: 0,
    changedQuantity: quantity,
    newQuantity: quantity,
    performedBy,
  };
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, shopId, quantity: 0 },
          { $set: { quantity } },
          { returnDocument: "after", session },
        );
        if (!updated)
          throw serviceError(
            409,
            "STOCK_CONFLICT",
            "Product stock changed; retry the request",
          );
        await StockMovement.create([movement], { session });
      });
      return;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (!isTransactionUnsupported(error)) throw error;
  }
  const updated = await Product.findOneAndUpdate(
    { _id: product._id, shopId, quantity: 0 },
    { $set: { quantity } },
    { returnDocument: "after" },
  );
  if (!updated)
    throw serviceError(
      409,
      "STOCK_CONFLICT",
      "Product stock changed; retry the request",
    );
  try {
    await StockMovement.create(movement);
  } catch (error) {
    const rolledBack = await Product.updateOne(
      { _id: product._id, shopId, quantity },
      { $set: { quantity: 0 } },
    );
    if (!rolledBack.modifiedCount)
      throw serviceError(
        500,
        "STOCK_HISTORY_INCONSISTENT",
        "Opening stock was applied but history could not be recorded; contact support",
      );
    throw error;
  }
};

const isTransactionUnsupported = (error) =>
  error.code === 20 ||
  /transaction numbers are only allowed|replica set|does not support transactions|transactions are not supported/i.test(
    error.message || "",
  );

export const listProducts = async (userId, query) => {
  const shopId = await resolveShop(userId);
  await initializeDefaultCategories(shopId);
  const { page, limit, skip } = parsePagination(query);
  const filter = { shopId, isArchived: false };
  if (query.isActive === "false") filter.isArchived = true;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ name: regex }, { sku: regex }, { barcode: regex }];
  }
  if (query.stockStatus === "OUT_OF_STOCK") filter.quantity = { $lte: 0 };
  if (query.stockStatus === "LOW_STOCK")
    filter.$expr = {
      $and: [
        { $gt: ["$quantity", 0] },
        { $lte: ["$quantity", "$minimumStock"] },
      ],
    };
  if (query.stockStatus === "IN_STOCK")
    filter.$expr = { $gt: ["$quantity", "$minimumStock"] };
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({
        [query.sortBy || "createdAt"]: query.sortOrder === "asc" ? 1 : -1,
        _id: 1,
      })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name")
      .lean(),
    Product.countDocuments(filter),
  ]);
  return {
    items: items.map(shapeProduct),
    pagination: paginationMeta(page, limit, total),
    page,
    pages: Math.ceil(total / limit),
    total,
  };
};

export const getProduct = async (userId, id) => {
  const shopId = await resolveShop(userId);
  const product = await Product.findOne({ _id: id, shopId })
    .populate("categoryId", "name")
    .lean();
  if (!product)
    throw serviceError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return shapeProduct(product);
};

export const updateProduct = async (userId, id, input) => {
  const shopId = await resolveShop(userId);
  const product = await productForShop(shopId, id, false);
  if (input.categoryId) await validateCategory(shopId, input.categoryId);
  const { image, imageUrl, ...fields } = input;
  if (image !== undefined || imageUrl !== undefined)
    fields.imageUrl = imageUrl ?? image;
  if (fields.quantity !== undefined) delete fields.quantity;
  Object.assign(product, fields);
  await product.save();
  return shapeProduct(product);
};

export const setProductStatus = async (userId, id, isActive) => {
  const shopId = await resolveShop(userId);
  const product = await productForShop(shopId, id);
  product.isArchived = !isActive;
  await product.save();
  return shapeProduct(product);
};

export const deleteProduct = async (userId, id) => {
  const shopId = await resolveShop(userId);
  const product = await productForShop(shopId, id);
  const hasHistory = await StockMovement.exists({ shopId, productId: id });
  if (hasHistory)
    throw serviceError(
      409,
      "PRODUCT_HAS_HISTORY",
      "Products with stock history must be archived instead of deleted",
    );
  await Product.deleteOne({ _id: id, shopId });
  return { id };
};
