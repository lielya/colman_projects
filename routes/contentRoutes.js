const express = require("express");
const router = express.Router();
const path = require("path");
const contentController = require("../controllers/contentController");

// Content Views
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/main.html"));
});

// Content API Routes
router.get("/content", contentController.getAllContent);
router.get("/content/search", contentController.searchContent);
router.get("/content/:contentId/episodes", contentController.getEpisodes);
router.get("/content/:contentId/watch-events", contentController.getWatchEvents);
router.get("/users/:userId/content/:contentId/progress", contentController.getProgress);

module.exports = router;

