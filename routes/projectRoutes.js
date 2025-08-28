const express = require("express");
const router = express.Router();
const {
  isLoggedIn,
  isEmployer,
  isOwner,
  isFreelancer,
} = require("../middleware");
const projectController = require("../controller/projectController");
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
const { Project, Application, Contract } = require("../models/projectModel");

// ========================
// PROJECT ROUTES
// ========================

// Show all open projects (Freelancer side)
router.get("/", projectController.listProjects);
router.get(
  "/new",
  isLoggedIn,
  isEmployer,
  projectController.renderNewProjectForm
);
router.get(
  "/my-projects",
  isLoggedIn,
  isEmployer,
  projectController.listEmployerProjects
);

//created project
router.post(
  "/create",
  isLoggedIn,
  isEmployer,
  upload.single("project[image]"), // ✅ matches form input name
  projectController.createProject
);

// Show form to create new project (Employer only)
// Specific routes first

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner(Project),
  projectController.editProjectForm
);
router.put(
  "/:id",
  isLoggedIn,
  isOwner(Project),
  upload.single("project[image]"),
  projectController.updateProject
);

router.delete(
  "/:id",
  isLoggedIn,
  isOwner(Project),
  projectController.deleteProject
);
// Apply to a project (freelancer only)
router.post(
  "/:id/apply",
  isLoggedIn,
  isFreelancer,
  projectController.applyToProject
);

// Show project (must be last)
router.get("/:id", projectController.showProject);

module.exports = router;
