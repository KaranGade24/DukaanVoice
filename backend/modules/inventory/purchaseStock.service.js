import Product from "../../models/Product.js";
import StockMovement from "../../models/StockMovement.js";
import { serviceError } from "./inventory.shared.js";

export const applyPurchaseStockMovement = async ({ shopId, productId, quantity, direction, purchaseReference, purchaseId, performedBy, unitPurchasePriceMinor, session, reason }) => {
  const productQuery = Product.findOne({ _id: productId, shopId, isArchived: false });
  if (session) productQuery.session(session);
  const product = await productQuery;
  if (!product) throw serviceError(404, "PRODUCT_NOT_FOUND", "Active product not found in this shop");
  const delta = direction === "IN" ? quantity : -quantity;
  const newQuantity = product.quantity + delta;
  if (newQuantity < 0) throw serviceError(409, "INSUFFICIENT_STOCK_FOR_CANCELLATION", "Purchased stock has already been sold or consumed");
  const filter = { _id: productId, shopId, isArchived: false, quantity: product.quantity };
  const update = { $set: { quantity: newQuantity } };
  if (direction === "IN") update.$set.purchasePrice = unitPurchasePriceMinor / 100;
  const updated = await Product.updateOne(filter, update, session ? { session } : {});
  if (!updated.modifiedCount) throw serviceError(409, "STOCK_CONFLICT", "Product stock changed concurrently; retry the purchase operation");
  const movement = {
    shopId, productId, purchaseId, type: direction === "IN" ? "PURCHASE" : "STOCK_ADJUSTMENT",
    previousQuantity: product.quantity, changedQuantity: delta, newQuantity, unit: product.unit,
    reason: reason || (direction === "IN" ? "Purchase received" : "Purchase cancelled"),
    reference: purchaseReference, notes: `Purchase ${purchaseReference}`, performedBy,
    purchaseCost: unitPurchasePriceMinor / 100,
  };
  try {
    const [record] = await StockMovement.create([movement], session ? { session } : {});
    return { movement: record, previousQuantity: product.quantity, newQuantity, product };
  } catch (error) {
    if (session) throw error;
    const rollback = await Product.updateOne({ _id: productId, shopId, quantity: newQuantity }, { $set: { quantity: product.quantity, purchasePrice: product.purchasePrice } });
    if (!rollback.modifiedCount) throw serviceError(500, "PURCHASE_STOCK_INCONSISTENT", "Stock changed but movement history failed; contact support");
    throw error;
  }
};
