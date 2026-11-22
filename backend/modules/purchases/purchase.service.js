import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Supplier from "../../models/Supplier.js";
import Purchase from "../../models/Purchase.js";
import PurchaseCounter from "../../models/PurchaseCounter.js";
import PurchasePayment from "../../models/PurchasePayment.js";
import Shop from "../../models/Shop.js";
import { calculatePurchase, minorToAmount, toMinorUnits } from "../../utils/purchaseCalculator.js";
import { applyPurchaseStockMovement } from "../inventory/purchaseStock.service.js";
import { escapeRegex, isTransactionUnsupported, pagination, pageInfo, purchaseError, resolveShop } from "./purchase.shared.js";

const paymentStatusFor = (paid, outstanding) => outstanding === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";
const minorInput = (amount) => {
  try { return toMinorUnits(amount); }
  catch (error) { throw purchaseError(400, "INVALID_MONEY_AMOUNT", error.message); }
};
const shapePurchase = (purchase) => {
  const item = purchase.toObject ? purchase.toObject() : purchase;
  return {
    ...item, id: item._id.toString(), supplierId: item.supplierId?._id?.toString() || item.supplierId?.toString(),
    ...(item.supplierId?.supplierName ? { supplier: { id: item.supplierId._id.toString(), supplierName: item.supplierId.supplierName, businessName: item.supplierId.businessName } } : {}),
    subtotal: minorToAmount(item.subtotalMinor), itemDiscountTotal: minorToAmount(item.itemDiscountTotalMinor),
    totalDiscount: minorToAmount(item.itemDiscountTotalMinor + item.additionalDiscountMinor),
    additionalDiscount: minorToAmount(item.additionalDiscountMinor), additionalDiscountType: item.additionalDiscountType || "AMOUNT", additionalDiscountValue: item.additionalDiscountValue ?? minorToAmount(item.additionalDiscountMinor), taxableAmount: minorToAmount(item.taxableAmountMinor), taxAmount: minorToAmount(item.taxAmountMinor),
    additionalCharges: minorToAmount(item.additionalChargesMinor), grandTotal: minorToAmount(item.grandTotalMinor), totalPaid: minorToAmount(item.totalPaidMinor), outstandingAmount: minorToAmount(item.outstandingMinor),
    items: item.items.map((line) => ({ ...line, productId: line.productId.toString(), discountType: line.discountType || "AMOUNT", discountValue: line.discountValue ?? minorToAmount(line.discountAmountMinor), unitPurchasePrice: minorToAmount(line.unitPurchasePriceMinor), lineSubtotal: minorToAmount(line.lineSubtotalMinor), discountAmount: minorToAmount(line.discountAmountMinor), additionalDiscountAllocation: minorToAmount(line.additionalDiscountAllocationMinor || 0), taxableAmount: minorToAmount(line.taxableAmountMinor), taxRate: line.taxRateBasisPoints / 100, taxAmount: minorToAmount(line.taxAmountMinor), lineTotal: minorToAmount(line.lineTotalMinor) })),
  };
};
const generateReference = async (shopId, year, session) => {
  const counter = await PurchaseCounter.findOneAndUpdate({ shopId, year }, { $inc: { sequence: 1 } }, { returnDocument: "after", ...(session ? { session } : {}) });
  if (!counter) throw purchaseError(500, "PURCHASE_COUNTER_MISSING", "Purchase reference counter is unavailable");
  return `PUR-${year}-${String(counter.sequence).padStart(6, "0")}`;
};
const productSnapshots = async (shopId, items, session) => {
  const ids = [...new Set(items.map((item) => item.productId))];
  let query = Product.find({ _id: { $in: ids }, shopId, isArchived: false }).select("_id name sku unit quantity purchasePrice");
  if (session) query = query.session(session);
  const products = await query.lean();
  if (products.length !== ids.length) throw purchaseError(400, "INVALID_PURCHASE_PRODUCT", "Every purchase item must reference an active product in this shop");
  return new Map(products.map((product) => [product._id.toString(), product]));
};
const createPaymentDoc = async ({ shopId, purchase, input, userId, session, idempotencyKey }) => {
  const amountMinor = minorInput(input.amount);
  if (amountMinor <= 0 || amountMinor > purchase.grandTotalMinor) throw purchaseError(400, "INVALID_INITIAL_PAYMENT", "Initial payment must be positive and cannot exceed the purchase total");
  const data = { shopId, purchaseId: purchase._id, supplierId: purchase.supplierId, amountMinor, paymentMethod: input.paymentMethod, paymentDate: input.paymentDate || new Date(), transactionReference: input.transactionReference || "", notes: input.notes || "", recordedBy: userId, idempotencyKey: idempotencyKey || null };
  const [payment] = await PurchasePayment.create([data], session ? { session } : {});
  purchase.totalPaidMinor = amountMinor;
  purchase.outstandingMinor = purchase.grandTotalMinor - amountMinor;
  purchase.paymentStatus = paymentStatusFor(purchase.totalPaidMinor, purchase.outstandingMinor);
  return payment;
};
const writePurchase = async ({ shopId, userId, input, idempotencyKey, session }) => {
  const supplierQuery = Supplier.findOne({ _id: input.supplierId, shopId, isActive: true });
  if (session) supplierQuery.session(session);
  const supplier = await supplierQuery;
  if (!supplier) throw purchaseError(404, "SUPPLIER_NOT_FOUND", "Active supplier not found in this shop");
  const products = await productSnapshots(shopId, input.items, session);
  let calculation;
  try {
    calculation = calculatePurchase(input);
  } catch (error) {
    throw purchaseError(400, "INVALID_PURCHASE_CALCULATION", error.message);
  }
  const productById = products;
  const items = calculation.lines.map((line) => {
    const product = productById.get(line.productId);
    return { ...line, productId: product._id, productNameSnapshot: product.name, skuSnapshot: product.sku || "", unit: product.unit };
  });
  const year = input.purchaseDate.getFullYear();
  const purchaseReference = await generateReference(shopId, year, session);
  const initialMinor = input.initialPayment ? minorInput(input.initialPayment.amount) : 0;
  if (initialMinor > calculation.grandTotalMinor) throw purchaseError(400, "OVERPAYMENT_NOT_ALLOWED", "Initial payment cannot exceed the purchase total");
  const now = new Date();
  const [purchase] = await Purchase.create([{
    shopId, purchaseReference, referenceYear: year, supplierId: supplier._id, supplierInvoiceNumber: input.supplierInvoiceNumber || "",
    purchaseDate: input.purchaseDate, dueDate: input.dueDate || null, items, subtotalMinor: calculation.subtotalMinor,
    itemDiscountTotalMinor: calculation.itemDiscountTotalMinor, additionalDiscountMinor: calculation.additionalDiscountMinor,
    additionalDiscountType: calculation.additionalDiscountType, additionalDiscountValue: calculation.additionalDiscountValue,
    taxableAmountMinor: calculation.taxableAmountMinor, taxAmountMinor: calculation.taxAmountMinor,
    additionalChargesMinor: calculation.additionalChargesMinor, grandTotalMinor: calculation.grandTotalMinor,
    totalPaidMinor: 0, outstandingMinor: calculation.grandTotalMinor, paymentStatus: "UNPAID", notes: input.notes || "",
    status: "POSTED", idempotencyKey: idempotencyKey || input.idempotencyKey || null, createdBy: userId, updatedBy: userId, postedAt: now,
  }], session ? { session } : {});
  for (const item of items) await applyPurchaseStockMovement({ shopId, productId: item.productId, quantity: item.quantity, direction: "IN", purchaseReference, purchaseId: purchase._id, performedBy: userId, unitPurchasePriceMinor: item.unitPurchasePriceMinor, session });
  if (input.initialPayment) await createPaymentDoc({ shopId, purchase, input: input.initialPayment, userId, session, idempotencyKey: idempotencyKey ? `${idempotencyKey}:initial`.slice(0, 100) : undefined });
  purchase.updatedBy = userId;
  await purchase.save(session ? { session } : {});
  return shapePurchase(purchase);
};
export const createPurchase = async (userId, input, requestKey) => {
  const shop = await resolveShop(userId);
  const idempotencyKey = requestKey || input.idempotencyKey;
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 100)) throw purchaseError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency key must be between 8 and 100 characters");
  const referenceYear = input.purchaseDate.getFullYear();
  try {
    await PurchaseCounter.updateOne({ shopId: shop._id, year: referenceYear }, { $setOnInsert: { shopId: shop._id, year: referenceYear, sequence: 0 } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  if (idempotencyKey) {
    const existing = await Purchase.findOne({ shopId: shop._id, idempotencyKey }).lean();
    if (existing) return shapePurchase(existing);
  }
  try {
    try {
      const session = await mongoose.startSession();
      try { let result; await session.withTransaction(async () => { result = await writePurchase({ shopId: shop._id, userId, input, idempotencyKey, session }); }); return result; }
      finally { await session.endSession(); }
    } catch (error) {
      if (!isTransactionUnsupported(error)) throw error;
      throw purchaseError(503, "TRANSACTIONS_REQUIRED", "Purchase posting requires a transaction-capable MongoDB deployment to keep purchase, stock, and payment records consistent");
    }
  } catch (error) {
    if (error.code === 11000 && idempotencyKey) {
      const existing = await Purchase.findOne({ shopId: shop._id, idempotencyKey }).lean();
      if (existing) return shapePurchase(existing);
    }
    throw error;
  }
};
export const listPurchases = async (userId, query) => {
  const shop = await resolveShop(userId);
  const { page, limit, skip } = pagination(query);
  const filter = { shopId: shop._id };
  if (query.supplierId) filter.supplierId = query.supplierId;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.status) filter.status = query.status;
  if (query.from || query.to) filter.purchaseDate = { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) };
  if (query.from && query.to && new Date(query.from) > new Date(query.to)) throw purchaseError(400, "INVALID_DATE_RANGE", "Start date must be before end date");
  if (query.search) { const regex = new RegExp(escapeRegex(query.search), "i"); filter.$or = [{ purchaseReference: regex }, { supplierInvoiceNumber: regex }]; }
  const [items, total] = await Promise.all([
    Purchase.find(filter).sort({ [query.sortBy || "purchaseDate"]: query.sortOrder === "asc" ? 1 : -1, _id: -1 }).skip(skip).limit(limit).populate("supplierId", "supplierName businessName").lean(),
    Purchase.countDocuments(filter),
  ]);
  return { items: items.map((item) => ({ ...shapePurchase(item), supplier: item.supplierId ? { id: item.supplierId._id.toString(), supplierName: item.supplierId.supplierName, businessName: item.supplierId.businessName } : null })), pagination: pageInfo(page, limit, total) };
};
const purchaseForShop = async (shopId, id) => {
  const purchase = await Purchase.findOne({ _id: id, shopId }).populate("supplierId", "supplierName businessName phoneNumber email gstNumber address").lean();
  if (!purchase) throw purchaseError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
  return purchase;
};
export const getPurchase = async (userId, id) => shapePurchase(await purchaseForShop((await resolveShop(userId))._id, id));
export const getPurchaseInvoice = async (userId, id) => {
  const shop = await resolveShop(userId);
  const purchase = await purchaseForShop(shop._id, id);
  return { shop: { id: shop._id.toString(), shopName: shop.shopName, businessType: shop.businessType, city: shop.city }, supplier: purchase.supplierId ? { id: purchase.supplierId._id.toString(), supplierName: purchase.supplierId.supplierName, businessName: purchase.supplierId.businessName, phoneNumber: purchase.supplierId.phoneNumber, email: purchase.supplierId.email, gstNumber: purchase.supplierId.gstNumber, address: purchase.supplierId.address } : null, purchase: shapePurchase(purchase) };
};
export const cancelPurchase = async (userId, id, reason) => {
  const shop = await resolveShop(userId);
  const cancelWithinSession = async (session) => {
    const query = Purchase.findOne({ _id: id, shopId: shop._id });
    if (session) query.session(session);
    const purchase = await query;
    if (!purchase) throw purchaseError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
    if (purchase.status !== "POSTED") throw purchaseError(409, "PURCHASE_NOT_POSTED", "Only posted purchases can be cancelled");
    if (purchase.totalPaidMinor > 0) throw purchaseError(409, "PURCHASE_HAS_PAYMENTS", "This purchase has payments. Record a refund or supplier credit before cancellation");
    for (const item of purchase.items) await applyPurchaseStockMovement({ shopId: shop._id, productId: item.productId, quantity: item.quantity, direction: "OUT", purchaseReference: purchase.purchaseReference, purchaseId: purchase._id, performedBy: userId, unitPurchasePriceMinor: item.unitPurchasePriceMinor, session, reason: "Purchase cancellation" });
    purchase.status = "CANCELLED"; purchase.cancelledAt = new Date(); purchase.cancelledBy = userId; purchase.cancellationReason = reason; purchase.updatedBy = userId;
    await purchase.save(session ? { session } : {});
    return shapePurchase(purchase);
  };
  try {
    const session = await mongoose.startSession();
    try { let value; await session.withTransaction(async () => { value = await cancelWithinSession(session); }); return value; }
    finally { await session.endSession(); }
  } catch (error) {
    if (isTransactionUnsupported(error)) throw purchaseError(503, "TRANSACTIONS_REQUIRED", "Purchase cancellation requires a transaction-capable MongoDB deployment");
    throw error;
  }
};
