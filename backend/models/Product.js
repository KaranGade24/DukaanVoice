import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 64,
      default: "",
    },
    barcode: { type: String, trim: true, maxlength: 80, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    imageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    unit: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 24,
    },
    sellingPrice: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, min: 0, default: null },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, min: 0, default: 5 },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
);
productSchema.index(
  { shopId: 1, sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $gt: "" } } },
);
productSchema.index(
  { shopId: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $gt: "" } } },
);
productSchema.index({ shopId: 1, name: "text", sku: "text", barcode: "text" });
productSchema.index({ shopId: 1, categoryId: 1, isArchived: 1, createdAt: -1 });
productSchema.index({ shopId: 1, quantity: 1, minimumStock: 1, isArchived: 1 });
export default mongoose.model("Product", productSchema);
