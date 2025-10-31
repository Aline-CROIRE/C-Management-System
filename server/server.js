const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

require('./models/User');
require('./models/Restaurant');
require('./models/MenuItem');
require('./models/Table');
require('./models/Order');
require('./models/WasteLog');
require('./models/ResourceLog');
require('./models/Customer');
require('./models/RestaurantCustomer');


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

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS Configuration: Allow all origins
app.use(cors({
  origin: "*", // Allows requests from any origin
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => res.status(200).json({ success: true, message: "API is healthy ✅" }));

app.use('/api/restaurant', restaurantRoutes);

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
