import Shop from "../../models/Shop.js";
export const purchaseError = (statusCode, code, message) => Object.assign(new Error(message), { statusCode, code });
export const resolveShop = async (userId) => {
  const shop = await Shop.findOne({ userId }).select("_id shopName businessType city").lean();
  if (!shop) throw purchaseError(403, "SHOP_NOT_FOUND", "An active shop is required for supplier and purchase access");
  return shop;
};
export const pagination = ({ page = 1, limit = 20 }) => ({ page: Number(page), limit: Number(limit), skip: (Number(page) - 1) * Number(limit) });
export const pageInfo = (page, limit, total) => ({ page, limit, total, pages: Math.ceil(total / limit) });
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const isTransactionUnsupported = (error) => error.code === 20 || /transaction numbers are only allowed|replica set|does not support transactions|transactions are not supported/i.test(error.message || "");
