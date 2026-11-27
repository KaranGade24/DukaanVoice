import mongoose from "mongoose";
const purchaseCounterSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    year: { type: Number, required: true },
    sequence: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);
purchaseCounterSchema.index({ shopId: 1, year: 1 }, { unique: true });
export default mongoose.model("PurchaseCounter", purchaseCounterSchema);
