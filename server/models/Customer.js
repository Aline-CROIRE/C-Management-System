const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    totalSpent: { type: Number, default: 0 },
    lastSaleDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);