const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { auth } = require("../middleware/auth")
const User = require("../models/User")
const { sendEmail } = require("../utils/email")

const router = express.Router()

// Register (for self-registration - users can choose modules)
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, company, phone, modules, password, confirmPassword } = req.body

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create user with password and selected modules
    const user = new User({
      firstName,
      lastName,
      email,
      company,
      phone,
      modules: modules || [], // User-selected modules
      role: "User",
      password, // Password will be hashed by the pre-save hook
      isEmailVerified: false,
    })

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken()
    await user.save()

    // Send email verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`

    await sendEmail({
      to: email,
      subject: "Verify Your Email - Management System Pro",
      template: "emailVerification",
      data: {
        firstName,
        verificationUrl,
        modules: modules || [],
      },
    })

    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      userId: user._id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
})

// Create user by admin (sends password setup email)
router.post("/create-user", auth, async (req, res) => {
  try {
    const { firstName, lastName, email, company, phone, modules, role } = req.body

    // Check if requester has permission
    if (!["Super Admin", "Admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create user without password (will be set via email link)
    const user = new User({
      firstName,
      lastName,
      email,
      company,
      phone,
      modules: modules || [],
      role: role || "User",
      isEmailVerified: true, // Admin-created users are pre-verified
      createdBy: req.user._id,
    })

    await user.save()

    // Send password setup email
    const setupUrl = `${process.env.CLIENT_URL}/set-password/${user._id}`

    await sendEmail({
      to: email,
      subject: "Account Created - Set Your Password - Management System Pro",
      template: "passwordSetup",
      data: {
        firstName,
        setupUrl,
        modules: modules || [],
      },
    })

    res.status(201).json({
      message: "User created successfully! Password setup email sent.",
      userId: user._id,
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({ message: "Server error creating user" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check if user has set password
    if (!user.password) {
      return res.status(400).json({ message: "Please complete your account setup first" })
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ message: "Please verify your email address first" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        modules: user.modules,
        isEmailVerified: user.isEmailVerified,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// Set Password
router.post("/set-password/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { password } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.password) {
      return res.status(400).json({ message: "Password already set" })
    }

    // Set password and verify email
    user.password = password
    user.isEmailVerified = true
    await user.save()

    res.json({ message: "Password set successfully" })
  } catch (error) {
    console.error("Set password error:", error)
    res.status(500).json({ message: "Server error setting password" })
  }
})

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    await sendEmail({
      to: email,
      subject: "Password Reset Request - Management System Pro",
      template: "passwordReset",
      data: {
        firstName: user.firstName,
        resetUrl,
      },
    })

    res.json({ message: "Password reset email sent" })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Server error sending reset email" })
  }
})

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" })
    }

    // Set new password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ message: "Server error resetting password" })
  }
})

// Verify Email
router.post("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params

    const user = await User.findOne({ emailVerificationToken: token })
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" })
    }

    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    await user.save()

    res.json({ message: "Email verified successfully! You can now log in to your account." })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({ message: "Server error verifying email" })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error fetching user" })
  }
})

module.exports = router
