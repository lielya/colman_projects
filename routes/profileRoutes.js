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
router.get("/profiles/:profileId/likes", profileController.getLikes);
router.post("/profiles/:profileId/like", profileController.likeContent);
router.post("/profiles/:profileId/unlike", profileController.unlikeContent);

module.exports = router;

