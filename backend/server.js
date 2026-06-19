import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import projectRoutes from "./routes/projects.js";
import messageRoutes from "./routes/messages.js";
import meetingRoutes from "./routes/meetings.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/3d_portfolio";

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://aniruddhasali.in",
  "http://aniruddhasali.in",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, postman, or curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "data", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/api/uploads", express.static(uploadDir));

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/meetings", meetingRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running smoothly" });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("🔌 Connected to MongoDB database successfully!");
    // Start Express Server after database connection
    app.listen(PORT, () => {
      console.log(`🚀 Portfolio backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.log("Trying to run server without database for safety (mock mode)...");
    
    // Start server anyway so frontend doesn't break if MongoDB is offline
    app.listen(PORT, () => {
      console.log(`🚀 Portfolio backend server running in MOCK mode on http://localhost:${PORT}`);
    });
  });
