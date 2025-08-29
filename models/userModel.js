const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["freelancer", "employer"], required: true },
    bio: String,
    skills: [String],
    profilePic: String,
    // Stripe fields (only for freelancers)
    stripeAccountId: { type: String },
    stripeOnboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ adds username, hash+salt password & helpers like register(), authenticate()
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);
