// routes/stripeRoutes.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require("../models/userModel");

// ✅ Onboard Freelancer (Create Stripe Connected Account + Link)
router.post("/onboard-freelancer/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== "freelancer") {
      return res.status(400).send("User not found or not a freelancer");
    }

    // Step 1: Create Stripe Connected Account if not exists
    if (!user.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US", // adjust for your region
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      user.stripeAccountId = account.id;
      user.stripeOnboardingComplete = false; // not complete until confirmed
      await user.save();
    }

    // Step 2: Generate Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: "http://localhost:3000/stripe/refresh", // retry if user cancels
      return_url: "http://localhost:3000/stripe/return", // after success
      type: "account_onboarding",
    });

    // 🔥 Redirect user directly to Stripe onboarding
    return res.redirect(accountLink.url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

// ✅ Handle refresh if user cancels onboarding
router.get("/refresh", (req, res) => {
  req.flash("error", "Onboarding was not completed, please try again.");
  res.redirect("/dashboard/freelancer");
});

// ✅ Handle return after successful onboarding (but not confirmed yet)
router.get("/return", async (req, res) => {
  try {
    const userId = req.user?._id; // logged in user
    if (!userId) return res.redirect("/login");

    const user = await User.findById(userId);
    if (!user) return res.redirect("/login");

    // Check with Stripe if onboarding is completed
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    if (account.details_submitted) {
      user.stripeOnboardingComplete = true;
      await user.save();
      req.flash("success", "Onboarding completed successfully!");
    } else {
      req.flash("error", "Onboarding not finished. Please complete it.");
    }

    res.redirect("/dashboard/freelancer");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/freelancer");
  }
});

// ✅ Stripe Webhook to auto-update onboarding status
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed.", err.message);
      return res.sendStatus(400);
    }

    // Handle the event
    if (event.type === "account.updated") {
      const account = event.data.object;

      if (account.details_submitted) {
        const user = await User.findOne({ stripeAccountId: account.id });
        if (user) {
          user.stripeOnboardingComplete = true;
          await user.save();
          console.log(`✅ User ${user.email} onboarding completed.`);
        }
      }
    }

    res.sendStatus(200);
  }
);

module.exports = router;
