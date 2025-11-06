const Content = require('../models/Content');
const Episode = require('../models/Episode');
const Progress = require('../models/Progress');
const WatchEvent = require('../models/WatchEvent');

// Get all content with pagination (default: 10 items per page)
exports.getAllContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const content = await Content.find()
      .skip((page - 1) * limit)
      .limit(limit);

    if (content.length === 0) {
      return res.status(404).json({ message: 'No content found' });
    }

    res.json(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search content by title or description
exports.searchContent = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid search query' });
    }

    const results = await Content.find({ 
      $or: [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') }
      ]
    });

    if (results.length === 0) {
      return res.status(404).json({ message: 'No content found matching your search' });
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all episodes for a specific content
exports.getEpisodes = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const episodes = await Episode.find({ contentId });

    if (episodes.length === 0) {
      return res.status(404).json({ message: 'No episodes found for this content' });
    }

    res.json(episodes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all watch events for a specific content
exports.getWatchEvents = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const watchEvents = await WatchEvent.find({ contentId });

    if (watchEvents.length === 0) {
      return res.status(404).json({ message: 'No watch events found for this content' });
    }

    res.json(watchEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get progress for a user watching a specific content
exports.getProgress = async (req, res) => {
  try {
    const { userId, contentId } = req.params;
    const progress = await Progress.findOne({ userId, contentId });

    if (!progress) {
      return res.status(404).json({ message: 'No progress found for this user on this content' });
    }

    res.json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
