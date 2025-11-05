const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const seedDatabase = require("./seedDatabase"); // ← import seeder
const app = express();

dotenv.config();

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost/netflixDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");

    // Call seeder after successful connection
    await seedDatabase();
    console.log("Seeding completed!");

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Logs all incoming requests with timestamp
    app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.url}`);
      next();
    });

    // Serve static files
    app.use(express.static(path.join(__dirname, "public")));

    // API Routes
    const indexRoutes = require("./routes/route");
    app.use("/api", indexRoutes);

    // 404 handler for API routes
    app.use("/*", (req, res) => {
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
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
