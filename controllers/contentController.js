const Content = require("../models/Content");
const Episode = require("../models/Episode");
const Progress = require("../models/Progress");
const WatchEvent = require("../models/WatchEvent");
// Import Like model for aggregation
const Like = require("../models/Like");

const normalizeAssetPath = (value) => {
  if (!value || typeof value !== "string") return "";
  let normalized = value.trim();
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  normalized = normalized.replace(/\\/g, "/");
  normalized = normalized.replace(/^(\.\.\/)+/, "");
  normalized = normalized.replace(/^\.\//, "");
  normalized = normalized.replace(/^public\//i, "");
  normalized = normalized.replace(/^\/?public\//i, "");
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  return normalized.replace(/\/{2,}/g, "/");
};

const mapEpisode = (episode) => {
  if (!episode) return null;
  return {
    id: episode._id?.toString?.() || episode.id,
    seriesId: episode.seriesId,
    season: episode.season,
    episode: episode.episode,
    title: episode.title,
    description: episode.description,
    durationSec: episode.durationSec,
    videoUrl: normalizeAssetPath(episode.videoUrl),
    thumbnailUrl: normalizeAssetPath(episode.thumbnailUrl),
    airDate: episode.airDate,
    createdAt: episode.createdAt,
    updatedAt: episode.updatedAt,
  };
};

// Get all content with pagination (default: 10 items per page)
exports.getAllContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const content = await Content.find()
      .skip((page - 1) * limit)
      .limit(limit);

    if (content.length === 0) {
      return res.status(404).json({ message: "No content found" });
    }

    res.json(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Search content by title/info/category
exports.searchContent = async (req, res) => {
  try {
    const q = req.query.q || "";
    if (typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({ error: "Invalid search query" });
    }

    const term = q.trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const safeRegex = new RegExp(escapeRegex(term), "i");
    const results = await Content.find({ title: safeRegex })
      .sort({ likes: -1, createdAt: -1, title: 1 })
      .limit(limit)
      .lean();

    const mapped = results.map((doc) => ({
      id: doc._id?.toString?.() || doc.id,
      type: doc.type,
      title: doc.title,
      year: doc.year,
      category: doc.category,
      poster: normalizeAssetPath(doc.poster),
      backdrop: normalizeAssetPath(doc.backdrop),
      videoUrl: normalizeAssetPath(doc.videoUrl),
      info: doc.info,
      likes: doc.likes || 0,
      rating: doc.rating || "N/A",
      score: typeof doc.score === "number" ? doc.score : (doc.likes || 0) + (doc.completions || 0),
      completions: doc.completions || 0,
      actors: doc.actors || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json({ results: mapped, count: mapped.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all episodes for a specific content
exports.getEpisodes = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const episodes = await Episode.find({ seriesId: contentId }).sort({ season: 1, episode: 1 });

    if (episodes.length === 0) {
      return res.status(404).json({ message: "No episodes found for this content" });
    }

    res.json(episodes.map(mapEpisode));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single content by ID
exports.getContentById = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const content = await Content.findById(contentId).lean();

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json({
      id: content._id?.toString() || content.id,
      type: content.type,
      title: content.title,
      year: content.year,
      category: content.category,
      poster: normalizeAssetPath(content.poster),
      backdrop: normalizeAssetPath(content.backdrop),
      videoUrl: normalizeAssetPath(content.videoUrl),
      info: content.info,
      likes: content.likes || 0,
      actors: content.actors || [],
      rating: content.rating || "N/A",
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get first episode (season 1, episode 1) for a series
exports.getFirstEpisode = async (req, res) => {
  try {
    const contentId = req.params.contentId;

    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });
    if (content.type !== "series") return res.status(400).json({ error: "Content is not a series" });

    const firstEpisode = await Episode.findOne({ seriesId: contentId, season: 1, episode: 1 });
    if (!firstEpisode) return res.status(404).json({ message: "No first episode found for this series" });

    res.json(mapEpisode(firstEpisode));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all watch events for a specific content
exports.getWatchEvents = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const watchEvents = await WatchEvent.find({ contentId });

    if (watchEvents.length === 0) {
      return res.status(404).json({ message: "No watch events found for this content" });
    }

    res.json(watchEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get progress for a user watching a specific content
exports.getProgress = async (req, res) => {
  try {
    const { userId, contentId } = req.params;
    const progress = await Progress.findOne({ userId, contentId });

    if (!progress) {
      return res.status(404).json({ message: "No progress found for this user on this content" });
    }

    res.json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get content by genre with pagination for infinite scrolling
exports.getContentByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(process.env.CONTENT_ITEMS_PER_PAGE, 10) || 10;

    if (!genre || genre === "all") {
      return res.status(400).json({ error: "Genre is required" });
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
      poster: normalizeAssetPath(doc.poster),
      backdrop: normalizeAssetPath(doc.backdrop),
      videoUrl: normalizeAssetPath(doc.videoUrl),
      info: doc.info,
      likes: doc.likes || 0,
      rating: doc.rating || "N/A",
      score: doc.score || (doc.likes || 0) + (doc.completions || 0),
      completions: doc.completions || 0,
      actors: doc.actors || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json({ genre, items: mapped, page, limit, total, hasMore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// =================================================================
// Get popular content using GroupBy (Aggregation on Like collection)
// =================================================================
exports.getPopularContentByLikes = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const popularContent = await Like.aggregate([
      { $group: { _id: "$contentId", likeCount: { $sum: 1 } } },
      { $sort: { likeCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "contents",
          localField: "_id",
          foreignField: "_id",
          as: "contentDetails",
        },
      },
      { $unwind: "$contentDetails" },
      {
        $project: {
          _id: 0,
          id: "$contentDetails._id",
          type: "$contentDetails.type",
          title: "$contentDetails.title",
          year: "$contentDetails.year",
          category: "$contentDetails.category",
          poster: "$contentDetails.poster",
          backdrop: "$contentDetails.backdrop",
          videoUrl: "$contentDetails.videoUrl",
          info: "$contentDetails.info",
          rating: "$contentDetails.rating",
          actors: "$contentDetails.actors",
          likes: "$likeCount",
        },
      },
    ]);

    // Always return 200 with a consistent shape
    const mapped = popularContent.map((doc) => ({
      ...doc,
      id: doc.id?.toString?.() || doc.id,
      poster: normalizeAssetPath(doc.poster),
      backdrop: normalizeAssetPath(doc.backdrop),
      videoUrl: normalizeAssetPath(doc.videoUrl),
    }));

    res.json({ ok: true, items: mapped, count: mapped.length });
  } catch (err) {
    console.error("Error in getPopularContentByLikes:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --- New in Netflix: latest 10 by createdAt ---
exports.getNewestTen = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);

    const docs = await Content.find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const items = docs.map((doc) => ({
      id: doc._id?.toString?.() || doc.id,
      type: doc.type,
      title: doc.title,
      year: doc.year,
      category: doc.category,
      poster: (doc.poster || "").replace(/^public\//i, "/"),
      backdrop: (doc.backdrop || "").replace(/^public\//i, "/"),
      videoUrl: (doc.videoUrl || "").replace(/^public\//i, "/"),
      info: doc.info,
      rating: doc.rating || "N/A",
      likes: doc.likes || 0,
      createdAt: doc.createdAt,
    }));

    res.json({ ok: true, items, count: items.length });
  } catch (err) {
    console.error("getNewestTen error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --- Server-Sent Events stream for live updates ---
// Note: uses a lightweight polling loop to avoid Mongo change streams requirements.
exports.streamNewestSSE = async (req, res) => {
  try {
    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Helper to fetch and push the newest list
    let lastPayload = "";
    const fetchAndSend = async () => {
      try {
        const docs = await Content.find({})
          .sort({ createdAt: -1, _id: -1 })
          .limit(10)
          .lean();

        const items = docs.map((doc) => ({
          id: doc._id?.toString?.() || doc.id,
          type: doc.type,
          title: doc.title,
          year: doc.year,
          category: doc.category,
          poster: (doc.poster || "").replace(/^public\//i, "/"),
          backdrop: (doc.backdrop || "").replace(/^public\//i, "/"),
          videoUrl: (doc.videoUrl || "").replace(/^public\//i, "/"),
          info: doc.info,
          rating: doc.rating || "N/A",
          likes: doc.likes || 0,
          createdAt: doc.createdAt,
        }));

        const payload = JSON.stringify({ ok: true, items, count: items.length });
        if (payload !== lastPayload) {
          res.write(`data: ${payload}\n\n`);
          lastPayload = payload;
        }
      } catch (e) {
        console.error("SSE newest fetch error:", e);
      }
    };

    // Initial push
    await fetchAndSend();

    // Poll every 10 seconds, you can reduce to 5 if you want it snappier
    const intervalId = setInterval(fetchAndSend, 10000);

    req.on("close", () => {
      clearInterval(intervalId);
      res.end();
    });
  } catch (err) {
    console.error("streamNewestSSE error:", err);
    // Cannot send JSON after setting SSE headers, just end
    try { res.end(); } catch {}
  }
};
