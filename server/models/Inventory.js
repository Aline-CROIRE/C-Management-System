const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
  category: { type: String, required: true, trim: true, index: true },
  description: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  unit: { type: String, required: true, trim: true, default: 'pcs' },
  price: { type: Number, required: true, min: 0 },
  totalValue: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 10, min: 0 },
  maxStockLevel: { type: Number, min: 0 },
  location: { type: String, required: true, trim: true, default: "Main Warehouse", index: true },
  supplier: { type: String, trim: true }, // Ideally, this would be an ObjectId ref to a Supplier model
  status: {
    type: String,
    // The enum now correctly includes 'on-order'
    enum: ["in-stock", "low-stock", "out-of-stock", "discontinued", "on-order"],
    default: "in-stock",
    index: true,
  },
  barcode: { type: String, trim: true },
  expiryDate: { type: Date },
  lastRestocked: { type: Date },
  tags: [{ type: String, trim: true }],
  imageUrl: { type: String }, // Simplified from images array for easier use with multer
}, { timestamps: true }); // Use timestamps option for createdAt and updatedAt

// Text index for powerful searches
inventorySchema.index({ name: "text", description: "text", sku: "text" });

/**
 * Mongoose Pre-Save Hook
 * This middleware runs automatically before any document is saved.
 * It ensures the `status` and `totalValue` are always correct and up-to-date.
 */
inventorySchema.pre("save", function (next) {
  // Only run this logic if quantity or price has been modified, or if it's a new document.
  if (this.isModified("quantity") || this.isModified("price") || this.isNew) {
    
    // 1. Always recalculate the totalValue.
    this.totalValue = (this.quantity || 0) * (this.price || 0);

    // 2. THIS IS THE CRITICAL FIX: Only update the status if it is NOT 'on-order'.
    // The 'on-order' status is special and is controlled exclusively by the Purchase Order system.
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