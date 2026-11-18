import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, trim: true, maxlength: 160 },
    businessType: {
      type: String,
      enum: ["grocery", "dairy_bakery", "pharmacy", "wholesale"],
      required: true,
    },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Shop", shopSchema);
