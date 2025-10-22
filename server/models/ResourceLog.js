const mongoose = require('mongoose');

const resourceLogSchema = new mongoose.Schema({
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
    enum: ['electricity', 'water', 'gas'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    enum: ['kWh', 'm3', 'gallons'],
    required: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'reading'],
    default: 'daily',
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

resourceLogSchema.index({ restaurantId: 1, date: -1 });
resourceLogSchema.index({ restaurantId: 1, type: 1, period: 1 });

module.exports = mongoose.model('ResourceLog', resourceLogSchema);