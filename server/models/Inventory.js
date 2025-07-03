const mongoose = require("mongoose")

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalValue: {
    type: Number,
    default: 0,
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0,
  },
  maxStockLevel: {
    type: Number,
    min: 0,
  },
  location: {
    type: String,
    required: true,
    trim: true,
    default: "Main Warehouse",
  },
  supplier: {
    type: String,
    trim: true,
  },
  supplierContact: {
    email: String,
    phone: String,
  },
  status: {
    type: String,
    enum: ["in-stock", "low-stock", "out-of-stock", "discontinued"],
    default: "in-stock",
  },
  barcode: {
    type: String,
    trim: true,
  },
  expiryDate: {
    type: Date,
  },
  lastRestocked: {
    type: Date,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  images: [
    {
      url: String,
      alt: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes for better query performance
inventorySchema.index({ sku: 1 })
inventorySchema.index({ category: 1 })
inventorySchema.index({ status: 1 })
inventorySchema.index({ location: 1 })
inventorySchema.index({ name: "text", description: "text" })

// Pre-save middleware to calculate total value
inventorySchema.pre("save", function (next) {
  this.totalValue = this.quantity * this.price
  this.updatedAt = new Date()

  // Update status based on quantity
  if (this.quantity === 0) {
    this.status = "out-of-stock"
  } else if (this.quantity <= this.minStockLevel) {
    this.status = "low-stock"
  } else {
    this.status = "in-stock"
  }

  next()
})

module.exports = mongoose.model("Inventory", inventorySchema)
