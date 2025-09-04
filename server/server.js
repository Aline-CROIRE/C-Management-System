const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// --- Route Imports ---
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


// --- Middleware Imports ---
const { verifyToken } = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;


// --- GLOBAL MIDDLEWARE SETUP ---

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// --- CORRECTED CORS CONFIGURATION ---
// Define allowed origins as an array
const allowedOrigins = [
  "http://localhost:3000", // Always allow local development
  "https://c-management-system-73dy.vercel.app", // Your deployed Vercel frontend URL
];

// If process.env.CLIENT_URL is set (e.g., on Render), add it to allowed origins
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true); 
    // Check if the requesting origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      // If not allowed, reject with a CORS error
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
  },
  credentials: true, // Allow sending cookies/auth headers
}));
// --- END CORRECTED CORS CONFIGURATION ---


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

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

// --- API Routes Mounting ---
app.use("/api/auth", authRoutes);
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


app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found.", path: req.originalUrl });
});

app.use(errorHandler);

// --- Database Connection & Server Start ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://KIMA:Aline%40123@cluster0.ufciukm.mongodb.net/ManagementSystemDB?retryWrites=true&w=majority");
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const startServer = async () => {
    await connectDB();
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
    });
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });
};

startServer();

module.exports = app;
