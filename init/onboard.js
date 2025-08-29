require("dotenv").config({ path: "../.env" }); // adjust path if needed
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function enableTransfersForFreelancers() {
  try {
    // Find all freelancers who have a Stripe account
    const freelancers = await User.find({
      role: "freelancer",
      stripeAccountId: { $exists: true, $ne: null },
    });

    console.log(
      `Found ${freelancers.length} freelancers with Stripe accounts.`
    );

    for (const freelancer of freelancers) {
      // Update Stripe account to request transfers capability
      const updatedAccount = await stripe.accounts.update(
        freelancer.stripeAccountId,
        {
          capabilities: { transfers: { requested: true } },
        }
      );

      console.log(
        `Updated transfers capability for freelancer: ${freelancer.name} (${freelancer.stripeAccountId})`
      );
    }

    console.log("✅ All freelancers updated successfully!");
  } catch (err) {
    console.error("Error updating freelancers:", err);
  } finally {
    mongoose.disconnect();
  }
}

enableTransfersForFreelancers();
