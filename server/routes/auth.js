// routes/authRoutes.js (UPDATED - more detailed error logging)
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

    // Frontend validation should ideally cover this, but a backend check is good.
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
      password, // Password hashing should happen in a pre-save hook in your User model
      company,
      phone: phone || null, // Ensure optional fields handle undefined gracefully
      modules: modules || [], // Ensure modules is an array, even if empty
      role,
    });

    await user.save(); // This is where Mongoose validation errors would typically occur

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Provide more specific error messages for known Mongoose errors
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
    res.json({
      success: true,
      message: "Login successful",
      token,
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
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        phone: user.phone,
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