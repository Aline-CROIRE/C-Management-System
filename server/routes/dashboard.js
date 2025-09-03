const express = require("express")
const { verifyToken } = require("../middleware/auth")
const User = require("../models/User")
const Inventory = require("../models/Inventory")
const PurchaseOrder = require("../models/PurchaseOrder")
const Receipt = require("../models/Receipt")
const router = express.Router()

// Get dashboard statistics
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const userModules = req.user.modules || []
    const stats = {}

    // Base stats for all users
    stats.overview = {
      totalRevenue: 0,
      monthlyGrowth: 0,
      activeModules: userModules.length,
      lastLogin: req.user.lastLogin,
    }

    // Calculate total revenue from receipts
    const revenueData = await Receipt.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ])

    if (revenueData.length > 0) {
      stats.overview.totalRevenue = revenueData[0].total
      stats.overview.totalTransactions = revenueData[0].count
    }

    // Module-specific stats
    if (userModules.includes("IMS")) {
      const inventoryStats = await Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalItems: { $sum: "$quantity" },
            totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
            uniqueProducts: { $sum: 1 },
            lowStockItems: {
              $sum: {
                $cond: [{ $lte: ["$quantity", "$minStock"] }, 1, 0],
              },
            },
          },
        },
      ])

      stats.inventory = inventoryStats[0] || {
        totalItems: 0,
        totalValue: 0,
        uniqueProducts: 0,
        lowStockItems: 0,
      }
    }

    if (userModules.includes("ISA")) {
      // Mock agriculture stats - replace with real data
      stats.agriculture = {
        activeFields: 156,
        totalArea: 2450,
        avgYield: 94.2,
        activeCrops: 12,
      }
    }

    if (userModules.includes("Waste Management")) {
      // Mock waste management stats - replace with real data
      stats.waste = {
        processedToday: 2.3,
        monthlyRevenue: 89432,
        efficiency: 87.5,
        recyclingRate: 92.3,
      }
    }

    if (userModules.includes("Construction Sites")) {
      // Mock construction stats - replace with real data
      stats.construction = {
        activeSites: 23,
        totalEquipment: 145,
        avgProgress: 76.3,
        onTimeProjects: 89.2,
      }
    }

    // Admin-only stats
    if (req.user.role === "admin") {
      const userStats = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ])

      stats.users = {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        roleBreakdown: userStats,
      }
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    })
  }
})

// Get recent activity
router.get("/recent-activity", verifyToken, async (req, res) => {
  try {
    const activities = []

    // Recent receipts
    const recentReceipts = await Receipt.find().sort({ createdAt: -1 }).limit(5).populate("customer", "name")

    recentReceipts.forEach((receipt) => {
      activities.push({
        type: "sale",
        title: "New Sale",
        description: `Sale of $${receipt.total} to ${receipt.customer?.name || "Customer"}`,
        timestamp: receipt.createdAt,
        icon: "💰",
        color: "#10b981",
      })
    })

    // Recent purchase orders
    const recentPOs = await PurchaseOrder.find().sort({ createdAt: -1 }).limit(3)

    recentPOs.forEach((po) => {
      activities.push({
        type: "purchase",
        title: "Purchase Order",
        description: `PO #${po.orderNumber} - $${po.total}`,
        timestamp: po.createdAt,
        icon: "📦",
        color: "#3b82f6",
      })
    })

    // Recent low stock alerts
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantity", "$minStock"] },
    }).limit(3)

    lowStockItems.forEach((item) => {
      activities.push({
        type: "alert",
        title: "Low Stock Alert",
        description: `${item.name} is running low (${item.quantity} left)`,
        timestamp: new Date(),
        icon: "⚠️",
        color: "#f59e0b",
      })
    })

    // Sort activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json({
      success: true,
      data: activities.slice(0, 10), // Return top 10 activities
    })
  } catch (error) {
    console.error("Recent activity error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching recent activity",
      error: error.message,
    })
  }
})

// Get notifications
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    const notifications = []

    // Low stock notifications
    if (req.user.modules?.includes("IMS")) {
      const lowStockItems = await Inventory.find({
        $expr: { $lte: ["$quantity", "$minStock"] },
      }).limit(5)

      lowStockItems.forEach((item) => {
        notifications.push({
          id: `low-stock-${item._id}`,
          type: "warning",
          title: "Low Stock Alert",
          message: `${item.name} is running low (${item.quantity} remaining)`,
          timestamp: new Date(),
          read: false,
          action: {
            label: "Reorder",
            url: `/inventory/${item._id}`,
          },
        })
      })
    }

    // System notifications
    notifications.push({
      id: "welcome",
      type: "info",
      title: "Welcome to the System",
      message: "Your account has been successfully set up.",
      timestamp: req.user.createdAt,
      read: false,
    })

    // Module-specific notifications
    if (req.user.modules?.includes("ISA")) {
      notifications.push({
        id: "harvest-reminder",
        type: "info",
        title: "Harvest Season",
        message: "Corn fields are ready for harvest in the next 2 weeks.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: false,
      })
    }

    res.json({
      success: true,
      data: notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    })
  } catch (error) {
    console.error("Notifications error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    })
  }
})

module.exports = router
