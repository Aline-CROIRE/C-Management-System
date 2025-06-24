const mongoose = require("mongoose")

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    module: {
      type: String,
      enum: ["IMS", "ISA", "Waste Management", "Construction Sites"],
      required: true,
    },
    metricType: {
      type: String,
      required: true, // e.g., 'revenue', 'items_count', 'efficiency', etc.
    },
    value: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Additional data specific to the metric
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
analyticsSchema.index({ userId: 1, module: 1, date: -1 })
analyticsSchema.index({ module: 1, metricType: 1, date: -1 })

module.exports = mongoose.model("Analytics", analyticsSchema)
