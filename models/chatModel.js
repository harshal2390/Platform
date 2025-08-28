const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const chatSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    }, // ✅ changed
    message: { type: String, required: true },
    attachments: [String],
    // file URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
