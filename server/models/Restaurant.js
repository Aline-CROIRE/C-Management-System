const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  logoUrl: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  qrCodeSecret: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  circularEconomyGoals: {
    wasteReductionTarget: { type: Number, default: 0, min: 0, max: 100 },
    energyReductionTarget: { type: Number, default: 0, min: 0, max: 100 },
    waterReductionTarget: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: Date,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

restaurantSchema.pre('validate', function(next) {
  if (this.isNew && !this.qrCodeSecret) {
    this.qrCodeSecret = mongoose.Types.ObjectId().toString();
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);