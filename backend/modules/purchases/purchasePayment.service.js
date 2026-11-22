import mongoose from "mongoose";
import Purchase from "../../models/Purchase.js";
import PurchasePayment from "../../models/PurchasePayment.js";
import { minorToAmount, toMinorUnits } from "../../utils/purchaseCalculator.js";
import { isTransactionUnsupported, pageInfo, pagination, purchaseError, resolveShop } from "./purchase.shared.js";

const shapePayment = (payment) => ({ id: payment._id.toString(), purchaseId: payment.purchaseId?._id?.toString() || payment.purchaseId?.toString(), supplierId: payment.supplierId?._id?.toString() || payment.supplierId?.toString(), amount: minorToAmount(payment.amountMinor), paymentMethod: payment.paymentMethod, paymentDate: payment.paymentDate, transactionReference: payment.transactionReference, notes: payment.notes, entryType: payment.entryType, reversalOf: payment.reversalOf?.toString() || null, recordedBy: payment.recordedBy?.fullName || payment.recordedBy?.toString(), createdAt: payment.createdAt });
const paymentStatusFor = (paid, outstanding) => outstanding === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";
export const recordPurchasePayment = async (userId, purchaseId, input, requestKey) => {
  const shop = await resolveShop(userId);
  const idempotencyKey = requestKey || input.idempotencyKey;
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 100)) throw purchaseError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency key must be between 8 and 100 characters");
  if (idempotencyKey) {
    const existing = await PurchasePayment.findOne({ shopId: shop._id, idempotencyKey }).lean();
    if (existing) return shapePayment(existing);
  }
  let amountMinor;
  try { amountMinor = toMinorUnits(input.amount); }
  catch (error) { throw purchaseError(400, "INVALID_PAYMENT_AMOUNT", error.message); }
  if (amountMinor < 1) throw purchaseError(400, "INVALID_PAYMENT_AMOUNT", "Payment must be at least one paisa");
  try {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const purchase = await Purchase.findOne({ _id: purchaseId, shopId: shop._id }).session(session);
        if (!purchase) throw purchaseError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
        if (purchase.status !== "POSTED") throw purchaseError(409, "PURCHASE_NOT_POSTED", "Payments can only be recorded for posted purchases");
        if (amountMinor > purchase.outstandingMinor) throw purchaseError(409, "OVERPAYMENT_NOT_ALLOWED", "Payment exceeds the outstanding balance");
        const previousOutstanding = purchase.outstandingMinor;
        const newOutstanding = previousOutstanding - amountMinor;
        const newTotalPaid = purchase.totalPaidMinor + amountMinor;
        const updated = await Purchase.updateOne({ _id: purchase._id, shopId: shop._id, status: "POSTED", outstandingMinor: previousOutstanding }, { $set: { outstandingMinor: newOutstanding, totalPaidMinor: newTotalPaid, paymentStatus: paymentStatusFor(newTotalPaid, newOutstanding), updatedBy: userId } }, { session });
        if (!updated.modifiedCount) throw purchaseError(409, "PAYMENT_CONFLICT", "Purchase balance changed concurrently; reload and retry");
        const [payment] = await PurchasePayment.create([{ shopId: shop._id, purchaseId: purchase._id, supplierId: purchase.supplierId, amountMinor, paymentMethod: input.paymentMethod, paymentDate: input.paymentDate || new Date(), transactionReference: input.transactionReference || "", notes: input.notes || "", idempotencyKey: idempotencyKey || null, recordedBy: userId }], { session });
        result = shapePayment(payment);
      });
      return result;
    } finally { await session.endSession(); }
  } catch (error) {
    if (isTransactionUnsupported(error)) throw purchaseError(503, "TRANSACTIONS_REQUIRED", "Purchase payments require a transaction-capable MongoDB deployment");
    if (error.code === 11000 && idempotencyKey) {
      const existing = await PurchasePayment.findOne({ shopId: shop._id, idempotencyKey }).lean();
      if (existing) return shapePayment(existing);
    }
    throw error;
  }
};
export const purchasePayments = async (userId, purchaseId, query) => {
  const shop = await resolveShop(userId);
  if (!await Purchase.exists({ _id: purchaseId, shopId: shop._id })) throw purchaseError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
  const { page, limit, skip } = pagination(query);
  const filter = { shopId: shop._id, purchaseId };
  const [items, total] = await Promise.all([PurchasePayment.find(filter).sort({ paymentDate: -1 }).skip(skip).limit(limit).populate("recordedBy", "fullName").lean(), PurchasePayment.countDocuments(filter)]);
  return { items: items.map(shapePayment), pagination: pageInfo(page, limit, total) };
};
export const listSupplierPayments = async (userId, query) => {
  const shop = await resolveShop(userId);
  const { page, limit, skip } = pagination(query);
  const filter = { shopId: shop._id };
  if (query.supplierId) filter.supplierId = query.supplierId;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.from || query.to) filter.paymentDate = { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) };
  if (query.from && query.to && new Date(query.from) > new Date(query.to)) throw purchaseError(400, "INVALID_DATE_RANGE", "Start date must be before end date");
  const [items, total] = await Promise.all([PurchasePayment.find(filter).sort({ paymentDate: -1 }).skip(skip).limit(limit).populate("purchaseId", "purchaseReference").populate("supplierId", "supplierName").populate("recordedBy", "fullName").lean(), PurchasePayment.countDocuments(filter)]);
  return { items: items.map((item) => ({ ...shapePayment(item), purchaseReference: item.purchaseId?.purchaseReference || "", supplierName: item.supplierId?.supplierName || "" })), pagination: pageInfo(page, limit, total) };
};
export const getSupplierPayment = async (userId, id) => {
  const shop = await resolveShop(userId);
  const payment = await PurchasePayment.findOne({ _id: id, shopId: shop._id }).populate("purchaseId", "purchaseReference").populate("supplierId", "supplierName").populate("recordedBy", "fullName").lean();
  if (!payment) throw purchaseError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  return { ...shapePayment(payment), purchaseReference: payment.purchaseId?.purchaseReference || "", supplierName: payment.supplierId?.supplierName || "" };
};
