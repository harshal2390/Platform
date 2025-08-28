const { Project, Application, Contract } = require("../models/ProjectModel");
const freelancerDashboard = (req, res) => {
  res.render("dashboard/freelancer", {
    user: req.user,
    projectsApplied: ["Website Redesign", "ML Model Training"], // example
    ongoingProjects: ["E-commerce App Development"],
    earnings: 1500,
  });
};

const employerDashboard = (req, res) => {
  res.render("dashboard/employer", {
    user: req.user,
    projectsPosted: ["AI Chatbot Project", "Portfolio Website"],
    bidsReceived: ["John Doe - $500", "Alice Smith - $700"],
    ongoingProjects: ["AI Chatbot Project"],
  });
};

const myApplications = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "freelancer") {
      req.flash("error", "Access denied!");
      return res.redirect("/");
    }

    // Fetch applications with project + employer populated
    const applications = await Application.find({ freelancer: req.user._id })
      .populate({
        path: "project",
        populate: { path: "employer", select: "name email" },
      })
      .lean();

    res.render("dashboard/freelancer", {
      applications,
      currUser: req.user,
    });
  } catch (err) {
    next(err);
  }
};
// Employer: View all bids for their projects
const employerBids = async (req, res, next) => {
  try {
    const projects = await Project.find({ employer: req.user._id })
      .populate({
        path: "employer",
        select: "name email",
      })
      .lean();

    // Attach only relevant applications
    for (let project of projects) {
      project.applications = await Application.find({
        project: project._id,
        status: { $ne: "rejected" },
      })
        .populate("freelancer", "name email")
        .lean();
    }

    res.render("dashboard/bids", { currUser: req.user, projects });
  } catch (err) {
    next(err);
  }
};

// Accept a bid
const acceptBid = async (req, res, next) => {
  try {
    const { appId } = req.params;

    const application = await Application.findById(appId)
      .populate("project")
      .populate("freelancer");
    if (!application) {
      req.flash("error", "Application not found!");
      return res.redirect("/dashboard/bids");
    }

    // Ensure only employer of project can accept
    if (application.project.employer.toString() !== req.user._id.toString()) {
      req.flash("error", "Unauthorized!");
      return res.redirect("/dashboard/bids");
    }

    // Accept this bid
    application.status = "accepted";
    await application.save();

    // Reject all other bids for this project
    await Application.updateMany(
      { project: application.project._id, _id: { $ne: application._id } },
      { $set: { status: "rejected" } }
    );

    // Update project status
    await Project.findByIdAndUpdate(application.project._id, {
      status: "hired",
    });

    // Create a contract between employer and freelancer
    const contract = new Contract({
      project: application.project._id,
      employer: application.project.employer,
      freelancer: application.freelancer._id,
      amount: application.bidAmount,
      currency: application.project.currency,
      status: "pending_payment",
    });
    await contract.save();

    req.flash("success", "Bid accepted and contract created!");
    res.redirect("/dashboard/bids");
  } catch (err) {
    next(err);
  }
};

// Reject a bid manually
const rejectBid = async (req, res, next) => {
  try {
    const { appId } = req.params;

    const application = await Application.findById(appId).populate("project");
    if (!application) {
      req.flash("error", "Application not found!");
      return res.redirect("/dashboard/bids");
    }

    if (application.project.employer.toString() !== req.user._id.toString()) {
      req.flash("error", "Unauthorized!");
      return res.redirect("/dashboard/bids");
    }

    application.status = "rejected";
    await application.save();

    req.flash("success", "Bid rejected successfully!");
    res.redirect("/dashboard/bids");
  } catch (err) {
    next(err);
  }
};
const employerOngoing = async (req, res, next) => {
  try {
    const contracts = await Contract.find({ employer: req.user._id })
      .populate("project", "title budgetMin budgetMax currency")
      .populate("freelancer", "name email")
      .lean();

    res.render("dashboard/ongoing", { user: req.user, contracts });
  } catch (err) {
    next(err);
  }
};

const getOngoingContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ freelancer: req.user._id })
      .populate("project")
      .populate("employer");
    res.render("dashboard/freelancerongoing", { contracts, user: req.user });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while fetching contracts.");
    res.redirect("/");
  }
};

const markContractCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findOne({
      _id: id,
      freelancer: req.user._id,
    });

    if (!contract) {
      req.flash("error", "Contract not found.");
      return res.redirect("dashboard/freelancerongoing");
    }

    // Only allow marking if it's in progress
    if (contract.status !== "in_progress") {
      req.flash(
        "error",
        "You can only mark in-progress contracts as completed."
      );
      return res.redirect("dashboard/freelancerongoing");
    }

    contract.status = "completed";
    await contract.save();

    req.flash("success", "Contract marked as completed successfully!");
    res.redirect("dashboard/freelancerongoing");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong updating contract status.");
    res.redirect("dashboard/freelancerongoing");
  }
};
module.exports = {
  myApplications,
  employerDashboard,
  freelancerDashboard,
  employerBids,
  rejectBid,
  acceptBid,
  employerOngoing,
  getOngoingContracts,
  markContractCompleted,
};
