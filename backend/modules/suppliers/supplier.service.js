import Supplier from "../../models/Supplier.js";
import Purchase from "../../models/Purchase.js";
import PurchasePayment from "../../models/PurchasePayment.js";
import { minorToAmount } from "../../utils/purchaseCalculator.js";
import { escapeRegex, pageInfo, pagination, purchaseError, resolveShop } from "../purchases/purchase.shared.js";

const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const normalizePhone = (value = "") => value.replace(/[ ()-]/g, "");
const normalizeSupplier = (input) => {
  const data = { ...input };
  if (data.phoneNumber !== undefined) data.phoneNumber = normalizePhone(data.phoneNumber);
  if (data.alternatePhone !== undefined) data.alternatePhone = normalizePhone(data.alternatePhone);
  if (data.email !== undefined) data.email = data.email.trim().toLowerCase();
  if (data.gstNumber !== undefined) {
    data.gstNumber = data.gstNumber.trim().toUpperCase();
    if (data.gstNumber && !gstinPattern.test(data.gstNumber)) throw purchaseError(400, "INVALID_GSTIN", "GSTIN format is invalid");
  }
  return data;
};
const supplierForShop = async (shopId, id) => {
  const supplier = await Supplier.findOne({ _id: id, shopId });
  if (!supplier) throw purchaseError(404, "SUPPLIER_NOT_FOUND", "Supplier not found");
  return supplier;
};
const summaryStages = [
  { $lookup: { from: Purchase.collection.name, let: { supplierId: "$_id", shopId: "$shopId" }, pipeline: [ { $match: { $expr: { $and: [{ $eq: ["$supplierId", "$$supplierId"] }, { $eq: ["$shopId", "$$shopId"] }, { $eq: ["$status", "POSTED"] }] } } }, { $group: { _id: null, purchaseCount: { $sum: 1 }, totalPurchasesMinor: { $sum: "$grandTotalMinor" }, totalPaidMinor: { $sum: "$totalPaidMinor" }, outstandingMinor: { $sum: "$outstandingMinor" } } } ], as: "purchaseSummary" } },
  { $addFields: { purchaseSummary: { $ifNull: [{ $arrayElemAt: ["$purchaseSummary", 0] }, { purchaseCount: 0, totalPurchasesMinor: 0, totalPaidMinor: 0, outstandingMinor: 0 }] } } },
];
const shapeSupplier = (supplier) => {
  const summary = supplier.purchaseSummary || {};
  return { ...supplier, id: supplier._id.toString(), purchaseCount: summary.purchaseCount || 0, totalPurchases: minorToAmount(summary.totalPurchasesMinor || 0), totalPaid: minorToAmount(summary.totalPaidMinor || 0), outstandingBalance: minorToAmount(summary.outstandingMinor || 0) };
};

export const createSupplier = async (userId, input) => {
  const shop = await resolveShop(userId);
  const data = normalizeSupplier(input);
  const duplicate = await Supplier.findOne({ shopId: shop._id, $or: [{ phoneNumber: data.phoneNumber }, ...(data.businessName ? [{ businessName: { $regex: `^${escapeRegex(data.businessName)}$`, $options: "i" } }] : [])] }).select("_id supplierName phoneNumber businessName").lean();
  const supplier = await Supplier.create({ ...data, shopId: shop._id, createdBy: userId, updatedBy: userId });
  return { ...shapeSupplier(supplier.toObject()), duplicateWarning: duplicate ? { id: duplicate._id.toString(), supplierName: duplicate.supplierName, phoneNumber: duplicate.phoneNumber } : null };
};

export const listSuppliers = async (userId, query) => {
  const shop = await resolveShop(userId);
  const { page, limit, skip } = pagination(query);
  const match = { shopId: shop._id };
  if (query.isActive !== "all") match.isActive = query.isActive !== "false";
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    match.$or = [{ supplierName: search }, { contactPerson: search }, { phoneNumber: search }, { businessName: search }];
  }
  const sortBy = query.sortBy || "supplierName";
  const direction = query.sortOrder === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    Supplier.aggregate([{ $match: match }, ...summaryStages, { $sort: { [sortBy === "purchaseCount" || sortBy === "totalPurchases" || sortBy === "outstandingBalance" ? `purchaseSummary.${sortBy === "purchaseCount" ? "purchaseCount" : sortBy === "totalPurchases" ? "totalPurchasesMinor" : "outstandingMinor"}` : sortBy]: direction, _id: 1 } }, { $skip: skip }, { $limit: limit }]),
    Supplier.countDocuments(match),
  ]);
  return { items: rows.map(shapeSupplier), pagination: pageInfo(page, limit, total) };
};

export const getSupplier = async (userId, id) => {
  const shop = await resolveShop(userId);
  const base = await supplierForShop(shop._id, id);
  const [supplier] = await Supplier.aggregate([{ $match: { _id: base._id, shopId: shop._id } }, ...summaryStages]);
  const recentPurchases = await Purchase.find({ shopId: shop._id, supplierId: supplier._id }).sort({ purchaseDate: -1 }).limit(10).select("purchaseReference supplierInvoiceNumber purchaseDate grandTotalMinor totalPaidMinor outstandingMinor paymentStatus status").lean();
  return { ...shapeSupplier(supplier), recentPurchases: recentPurchases.map((purchase) => ({ ...purchase, id: purchase._id.toString(), grandTotal: minorToAmount(purchase.grandTotalMinor), totalPaid: minorToAmount(purchase.totalPaidMinor), outstandingBalance: minorToAmount(purchase.outstandingMinor) })) };
};

export const updateSupplier = async (userId, id, input) => {
  const shop = await resolveShop(userId);
  const supplier = await supplierForShop(shop._id, id);
  const data = normalizeSupplier(input);
  Object.assign(supplier, data, { updatedBy: userId });
  if (data.isActive === false) supplier.archivedAt = new Date();
  if (data.isActive === true) supplier.archivedAt = null;
  await supplier.save();
  const duplicate = await Supplier.findOne({ shopId: shop._id, _id: { $ne: supplier._id }, $or: [{ phoneNumber: supplier.phoneNumber }, ...(supplier.businessName ? [{ businessName: { $regex: `^${escapeRegex(supplier.businessName)}$`, $options: "i" } }] : [])] }).select("_id supplierName phoneNumber").lean();
  return { ...(await getSupplier(userId, id)), duplicateWarning: duplicate ? { id: duplicate._id.toString(), supplierName: duplicate.supplierName, phoneNumber: duplicate.phoneNumber } : null };
};
export const archiveSupplier = async (userId, id) => updateSupplier(userId, id, { isActive: false });

export const supplierPurchases = async (userId, id, query) => {
  const shop = await resolveShop(userId);
  await supplierForShop(shop._id, id);
  const { page, limit, skip } = pagination(query);
  const filter = { shopId: shop._id, supplierId: id, ...(query.status ? { status: query.status } : {}), ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}) };
  const [items, total] = await Promise.all([Purchase.find(filter).sort({ purchaseDate: -1 }).skip(skip).limit(limit).lean(), Purchase.countDocuments(filter)]);
  return { items: items.map((item) => ({ ...item, id: item._id.toString(), grandTotal: minorToAmount(item.grandTotalMinor), totalPaid: minorToAmount(item.totalPaidMinor), outstandingBalance: minorToAmount(item.outstandingMinor) })), pagination: pageInfo(page, limit, total) };
};

export const supplierSummary = async (userId, id) => {
  const shop = await resolveShop(userId);
  await supplierForShop(shop._id, id);
  const [summary] = await Purchase.aggregate([{ $match: { shopId: shop._id, supplierId: id, status: "POSTED" } }, { $group: { _id: null, purchaseCount: { $sum: 1 }, totalPurchasesMinor: { $sum: "$grandTotalMinor" }, totalPaidMinor: { $sum: "$totalPaidMinor" }, outstandingMinor: { $sum: "$outstandingMinor" } } }]);
  const supplierId = id;
  const recentPurchases = await supplierPurchases(userId, id, { page: 1, limit: 10, sortOrder: "desc" });
  const paymentHistory = await PurchasePayment.find({ shopId: shop._id, supplierId }).sort({ paymentDate: -1 }).limit(20).populate("purchaseId", "purchaseReference").lean();
  return { supplierId, purchaseCount: summary?.purchaseCount || 0, totalPurchases: minorToAmount(summary?.totalPurchasesMinor || 0), totalPaid: minorToAmount(summary?.totalPaidMinor || 0), outstandingBalance: minorToAmount(summary?.outstandingMinor || 0), recentPurchases: recentPurchases.items, paymentHistory: paymentHistory.map((payment) => ({ id: payment._id.toString(), purchaseId: payment.purchaseId?._id.toString(), purchaseReference: payment.purchaseId?.purchaseReference || "", amount: minorToAmount(payment.amountMinor), paymentMethod: payment.paymentMethod, paymentDate: payment.paymentDate, transactionReference: payment.transactionReference, entryType: payment.entryType })) };
};
export const supplierOutstanding = async (userId, id, query = {}) => {
  const shop = await resolveShop(userId);
  await supplierForShop(shop._id, id);
  const { page, limit, skip } = pagination(query);
  const [totals, purchases, total] = await Promise.all([
    Purchase.aggregate([{ $match: { shopId: shop._id, supplierId: id, status: "POSTED" } }, { $group: { _id: null, outstandingMinor: { $sum: "$outstandingMinor" } } }]),
    Purchase.find({ shopId: shop._id, supplierId: id, status: "POSTED", outstandingMinor: { $gt: 0 } }).sort({ purchaseDate: 1, _id: 1 }).skip(skip).limit(limit).select("purchaseReference supplierInvoiceNumber purchaseDate grandTotalMinor totalPaidMinor outstandingMinor paymentStatus").lean(),
    Purchase.countDocuments({ shopId: shop._id, supplierId: id, status: "POSTED", outstandingMinor: { $gt: 0 } }),
  ]);
  return { supplierId: id, outstandingBalance: minorToAmount(totals[0]?.outstandingMinor || 0), purchases: purchases.map((purchase) => ({ id: purchase._id.toString(), purchaseReference: purchase.purchaseReference, supplierInvoiceNumber: purchase.supplierInvoiceNumber, purchaseDate: purchase.purchaseDate, grandTotal: minorToAmount(purchase.grandTotalMinor), totalPaid: minorToAmount(purchase.totalPaidMinor), outstandingBalance: minorToAmount(purchase.outstandingMinor), paymentStatus: purchase.paymentStatus })), pagination: pageInfo(page, limit, total) };
};

