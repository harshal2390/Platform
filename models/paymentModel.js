const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    payerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    payeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    provider: {
      type: String,
      enum: ["stripe", "razorpay", "paypal"],
      required: true,
    },
    transactionId: String,
    commission: { type: Number, default: 0 },
    netAmount: { type: Number },
    status: {
      type: String,
      enum: ["initiated", "escrowed", "released", "refunded", "failed"],
      default: "initiated",
    },
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

module.exports = Payment; // ✅ CommonJS export
