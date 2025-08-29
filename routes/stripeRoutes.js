// routes/stripeRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/userModel");

// Dummy onboarding for freelancers
router.post("/dummy-onboard/:freelancerId", async (req, res) => {
  try {
    const freelancer = await User.findById(req.params.freelancerId);
    if (!freelancer)
      return res.status(404).json({ error: "Freelancer not found" });
    if (freelancer.stripeOnboardingComplete) {
      return res.json({ success: true, message: "Already onboarded" });
    }

    // ✅ Create a Stripe Express account in test mode
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: freelancer.email,
    });

    // ✅ Save to DB
    freelancer.stripeAccountId = account.id;
    freelancer.stripeOnboardingComplete = true;
    await freelancer.save();

    res.json({
      success: true,
      stripeAccountId: account.id,
      message: "Freelancer onboarded successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ Onboard Freelancer (Create Stripe Connected Account)
router.post("/onboard-freelancer/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== "freelancer") {
      return res
        .status(400)
        .json({ error: "User not found or not a freelancer" });
    }

    // Step 1: Create Stripe Connected Account if not exists
    if (!user.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express", // simple onboarding for demo
        country: "US", // change if needed
        email: user.email,
        capabilities: {
          transfers: { requested: true }, // freelancer needs payouts
        },
      });

      user.stripeAccountId = account.id;
      await user.save();
    }

    // Step 2: Generate Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: "http://localhost:3000/reauth", // handle refresh
      return_url: "http://localhost:3000/dashboard", // after onboarding
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url }); // frontend redirect to this
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
