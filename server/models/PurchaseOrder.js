const mongoose = require("mongoose")

const purchaseOrderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sku: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
})

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  supplier: {
    type: String,
    required: true,
    trim: true,
  },
  supplierEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  supplierPhone: {
    type: String,
    trim: true,
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expectedDate: {
    type: Date,
  },
  receivedDate: {
    type: Date,
  },
  items: [purchaseOrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "sent", "confirmed", "partially-received", "received", "cancelled"],
    default: "pending",
  },
  notes: {
    type: String,
    trim: true,
  },
  attachments: [
    {
      filename: String,
      url: String,
      uploadDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes
purchaseOrderSchema.index({ poNumber: 1 })
purchaseOrderSchema.index({ supplier: 1 })
purchaseOrderSchema.index({ status: 1 })
purchaseOrderSchema.index({ orderDate: -1 })

// Pre-save middleware
purchaseOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema)
