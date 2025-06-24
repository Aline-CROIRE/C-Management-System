const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token or user deactivated." })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token." })
  }
}

// Authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." })
    }
    next()
  }
}

module.exports = { auth, authorize }
