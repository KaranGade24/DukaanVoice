import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    unitPriceMinor: { type: Number, required: true, min: 0 },
    purchaseCostMinor: { type: Number, min: 0, default: null },
    lineTotalMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    customerName: { type: String, trim: true, default: "" },
    customerPhone: { type: String, trim: true, default: "" },
    saleNumber: { type: String, required: true },
    items: { type: [saleItemSchema], required: true },
    subtotalMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, required: true, min: 0, default: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    amountReceivedMinor: { type: Number, required: true, min: 0 },
    balanceDueMinor: { type: Number, required: true, min: 0, default: 0 },
    creditPayments: {
      type: [
        {
          amountMinor: { type: Number, min: 1, required: true },
          receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          receivedAt: { type: Date, required: true, default: Date.now },
        },
      ],
      default: [],
    },
    changeMinor: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CARD", "UDHAR"],
      required: true,
    },
    status: { type: String, enum: ["COMPLETED"], default: "COMPLETED" },
    idempotencyKey: { type: String, maxlength: 100, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

saleSchema.index({ shopId: 1, saleNumber: 1 }, { unique: true });
saleSchema.index({ shopId: 1, createdAt: -1 });
saleSchema.index(
  { shopId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
export default mongoose.model("Sale", saleSchema);
