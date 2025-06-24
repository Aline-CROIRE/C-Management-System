const express = require("express")
const { auth } = require("../middleware/auth")
const User = require("../models/User")
const Analytics = require("../models/Analytics")
const Activity = require("../models/Activity")

const router = express.Router()

// Get dashboard statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const user = req.user
    const userModules =
      user.role === "Super Admin" ? ["IMS", "ISA", "Waste Management", "Construction Sites"] : user.modules

    // Get analytics for user's modules
    const analytics = await Analytics.find({
      module: { $in: userModules },
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    }).sort({ date: -1 })

    // Calculate module-specific stats
    const moduleStats = {}
    userModules.forEach((module) => {
      const moduleAnalytics = analytics.filter((a) => a.module === module)
      moduleStats[module] = {
        totalItems: moduleAnalytics.filter((a) => a.metricType === "items_count").reduce((sum, a) => sum + a.value, 0),
        revenue: moduleAnalytics.filter((a) => a.metricType === "revenue").reduce((sum, a) => sum + a.value, 0),
        efficiency:
          moduleAnalytics.filter((a) => a.metricType === "efficiency").length > 0
            ? moduleAnalytics.filter((a) => a.metricType === "efficiency").slice(-1)[0].value
            : 0,
        alerts: moduleAnalytics.filter((a) => a.metricType === "alerts").reduce((sum, a) => sum + a.value, 0),
      }
    })

    // Get chart data for last 6 months
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthAnalytics = await Analytics.find({
        module: { $in: userModules },
        date: { $gte: monthStart, $lte: monthEnd },
      })

      const monthRevenue = monthAnalytics.filter((a) => a.metricType === "revenue").reduce((sum, a) => sum + a.value, 0)
      const monthEfficiency =
        monthAnalytics.filter((a) => a.metricType === "efficiency").length > 0
          ? monthAnalytics.filter((a) => a.metricType === "efficiency").slice(-1)[0]?.value || 0
          : 0

      chartData.push({
        name: date.toLocaleDateString("en-US", { month: "short" }),
        revenue: monthRevenue,
        efficiency: monthEfficiency,
      })
    }

    res.json({
      moduleStats,
      chartData,
      totalRevenue: Object.values(moduleStats).reduce((sum, module) => sum + module.revenue, 0),
      totalItems: Object.values(moduleStats).reduce((sum, module) => sum + module.totalItems, 0),
      averageEfficiency:
        Object.values(moduleStats).reduce((sum, module) => sum + module.efficiency, 0) / userModules.length,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({ message: "Failed to fetch dashboard statistics" })
  }
})

// Get recent activities
router.get("/activities", auth, async (req, res) => {
  try {
    const user = req.user
    const userModules =
      user.role === "Super Admin" ? ["IMS", "ISA", "Waste Management", "Construction Sites", "System"] : user.modules

    const activities = await Activity.find({
      module: { $in: userModules },
    })
      .populate("userId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(20)

    res.json(activities)
  } catch (error) {
    console.error("Activities fetch error:", error)
    res.status(500).json({ message: "Failed to fetch activities" })
  }
})

// Mark activity as read
router.patch("/activities/:id/read", auth, async (req, res) => {
  try {
    await Activity.findByIdAndUpdate(req.params.id, { isRead: true })
    res.json({ message: "Activity marked as read" })
  } catch (error) {
    res.status(500).json({ message: "Failed to update activity" })
  }
})

// Get user management data (Admin/Super Admin only)
router.get("/users", auth, async (req, res) => {
  try {
    const user = req.user

    if (!["Super Admin", "Admin"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" })
    }

    let query = {}
    if (user.role === "Admin") {
      // Admins can only see users they created or users with lower roles
      query = {
        $or: [{ createdBy: user._id }, { role: { $in: ["Manager", "User"] } }],
      }
    }

    const users = await User.find(query)
      .select("-password")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })

    res.json(users)
  } catch (error) {
    console.error("Users fetch error:", error)
    res.status(500).json({ message: "Failed to fetch users" })
  }
})

module.exports = router
