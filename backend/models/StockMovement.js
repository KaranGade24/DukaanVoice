import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", default: null, index: true },
    unit: { type: String, trim: true, maxlength: 24, default: "" },
    type: {
      type: String,
      enum: ["OPENING_STOCK", "STOCK_IN", "STOCK_OUT", "STOCK_ADJUSTMENT", "PURCHASE", "SALE", "RETURN", "DAMAGE", "EXPIRED"],
      required: true,
    },
    previousQuantity: { type: Number, required: true, min: 0 },
    changedQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, maxlength: 120, default: "" },
    reference: { type: String, trim: true, maxlength: 120, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    purchaseCost: { type: Number, min: 0, default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);
stockMovementSchema.index({ shopId: 1, createdAt: -1 });
stockMovementSchema.index({ shopId: 1, productId: 1, createdAt: -1 });
stockMovementSchema.index({ shopId: 1, type: 1, createdAt: -1 });
stockMovementSchema.index({ shopId: 1, purchaseId: 1, createdAt: -1 });
export default mongoose.model("StockMovement", stockMovementSchema);
