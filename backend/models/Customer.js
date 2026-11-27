import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, default: "", maxlength: 30 },
    phoneKey: { type: String, trim: true, default: null, select: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

customerSchema.index({ shopId: 1, name: 1 });
customerSchema.index({ shopId: 1, phone: 1 });
customerSchema.index(
  { shopId: 1, phoneKey: 1 },
  { unique: true, partialFilterExpression: { phoneKey: { $type: "string" } } },
);
export default mongoose.model("Customer", customerSchema);
