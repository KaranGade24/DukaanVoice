import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);
const draftLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    title: { type: String, maxlength: 120, default: "Shop assistant" },
    messages: { type: [messageSchema], default: [] },
    draft: {
      items: { type: [draftLineSchema], default: [] },
      discount: { type: Number, min: 0, default: 0 },
      paymentMethod: {
        type: String,
        enum: ["CASH", "UPI", "CARD", "UDHAR"],
        default: "CASH",
      },
      amountReceived: { type: Number, min: 0, default: 0 },
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
      },
      customerName: { type: String, default: "" },
    },
    pendingAction: {
      token: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      draftSignature: { type: String, default: null },
    },
    confirmationClaimedAt: { type: Date, default: null },
    confirmationIdempotencyKey: { type: String, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ userId: 1, shopId: 1, updatedAt: -1 });
export default mongoose.model("AgentConversation", schema);
