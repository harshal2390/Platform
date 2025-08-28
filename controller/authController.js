const User = require("../models/userModel");
const passport = require("passport");

module.exports.signupPost = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const newUser = new User({ name, email, role });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);

      req.flash("success", "Welcome " + registeredUser.name + "!");

      // ✅ Redirect based on role
      if (registeredUser.role === "freelancer") {
        return res.redirect("/dashboard/freelancer");
      } else if (registeredUser.role === "employer") {
        return res.redirect("/dashboard/employer");
      }

      res.redirect("/home");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.loginPost = [
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    // ✅ Redirect based on role after successful login
    if (req.user.role === "freelancer") {
      return res.redirect("/dashboard/freelancer");
    } else if (req.user.role === "employer") {
      return res.redirect("/dashboard/employer");
    }
    res.redirect("/home");
  },
];
