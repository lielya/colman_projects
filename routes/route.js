const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const profileController = require("../controllers/profileController");
const contentController = require("../controllers/contentController");

// Home page
router.get("/", (req, res) => {
  res.sendFile("main.html", { root: "public" });
});

// ===== AUTH ROUTES =====
// router.post("/register", authController.registerUser); // optional

// ===== PROFILE ROUTES =====

// Get all profiles for a specific user
// Example: GET /api/users/6745a12b3fabc1234567890a/profiles
router.get("/api/users/:userId/profiles", profileController.getProfiles);

// Create a new profile for a user
router.post("/api/users/:userId/profiles", profileController.createProfile);

// Get profile likes (optional)
router.get("/api/profiles/:profileId/likes", profileController.getLikes);

// Like / Unlike content (optional)
router.post("/api/profiles/:profileId/like", profileController.likeContent);
router.post("/api/profiles/:profileId/unlike", profileController.unlikeContent);

// ===== CONTENT ROUTES (if you have them) =====
// e.g. router.get("/api/content", contentController.getAllContent);

module.exports = router;