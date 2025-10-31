// server/app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// --- Import Mongoose Models (ensure they are loaded) ---
require('./models/User');
require('./models/Restaurant');
require('./models/MenuItem');
require('./models/Table');
require('./models/Order');
require('./models/WasteLog');
require('./models/ResourceLog');
require('./models/Customer');
require('./models/RestaurantCustomer');
// ... other models you have in your system


// --- Import Routes ---
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory"); 
const purchaseOrderRoutes = require("./routes/purchaseOrders");
const supplierRoutes = require("./routes/suppliers");
const analyticsRoutes = require("./routes/analytics");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const reportsRoutes = require('./routes/reportsRoutes');
const salesRoutes = require("./routes/sales");
const notificationRoutes = require("./routes/notifications");
const customerExistingRoutes = require('./routes/customers');
const constructionRoutes = require('./routes/construction');
const workerRoutes = require('./routes/workers');
const expenseRoutes = require('./routes/expenses');
const InternalUseRoutes = require('./routes/InternalUseRoutes');
const stockAdjustmentRoutes = require('./routes/stockAdjustmentRoutes');
const snapshotRoutes = require('./routes/snapshots');

const restaurantRoutes = require('./routes/restaurantRoutes');


const { verifyToken, checkModuleAccess } = require("./middleware/auth");
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

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  // Your *previous* Vercel frontend URL, keep it if it's still potentially in use
  "https://c-management-system-73dy.vercel.app", 
  // FIX: ADD YOUR *CURRENT* VERCEl FRONTEND URL HERE
  "https://c-management-system-un5e.vercel.app", 
];

// Add environment variable CLIENT_URL to allowed origins
// This is good practice if your CLIENT_URL might change based on environment (e.g., staging, production)
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}
// Add origin from CLIENT_QR_ORDER_BASE_URL to allowed origins for public QR requests
if (process.env.CLIENT_QR_ORDER_BASE_URL) {
    try {
        const url = new URL(process.env.CLIENT_QR_ORDER_BASE_URL);
        const origin = url.origin; // Extracts "https://example.com" from "https://example.com/path/to/qr"
        if (!allowedOrigins.includes(origin)) {
            allowedOrigins.push(origin);
        }
    } catch (e) {
        logger.error(`Invalid CLIENT_QR_ORDER_BASE_URL: ${e.message}`);
    }
}


app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // If the origin is in our allowed list, permit the request
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      // Otherwise, block the request and log it
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      logger.warn(msg);
      return callback(new Error(msg), false);
    }
  },
  credentials: true, // Allow cookies to be sent with cross-origin requests
}));

// Standard Middleware
app.use(express.json({ limit: "10mb" })); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded request bodies
app.use(compression()); // Compress response bodies for faster loading
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP request logger

// Serve static files from the 'uploads' directory (e.g., for user avatars, document uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint for monitoring
app.get("/health", (req, res) => res.status(200).json({ success: true, message: "API is healthy ✅" }));

// --- API Routes ---

// The /api/restaurant routes are mounted first to allow public QR routes to bypass verifyToken
// and to ensure the /my-restaurant route can be hit before other authenticated routes that
// might depend on req.user.restaurantId being populated.
app.use('/api/restaurant', restaurantRoutes);


// Authenticated API Routes
// These routes typically require a JWT for access and often depend on `req.user`
app.use("/api/auth", authRoutes);
app.use("/api/inventory", verifyToken, inventoryRoutes); 
app.use("/api/purchase-orders", verifyToken, purchaseOrderRoutes);
app.use("/api/suppliers", verifyToken, supplierRoutes);
app.use("/api/analytics", verifyToken, analyticsRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/dashboard", verifyToken, dashboardRoutes);
app.use("/api/reports", verifyToken, reportsRoutes);
app.use("/api/notifications", verifyToken, notificationRoutes);
app.use("/api/sales", verifyToken, salesRoutes);
app.use("/api/customers", verifyToken, customerExistingRoutes); 
app.use('/api/construction', verifyToken, constructionRoutes); 
app.use('/api/workers', workerRoutes); 
app.use('/api/expenses', expenseRoutes); 
app.use('/api/internal-use', verifyToken, InternalUseRoutes);
app.use('/api/stock-adjustments', verifyToken, stockAdjustmentRoutes);
app.use('/api/snapshots', verifyToken, snapshotRoutes);

// Catch-all for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found.", path: req.originalUrl });
});

// Error handling middleware (should be the last middleware in the chain)
app.use(errorHandler);

// Database connection function
const connectDB = async () => {
  try {
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

// Function to start the server
const startServer = async () => {
    await connectDB(); // Connect to MongoDB
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });

    // Handle unhandled promise rejections (e.g., from async operations)
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message, err.stack);
      server.close(() => process.exit(1)); // Close server gracefully and exit
    });

    // Handle uncaught exceptions (e.g., synchronous errors)
    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
      console.error(err.name, err.message, err.stack);
      server.close(() => process.exit(1)); // Close server gracefully and exit
    });
};

startServer(); // Initiate server startup

module.exports = app;
