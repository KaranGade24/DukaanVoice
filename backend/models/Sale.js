import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true, trim: true },
  sku: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  unitPriceMinor: { type: Number, required: true, min: 0 },
  lineTotalMinor: { type: Number, required: true, min: 0 },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
  saleNumber: { type: String, required: true },
  items: { type: [saleItemSchema], required: true },
  subtotalMinor: { type: Number, required: true, min: 0 },
  discountMinor: { type: Number, required: true, min: 0, default: 0 },
  totalMinor: { type: Number, required: true, min: 0 },
  amountReceivedMinor: { type: Number, required: true, min: 0 },
  changeMinor: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["CASH", "UPI", "CARD"], required: true },
  status: { type: String, enum: ["COMPLETED"], default: "COMPLETED" },
  idempotencyKey: { type: String, maxlength: 100, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });

saleSchema.index({ shopId: 1, saleNumber: 1 }, { unique: true });
saleSchema.index({ shopId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });
export default mongoose.model("Sale", saleSchema);
