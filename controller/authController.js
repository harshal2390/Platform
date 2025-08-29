const User = require("../models/userModel");
const passport = require("passport");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports.signupPost = async (req, res, next) => {
  try {
    const { name, email, password, role, doOnboardingNow } = req.body;

    // 1️⃣ Create new user in DB
    const newUser = new User({ name, email, role });
    const registeredUser = await User.register(newUser, password);

    let stripeOnboardingUrl = null;

    // 2️⃣ Handle freelancer onboarding
    if (registeredUser.role === "freelancer") {
      // Create Stripe Express account if not exists
      if (!registeredUser.stripeAccountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "US", // adjust for your region
          email: registeredUser.email,
          capabilities: {
            transfers: { requested: true },
          },
        });

        registeredUser.stripeAccountId = account.id;
      }

      // ✅ If checkbox ticked → send to Stripe onboarding immediately
      if (doOnboardingNow === "true") {
        const accountLink = await stripe.accountLinks.create({
          account: registeredUser.stripeAccountId,
          refresh_url: "http://localhost:3000/stripe/refresh",
          return_url: "http://localhost:3000/stripe/return",
          type: "account_onboarding",
        });

        stripeOnboardingUrl = accountLink.url;
        registeredUser.stripeOnboardingComplete = false;
      } else {
        // User skipped onboarding
        registeredUser.stripeOnboardingComplete = false;
      }

      await registeredUser.save();
    }

    // 3️⃣ Log in the user
    req.login(registeredUser, (err) => {
      if (err) return next(err);

      req.flash("success", "Welcome " + registeredUser.name + "!");

      // 4️⃣ Redirect based on role
      if (registeredUser.role === "freelancer") {
        if (stripeOnboardingUrl) {
          // ✅ Directly send them to Stripe onboarding page
          return res.redirect(stripeOnboardingUrl);
        }
        return res.redirect("/dashboard/freelancer");
      } else if (registeredUser.role === "employer") {
        return res.redirect("/dashboard/employer");
      }

      res.redirect("/home");
    });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

// 🔑 Login controller
module.exports.loginPost = [
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    // Redirect based on role
    if (req.user.role === "freelancer") {
      return res.redirect("/dashboard/freelancer");
    } else if (req.user.role === "employer") {
      return res.redirect("/dashboard/employer");
    }
    res.redirect("/home");
  },
];

// 🚪 Logout controller (fixed)
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    // ⚡ set flash BEFORE destroying session
    req.flash("success", "You have been logged out successfully.");

    // Now destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }

      res.clearCookie("connect.sid"); // remove cookie
      res.redirect("/login"); // redirect user
    });
  });
};
