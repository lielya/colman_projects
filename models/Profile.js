const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  avatar: { 
    type: String, 
    default: "/images/default-avatar.png" 
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content" 
    }
  ],
  watchHistory: [
    {
      contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content" },
      progress: { type: Number, default: 0 }, 
      lastWatched: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Profile", profileSchema);