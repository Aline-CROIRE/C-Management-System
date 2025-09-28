// server/models/DailyStockSnapshot.js
const mongoose = require('mongoose');

const dailyStockSnapshotSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    openingQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    closingQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    // Optional: could add fields like `inflow`, `outflow`, `adjustments` for breakdown
}, { timestamps: true });

// Ensure unique snapshot per item per day
dailyStockSnapshotSchema.index({ user: 1, item: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyStockSnapshot', dailyStockSnapshotSchema);