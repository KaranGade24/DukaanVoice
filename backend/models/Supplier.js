import mongoose from "mongoose";
const addressSchema = new mongoose.Schema({ street: { type: String, trim: true, maxlength: 200, default: "" }, city: { type: String, trim: true, maxlength: 120, default: "" }, state: { type: String, trim: true, maxlength: 120, default: "" }, pincode: { type: String, trim: true, maxlength: 12, default: "" }, country: { type: String, trim: true, maxlength: 80, default: "India" } }, { _id: false });
const supplierSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  supplierName: { type: String, required: true, trim: true, maxlength: 160 },
  contactPerson: { type: String, trim: true, maxlength: 120, default: "" },
  phoneNumber: { type: String, required: true, trim: true, maxlength: 24 },
  alternatePhone: { type: String, trim: true, maxlength: 24, default: "" },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  businessName: { type: String, trim: true, maxlength: 160, default: "" },
  gstNumber: { type: String, trim: true, uppercase: true, maxlength: 15, default: "" },
  address: { type: addressSchema, default: () => ({}) }, notes: { type: String, trim: true, maxlength: 1000, default: "" },
  isActive: { type: Boolean, default: true, index: true }, archivedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
supplierSchema.index({ shopId: 1, supplierName: 1 });
supplierSchema.index({ shopId: 1, phoneNumber: 1 });
supplierSchema.index({ shopId: 1, isActive: 1, supplierName: 1 });
export default mongoose.model("Supplier", supplierSchema);
