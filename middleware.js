// middlewares/auth.js
const mongoose = require("mongoose");

// ✅ Check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You must be logged in first!");
  return res.redirect("/login");
}

// ✅ Restrict route to freelancers only
function isFreelancer(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.role === "freelancer") return next();
    req.flash("error", "Only freelancers can access this page!");
    return res.redirect("back");
  }
  req.flash("error", "You must be logged in first!");
  return res.redirect("/login");
}

// ✅ Restrict route to employers only
function isEmployer(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.role === "employer") return next();
    req.flash("error", "Only employers can access this page!");
    return res.redirect("back");
  }
  req.flash("error", "You must be logged in first!");
  return res.redirect("/login");
}

// ✅ Prevent logged-in users from accessing login/signup again
function preventAuthAccess(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    req.flash("info", "You are already logged in!");
    return res.redirect("/"); // redirect to homepage or dashboard
  }
  return next();
}

// ✅ Ownership check specifically for Projects
function isOwner(model) {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      if (!resource) {
        req.flash("error", "Project not found!");
        return res.redirect("/projects");
      }

      // Compare ObjectIds as strings
      if (resource.employer.toString() === req.user._id.toString()) {
        return next();
      }

      req.flash("error", "You do not have permission to do that!");
      return res.redirect("/projects");
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  isLoggedIn,
  isFreelancer,
  isEmployer,
  preventAuthAccess,
  isOwner,
};
