const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const { verifyToken, requireRole } = require("../middleware/auth")

// Get all users (admin only)
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "-password")
    res.json({
      success: true,
      users,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    })
  }
})

// Create new user (admin only)
router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { firstName, lastName, email, role, modules, isActive } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "user",
      modules: modules || [],
      isActive: isActive !== undefined ? isActive : true,
      isEmailVerified: true, // Admin created users are auto-verified
    })

    await user.save()

    // TODO: Send email with temporary password

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        modules: user.modules,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    })
  }
})

// Update user (admin only)
router.put("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { firstName, lastName, email, role, modules, isActive } = req.body

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        role,
        modules,
        isActive,
      },
      { new: true, select: "-password" },
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    })
  }
})

// Delete user (admin only)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    })
  }
})

// Toggle user status (admin only)
router.patch("/:id/status", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { isActive } = req.body

    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true, select: "-password" })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    })
  }
})

// Update user profile (own profile)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, department, position } = req.body

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        department,
        position,
      },
      { new: true, select: "-password" },
    )

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    })
  }
})

// Change password (own password)
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedNewPassword,
    })

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    })
  }
})

module.exports = router
