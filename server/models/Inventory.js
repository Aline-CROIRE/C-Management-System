const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  user: { // <-- IMPORTANT: Add user reference
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for faster user-specific queries
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
}, { timestamps: true });

// Compound index for SKU uniqueness per user
inventorySchema.index({ sku: 1, user: 1 }, { unique: true }); // Ensure SKU is unique only for a given user

inventorySchema.index({ name: "text", description: "text", sku: "text" });

inventorySchema.pre("save", function (next) {
  // Only calculate totalValue and status if relevant fields are modified or it's a new document
  if (this.isModified("quantity") || this.isModified("price") || this.isModified("minStockLevel") || this.isNew) {
    this.totalValue = (this.quantity || 0) * (this.price || 0);

    // Only update status if it's not explicitly 'on-order' (which is set by POs)
    // or if the quantity/minStockLevel changes force a new status.
    if (this.status !== "on-order") { // Don't override 'on-order' status via quantity/price changes
      if (this.quantity <= 0) {
        this.status = "out-of-stock";
      } else if (this.quantity <= this.minStockLevel) {
        this.status = "low-stock";
      } else {
        this.status = "in-stock";
      }
    } else {
      // If status is 'on-order', but quantity is received, it should eventually be set to 'in-stock'
      // This logic is better handled in the PO completion route directly.
      // However, if quantity becomes <= 0 while 'on-order', it implies an error or specific flow.
      // For safety, let's keep it simple: 'on-order' status is usually explicitly changed.
      if (this.quantity > 0 && this.status === 'on-order') {
        // If items are received, quantity updates. The PO route should then change status.
        // If a quantity change pushes it past minStockLevel, it becomes 'in-stock'.
        // If you receive items and it's still below minStockLevel, it stays 'low-stock'
        // This is complex pre-save. Best handled in API routes.
      }
    }
  }
  next();
});

module.exports = mongoose.model("Inventory", inventorySchema);