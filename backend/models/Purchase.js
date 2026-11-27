import mongoose from "mongoose";
const purchaseItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productNameSnapshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    skuSnapshot: { type: String, trim: true, maxlength: 64, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 24 },
    unitPurchasePriceMinor: { type: Number, required: true, min: 0 },
    lineSubtotalMinor: { type: Number, required: true, min: 0 },
    discountType: {
      type: String,
      enum: ["AMOUNT", "PERCENTAGE", "MIXED"],
      default: "AMOUNT",
    },
    discountValue: { type: Number, min: 0, default: 0 },
    discountAmountMinor: { type: Number, required: true, min: 0 },
    additionalDiscountAllocationMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxableAmountMinor: { type: Number, required: true, min: 0 },
    taxRateBasisPoints: { type: Number, required: true, min: 0, max: 2800 },
    taxAmountMinor: { type: Number, required: true, min: 0 },
    lineTotalMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);
const purchaseSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    purchaseReference: { type: String, required: true, trim: true },
    referenceYear: { type: Number, required: true },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierInvoiceNumber: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    purchaseDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: [(items) => items.length > 0, "At least one item is required"],
    },
    subtotalMinor: { type: Number, required: true, min: 0 },
    itemDiscountTotalMinor: { type: Number, required: true, min: 0 },
    additionalDiscountType: {
      type: String,
      enum: ["AMOUNT", "PERCENTAGE"],
      default: "AMOUNT",
    },
    additionalDiscountValue: { type: Number, min: 0, default: 0 },
    additionalDiscountMinor: { type: Number, required: true, min: 0 },
    taxableAmountMinor: { type: Number, required: true, min: 0 },
    taxAmountMinor: { type: Number, required: true, min: 0 },
    additionalChargesMinor: { type: Number, required: true, min: 0 },
    grandTotalMinor: { type: Number, required: true, min: 0 },
    totalPaidMinor: { type: Number, required: true, min: 0, default: 0 },
    outstandingMinor: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIALLY_PAID", "PAID"],
      required: true,
      default: "UNPAID",
    },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["POSTED", "CANCELLED"],
      required: true,
      default: "POSTED",
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    idempotencyKey: { type: String, trim: true, maxlength: 100, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postedAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);
purchaseSchema.index({ shopId: 1, purchaseReference: 1 }, { unique: true });
purchaseSchema.index({
  shopId: 1,
  referenceYear: 1,
  supplierId: 1,
  purchaseDate: -1,
});
purchaseSchema.index({ shopId: 1, paymentStatus: 1, purchaseDate: -1 });
purchaseSchema.index({ shopId: 1, status: 1, purchaseDate: -1 });
purchaseSchema.index(
  { shopId: 1, supplierId: 1, supplierInvoiceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { supplierInvoiceNumber: { $gt: "" } },
  },
);
purchaseSchema.index(
  { shopId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
export default mongoose.model("Purchase", purchaseSchema);
