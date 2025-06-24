const mongoose = require("mongoose")

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    module: {
      type: String,
      enum: ["IMS", "ISA", "Waste Management", "Construction Sites", "System"],
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g., 'created', 'updated', 'deleted', 'login', etc.
    },
    description: {
      type: String,
      required: true,
    },
    entityType: {
      type: String, // e.g., 'inventory_item', 'user', 'crop', etc.
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
activitySchema.index({ userId: 1, createdAt: -1 })
activitySchema.index({ module: 1, createdAt: -1 })

module.exports = mongoose.model("Activity", activitySchema)
