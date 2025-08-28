import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },

    payerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // employer
    payeeId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // freelancer

    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    provider: {
      type: String,
      enum: ["stripe", "razorpay", "paypal"],
      required: true,
    },
    transactionId: String, // Payment reference from provider (Stripe PI, Razorpay Order, etc.)

    commission: { type: Number, default: 0 }, // platform’s fee
    netAmount: { type: Number }, // amount freelancer will receive after commission

    status: {
      type: String,
      enum: [
        "initiated", // payment started
        "escrowed", // funds held in escrow
        "released", // funds paid out to freelancer
        "refunded", // funds returned to employer
        "failed", // payment failed
      ],
      default: "initiated",
    },
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
