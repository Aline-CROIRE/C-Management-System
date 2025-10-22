const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  prepTimeMinutes: {
    type: Number,
    min: 0,
    default: 10,
  },
  allergens: [{
    type: String,
    trim: true,
  }],
}, { timestamps: true });

menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
