const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const Payment = require("../models/paymentModel"); // ✅ now works
const { Contract } = require("../models/projectModel"); // Contract model
const User = require("../models/userModel"); // User model

// ✅ Step 2: Employer funds escrow
router.post("/create-escrow/:contractId", async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId)
      .populate("employer")
      .populate("freelancer");

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const employer = contract.employer;
    const freelancer = contract.freelancer;

    if (!freelancer.stripeAccountId) {
      return res
        .status(400)
        .json({ error: "Freelancer not onboarded with Stripe" });
    }

    // 🔹 1. Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(contract.amount * 100), // cents
      currency: contract.currency.toLowerCase(),
      payment_method_types: ["card"],

      // Group funds under contract for later transfer
      transfer_group: `contract_${contract._id}`,
    });

    // 🔹 2. Save payment to DB
    const payment = new Payment({
      projectId: contract.project,
      contractId: contract._id,
      payerId: employer._id,
      payeeId: freelancer._id,
      amount: contract.amount,
      currency: contract.currency,
      provider: "stripe",
      transactionId: paymentIntent.id,
      status: "escrowed",
    });

    await payment.save();

    // 🔹 3. Update contract
    contract.paymentIntentId = paymentIntent.id;
    contract.status = "in_progress";
    await contract.save();

    res.json({
      clientSecret: paymentIntent.client_secret, // frontend will confirm payment
      paymentId: payment._id,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong", details: err.message });
  }
});

// ✅ Step 3: Release Escrow
router.post("/release/:contractId", async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId).populate(
      "freelancer"
    );
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    // Get escrowed payment
    const payment = await Payment.findOne({
      contractId: contract._id,
      status: "escrowed",
    });
    if (!payment)
      return res.status(400).json({ error: "No escrowed payment found" });

    const freelancer = contract.freelancer;

    if (!freelancer.stripeAccountId) {
      return res.status(400).json({ error: "Freelancer is not onboarded" });
    }

    // 🔹 Create transfer to freelancer connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(payment.amount * 100), // cents
      currency: payment.currency.toLowerCase(),
      destination: freelancer.stripeAccountId,
      transfer_group: `contract_${contract._id}`,
    });

    // 🔹 Update Payment & Contract in DB
    payment.status = "released";
    payment.netAmount = payment.amount;
    payment.transferId = transfer.id;
    await payment.save();

    contract.status = "completed";
    await contract.save();

    res.json({ success: true, transferId: transfer.id });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong", details: err.message });
  }
});

module.exports = router;
