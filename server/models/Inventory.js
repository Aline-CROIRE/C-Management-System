// server/models/Inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
  description: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  unit: { type: String, required: true, trim: true, default: 'pcs' },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, default: 0 },
  totalValue: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 10, min: 0 },
  maxStockLevel: { type: Number, min: 0 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
    index: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
  },
  status: {
    type: String,
    enum: ["in-stock", "low-stock", "out-of-stock", "discontinued", "on-order"],
    default: "in-stock",
    index: true,
  },
  barcode: { type: String, trim: true },
  expiryDate: { type: Date },
  lastRestocked: { type: Date },
  tags: [{ type: String, trim: true }],
  imageUrl: { type: String },
  packagingType: { 
    type: String,
    enum: ['None', 'Reusable', 'Recyclable', 'Compostable', 'Other'], 
    default: 'None'
  },
  packagingDeposit: { type: Number, default: 0, min: 0 }, 
  isReusablePackaging: { // NEW: Flag to identify if this inventory item IS a reusable packaging unit (e.g., "Glass Milk Bottle (empty)")
    type: Boolean,
    default: false,
  },
  linkedReusablePackagingItem: { // NEW: For a *product* (e.g., "Milk in Glass Bottle"), links to its actual reusable packaging item
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    default: null,
  },
}, { timestamps: true });

inventorySchema.index({ sku: 1, user: 1 }, { unique: true });
inventorySchema.index({ name: "text", description: "text", sku: "text" });

inventorySchema.pre("save", function (next) {
  if (this.isModified("quantity") || this.isModified("price") || this.isModified("minStockLevel") || this.isNew) {
    this.totalValue = (this.quantity || 0) * (this.price || 0);

    if (this.status !== "on-order") {
      if (this.quantity <= 0) {
        this.status = "out-of-stock";
      } else if (this.quantity <= this.minStockLevel) {
        this.status = "low-stock";
      } else {
        this.status = "in-stock";
      }
    }
  }
  next();
});

module.exports = mongoose.model("Inventory", inventorySchema);