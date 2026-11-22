import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    image: { type: String, trim: true, maxlength: 2048, default: "" },
    icon: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "package-variant",
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);
categorySchema.index(
  { shopId: 1, name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    partialFilterExpression: { isActive: true },
  },
);
export default mongoose.model("Category", categorySchema);
