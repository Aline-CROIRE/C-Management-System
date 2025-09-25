// server/models/InternalUse.js
const mongoose = require("mongoose");

const internalUseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    itemName: { // NEW: Store item name for historical records even if item is deleted
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
    quantity: {
      type: Number,
      required: [true, 'Quantity is required.'],
      min: [1, 'Quantity must be at least 1.'],
    },
    unitPrice: { // NEW: Price of the item at the time of internal use
        type: Number,
        required: [true, 'Unit price at time of use is required.'],
        min: [0, 'Unit price cannot be negative.'],
    },
    totalValue: { // NEW: totalValue = quantity * unitPrice
        type: Number,
        required: [true, 'Total value of internal use is required.'],
        min: [0, 'Total value cannot be negative.'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for internal use is required.'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

internalUseSchema.index({ user: 1, date: -1 });
internalUseSchema.index({ user: 1, item: 1, date: -1 });

module.exports = mongoose.model("InternalUse", internalUseSchema);