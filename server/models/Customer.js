const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    user: { // <-- IMPORTANT: Add user reference
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
        // Make email unique per user, not globally
        // unique: true, // Removed global unique constraint
        sparse: true,
    },
    phone: {
        type: String,
        trim: true,
        // Make phone unique per user, not globally
        // unique: true, // Removed global unique constraint
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
    lastSaleDate: {
        type: Date,
    },
    // You might add 'status: { type: String, enum: ['active', 'inactive'], default: 'active' }'
}, { timestamps: true });

// Compound index for uniqueness per user
customerSchema.index({ user: 1, email: 1 }, { unique: true, sparse: true });
customerSchema.index({ user: 1, phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ user: 1, name: 1 }, { unique: true }); // Name should be unique per user

module.exports = mongoose.model('Customer', customerSchema);