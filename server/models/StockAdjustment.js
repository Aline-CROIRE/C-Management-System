// server/models/StockAdjustment.js
const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema(
  {
    user: { // Ensure adjustments are associated with a user
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
          index: true,
        },
    item: { // The inventory item that was adjusted
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Inventory',
          required: true,
          index: true,
        },
    itemName: { // NEW: Store item name for historical records
          type: String,
          required: true,
        },
    itemSku: { // NEW: Store item SKU for historical records
          type: String,
          required: true,
        },
    unit: { // NEW: Store item unit for historical records
          type: String,
          required: true,
        },
    quantity: { // How many units were adjusted
          type: Number,
          required: [true, 'Quantity for adjustment is required.'],
          min: [1, 'Quantity must be at least 1.'],
        },
    unitCost: { // NEW: Cost of the item at the time of adjustment (for financial loss tracking)
          type: Number,
          required: [true, 'Unit cost at time of adjustment is required.'],
          min: [0, 'Unit cost cannot be negative.'],
        },
    totalCostImpact: { // NEW: totalCostImpact = quantity * unitCost
          type: Number,
          required: [true, 'Total cost impact of adjustment is required.'],
          min: [0, 'Total cost impact cannot be negative.'],
        },
    type: { // Type of adjustment (e.g., damaged, expired, lost)
          type: String,
          enum: ['damaged', 'expired', 'lost', 'shrinkage', 'other'],
          required: [true, 'Type of adjustment is required.'],
        },
    reason: { // Specific reason for the adjustment
          type: String,
          required: [true, 'Reason for adjustment is required.'],
          trim: true,
        },
    date: { // When the adjustment occurred
          type: Date,
          default: Date.now,
        },
    notes: { // Optional additional notes
          type: String,
          trim: true,
        },
      },
      {
        timestamps: true, // Adds createdAt and updatedAt fields
      }
    );

stockAdjustmentSchema.index({ user: 1, date: -1 });
stockAdjustmentSchema.index({ user: 1, item: 1, date: -1 });
stockAdjustmentSchema.index({ user: 1, type: 1, date: -1 });

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);