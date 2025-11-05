const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile', // Reference to the Profile model
      required: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content', // Reference to the Content (Movie/Series) model
      required: true
    },
    liked: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Prevent duplicate likes by the same profile on the same content
likeSchema.index({ profileId: 1, contentId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
