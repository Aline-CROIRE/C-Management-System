const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const User = require("../models/User")
const Analytics = require("../models/Analytics")
const Activity = require("../models/Activity")

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/management-system")
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await Analytics.deleteMany({})
    await Activity.deleteMany({})
    console.log("🗑️  Cleared existing data")

    // Create Super Admin with password already set
    const superAdmin = new User({
      firstName: "System",
      lastName: "Administrator",
      email: "admin@managementsystem.com",
      password: "Admin123!",
      role: "Super Admin",
      modules: ["IMS", "ISA", "Waste Management", "Construction Sites"],
      company: "Management System Pro",
      phone: "+1234567890",
      isEmailVerified: true,
      isActive: true,
    })

    await superAdmin.save()
    console.log("👤 Created Super Admin: admin@managementsystem.com / Admin123!")

    // Create sample analytics data
    const modules = ["IMS", "ISA", "Waste Management", "Construction Sites"]
    const metricTypes = ["revenue", "items_count", "efficiency", "alerts"]

    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      for (const module of modules) {
        for (const metricType of metricTypes) {
          let value
          switch (metricType) {
            case "revenue":
              value = Math.floor(Math.random() * 5000) + 1000
              break
            case "items_count":
              value = Math.floor(Math.random() * 100) + 50
              break
            case "efficiency":
              value = Math.floor(Math.random() * 20) + 80
              break
            case "alerts":
              value = Math.floor(Math.random() * 5)
              break
          }

          await Analytics.create({
            userId: superAdmin._id,
            module,
            metricType,
            value,
            date,
          })
        }
      }
    }

    // Create sample activities
    const activities = [
      {
        userId: superAdmin._id,
        module: "System",
        action: "system_initialized",
        description: "Management system initialized successfully",
        priority: "high",
      },
      {
        userId: superAdmin._id,
        module: "IMS",
        action: "inventory_check",
        description: "Inventory levels checked and updated",
        priority: "medium",
      },
    ]

    for (const activity of activities) {
      await Activity.create(activity)
    }

    console.log("📊 Created sample analytics and activities")
    console.log("\n🎉 Database seeded successfully!")
    console.log("\n📋 Login Credentials:")
    console.log("Super Admin: admin@managementsystem.com / Admin123!")
    console.log("\nNote: Other users should be created through the registration flow.")

    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

seedDatabase()
