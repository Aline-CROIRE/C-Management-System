const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
    },
    phone: {
        type: String,
        trim: true,
        sparse: true,
    },
    address: {
        type: String,
        trim: true,
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0,
    },
    currentBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastSaleDate: {
        type: Date,
    },
}, { timestamps: true });

customerSchema.index({ user: 1, email: 1 }, { unique: true, sparse: true });
customerSchema.index({ user: 1, phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);