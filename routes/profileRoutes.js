const express = require("express");
const router = express.Router();
const path = require("path");
const profileController = require("../controllers/profileController");

// Profile Views
router.get("/profiles", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/profiles.html"));
});

// Profile API Routes
router.get("/users/:userId/profiles", profileController.getProfiles);
router.post("/users/:userId/profiles", profileController.createProfile);
router.put("/profiles/:profileId", profileController.updateProfile);
router.delete("/profiles/:profileId", profileController.deleteProfile);
router.get("/profiles/:profileId/feed", profileController.getFeed);
router.get("/profiles/:profileId/continue", profileController.getContinueWatching);
router.get("/profiles/:profileId/recommendations", profileController.getRecommendations);
router.post("/profiles/:profileId/progress", profileController.upsertProgress);
router.get("/profiles/:profileId/likes", profileController.getLikes);
router.post("/profiles/:profileId/like", profileController.likeContent);
router.post("/profiles/:profileId/unlike", profileController.unlikeContent);
router.get("/content/popular", profileController.getPopularContent);
router.get("/content/newest", profileController.getNewestByGenre);
// Statistics routes
router.get("/users/:userId/stats/daily-views", profileController.getDailyViewsStats);
router.get("/users/:userId/stats/genre-popularity", profileController.getGenrePopularityStats);

module.exports = router;

