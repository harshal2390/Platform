const express = require("express");
const router = express.Router();
const dashboardController = require("../controller/dashboardController");

const projectController = require("../controller/projectController");

//  Import middlewares
const { isLoggedIn, isFreelancer, isEmployer } = require("../middleware");

// Freelancer dashboard (only freelancers can see this)
router.get(
  "/freelancer",
  isLoggedIn,
  isFreelancer,
  projectController.listProjects // shows open projects
);

// Employer dashboard (only employers can see this)
router.get(
  "/employer",
  isLoggedIn,
  isEmployer,
  projectController.listProjects // shows open projects
);
//employer ongoing
router.get("/ongoing", isLoggedIn, dashboardController.employerOngoing);

router.get(
  "/freelancer/ongoing",
  isLoggedIn,
  dashboardController.getOngoingContracts
); //freelancer ongoing
router.post(
  "/freelancer/:id/complete",
  isLoggedIn,
  dashboardController.markContractCompleted
);

// Show all applications by logged-in freelancer
router.get("/my-applications", isLoggedIn, dashboardController.myApplications);

router.get("/bids", isLoggedIn, dashboardController.employerBids);
router.post("/bids/:appId/accept", isLoggedIn, dashboardController.acceptBid);
router.post("/bids/:appId/reject", isLoggedIn, dashboardController.rejectBid);

module.exports = router;
