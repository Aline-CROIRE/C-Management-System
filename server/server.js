const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Import routes
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
const customerRoutes = require('./routes/customers');
const constructionRoutes = require('./routes/construction');
const workerRoutes = require('./routes/workers');
const expenseRoutes = require('./routes/expenses');

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

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://c-management-system-73dy.vercel.app",
];

if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      logger.warn(msg);
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
}));

// Standard Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts from this IP, please try again after 15 minutes." },
});
app.use("/api", apiLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => res.status(200).json({ success: true, message: "API is healthy ✅" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/inventory", verifyToken, inventoryRoutes); // ALL inventory and inventory-related metadata routes

app.use("/api/purchase-orders", verifyToken, purchaseOrderRoutes);
app.use("/api/suppliers", verifyToken, supplierRoutes);
app.use("/api/analytics", verifyToken, analyticsRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/dashboard", verifyToken, dashboardRoutes);
app.use("/api/reports", verifyToken, reportsRoutes);
app.use("/api/notifications", verifyToken, notificationRoutes);
app.use("/api/sales", verifyToken, salesRoutes);
app.use("/api/customers", verifyToken, customerRoutes);
app.use('/api/construction', verifyToken, constructionRoutes); 
app.use('/api/workers', workerRoutes); 
app.use('/api/expenses', expenseRoutes); 

app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found.", path: req.originalUrl });
});

app.use(errorHandler);

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in environment variables.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const startServer = async () => {
    await connectDB();
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });

    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message, err.stack);
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
      console.error(err.name, err.message, err.stack);
      server.close(() => process.exit(1));
    });
};

startServer();

module.exports = app;