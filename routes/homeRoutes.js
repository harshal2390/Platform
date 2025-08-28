const express = require("express");
const router = express.Router();
const homeController = require("../controller/homeController.js");

router.get("/", homeController.home);

router.get("/login", homeController.login);
router.get("/signup", homeController.signup);

module.exports = router;
