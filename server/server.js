const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config(); // Load environment variables from .env file

// Import routes
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const metadataRoutes = require("./routes/metadata");
const purchaseOrderRoutes = require("./routes/purchaseOrders");
const supplierRoutes = require("./routes/suppliers");
const analyticsRoutes = require("./routes/analytics");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const reportsRoutes = require('./routes/reportsRoutes');
const salesRoutes = require("./routes/sales");
const notificationRoutes = require("./routes/notifications");
const customerRoutes = require('./routes/customers');
const constructionRoutes = require('./routes/construction');
const workerRoutes = require('./routes/workers');
const expenseRoutes = require('./routes/expenseRoutes');

// Import middleware and utilities
const { verifyToken } = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS Configuration to accept all origins with credentials
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // or from any specified origin.
    // When `credentials: true` is set, `Access-Control-Allow-Origin: *`
    // is not allowed by browsers. Instead, the `cors` library will echo
    // the request's 'Origin' header as 'Access-Control-Allow-Origin'
    // if the function returns true.
    callback(null, true);
  },
  credentials: true,
}));

// Standard Middleware
app.use(express.json({ limit: "10mb" })); // Body parser for JSON
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Body parser for URL-encoded data
app.use(compression()); // Gzip compression
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP request logger

// Rate Limiting to prevent brute-force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: "Too many attempts from this IP, please try again after 15 minutes." },
});
app.use("/api", apiLimiter); // Apply rate limiting to all /api routes

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/health", (req, res) => res.status(200).json({ success: true, message: "API is healthy ✅" }));

// API Routes
app.use("/api/auth", authRoutes); // Auth routes are public (no verifyToken middleware here)
app.use("/api/inventory", verifyToken, inventoryRoutes);
app.use("/api/purchase-orders", verifyToken, purchaseOrderRoutes);
app.use("/api/suppliers", verifyToken, supplierRoutes);
app.use("/api/analytics", verifyToken, analyticsRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/dashboard", verifyToken, dashboardRoutes);
app.use("/api/reports", verifyToken, reportsRoutes);
app.use("/api/notifications", verifyToken, notificationRoutes);
app.use("/api/metadata", verifyToken, metadataRoutes);
app.use("/api/sales", verifyToken, salesRoutes);
app.use("/api/customers", verifyToken, customerRoutes);
app.use('/api/construction', verifyToken, constructionRoutes); 
app.use('/api/workers', workerRoutes); 
app.use('/api/expenses', expenseRoutes); 
// Catch-all for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found.", path: req.originalUrl });
});

// Centralized Error Handling Middleware (should be the last middleware)
app.use(errorHandler);

// Database Connection
const connectDB = async () => {
  try {
    // Ensure MONGODB_URI is provided in .env
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in environment variables.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit process with failure code
  }
};

// Start Server Function
const startServer = async () => {
    await connectDB(); // Connect to DB first
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message, err.stack); // Log full error stack
      server.close(() => process.exit(1)); // Close server and exit
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
      console.error(err.name, err.message, err.stack); // Log full error stack
      server.close(() => process.exit(1)); // Close server and exit
    });
};

startServer();

module.exports = app;
