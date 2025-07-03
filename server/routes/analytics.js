const express = require("express")
const { verifyToken, checkModuleAccess } = require("../middleware/auth")
const Inventory = require("../models/Inventory")
const PurchaseOrder = require("../models/PurchaseOrder")
const Receipt = require("../models/Receipt")
const User = require("../models/User")
const router = express.Router()

// Get dashboard analytics
router.get("/dashboard", verifyToken, checkModuleAccess("Analytics"), async (req, res) => {
  try {
    const { startDate, endDate, modules } = req.query
    const userModules = req.user.modules

    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    const analytics = {}

    // Revenue analytics
    const revenueData = await Receipt.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalRevenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    analytics.revenue = {
      total: revenueData.reduce((sum, item) => sum + item.totalRevenue, 0),
      trend: revenueData.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`,
        revenue: item.totalRevenue,
        transactions: item.count,
      })),
    }

    // Inventory analytics (if user has IMS access)
    if (userModules.includes("IMS")) {
      const inventoryStats = await Inventory.aggregate([
        {
          $group: {
            _id: "$category",
            totalItems: { $sum: "$quantity" },
            totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
            lowStockItems: {
              $sum: {
                $cond: [{ $lte: ["$quantity", "$minStock"] }, 1, 0],
              },
            },
          },
        },
      ])

      const totalInventoryValue = await Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
            totalItems: { $sum: "$quantity" },
            uniqueProducts: { $sum: 1 },
          },
        },
      ])

      analytics.inventory = {
        totalValue: totalInventoryValue[0]?.totalValue || 0,
        totalItems: totalInventoryValue[0]?.totalItems || 0,
        uniqueProducts: totalInventoryValue[0]?.uniqueProducts || 0,
        categoryBreakdown: inventoryStats,
        lowStockCount: inventoryStats.reduce((sum, cat) => sum + cat.lowStockItems, 0),
      }
    }

    // Purchase order analytics
    if (userModules.includes("IMS")) {
      const purchaseOrderStats = await PurchaseOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$total" },
          },
        },
      ])

      analytics.purchaseOrders = {
        total: purchaseOrderStats.reduce((sum, item) => sum + item.count, 0),
        totalValue: purchaseOrderStats.reduce((sum, item) => sum + item.totalValue, 0),
        statusBreakdown: purchaseOrderStats,
      }
    }

    // User activity analytics (admin only)
    if (req.user.role === "admin") {
      const userStats = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: ["$isActive", 1, 0],
              },
            },
          },
        },
      ])

      const recentLogins = await User.find({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }).countDocuments()

      analytics.users = {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        recentLogins,
        roleBreakdown: userStats,
      }
    }

    // Module performance metrics
    const moduleMetrics = {}

    if (userModules.includes("IMS")) {
      const inventoryTurnover = await calculateInventoryTurnover(start, end)
      moduleMetrics.IMS = {
        performance: inventoryTurnover,
        efficiency: Math.min(100, inventoryTurnover * 20), // Convert to percentage
        status: "active",
      }
    }

    if (userModules.includes("ISA")) {
      // Mock agriculture data - replace with real calculations
      moduleMetrics.ISA = {
        performance: 92,
        efficiency: 88,
        status: "active",
      }
    }

    if (userModules.includes("Waste Management")) {
      // Mock waste management data - replace with real calculations
      moduleMetrics["Waste Management"] = {
        performance: 78,
        efficiency: 85,
        status: "active",
      }
    }

    if (userModules.includes("Construction Sites")) {
      // Mock construction data - replace with real calculations
      moduleMetrics["Construction Sites"] = {
        performance: 88,
        efficiency: 82,
        status: "active",
      }
    }

    analytics.modules = moduleMetrics

    res.json({
      success: true,
      data: analytics,
      dateRange: { start, end },
      modules: userModules,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: error.message,
    })
  }
})

// Get specific module analytics
router.get("/module/:moduleName", verifyToken, async (req, res) => {
  try {
    const { moduleName } = req.params
    const { startDate, endDate } = req.query

    // Check if user has access to this module
    if (!req.user.hasModuleAccess(moduleName) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: `Access denied to ${moduleName} module`,
      })
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    let moduleData = {}

    switch (moduleName) {
      case "IMS":
        moduleData = await getInventoryAnalytics(start, end)
        break
      case "ISA":
        moduleData = await getAgricultureAnalytics(start, end)
        break
      case "Waste Management":
        moduleData = await getWasteManagementAnalytics(start, end)
        break
      case "Construction Sites":
        moduleData = await getConstructionAnalytics(start, end)
        break
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid module name",
        })
    }

    res.json({
      success: true,
      module: moduleName,
      data: moduleData,
      dateRange: { start, end },
    })
  } catch (error) {
    console.error("Module analytics error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching module analytics",
      error: error.message,
    })
  }
})

// Generate and export reports
router.post("/reports/generate", verifyToken, checkModuleAccess("Analytics"), async (req, res) => {
  try {
    const { reportType, modules, dateRange, format = "json" } = req.body

    // Validate user has access to requested modules
    const userModules = req.user.modules
    const requestedModules = modules.filter((module) => userModules.includes(module))

    if (requestedModules.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No access to requested modules",
      })
    }

    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)

    const reportData = {
      reportType,
      generatedAt: new Date(),
      dateRange: { start, end },
      modules: requestedModules,
      data: {},
    }

    // Generate data for each requested module
    for (const module of requestedModules) {
      switch (module) {
        case "IMS":
          reportData.data.inventory = await getInventoryAnalytics(start, end)
          break
        case "ISA":
          reportData.data.agriculture = await getAgricultureAnalytics(start, end)
          break
        case "Waste Management":
          reportData.data.waste = await getWasteManagementAnalytics(start, end)
          break
        case "Construction Sites":
          reportData.data.construction = await getConstructionAnalytics(start, end)
          break
      }
    }

    // Add summary metrics
    reportData.summary = generateReportSummary(reportData.data)

    res.json({
      success: true,
      report: reportData,
      downloadUrl: `/api/analytics/reports/download/${Date.now()}`, // Mock download URL
    })
  } catch (error) {
    console.error("Report generation error:", error)
    res.status(500).json({
      success: false,
      message: "Error generating report",
      error: error.message,
    })
  }
})

// Helper functions
async function calculateInventoryTurnover(start, end) {
  try {
    const sales = await Receipt.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
        },
      },
    ])

    const avgInventory = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          avgValue: { $avg: { $multiply: ["$quantity", "$price"] } },
        },
      },
    ])

    const totalSales = sales[0]?.totalSales || 0
    const avgInventoryValue = avgInventory[0]?.avgValue || 1

    return totalSales / avgInventoryValue
  } catch (error) {
    console.error("Inventory turnover calculation error:", error)
    return 0
  }
}

async function getInventoryAnalytics(start, end) {
  // Detailed inventory analytics
  const analytics = {
    overview: await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
          uniqueProducts: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
    ]),
    categoryBreakdown: await Inventory.aggregate([
      {
        $group: {
          _id: "$category",
          items: { $sum: "$quantity" },
          value: { $sum: { $multiply: ["$quantity", "$price"] } },
          products: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
    ]),
    lowStockItems: await Inventory.find({
      $expr: { $lte: ["$quantity", "$minStock"] },
    }).select("name quantity minStock category"),
    recentTransactions: await Receipt.find({
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customer", "name email"),
  }

  return analytics
}

async function getAgricultureAnalytics(start, end) {
  // Mock agriculture analytics - replace with real data
  return {
    overview: {
      totalFields: 156,
      activeFields: 142,
      totalArea: "2,450 hectares",
      avgYield: "94.2%",
    },
    cropBreakdown: [
      { crop: "Wheat", area: 850, yield: 95.2, status: "Growing" },
      { crop: "Corn", area: 650, yield: 92.8, status: "Harvesting" },
      { crop: "Soybeans", area: 450, yield: 96.1, status: "Planted" },
      { crop: "Rice", area: 500, yield: 93.5, status: "Growing" },
    ],
    soilHealth: {
      excellent: 45,
      good: 38,
      fair: 15,
      poor: 2,
    },
    irrigation: {
      automated: 78,
      manual: 22,
      efficiency: 87.5,
    },
  }
}

async function getWasteManagementAnalytics(start, end) {
  // Mock waste management analytics - replace with real data
  return {
    overview: {
      totalProcessed: "45.2 tons",
      revenue: "$89,432",
      efficiency: "87.5%",
      recyclingRate: "92.3%",
    },
    wasteTypes: [
      { type: "Organic", amount: 18.5, revenue: 35420 },
      { type: "Plastic", amount: 12.3, revenue: 28950 },
      { type: "Metal", amount: 8.7, revenue: 15680 },
      { type: "Paper", amount: 5.7, revenue: 9382 },
    ],
    partners: [
      { name: "EcoRecycle Corp", volume: 15.2, revenue: 28500 },
      { name: "Green Solutions", volume: 12.8, revenue: 24200 },
      { name: "Waste Pro", volume: 10.5, revenue: 19800 },
    ],
  }
}

async function getConstructionAnalytics(start, end) {
  // Mock construction analytics - replace with real data
  return {
    overview: {
      activeSites: 23,
      totalEquipment: 145,
      avgProgress: "76.3%",
      onTimeProjects: "89.2%",
    },
    siteBreakdown: [
      { site: "Downtown Plaza", progress: 85, budget: 2500000, status: "On Track" },
      { site: "Residential Complex A", progress: 67, budget: 1800000, status: "Delayed" },
      { site: "Industrial Park", progress: 92, budget: 3200000, status: "Ahead" },
      { site: "Shopping Center", progress: 54, budget: 2100000, status: "On Track" },
    ],
    equipment: {
      operational: 132,
      maintenance: 8,
      repair: 5,
      utilization: 91.2,
    },
    costs: {
      materials: 1250000,
      labor: 890000,
      equipment: 450000,
      overhead: 320000,
    },
  }
}

function generateReportSummary(data) {
  const summary = {
    totalModules: Object.keys(data).length,
    keyMetrics: {},
    recommendations: [],
  }

  // Generate key metrics based on available data
  if (data.inventory) {
    summary.keyMetrics.inventoryValue = data.inventory.overview[0]?.totalValue || 0
    summary.keyMetrics.lowStockItems = data.inventory.lowStockItems?.length || 0
  }

  if (data.agriculture) {
    summary.keyMetrics.avgYield = data.agriculture.overview.avgYield
    summary.keyMetrics.activeFields = data.agriculture.overview.activeFields
  }

  if (data.waste) {
    summary.keyMetrics.wasteRevenue = data.waste.overview.revenue
    summary.keyMetrics.recyclingRate = data.waste.overview.recyclingRate
  }

  if (data.construction) {
    summary.keyMetrics.avgProgress = data.construction.overview.avgProgress
    summary.keyMetrics.onTimeProjects = data.construction.overview.onTimeProjects
  }

  // Generate recommendations
  if (data.inventory?.lowStockItems?.length > 0) {
    summary.recommendations.push("Consider restocking low inventory items to avoid stockouts")
  }

  if (data.agriculture?.soilHealth?.poor > 5) {
    summary.recommendations.push("Implement soil improvement programs for fields with poor health")
  }

  return summary
}

module.exports = router
