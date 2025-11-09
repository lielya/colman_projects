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

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Search content by title/info/category
exports.searchContent = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid search query' });
    }

    const term = q.trim();
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

  const safeRegex = new RegExp(escapeRegex(term), "i");
  const results = await Content.find({
    title: safeRegex,
  })
    .sort({ likes: -1, createdAt: -1, title: 1 })
    .limit(limit)
    .lean();

    const mapped = results.map((doc) => ({
      id: doc._id?.toString?.() || doc.id,
      type: doc.type,
      title: doc.title,
      year: doc.year,
      category: doc.category,
      poster: doc.poster,
      backdrop: doc.backdrop,
      info: doc.info,
      likes: doc.likes || 0,
      score:
        typeof doc.score === "number"
          ? doc.score
          : (doc.likes || 0) + (doc.completions || 0),
      completions: doc.completions || 0,
      actors: doc.actors || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json({ results: mapped, count: mapped.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all episodes for a specific content
exports.getEpisodes = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const episodes = await Episode.find({ seriesId: contentId })
      .sort({ season: 1, episode: 1 });

    if (episodes.length === 0) {
      return res.status(404).json({ message: 'No episodes found for this content' });
    }

    res.json(episodes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single content by ID
exports.getContentById = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const content = await Content.findById(contentId).lean();
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      id: content._id?.toString() || content.id,
      type: content.type,
      title: content.title,
      year: content.year,
      category: content.category,
      poster: content.poster,
      backdrop: content.backdrop,
      info: content.info,
      likes: content.likes || 0,
      actors: content.actors || [],
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get first episode (season 1, episode 1) for a series
exports.getFirstEpisode = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    
    // Verify it's a series
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    if (content.type !== 'series') {
      return res.status(400).json({ error: 'Content is not a series' });
    }

    // Find first episode (season 1, episode 1)
    const firstEpisode = await Episode.findOne({ 
      seriesId: contentId,
      season: 1,
      episode: 1
    });

    if (!firstEpisode) {
      return res.status(404).json({ message: 'No first episode found for this series' });
    }

    res.json({
      id: firstEpisode._id.toString(),
      title: firstEpisode.title,
      season: firstEpisode.season,
      episode: firstEpisode.episode,
      description: firstEpisode.description,
      durationSec: firstEpisode.durationSec,
      videoUrl: firstEpisode.videoUrl,
      thumbnailUrl: firstEpisode.thumbnailUrl,
      airDate: firstEpisode.airDate
    });
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

// Get content by genre with pagination for infinite scrolling
exports.getContentByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(process.env.CONTENT_ITEMS_PER_PAGE, 10) || 10;
    
    if (!genre || genre === 'all') {
      return res.status(400).json({ error: 'Genre is required' });
    }

    const skip = (page - 1) * limit;
    
    const content = await Content.find({ category: genre })
      .sort({ createdAt: -1, year: -1, title: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Content.countDocuments({ category: genre });
    const hasMore = skip + content.length < total;

    const mapped = content.map((doc) => ({
      id: doc._id?.toString?.() || doc.id,
      type: doc.type,
      title: doc.title,
      year: doc.year,
      category: doc.category,
      poster: doc.poster,
      backdrop: doc.backdrop,
      info: doc.info,
      likes: doc.likes || 0,
      score: doc.score || (doc.likes || 0) + (doc.completions || 0),
      completions: doc.completions || 0,
      actors: doc.actors || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json({
      genre,
      items: mapped,
      page,
      limit,
      total,
      hasMore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
