const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

router.post("/signup", authController.signupPost);
router.post("/login", authController.loginPost);
router.get("/logout", authController.logout);

module.exports = router;
