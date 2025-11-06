const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema({
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Content", // references your Content model (series)
    required: true
  },
  season: {
    type: Number,
    required: true,
    min: 1
  },
  episode: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    required: [true, "Episode title is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Episode description is required"],
    trim: true
  },
  durationSec: {
    type: Number,
    required: [true, "Duration is required"],
    min: 1
  },
  videoUrl: {
    type: String,
    required: [true, "Video URL is required"],
    trim: true
  },
  thumbnailUrl: {
    type: String,
    required: [true, "Thumbnail URL is required"],
    trim: true
  },
  airDate: {
    type: Date,
    required: [true, "Air date is required"]
  }
}, { timestamps: true });

// Optional: index for fast lookup by series + episode
episodeSchema.index({ seriesId: 1, season: 1, episode: 1 }, { unique: true });

module.exports = mongoose.model("Episode", episodeSchema);