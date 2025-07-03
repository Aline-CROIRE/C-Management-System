// routes/auth.js

const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit"); // 1. Import rate-limiter
const User = require("../models/User");
const router = express.Router();

// Import your shared authentication middleware
const { verifyToken } = require("../middleware/auth");


// --- RATE LIMITER CONFIGURATION (THE FIX FOR THE 429 ERROR) ---

// A stricter limiter for sensitive actions like logging in, registering, and password resets.
const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 requests per window.
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts from this IP, please try again after 15 minutes." },
});

// A much more lenient limiter for general API use, including the '/me' check.
// This should ideally be applied globally in your main server file (app.js or server.js),
// but we will apply the stricter one to specific routes here for a complete solution.


// --- Helper Functions and Setup ---

// Gmail transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d", // Token expires in 7 days
  });
};


// ====================================================================
// PUBLIC AUTHENTICATION ROUTES
// ====================================================================

// Register user - Apply the stricter rate limiter
router.post("/register", authActionLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = "user" } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }
    // ... rest of your registration logic ...
    const user = new User({ firstName, lastName, email, password, role });
    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: { id: user._id, firstName: user.firstName, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

// Login user - Apply the stricter rate limiter
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
    res.json({
      success: true, message: "Login successful", token,
      user: { id: user._id, firstName: user.firstName, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// Other sensitive routes
router.post("/forgot-password", authActionLimiter, async (req, res) => { /* ... */ });
router.post("/reset-password/:token", authActionLimiter, async (req, res) => { /* ... */ });
router.post("/verify-email/:token", async (req, res) => { /* ... */ });

// ====================================================================
// PROTECTED USER ROUTE
// ====================================================================

// Get current user's profile.
// This route does NOT use the strict `authActionLimiter`.
// This allows for frequent checks on app load without getting blocked.
router.get("/me", verifyToken, async (req, res) => {
  try {
    // The `verifyToken` middleware attaches the full user object to `req.user`.
    // No need to query the database again. This is efficient.
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        modules: user.modules,
        permissions: user.permissions,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Get '/me' error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching user profile." });
  }
});

module.exports = router;