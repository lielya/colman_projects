const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const User = require("../models/User");
const Like = require("../models/Like");
const Content = require("../models/Content");
const Progress = require("../models/Progress");
const WatchEvent = require("../models/WatchEvent");

const ensureAssetPath = (value) => {
  if (!value || typeof value !== "string") return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  return `/${value.replace(/^\.?\//, "")}`;
};

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
    info: doc.info,
    likes: totalLikes,
    score: doc.score || 0,
    totalLikes,
    completions: doc.completions || 0,
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

const buildGlobalLikeMap = async (contentIds = []) => {
  const match = { liked: true };

  const ids = contentIds
    .map((id) => toObjectId(id))
    .filter(Boolean);

  if (contentIds.length > 0 && ids.length === 0) {
    return new Map();
  }

  if (ids.length > 0) {
    match.contentId = { $in: ids };
  } else {
    return new Map();
  }

  const likeCounts = await Like.aggregate([
    { $match: match },
    { $group: { _id: "$contentId", count: { $sum: 1 } } },
  ]);

  const map = new Map();
  likeCounts.forEach((row) => {
    if (row?._id) {
      map.set(row._id.toString(), row.count);
    }
  });
  return map;
};

const computePopularity = async (match = {}, limit = 20) => {
  const pipeline = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

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
      $sort: {
        score: -1,
        createdAt: -1,
        year: -1,
        title: 1,
      },
    },
    { $limit: limit },
    {
      $project: {
        watchEvents: 0,
        likeDocs: 0,
      },
    }
  );

  return Content.aggregate(pipeline);
};

const buildNewestByGenre = async (limitPerGenre = null) => {
  // Use environment variable if not provided, default to 10
  if (limitPerGenre === null) {
    limitPerGenre = parseInt(process.env.CONTENT_ITEMS_PER_PAGE, 10) || 10;
  }
  const pipeline = [
    {
      $sort: {
        createdAt: -1,
        year: -1,
        title: 1,
      },
    },
    {
      $group: {
        _id: "$category",
        items: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        category: "$_id",
        items: { $slice: ["$items", limitPerGenre] },
        _id: 0,
      },
    },
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

const mapProgressEntry = (item, likeMap = null) => {
  if (!item || !item.contentId) return null;
  const resumePositionSec = Math.max(0, (item.lastPositionSec || 0) - 10);

  return {
    id: item._id.toString(),
    content: mapContent(item.contentId, likeMap),
    episode: item.episodeId
      ? {
          id: item.episodeId._id.toString(),
          title: item.episodeId.title,
          season: item.episodeId.season,
          number: item.episodeId.episode,
        }
      : null,
    lastPositionSec: item.lastPositionSec || 0,
    resumePositionSec,
    durationSec: item.durationSec || 0,
    watchPercentage: item.watchPercentage || 0,
    status: item.status,
    updatedAt: item.updatedAt,
  };
};

const buildContinueWatching = async (profileId, limit = 12) => {
  const items = await Progress.find({
    profileId,
    watchPercentage: { $lt: 95 },
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate([
      { path: "contentId" },
      { path: "episodeId", select: "title season episode" },
    ])
    .lean();

  const contentIds = items
    .map((item) =>
      item?.contentId?._id?.toString?.() || item?.contentId?.toString?.()
    )
    .filter(Boolean);

  const likeMap = await buildGlobalLikeMap(contentIds);

  return items.map((item) => mapProgressEntry(item, likeMap)).filter(Boolean);
};

const buildRecommendations = async (profileId, options = {}) => {
  const limit = options.limit || 20;

  const [likedDocs, recentProgress] = await Promise.all([
    Like.find({ profileId, liked: true })
      .populate({ path: "contentId" })
      .lean(),
    Progress.find({ profileId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate({ path: "contentId" })
      .lean(),
  ]);

  const preferredCategories = new Set();
  const excludeIds = new Set();

  likedDocs.forEach((doc) => {
    if (doc.contentId?._id) {
      excludeIds.add(doc.contentId._id.toString());
      if (doc.contentId.category) {
        preferredCategories.add(doc.contentId.category);
      }
    }
  });

  recentProgress.forEach((item) => {
    if (item.contentId?._id) {
      excludeIds.add(item.contentId._id.toString());
      if (item.contentId.category) {
        preferredCategories.add(item.contentId.category);
      }
    }
  });

  const match = {};
  const categoryList = Array.from(preferredCategories);
  if (categoryList.length > 0) {
    match.category = { $in: categoryList };
  }

  const excludeObjectIds = Array.from(excludeIds)
    .map(toObjectId)
    .filter(Boolean);

  if (excludeObjectIds.length > 0) {
    match._id = { $nin: excludeObjectIds };
  }

  const recommendations = await computePopularity(match, limit);
  const likeMap = await buildGlobalLikeMap(
    recommendations.map((doc) => doc._id)
  );

  const reasonsByCategory = {};
  categoryList.forEach((category) => {
    reasonsByCategory[category] = `Because you enjoy ${category} titles`;
  });

  return recommendations.map((item) => {
    const mapped = mapContent(item, likeMap);
    const reason =
      reasonsByCategory[mapped.category] ||
      "Popular with viewers similar to you";
    return { ...mapped, reason };
  });
};

const buildPopularContent = async (limit = 20) => {
  const docs = await computePopularity({}, limit);
  const likeMap = await buildGlobalLikeMap(docs.map((doc) => doc._id));
  return docs.map((doc) => mapContent(doc, likeMap));
};

const ensureProfileExists = async (profileId) => {
  const profile = await Profile.findById(profileId).lean();
  return profile;
};

// get all profiles
exports.getProfiles = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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
    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
      return res
        .status(409)
        .json({ error: "Profile name already exists for this user" });
    }

    res.status(500).json({ error: "Server error creating profile" });
  }
};

exports.getLikes = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const likes = await Like.find({ profileId, liked: true })
      .select("contentId")
      .lean();

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
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const contentObjectId = toObjectId(contentId);
    if (!contentObjectId) {
      return res.status(400).json({ error: "Valid contentId is required" });
    }

    const contentExists = await Content.exists({ _id: contentObjectId });
    if (!contentExists) {
      return res.status(404).json({ error: "Content not found" });
    }

    const existing = await Like.findOne({
      profileId,
      contentId: contentObjectId,
    });

    if (existing && existing.liked) {
      return res.json({ message: "Content already liked" });
    }

    await Like.findOneAndUpdate(
      { profileId, contentId: contentObjectId },
      { $set: { liked: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Content.updateOne(
      { _id: contentObjectId },
      { $inc: { likes: 1 } }
    );

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
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const contentObjectId = toObjectId(contentId);
    if (!contentObjectId) {
      return res.status(400).json({ error: "Valid contentId is required" });
    }

    const removed = await Like.findOneAndDelete({
      profileId,
      contentId: contentObjectId,
    });

    if (removed && removed.liked) {
      await Content.updateOne(
        { _id: contentObjectId },
        { $inc: { likes: -1 } }
      );
    }

    res.json({ message: "Content unliked successfully" });
  } catch (error) {
    console.error("Unlike content error:", error);
    res.status(500).json({ error: "Server error unliking content" });
  }
};

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

exports.getContinueWatching = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const items = await buildContinueWatching(profile._id);
    res.json({ profileId, items });
  } catch (error) {
    console.error("Continue watching error:", error);
    res.status(500).json({ error: "Server error retrieving continue watching" });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const items = await buildRecommendations(profile._id);
    res.json({ profileId, items });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ error: "Server error retrieving recommendations" });
  }
};

exports.upsertProgress = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

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
    if (!contentObjectId) {
      return res.status(400).json({ error: "Valid contentId is required" });
    }

    const contentExists = await Content.exists({ _id: contentObjectId });
    if (!contentExists) {
      return res.status(404).json({ error: "Content not found" });
    }

    const duration = Math.max(0, sanitizeNumber(durationSec, 0));
    const position = Math.max(
      0,
      Math.min(duration, sanitizeNumber(lastPositionSec, 0))
    );
    const explicitPercentage = Number.isFinite(Number(watchPercentage))
      ? Number(watchPercentage)
      : null;

    const computedPercentage =
      explicitPercentage !== null && !Number.isNaN(explicitPercentage)
        ? Math.max(0, Math.min(100, explicitPercentage))
        : duration > 0
        ? Math.max(0, Math.min(100, Math.round((position / duration) * 100)))
        : 0;

    const resolvedStatus =
      status === "done" || computedPercentage >= 95 ? "done" : "in_progress";

    const episodeObjectId = toObjectId(episodeId);
    if (episodeId && !episodeObjectId) {
      return res.status(400).json({ error: "Invalid episodeId" });
    }

    const updateQuery = {
      profileId: profile._id,
      contentId: contentObjectId,
    };

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
        { path: "episodeId", select: "title season episode" },
      ])
      .lean();

    let eventType = typeof event === "string" ? event.toLowerCase() : null;
    if (resolvedStatus === "done") {
      eventType = "complete";
    }

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

exports.getPopularContent = async (_req, res) => {
  try {
    const items = await buildPopularContent();
    res.json({ items });
  } catch (error) {
    console.error("Popular content error:", error);
    res.status(500).json({ error: "Server error retrieving popular content" });
  }
};

exports.getNewestByGenre = async (_req, res) => {
  try {
    const grouped = await buildNewestByGenre();
    res.json({ grouped });
  } catch (error) {
    console.error("Newest by genre error:", error);
    res.status(500).json({ error: "Server error retrieving newest content" });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await ensureProfileExists(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const [continueWatching, recommendations, popular, newestByGenre, likeDocs] =
      await Promise.all([
        buildContinueWatching(profile._id),
        buildRecommendations(profile._id),
        buildPopularContent(20),
        buildNewestByGenre(), // Will use CONTENT_ITEMS_PER_PAGE from env
        Like.find({ profileId: profile._id, liked: true })
          .select("contentId")
          .lean(),
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
