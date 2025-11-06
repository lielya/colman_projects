const express = require("express");
const router = express.Router();
const path = require("path");
const authController = require("../controllers/userController");

// Auth Views
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html"));
});

// Auth API Routes (will be mounted under /api)
router.post("/login", authController.login);
router.post("/register", authController.register);

module.exports = router;

