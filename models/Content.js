const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['movie', 'series'] },
  description: String,
  imageUrl: String,
  videoUrl: String,
  likes: { type: Number, default: 0 }
});

module.exports = mongoose.model('Content', contentSchema);