import mongoose from "mongoose";
const purchasePaymentSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  amountMinor: { type: Number, required: true, min: 1 },
  paymentMethod: { type: String, enum: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"], required: true },
  paymentDate: { type: Date, required: true }, transactionReference: { type: String, trim: true, maxlength: 120, default: "" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  entryType: { type: String, enum: ["PAYMENT", "REVERSAL"], default: "PAYMENT", required: true },
  reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: "PurchasePayment", default: null },
  idempotencyKey: { type: String, trim: true, maxlength: 100, default: null },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
purchasePaymentSchema.index({ shopId: 1, purchaseId: 1, paymentDate: -1 });
purchasePaymentSchema.index({ shopId: 1, supplierId: 1, paymentDate: -1 });
purchasePaymentSchema.index({ shopId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });
export default mongoose.model("PurchasePayment", purchasePaymentSchema);
