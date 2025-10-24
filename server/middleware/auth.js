// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    // .lean() makes it a plain JS object, easier to manipulate and pass around
    const user = await User.findById(decoded.userId).select("-password").lean(); 

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Your account is deactivated.",
      });
    }

    // Attach the user object to the request. This `user` object will now include `restaurantId`
    // if it's stored on the User model directly.
    req.user = user; 

    // This block is for scenarios where `req.user.restaurantId` might not be directly set on the User model
    // but the user *owns* a restaurant. Given `restaurantId` is now directly on the User model,
    // this specific lookup might be less critical for /me, but good for other middleware using `req.user.restaurantId`.
    // We'll keep it as a safeguard.
    if (req.user.role !== 'admin' && !req.user.restaurantId) { 
        const ownedRestaurant = await Restaurant.findOne({ owner: req.user._id, isActive: true });
        if (ownedRestaurant) {
            req.user.restaurantId = ownedRestaurant._id; // Attach ObjectId directly
            console.log(`Middleware: User ${req.user._id} now has restaurantId from owned restaurant lookup: ${ownedRestaurant._id}`);
        } else {
            console.warn(`Middleware: User ${req.user._id} is not an admin, has no direct restaurantId, and no owned active restaurant found.`);
        }
    } else if (req.user.restaurantId) {
        console.log(`Middleware: User ${req.user._id} already has restaurantId: ${req.user.restaurantId}`);
    }


    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${role} role required.`,
      });
    }
    next();
  };
};

const checkModuleAccess = (moduleName) => {
  return (req, res, next) => {
    if (req.user.role === "admin") return next();

    if (!req.user.modules || !req.user.modules.includes(moduleName)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have access to the '${moduleName}' module.` + (req.user.restaurantId ? '' : ' (No restaurant associated with your account.)'),
      });
    }

    next();
  };
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }
  next();
};

const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.permissions && req.user.permissions[module] && req.user.permissions[module][action]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: You do not have '${action}' permission for the '${module}' module.`,
    });
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  checkModuleAccess,
  checkPermission,
};