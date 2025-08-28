const { Project, Application, Contract } = require("../models/projectModel");

// ========================
// FREELANCER SIDE
// ========================

// List all open projects (for freelancers)
const listProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ status: "open" })
      .populate("employer", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.render("projects/index", { user: req.user, allProjects: projects });
  } catch (err) {
    next(err);
  }
};

// View single project details
const showProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("employer", "name email")
      .lean();

    if (!project) {
      req.flash("error", "Project not found!");
      return res.redirect("/projects");
    }

    let hasApplied = false;

    // Check if current user is freelancer and already applied
    if (req.user && req.user.role === "freelancer") {
      const existingApplication = await Application.findOne({
        project: project._id,
        freelancer: req.user._id,
      }).lean();

      if (existingApplication) {
        hasApplied = true;
      }
    }

    res.render("projects/show", {
      currUser: req.user,
      project,
      hasApplied,
    });
  } catch (err) {
    next(err);
  }
};

// ========================
// EMPLOYER SIDE
// ========================

// Render form for employer to create new project
const renderNewProjectForm = (req, res) => {
  res.render("projects/new", { user: req.user });
};

// Create new project
const createProject = async (req, res, next) => {
  try {
    const { project } = req.body;

    const newProject = new Project({
      title: project.title,
      description: project.description,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      currency: project.currency,
      timeline: project.timeline,
      skills: project.skills
        ? project.skills.split(",").map((s) => s.trim())
        : [],
      employer: req.user._id,
    });

    if (req.file) {
      newProject.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await newProject.save();
    req.flash("success", "Project created successfully!");
    res.redirect("/dashboard/employer");
  } catch (err) {
    next(err);
  }
};

// List employer’s own projects
const listEmployerProjects = async (req, res, next) => {
  try {
    const myProjects = await Project.find({ employer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.render("dashboard/employer", { user: req.user, myProjects });
  } catch (err) {
    next(err);
  }
};

// ========================
// EMPLOYER EDIT / UPDATE / DELETE
// ========================

// Render edit form
const editProjectForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).lean();

    if (!project) {
      req.flash("error", "Project not found!");
      return res.redirect("/projects");
    }

    // Ownership check
    if (req.user._id.toString() !== project.employer.toString()) {
      req.flash("error", "You do not have permission to edit this project!");
      return res.redirect("/projects");
    }

    res.render("projects/edit", { project, user: req.user });
  } catch (err) {
    next(err);
  }
};

// Update project
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      req.flash("error", "Project not found!");
      return res.redirect("/projects");
    }

    // Ownership check
    if (!req.user._id.equals(project.employer)) {
      req.flash("error", "You do not have permission to update this project!");
      return res.redirect("/projects");
    }

    const { project: updatedData } = req.body;
    project.title = updatedData.title;
    project.description = updatedData.description;
    project.budgetMin = updatedData.budgetMin;
    project.budgetMax = updatedData.budgetMax;
    project.currency = updatedData.currency;
    project.timeline = updatedData.timeline;
    project.skills = updatedData.skills
      ? updatedData.skills.split(",").map((s) => s.trim())
      : [];

    if (req.file) {
      project.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await project.save();
    req.flash("success", "Project updated successfully!");
    res.redirect(`/projects/${project._id}`);
  } catch (err) {
    next(err);
  }
};

// Delete project
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      req.flash("error", "Project not found!");
      return res.redirect("/projects");
    }

    // Ownership check
    if (!req.user._id.equals(project.employer)) {
      req.flash("error", "You do not have permission to delete this project!");
      return res.redirect("/projects");
    }

    await Project.findByIdAndDelete(id);
    req.flash("success", "Project deleted successfully!");
    res.redirect("/dashboard/employer");
  } catch (err) {
    next(err);
  }
};
const applyToProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bidAmount, proposedTimeline, coverLetter } = req.body;

    // 1️⃣ Validate inputs
    if (!bidAmount || !proposedTimeline || !coverLetter) {
      req.flash("error", "All fields are required to apply.");
      return res.redirect(`/projects/${id}`);
    }

    // 2️⃣ Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      req.flash("error", "Project not found.");
      return res.redirect("/projects");
    }

    // 3️⃣ Prevent employer from applying
    if (project.employer.equals(req.user._id)) {
      req.flash("error", "You cannot apply to your own project.");
      return res.redirect(`/projects/${id}`);
    }

    // 4️⃣ Check if freelancer already applied
    const existingApplication = await Application.findOne({
      project: project._id,
      freelancer: req.user._id,
    });

    if (existingApplication) {
      req.flash("error", "You have already applied to this project.");
      return res.redirect(`/projects/${id}`);
    }

    // 5️⃣ Create new application
    const newApplication = new Application({
      project: project._id,
      freelancer: req.user._id,
      bidAmount,
      proposedTimeline,
      coverLetter,
      status: "applied",
    });

    await newApplication.save();

    req.flash("success", "Application submitted successfully!");
    res.redirect(`/projects/${id}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProjects,
  showProject,
  renderNewProjectForm,
  createProject,
  listEmployerProjects,
  editProjectForm,
  updateProject,
  deleteProject,
  applyToProject,
};
