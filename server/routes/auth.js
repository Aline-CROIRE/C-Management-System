// server/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts from this IP, please try again after 15 minutes." },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });
};

router.post("/register", authActionLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, company, phone, modules, role = "user" } = req.body;

    if (!firstName || !lastName || !email || !password || !company) {
      return res.status(400).json({ success: false, message: "All required fields (first name, last name, email, password, company) are missing." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      company,
      phone: phone || null,
      modules: modules || [],
      role,
    });

    await user.save();

    const token = generateToken(user._id);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
    }
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

router.post("/login", authActionLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "This account has been deactivated." });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user._id);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

router.post("/forgot-password", authActionLimiter, async (req, res) => { /* ... */ });
router.post("/reset-password/:token", authActionLimiter, async (req, res) => { /* ... */ });
router.post("/verify-email/:token", async (req, res) => { /* ... */ });

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = req.user; 
    console.log("Backend /me: Raw user object from verifyToken:", user); // Debug: Check what verifyToken passes

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        phone: user.profile?.phone, 
        role: user.role,
        modules: user.modules,
        permissions: user.permissions,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        // CRITICAL: Ensure restaurantId is converted to string for frontend consumption
        restaurantId: user.restaurantId ? user.restaurantId.toString() : null, 
      },
    });
    console.log("Backend /me: Response sent with user data, including restaurantId.");
  } catch (error) {
    console.error("Backend /me: Error fetching user profile:", error);
    res.status(500).json({ success: false, message: "Server error while fetching user profile." });
  }
});

module.exports = router;