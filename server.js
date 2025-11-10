// server.js

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session"); // <-- REQUIRED for login
const seedDatabase = require("./seedDatabase");
const app = express();

dotenv.config();

async function startServer() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/netflixDB";
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");

    // Call seeder after successful connection
    await seedDatabase();
    console.log("✅ Seeding completed!");

    // --- Middleware ---
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- Session Middleware (CRITICAL FOR LOGIN) ---
    // Make sure you ran: npm install express-session
    app.use(session({
      secret: process.env.SESSION_SECRET || 'your_secret_key_goes_here',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Set to true if using HTTPS
    }));

    // Request logging middleware
    app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.url}`);
      next();
    });

    // Serve static files
    app.use(express.static(path.join(__dirname, "public")));

    // --- Import Route Modules ---
    const authRoutes = require("./routes/authRoutes");
    const profileRoutes = require("./routes/profileRoutes");
    const contentRoutes = require("./routes/contentRoutes");
    const adminRoutes = require("./routes/adminRoutes"); // <-- UPDATED with camelCase

    // --- Mount Routes ---

    // Mount routes - Views routes (no /api prefix)
    app.use("/", authRoutes); // Auth views: / (login), /login, /register
    app.use("/", profileRoutes); // Profile views: /profiles
    app.use("/", contentRoutes); // Content views: /main (main page after login)

    // Mount API routes (with /api prefix)
    app.use("/api", authRoutes); // Auth API: /api/login, /api/register
    app.use("/api", profileRoutes); // Profile API: /api/users/:userId/profiles, etc.
    app.use("/api", contentRoutes); // Content API: /api/content, etc.

    // Mount Admin routes (handles /admin/...)
    app.use("/admin", adminRoutes); // <-- NEWLY ADDED

    // 404 handler for API routes only
    app.use("/api/*", (req, res) => {
      res.status(404).json({ error: "API endpoint not found" });
    });

    // General error handler
    app.use((err, req, res, next) => {
      console.error(`Error: ${err.message}`);
      console.error(err.stack);
      res.status(500).json({ error: "Server error occurred" });
    });

    // Start Server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();