const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true },
  episodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Episode" },
  lastPositionSec: { type: Number, default: 0 },
  durationSec: { type: Number, default: 0 },
  status: { type: String, enum: ["in_progress", "done"], default: "in_progress" },
  watchPercentage: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);