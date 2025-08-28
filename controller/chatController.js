// controllers/chatController.js
const Message = require("../models/chatModel");
const { Project, Application, Contract } = require("../models/projectModel");

// Save a chat message
exports.saveMessage = async (req, res) => {
  console.log("📩 saveMessage called!");
  console.log("Body:", req.body);
  console.log("User:", req.user);
  try {
    const { receiverId, contractId, message } = req.body; // ✅ use contractId

    // Validate required fields
    if (!receiverId || !contractId || !message) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    // Create new message
    const newMsg = new Message({
      senderId: req.user._id,
      receiverId,
      contractId,
      message,
    });

    // Save to MongoDB
    await newMsg.save();

    // Emit via Socket.IO to the contract room
    const io = req.app.get("io");
    io.to(contractId.toString()).emit("newMessage", {
      _id: newMsg._id,
      senderId: req.user._id,
      receiverId,
      message,
      createdAt: newMsg.createdAt,
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get chat page for a contract
exports.getChatPage = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId)
      .populate("project")
      .populate("employer")
      .populate("freelancer");

    if (!contract) {
      return res.status(404).send("Contract not found");
    }

    // Fetch all messages for this contract
    const messages = await Message.find({ contractId: contract._id })
      .populate("senderId")
      .sort({ createdAt: 1 }); // sort oldest first

    res.render("chat", {
      project: contract.project,
      contract,
      messages,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching chat page:", err);
    res.status(500).send("Internal server error");
  }
};
