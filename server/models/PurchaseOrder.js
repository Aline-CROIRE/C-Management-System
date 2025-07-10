// models/PurchaseOrder.js

const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Defines the structure of a single item within a purchase order
const poItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
}, { _id: false }); // No separate _id for sub-documents

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: Number, unique: true }, // Auto-generated e.g., PO-1001
  supplier: { type: String, required: true, trim: true },
  items: [poItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Ordered', 'Partial', 'Received', 'Cancelled'],
    default: 'Pending',
  },
  orderDate: { type: Date, default: Date.now },
  expectedDate: { type: Date },
  receivedDate: { type: Date },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// This plugin automatically creates and increments the poNumber field
PurchaseOrderSchema.plugin(AutoIncrement, { inc_field: 'poNumber', start_seq: 1001 });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);