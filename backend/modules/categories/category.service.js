import Category from "../../models/Category.js";
import Product from "../../models/Product.js";
import {
  escapeRegex,
  paginationMeta,
  parsePagination,
  resolveShop,
  serviceError,
} from "../inventory/inventory.shared.js";

const DEFAULT_CATEGORIES = [
  "Grocery",
  "Dairy",
  "Beverages",
  "Snacks",
  "Personal Care",
  "Household",
  "Electronics",
  "Clothing",
  "Other",
];

export const initializeDefaultCategories = async (shopId) => {
  const defaultCount = await Category.countDocuments({
    shopId,
    isDefault: true,
  });
  if (defaultCount === DEFAULT_CATEGORIES.length) return;
  try {
    await Category.bulkWrite(
      DEFAULT_CATEGORIES.map((name) => ({
        updateOne: {
          filter: { shopId, name },
          update: {
            $setOnInsert: { shopId, name, isDefault: true, isActive: true },
          },
          upsert: true,
          collation: { locale: "en", strength: 2 },
        },
      })),
      { ordered: false },
    );
  } catch (error) {
    const writeErrors =
      error.writeErrors || error.result?.getWriteErrors?.() || [];
    const onlyDuplicateErrors = writeErrors.length
      ? writeErrors.every((writeError) => writeError.code === 11000)
      : error.code === 11000;
    if (!onlyDuplicateErrors) throw error;
  }
};

const categoryForShop = async (shopId, id) => {
  const category = await Category.findOne({ _id: id, shopId });
  if (!category)
    throw serviceError(404, "CATEGORY_NOT_FOUND", "Category not found");
  return category;
};

const shapeCategory = (category, productCount) => {
  const item = category.toObject ? category.toObject() : category;
  return { ...item, id: item._id.toString(), productCount };
};

export const createCategory = async (userId, input) => {
  const shopId = await resolveShop(userId);
  await initializeDefaultCategories(shopId);
  const category = await Category.create({
    ...input,
    image: input.image || "",
    shopId,
  });
  return shapeCategory(category, 0);
};

export const listCategories = async (userId, query) => {
  const shopId = await resolveShop(userId);
  await initializeDefaultCategories(shopId);
  const { page, limit, skip } = parsePagination(query);
  const filter = { shopId };
  if (query.isActive) filter.isActive = query.isActive === "true";
  if (query.search)
    filter.name = { $regex: escapeRegex(query.search), $options: "i" };
  const sortBy = query.sortBy || "createdAt";
  const direction = query.sortOrder === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    Category.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: Product.collection.name,
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$categoryId", "$$categoryId"] },
                    { $eq: ["$shopId", shopId] },
                    { $eq: ["$isArchived", false] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "counts",
        },
      },
      {
        $addFields: {
          productCount: {
            $ifNull: [{ $arrayElemAt: ["$counts.count", 0] }, 0],
          },
        },
      },
      { $project: { counts: 0 } },
      { $sort: { [sortBy]: direction, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]),
    Category.countDocuments(filter),
  ]);
  return {
    items: rows.map((row) => ({ ...row, id: row._id.toString() })),
    pagination: paginationMeta(page, limit, total),
  };
};

export const getCategory = async (userId, id) => {
  const shopId = await resolveShop(userId);
  const category = await Category.findOne({ _id: id, shopId }).lean();
  if (!category)
    throw serviceError(404, "CATEGORY_NOT_FOUND", "Category not found");
  category.productCount = await Product.countDocuments({
    shopId,
    categoryId: id,
    isArchived: false,
  });
  return shapeCategory(category, category.productCount);
};

export const updateCategory = async (userId, id, input) => {
  const shopId = await resolveShop(userId);
  const category = await categoryForShop(shopId, id);
  Object.assign(category, input);
  await category.save();
  return shapeCategory(
    category,
    await Product.countDocuments({ shopId, categoryId: id, isArchived: false }),
  );
};

export const setCategoryStatus = async (userId, id, isActive) => {
  const shopId = await resolveShop(userId);
  const category = await categoryForShop(shopId, id);
  category.isActive = isActive;
  await category.save();
  return shapeCategory(
    category,
    await Product.countDocuments({ shopId, categoryId: id, isArchived: false }),
  );
};

export const deleteCategory = async (userId, id) => {
  const shopId = await resolveShop(userId);
  await categoryForShop(shopId, id);
  const count = await Product.countDocuments({ shopId, categoryId: id });
  if (count)
    throw serviceError(
      409,
      "CATEGORY_HAS_PRODUCTS",
      "Reassign or archive this category's products before deleting it",
    );
  await Category.deleteOne({ _id: id, shopId });
  return { id };
};
