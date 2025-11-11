const mongoose = require("mongoose");

// Models
const Profile = require("../models/Profile");
const User = require("../models/User");
const Like = require("../models/Like");
const Content = require("../models/Content");
const Progress = require("../models/Progress");
const WatchEvent = require("../models/WatchEvent");

// Helpers
const ensureAssetPath = (value) => {
  if (!value || typeof value !== "string") return "";

  let normalized = value.trim();
  if (!normalized) return "";

  if (/^https?:\/\//i.test(normalized)) return normalized;

  normalized = normalized.replace(/\\/g, "/");
  normalized = normalized.replace(/^(\.\.\/)+/, "");
  normalized = normalized.replace(/^\.\//, "");
  normalized = normalized.replace(/^public\//i, "");
  normalized = normalized.replace(/^\/?public\//i, "");

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized.replace(/\/{2,}/g, "/");
};

// Map content document to API shape
const mapContent = (doc, likeMap = null) => {
  if (!doc) return null;
  const docId = doc._id?.toString?.() || doc.id;

  const totalLikes =
    typeof doc.totalLikes === "number"
      ? doc.totalLikes
      : typeof doc.likes === "number" && doc.likes > 0
      ? doc.likes
      : likeMap && docId && likeMap.has(docId)
      ? likeMap.get(docId)
      : 0;

  return {
    id: docId,
    type: doc.type,
    title: doc.title,
    year: doc.year,
    category: doc.category,
    poster: ensureAssetPath(doc.poster),
    backdrop: ensureAssetPath(doc.backdrop),
    videoUrl: ensureAssetPath(doc.videoUrl),
    info: doc.info,
    likes: totalLikes,
    rating: doc.rating || "N/A", // fallback if rating missing
    score: doc.score || 0,
    totalLikes,
    completions: doc.completions || 0,
    actors: doc.actors || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const sanitizeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// Build a map of contentId -> likeCount (only for given IDs)
const buildGlobalLikeMap = async (contentIds = []) => {
  const match = { liked: true };

  const ids = contentIds.map((id) => toObjectId(id)).filter(Boolean);
  if (contentIds.length > 0 && ids.length === 0) return new Map();
  if (ids.length === 0) return new Map();

  match.contentId = { $in: ids };

  const likeCounts = await Like.aggregate([
    { $match: match },
    { $group: { _id: "$contentId", count: { $sum: 1 } } },
  ]);

  const map = new Map();
  likeCounts.forEach((row) => {
    if (row?._id) map.set(row._id.toString(), row.count);
  });
  return map;
};

// Popularity score = likes + completions
const computePopularity = async (match = {}, limit = 20) => {
  const pipeline = [];

  if (Object.keys(match).length > 0) pipeline.push({ $match: match });

  pipeline.push(
    {
      $lookup: {
        from: "watchevents",
        localField: "_id",
        foreignField: "contentId",
        as: "watchEvents",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "contentId",
        as: "likeDocs",
      },
    },
    {
      $addFields: {
        completions: {
          $size: {
            $filter: {
              input: "$watchEvents",
              as: "evt",
              cond: { $eq: ["$$evt.event", "complete"] },
            },
          },
        },
        totalLikes: {
          $let: {
            vars: {
              likeCount: {
                $size: {
                  $filter: {
                    input: "$likeDocs",
                    as: "lk",
                    cond: { $eq: ["$$lk.liked", true] },
                  },
                },
              },
            },
            in: {
              $cond: [
                { $gt: ["$$likeCount", 0] },
                "$$likeCount",
                { $ifNull: ["$likes", 0] },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        score: { $add: ["$totalLikes", "$completions"] },
      },
    },
    {
      $sort: { score: -1, createdAt: -1, year: -1, title: 1 },
    },
    { $limit: limit },
    { $project: { watchEvents: 0, likeDocs: 0 } }
  );

  return Content.aggregate(pipeline);
};

// Get newest items per genre
const buildNewestByGenre = async (limitPerGenre = null) => {
  if (limitPerGenre === null) {
    limitPerGenre = parseInt(process.env.CONTENT_ITEMS_PER_PAGE, 10) || 10;
  }

  const pipeline = [
    { $sort: { createdAt: -1, year: -1, title: 1 } },
    { $group: { _id: "$category", items: { $push: "$$ROOT" } } },
    { $project: { category: "$_id", items: { $slice: ["$items", limitPerGenre] }, _id: 0 } },
    { $sort: { category: 1 } },
  ];

  const grouped = await Content.aggregate(pipeline);

  const allContentIds = grouped
    .flatMap((group) => group.items || [])
    .map((item) => item?._id?.toString?.())
    .filter(Boolean);

  const likeMap = await buildGlobalLikeMap(allContentIds);

  const result = {};
  grouped.forEach((group) => {
    result[group.category] = (group.items || []).map((item) =>
      mapContent(item, likeMap)
    );
  });
  return result;
};

// Map a progress document to API shape
const mapProgressEntry = (item, likeMap = null) => {
  if (!item || !item.contentId) return null;

  const contentDoc = item.contentId.title ? item.contentId : { _id: item.contentId };
  const resumePositionSec = Math.max(0, (item.lastPositionSec || 0) - 10);

  return {
    id: item._id.toString(),
    content: mapContent(contentDoc, likeMap),
    episode: item.episodeId
      ? {
          id: item.episodeId._id.toString(),
          title: item.episodeId.title,
          season: item.episodeId.season,
          number: item.episodeId.episode,
          videoUrl: ensureAssetPath(item.episodeId.videoUrl),
          durationSec: item.episodeId.durationSec || 0,
        }
      : null,
    lastPositionSec: item.lastPositionSec || 0,
    resumePositionSec,
    durationSec: item.durationSec || item.episodeId?.durationSec || 0,
    watchPercentage: item.watchPercentage || 0,
    status: item.status,
    updatedAt: item.updatedAt,
  };
};

// Continue watching section
const buildContinueWatching = async (profileId, limit = 12) => {
  const rawItems = await Progress.find({
    profileId,
    status: { $ne: "done" },
    watchPercentage: { $gt: 0, $lt: 95 },
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate([
      { path: "contentId" },
      { path: "episodeId", select: "title season episode videoUrl durationSec" },
    ])
    .lean();

  // keep only latest per content
  const uniqueItems = [];
  const seenContent = new Set();
  for (const item of rawItems) {
    const contentId =
      item?.contentId?._id?.toString?.() || item?.contentId?.toString?.();
    if (!contentId || seenContent.has(contentId)) continue;
    seenContent.add(contentId);
    uniqueItems.push(item);
    if (uniqueItems.length >= limit) break;
  }

  const contentIds = uniqueItems
    .map((item) => item?.contentId?._id?.toString?.() || item?.contentId?.toString?.())
    .filter(Boolean);

  const likeMap = await buildGlobalLikeMap(contentIds);

  return uniqueItems.map((item) => mapProgressEntry(item, likeMap)).filter(Boolean);
};

// Recommendations by preferred categories and popularity
const buildRecommendations = async (profileId, options = {}) => {
  const limit = options.limit || 20;

  const [likedDocs, recentProgress] = await Promise.all([
    Like.find({ profileId, liked: true }).populate({ path: "contentId" }).lean(),
    Progress.find({ profileId }).sort({ updatedAt: -1 }).limit(50).populate({ path: "contentId" }).lean(),
  ]);

  const preferredCategories = new Set();
  const excludeIds = new Set();

  likedDocs.forEach((doc) => {
    if (doc.contentId?._id) {
      excludeIds.add(doc.contentId._id.toString());
      if (doc.contentId.category) preferredCategories.add(doc.contentId.category);
    }
  });

  recentProgress.forEach((item) => {
    if (item.contentId?._id) {
      excludeIds.add(item.contentId._id.toString());
      if (item.contentId.category) preferredCategories.add(item.contentId.category);
    }
  });

  const match = {};
  const categoryList = Array.from(preferredCategories);
  if (categoryList.length > 0) match.category = { $in: categoryList };

  const excludeObjectIds = Array.from(excludeIds).map(toObjectId).filter(Boolean);
  if (excludeObjectIds.length > 0) match._id = { $nin: excludeObjectIds };

  const recommendations = await computePopularity(match, limit);
  const likeMap = await buildGlobalLikeMap(recommendations.map((doc) => doc._id));

  const reasonsByCategory = {};
  categoryList.forEach((category) => {
    reasonsByCategory[category] = `Because you enjoy ${category} titles`;
  });

  return recommendations.map((item) => {
    const mapped = mapContent(item, likeMap);
    const reason = reasonsByCategory[mapped.category] || "Popular with viewers similar to you";
    return { ...mapped, reason };
  });
};

// Popular content for home page
const buildPopularContent = async (limit = 20) => {
  const docs = await computePopularity({}, limit);
  const likeMap = await buildGlobalLikeMap(docs.map((doc) => doc._id));
  return docs.map((doc) => mapContent(doc, likeMap));
};

const ensureProfileExists = async (profileId) => {
  const profile = await Profile.findById(profileId).lean();
  return profile;
};

// Profiles CRUD
exports.getProfiles = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const profiles = await Profile.find({ userId }).select("name avatar").lean();

    const response = profiles.map((profile) => ({
      id: profile._id.toString(),
      name: profile.name,
      avatar: profile.avatar,
    }));

    res.json(response);
  } catch (error) {
    console.error("Get profiles error:", error);
    res.status(500).json({ error: "Server error retrieving profiles" });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, avatar } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Profile name is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // limit to 5 profiles per user
    const existingProfilesCount = await Profile.countDocuments({ userId });
    if (existingProfilesCount >= 5) {
      return res.status(400).json({ error: "Maximum of 5 profiles allowed per user" });
    }

    // unique name per user
    const existingProfile = await Profile.findOne({ userId, name: name.trim() });
    if (existingProfile) {
      return res.status(409).json({ error: "Profile name already exists for this user" });
    }

    const profile = new Profile({
      userId,
      name: name.trim(),
      avatar: avatar || "/images/default-avatar.png",
    });

    await profile.save();

    res.status(201).json({
      message: "Profile created successfully",
      profile: {
        id: profile._id.toString(),
        name: profile.name,
        avatar: profile.avatar,
      },
    });
  } catch (error) {
    console.error("Create profile error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Profile name already exists for this user" });
    }
    res.status(500).json({ error: "Server error creating profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { name, avatar } = req.body || {};

    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // validate name and keep it unique for the same user
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Profile name cannot be empty" });
      }

      const existingProfile = await Profile.findOne({
        userId: profile.userId,
        name: name.trim(),
        _id: { $ne: profileId },
      });
      if (existingProfile) {
        return res.status(409).json({ error: "Profile name already exists for this user" });
      }

      profile.name = name.trim();
    }

    if (avatar !== undefined) profile.avatar = avatar;

    await profile.save();

    res.json({
      message: "Profile updated successfully",
      profile: {
        id: profile._id.toString(),
        name: profile.name,
        avatar: profile.avatar,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Server error updating profile" });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // cascade delete related data
    const Progress = require("../models/Progress");
    const WatchEvent = require("../models/WatchEvent");
    const Like = require("../models/Like");

    await Promise.all([
      Progress.deleteMany({ profileId: profile._id }),
      WatchEvent.deleteMany({ profileId: profile._id }),
      Like.deleteMany({ profileId: profile._id }),
    ]);

    await Profile.findByIdAndDelete(profileId);

    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ error: "Server error deleting profile" });
  }
};

// Likes
exports.getLikes = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const likes = await Like.find({ profileId, liked: true }).select("contentId").lean();

    const contentIds = likes
      .map((like) => like.contentId)
      .filter(Boolean)
      .map((id) => id.toString());

    res.json({ profileId, likes: contentIds });
  } catch (error) {
    console.error("Get likes error:", error);
    res.status(500).json({ error: "Server error retrieving likes" });
  }
};

exports.likeContent = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { contentId } = req.body || {};

    const profile = await ensureProfileExists(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const contentObjectId = toObjectId(contentId);
    if (!contentObjectId) return res.status(400).json({ error: "Valid contentId is required" });

    const contentExists = await Content.exists({ _id: contentObjectId });
    if (!contentExists) return res.status(404).json({ error: "Content not found" });

    const existing = await Like.findOne({ profileId, contentId: contentObjectId });
    if (existing && existing.liked) return res.json({ message: "Content already liked" });

    await Like.findOneAndUpdate(
      { profileId, contentId: contentObjectId },
      { $set: { liked: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Content.updateOne({ _id: contentObjectId }, { $inc: { likes: 1 } });

    res.json({ message: "Content liked successfully" });
  } catch (error) {
    console.error("Like content error:", error);
    res.status(500).json({ error: "Server error liking content" });
  }
};

exports.unlikeContent = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { contentId } = req.body || {};

    const profile = await ensureProfileExists(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const contentObjectId = toObjectId(contentId);
    if (!contentObjectId) return res.status(400).json({ error: "Valid contentId is required" });

    const removed = await Like.findOneAndDelete({ profileId, contentId: contentObjectId });

    if (removed && removed.liked) {
      await Content.updateOne({ _id: contentObjectId }, { $inc: { likes: -1 } });
    }

    res.json({ message: "Content unliked successfully" });
  } catch (error) {
    console.error("Unlike content error:", error);
    res.status(500).json({ error: "Server error unliking content" });
  }
};

// Aggregated like counts
exports.getGlobalLikeCounts = async (_req, res) => {
  try {
    const likeCounts = await Like.aggregate([
      { $match: { liked: true } },
      { $group: { _id: "$contentId", count: { $sum: 1 } } },
    ]);

    const counts = {};
    likeCounts.forEach((item) => {
      counts[item._id.toString()] = item.count;
    });

    res.json({ counts });
  } catch (error) {
    console.error("Get global like counts error:", error);
    res.status(500).json({ error: "Server error retrieving like counts" });
  }
};

// Continue watching API
exports.getContinueWatching = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const items = await buildContinueWatching(profile._id);
    res.json({ profileId, items });
  } catch (error) {
    console.error("Continue watching error:", error);
    res.status(500).json({ error: "Server error retrieving continue watching" });
  }
};

// Recommendations API
exports.getRecommendations = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const items = await buildRecommendations(profile._id);
    res.json({ profileId, items });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ error: "Server error retrieving recommendations" });
  }
};

// Upsert progress and record events
exports.upsertProgress = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const {
      contentId,
      episodeId,
      lastPositionSec,
      durationSec,
      watchPercentage,
      status,
      event,
    } = req.body || {};

    const contentObjectId = toObjectId(contentId);
    if (!contentObjectId) return res.status(400).json({ error: "Valid contentId is required" });

    const contentExists = await Content.exists({ _id: contentObjectId });
    if (!contentExists) return res.status(404).json({ error: "Content not found" });

    const duration = Math.max(0, sanitizeNumber(durationSec, 0));
    const position = Math.max(0, Math.min(duration, sanitizeNumber(lastPositionSec, 0)));

    const explicitPercentage = Number.isFinite(Number(watchPercentage))
      ? Number(watchPercentage)
      : null;

    const computedPercentage =
      explicitPercentage !== null && !Number.isNaN(explicitPercentage)
        ? Math.max(0, Math.min(100, explicitPercentage))
        : duration > 0
        ? Math.max(0, Math.min(100, Math.round((position / duration) * 100)))
        : 0;

    const resolvedStatus = status === "done" || computedPercentage >= 95 ? "done" : "in_progress";

    const episodeObjectId = toObjectId(episodeId);
    if (episodeId && !episodeObjectId) {
      return res.status(400).json({ error: "Invalid episodeId" });
    }

    const updateQuery = { profileId: profile._id, contentId: contentObjectId };

    const updateDoc = {
      lastPositionSec: position,
      durationSec: duration,
      watchPercentage: computedPercentage,
      status: resolvedStatus,
      profileId: profile._id,
      contentId: contentObjectId,
    };

    const updateOps = { $set: updateDoc };
    if (episodeObjectId) {
      updateOps.$set.episodeId = episodeObjectId;
    } else {
      updateOps.$unset = { episodeId: "" };
    }

    const progress = await Progress.findOneAndUpdate(updateQuery, updateOps, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
      .populate([
        { path: "contentId" },
        { path: "episodeId", select: "title season episode videoUrl durationSec" },
      ])
      .lean();

    let eventType = typeof event === "string" ? event.toLowerCase() : null;
    if (resolvedStatus === "done") eventType = "complete";

    if (eventType && ["start", "pause", "complete"].includes(eventType)) {
      await WatchEvent.create({
        profileId: profile._id,
        contentId: contentObjectId,
        event: eventType,
        positionSec: position,
      });
    }

    const mapped = mapProgressEntry(progress);
    res.json({ profileId, progress: mapped });
  } catch (error) {
    console.error("Upsert progress error:", error);
    res.status(500).json({ error: "Server error saving progress" });
  }
};

// Popular content API
exports.getPopularContent = async (_req, res) => {
  try {
    const items = await buildPopularContent();
    res.json({ items });
  } catch (error) {
    console.error("Popular content error:", error);
    res.status(500).json({ error: "Server error retrieving popular content" });
  }
};

// Stats: daily views per profile (last 7 days)
exports.getDailyViewsStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const profiles = await Profile.find({ userId }).select("_id name").lean();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const watchEvents = await WatchEvent.find({
      profileId: { $in: profiles.map((p) => p._id) },
      createdAt: { $gte: sevenDaysAgo },
    }).lean();

    const stats = {};
    profiles.forEach((profile) => {
      stats[profile._id.toString()] = { profileName: profile.name, dailyViews: {} };
    });

    watchEvents.forEach((event) => {
      const profileId = event.profileId.toString();
      const date = new Date(event.createdAt);
      const dateKey = date.toISOString().split("T")[0];
      if (!stats[profileId]) return;
      if (!stats[profileId].dailyViews[dateKey]) stats[profileId].dailyViews[dateKey] = 0;
      stats[profileId].dailyViews[dateKey]++;
    });

    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toISOString().split("T")[0]);
    }

    // colors for chart.js
    const colors = [
      { bg: "rgba(229, 9, 20, 0.6)", border: "rgba(229, 9, 20, 1)" },
      { bg: "rgba(0, 123, 255, 0.6)", border: "rgba(0, 123, 255, 1)" },
      { bg: "rgba(40, 167, 69, 0.6)", border: "rgba(40, 167, 69, 1)" },
      { bg: "rgba(255, 193, 7, 0.6)", border: "rgba(255, 193, 7, 1)" },
      { bg: "rgba(220, 53, 69, 0.6)", border: "rgba(220, 53, 69, 1)" },
    ];

    const datasets = profiles.map((profile, index) => {
      const profileId = profile._id.toString();
      const data = labels.map((date) => stats[profileId]?.dailyViews[date] || 0);
      const color = colors[index % colors.length];
      return {
        label: profile.name,
        data,
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 1,
      };
    });

    res.json({ labels, datasets });
  } catch (error) {
    console.error("Get daily views stats error:", error);
    res.status(500).json({ error: "Server error retrieving daily views statistics" });
  }
};

// Stats: genre popularity
exports.getGenrePopularityStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const profiles = await Profile.find({ userId }).select("_id").lean();
    const profileIds = profiles.map((p) => p._id);

    const watchEvents = await WatchEvent.find({
      profileId: { $in: profileIds },
    })
      .populate({ path: "contentId", select: "category" })
      .lean();

    const genreCounts = {};
    watchEvents.forEach((event) => {
      if (event.contentId && event.contentId.category) {
        const genre = event.contentId.category;
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    });

    const labels = Object.keys(genreCounts);
    const data = Object.values(genreCounts);

    const genreColors = [
      { bg: "rgba(229, 9, 20, 0.6)", border: "rgba(229, 9, 20, 1)" },
      { bg: "rgba(0, 123, 255, 0.6)", border: "rgba(0, 123, 255, 1)" },
      { bg: "rgba(40, 167, 69, 0.6)", border: "rgba(40, 167, 69, 1)" },
      { bg: "rgba(255, 193, 7, 0.6)", border: "rgba(255, 193, 7, 1)" },
      { bg: "rgba(220, 53, 69, 0.6)", border: "rgba(220, 53, 69, 1)" },
      { bg: "rgba(108, 117, 125, 0.6)", border: "rgba(108, 117, 125, 1)" },
      { bg: "rgba(23, 162, 184, 0.6)", border: "rgba(23, 162, 184, 1)" },
      { bg: "rgba(255, 87, 34, 0.6)", border: "rgba(255, 87, 34, 1)" },
    ];

    const backgroundColor = labels.map((_, i) => genreColors[i % genreColors.length].bg);
    const borderColor = labels.map((_, i) => genreColors[i % genreColors.length].border);

    res.json({
      labels,
      datasets: [{ data, backgroundColor, borderColor, borderWidth: 1 }],
    });
  } catch (error) {
    console.error("Get genre popularity stats error:", error);
    res.status(500).json({ error: "Server error retrieving genre popularity statistics" });
  }
};

// Newest-by-genre API
exports.getNewestByGenre = async (_req, res) => {
  try {
    const grouped = await buildNewestByGenre();
    res.json({ grouped });
  } catch (error) {
    console.error("Newest by genre error:", error);
    res.status(500).json({ error: "Server error retrieving newest content" });
  }
};

// Home feed aggregation
exports.getFeed = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const [continueWatching, recommendations, popular, newestByGenre, likeDocs] =
      await Promise.all([
        buildContinueWatching(profile._id),
        buildRecommendations(profile._id),
        buildPopularContent(20),
        buildNewestByGenre(),
        Like.find({ profileId: profile._id, liked: true }).select("contentId").lean(),
      ]);

    const likedContentIds = likeDocs
      .map((doc) => doc.contentId)
      .filter(Boolean)
      .map((id) => id.toString());

    res.json({
      profile: {
        id: profile._id.toString(),
        name: profile.name,
        avatar: profile.avatar,
      },
      sections: {
        continueWatching,
        recommendations,
        popular,
        newestByGenre,
      },
      likes: likedContentIds,
    });
  } catch (error) {
    console.error("Feed aggregation error:", error);
    res.status(500).json({ error: "Server error building feed" });
  }
};




