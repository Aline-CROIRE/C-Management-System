const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/auth")
const Notification = require("../models/Notification") // Import the Notification model

// Get user notifications
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id // Assuming req.user is populated by verifyToken middleware

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(50); // Limit to a reasonable number of recent notifications

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.json({
      success: true,
      notifications,
      unreadCount, // Return unreadCount directly
    })
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    })
  }
})

// Mark notification as read
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, user: userId, read: false }, // Find unread notification for the user
        { $set: { read: true } },
        { new: true }
    );

    if (!notification) {
        // Notification not found or already read, or doesn't belong to user
        return res.status(404).json({ success: false, message: "Notification not found or already read." });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    })
  }
})

// Mark all notifications as read
router.patch("/mark-all-read", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
        { user: userId, read: false }, // Mark all unread for the user
        { $set: { read: true } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    })
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    })
  }
})

// Delete notification
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await Notification.findOneAndDelete({ _id: id, user: userId });

    if (!result) {
        return res.status(404).json({ success: false, message: "Notification not found." });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    })
  } catch (error) {
    console.error("Failed to delete notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    })
  }
})

module.exports = router