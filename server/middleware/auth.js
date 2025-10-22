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
    const user = await User.findById(decoded.userId).select("-password");

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

    req.user = user;

    if (req.user.role !== 'admin') {
        const ownedRestaurant = await Restaurant.findOne({ owner: req.user._id, isActive: true });
        if (ownedRestaurant) {
            req.user.restaurantId = ownedRestaurant._id.toString();
        } else {
            console.warn(`User ${req.user._id} does not own an active restaurant.`);
        }
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
        message: `Forbidden: You do not have access to the '${moduleName}' module.`,
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