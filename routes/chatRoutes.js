const express = require("express");
const router = express.Router();
const { saveMessage, getChatPage } = require("../controller/chatController");
const { isLoggedIn } = require("../middleware");

router.post("/send", isLoggedIn, saveMessage);
router.get("/:contractId", isLoggedIn, getChatPage); // show chat UI

module.exports = router;
