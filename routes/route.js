const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const profileController = require("../controllers/profileController");
const contentController = require("../controllers/contentController");

// Home page
router.get("/", (req, res) => {
  res.sendFile("main.html", { root: "public" });
});

// router.post("/register", authController.registerUser);
// router.post("/login", authController.loginUser);

// Get profiles
// router.get("profiles", profileController.getProfiles);

module.exports = router;
