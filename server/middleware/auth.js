const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
    next();
  } catch (error) {
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
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  checkModuleAccess,
  checkPermission,
};