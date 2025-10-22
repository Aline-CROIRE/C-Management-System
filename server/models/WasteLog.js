const mongoose = require('mongoose');

const wasteLogSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: [
      'food_pre_consumer',
      'food_post_consumer',
      'packaging_plastic',
      'packaging_paper',
      'packaging_glass',
      'packaging_metal',
      'cooking_oil',
      'general_waste',
      'other'
    ],
    required: true,
  },
  category: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    enum: ['kg', 'liters', 'units', 'grams'],
    default: 'kg',
  },
  disposalMethod: {
    type: String,
    enum: ['compost', 'recycling', 'landfill', 'animal_feed', 'donation', 'recycled_oil'],
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

wasteLogSchema.index({ restaurantId: 1, date: -1 });
wasteLogSchema.index({ restaurantId: 1, type: 1, disposalMethod: 1 });

module.exports = mongoose.model('WasteLog', wasteLogSchema);