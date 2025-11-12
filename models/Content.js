const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["movie", "series"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    poster: {
      type: String,
      required: true
    },
    backdrop: {
      type: String,
      required: true
    },
    info: {
      type: String,
      required: true
    },
    likes: {
      type: Number,
      default: 0
    },
    actors: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        wikipediaUrl: {
          type: String,
          required: true,
          trim: true
        }
      }
    ],
    videoUrl: {
      type: String
    },
    director: {
      type: String
    },
    rating: {
      type: String
    }
  },
  { timestamps: true } 
);

contentSchema.index({
  title: "text",
  info: "text",
  category: "text"
});

module.exports = mongoose.model("Content", contentSchema);
