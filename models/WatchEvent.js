const mongoose = require('mongoose');
const { Schema } = mongoose;

const watchEventSchema = new Schema({
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'Profile', // Reference to the Profile collection
    required: true
  },
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'Content', // Reference to the Content collection (movies/series)
    required: true
  },
  event: {
    type: String,
    enum: ['start', 'pause', 'complete'], // Possible event types
    required: true
  },
  positionSec: {
    type: Number, // Number of seconds watched
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now // Defaults to the current time
  }
});

const WatchEvent = mongoose.model('WatchEvent', watchEventSchema);

module.exports = WatchEvent;
