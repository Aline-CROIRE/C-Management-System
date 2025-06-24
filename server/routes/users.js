const express = require("express")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const { sendEmail } = require("../utils/email")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Register user
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, modules, company, phone } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      modules,
      company,
      phone,
    })

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken()
    await user.save()

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - Management System Pro",
      template: "emailVerification",
      data: {
        firstName: user.firstName,
        verificationUrl,
      },
    })

    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      userId: user._id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Registration failed. Please try again." })
  }
})

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in" })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Your account has been deactivated" })
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Login failed. Please try again." })
  }
})

// Verify email
router.post("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params

    const user = await User.findOne({ emailVerificationToken: token })
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" })
    }

    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    await user.save()

    res.json({ message: "Email verified successfully! You can now log in." })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({ message: "Email verification failed" })
  }
})

// Set password for admin-created users
router.post("/set-password/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { password } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({ message: "Invalid user or expired link" })
    }

    // Update password
    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    res.json({ message: "Password set successfully! You can now log in." })
  } catch (error) {
    console.error("Set password error:", error)
    res.status(500).json({ message: "Failed to set password" })
  }
})

// Create user by Super Admin/Admin
router.post("/create-user", auth, authorize(["Super Admin", "Admin"]), async (req, res) => {
  try {
    const { firstName, lastName, email, role, modules, company, phone } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString("hex")

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: tempPassword,
      role,
      modules,
      company,
      phone,
      isEmailVerified: true, // Admin-created accounts are pre-verified
      createdBy: req.user.userId,
    })

    await user.save()

    // Send password setup email
    const passwordSetupUrl = `${process.env.CLIENT_URL}/set-password/${user._id}`
    await sendEmail({
      to: user.email,
      subject: "Welcome to Management System Pro - Set Your Password",
      template: "passwordSetup",
      data: {
        firstName: user.firstName,
        tempPassword,
        passwordSetupUrl,
        createdBy: req.user.firstName + " " + req.user.lastName,
      },
    })

    res.status(201).json({
      message: "User created successfully! Password setup email sent.",
      userId: user._id,
    })
  } catch (error) {
    console.error("User creation error:", error)
    res.status(500).json({ message: "User creation failed. Please try again." })
  }
})

module.exports = router
