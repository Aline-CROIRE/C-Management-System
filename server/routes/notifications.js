const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/auth")

// Get user notifications
router.get("/", verifyToken, async (req, res) => {
  try {
    // Mock notifications for now
    const notifications = [
      {
        _id: "1",
        title: "Welcome to the system",
        message: "Your account has been created successfully",
        type: "info",
        read: false,
        createdAt: new Date(),
      },
    ]

    res.json({
      success: true,
      notifications,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    })
  }
})

// Mark notification as read
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    })
  }
})

// Mark all notifications as read
router.patch("/mark-all-read", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "All notifications marked as read",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    })
  }
})

// Delete notification
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Notification deleted",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    })
  }
})

module.exports = router
