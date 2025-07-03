// server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// --- Import Routes ---
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const metadataRoutes = require("./routes/metadata"); // <-- IMPORT THE NEW METADATA ROUTES
const analyticsRoutes = require("./routes/analytics");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const notificationRoutes = require("./routes/notifications");

// --- Import Middleware ---
const { verifyToken } = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Global Middleware ---
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());

app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));


// --- Rate Limiting Strategy ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // A reasonable general limit
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes." },
});
app.use("/api", apiLimiter);


// --- Static File Serving ---
// This is the crucial fix for displaying images. It must come before route definitions.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// --- Health Check Endpoint ---
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is healthy ✅" });
});


// --- API Routes Mounting ---

// Public routes (not protected by verifyToken)
app.use("/api/auth", authRoutes);

// --- THE FIX: Separate routes for better organization and to prevent data loss ---
// `inventoryRoutes` now only handles `/inventory`, `/stats`, etc.
app.use("/api", verifyToken, inventoryRoutes);

// `metadataRoutes` now handles `/categories` and `/locations`
app.use("/api", verifyToken, metadataRoutes);

// Other protected routes
app.use("/api/analytics", verifyToken, analyticsRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/dashboard", verifyToken, dashboardRoutes);
app.use("/api/reports", verifyToken, reportRoutes);
app.use("/api/notifications", verifyToken, notificationRoutes);


// API Info Route
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the C-Management-System API",
    version: "1.0.0"
  });
});

// Catch-all for any undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
    path: req.originalUrl,
  });
});

// --- Serve React Frontend in Production ---
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "..", "client", "build");
  app.use(express.static(clientBuildPath));
  // For any route not caught by the API, serve the React app's index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Global Error Handler (must be the last `app.use` call)
app.use(errorHandler);

// --- Database Connection & Server Start ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit process with failure
  }
};

const startServer = async () => {
    await connectDB();
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
    });
    
    // Gracefully handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });
};

startServer();

module.exports = app;