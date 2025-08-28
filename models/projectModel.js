import mongoose from "mongoose";
const { Schema } = mongoose;

/* ------------------ Project Schema ------------------ */
const projectSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  budgetMin: Number,
  budgetMax: Number,
  currency: { type: String, default: "USD" },
  timeline: String,
  skills: [String],
  image: {
    url: String,
    filename: String,
  },
  employer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["open", "hired", "ongoing", "completed", "closed"],
    default: "open",
  },
  createdAt: { type: Date, default: Date.now },
});

/* ------------------ Application Schema ------------------ */
const applicationSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  coverLetter: String,
  bidAmount: Number,
  proposedTimeline: String,
  status: {
    type: String,
    enum: ["applied", "rejected", "accepted"],
    default: "applied",
  },
  createdAt: { type: Date, default: Date.now },
});

/* ------------------ Contract Schema ------------------ */

const contractSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  employer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  application: { type: Schema.Types.ObjectId, ref: "Application" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  status: {
    type: String,
    enum: ["pending_payment", "in_progress", "completed", "cancelled"],
    default: "pending_payment",
  },
  paymentIntentId: String,
  createdAt: { type: Date, default: Date.now },
});

/* ------------------ Models (safe exports) ------------------ */
const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

const Contract =
  mongoose.models.Contract || mongoose.model("Contract", contractSchema);

/* ------------------ Export ------------------ */
export { Project, Application, Contract };
