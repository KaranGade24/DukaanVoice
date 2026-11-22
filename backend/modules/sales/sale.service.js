import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Sale from "../../models/Sale.js";
import StockMovement from "../../models/StockMovement.js";
import { resolveShop, serviceError } from "../inventory/inventory.shared.js";

const transactionUnsupported = (error) => error.code === 20 || /replica set|transactions are not supported|transaction numbers are only allowed/i.test(error.message || "");
const shape = (sale) => {
  const value = sale.toObject ? sale.toObject() : sale;
  return { ...value, id: value._id.toString(), subtotal: value.subtotalMinor / 100, discount: value.discountMinor / 100, total: value.totalMinor / 100, amountReceived: value.amountReceivedMinor / 100, change: value.changeMinor / 100 };
};
const postSale = async ({ shopId, userId, input, idempotencyKey, session }) => {
  const ids = input.items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) throw serviceError(400, "DUPLICATE_SALE_PRODUCT", "Each product can appear only once");
  let query = Product.find({ _id: { $in: ids }, shopId, isArchived: false });
  if (session) query = query.session(session);
  const products = await query;
  if (products.length !== ids.length) throw serviceError(400, "INVALID_SALE_PRODUCT", "Every item must be an active product in this shop");
  const byId = new Map(products.map((product) => [product._id.toString(), product]));
  const lines = input.items.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (product.quantity < quantity) throw serviceError(409, "INSUFFICIENT_STOCK", `${product.name} has only ${product.quantity} ${product.unit} available`);
    const unitPriceMinor = Math.round(product.sellingPrice * 100);
    const lineTotalMinor = Math.round(unitPriceMinor * quantity);
    if (!Number.isSafeInteger(lineTotalMinor)) throw serviceError(400, "SALE_AMOUNT_TOO_LARGE", "Sale amount exceeds the supported range");
    return { product, quantity, unitPriceMinor, lineTotalMinor };
  });
  const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  if (!Number.isSafeInteger(subtotalMinor)) throw serviceError(400, "SALE_AMOUNT_TOO_LARGE", "Sale amount exceeds the supported range");
  const discountMinor = Math.round(input.discount * 100);
  if (discountMinor > subtotalMinor) throw serviceError(400, "DISCOUNT_EXCEEDS_SUBTOTAL", "Discount cannot exceed the item subtotal");
  const totalMinor = subtotalMinor - discountMinor;
  const amountReceivedMinor = Math.round(input.amountReceived * 100);
  if ((input.paymentMethod !== "CASH" && amountReceivedMinor !== totalMinor) || amountReceivedMinor < totalMinor)
    throw serviceError(400, "INVALID_AMOUNT_RECEIVED", "Received amount must equal the total for UPI or card, and cover the total for cash");
  const [sale] = await Sale.create([{
    shopId, saleNumber: `SAL-${new mongoose.Types.ObjectId().toString().toUpperCase()}`,
    items: lines.map(({ product, quantity, unitPriceMinor, lineTotalMinor }) => ({ productId: product._id, productName: product.name, sku: product.sku, quantity, unit: product.unit, unitPriceMinor, lineTotalMinor })),
    subtotalMinor, discountMinor, totalMinor, amountReceivedMinor, changeMinor: amountReceivedMinor - totalMinor,
    paymentMethod: input.paymentMethod, idempotencyKey: idempotencyKey || null, createdBy: userId,
  }], session ? { session } : {});
  for (const { product, quantity } of lines) {
    const newQuantity = product.quantity - quantity;
    const updated = await Product.updateOne({ _id: product._id, shopId, quantity: product.quantity }, { $set: { quantity: newQuantity } }, session ? { session } : {});
    if (!updated.modifiedCount) throw serviceError(409, "STOCK_CONFLICT", `${product.name} stock changed; retry the sale`);
    await StockMovement.create([{
      shopId, productId: product._id, type: "SALE", previousQuantity: product.quantity,
      changedQuantity: -quantity, newQuantity, unit: product.unit, reason: "Point of sale",
      reference: sale.saleNumber, notes: `Sale ${sale.saleNumber}`, performedBy: userId,
    }], session ? { session } : {});
  }
  return shape(sale);
};

export const createSale = async (userId, input, requestKey) => {
  const shopId = await resolveShop(userId);
  const key = requestKey || null;
  if (key && (key.length < 8 || key.length > 100)) throw serviceError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency key must be between 8 and 100 characters");
  if (key) { const existing = await Sale.findOne({ shopId, idempotencyKey: key }); if (existing) return shape(existing); }
  try {
    const session = await mongoose.startSession();
    try { let result; await session.withTransaction(async () => { result = await postSale({ shopId, userId, input, idempotencyKey: key, session }); }); return result; }
    finally { await session.endSession(); }
  } catch (error) {
    if (transactionUnsupported(error)) throw serviceError(503, "TRANSACTIONS_REQUIRED", "Sale posting requires a transaction-capable MongoDB deployment to keep sale and stock records consistent");
    if (error.code === 11000 && key) { const existing = await Sale.findOne({ shopId, idempotencyKey: key }); if (existing) return shape(existing); }
    throw error;
  }
};
