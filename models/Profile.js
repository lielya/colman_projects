const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: [1, 'Profile name cannot be empty'],
    maxlength: [20, 'Profile name cannot be more than 20 characters'] 
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