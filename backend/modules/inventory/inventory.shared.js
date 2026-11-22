import Shop from "../../models/Shop.js";

export const serviceError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

export const resolveShop = async (userId) => {
  const shop = await Shop.findOne({ userId }).select("_id").lean();
  if (!shop)
    throw serviceError(
      403,
      "SHOP_NOT_FOUND",
      "An active shop is required for inventory access",
    );
  return shop._id;
};

export const parsePagination = ({ page = 1, limit = 20 }) => ({
  page: Number(page),
  limit: Number(limit),
  skip: (Number(page) - 1) * Number(limit),
});

export const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

export const getStockStatus = (quantity, minimumStock) =>
  quantity <= 0
    ? "OUT_OF_STOCK"
    : quantity <= minimumStock
      ? "LOW_STOCK"
      : "IN_STOCK";

export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
