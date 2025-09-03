const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
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
    contactPerson: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        // Make email unique per user, not globally
        // unique: true, // Removed global unique constraint
        sparse: true, // Allows multiple docs to have null email, or empty string
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
    notes: {
        type: String,
        trim: true,
    },
    // You might add a field like 'status: { type: String, enum: ['active', 'inactive'], default: 'active' }'
}, { timestamps: true });

// Compound index for uniqueness per user
supplierSchema.index({ user: 1, email: 1 }, { unique: true, sparse: true });
supplierSchema.index({ user: 1, phone: 1 }, { unique: true, sparse: true });
supplierSchema.index({ user: 1, name: 1 }, { unique: true }); // Name should be unique per user

module.exports = mongoose.model('Supplier', supplierSchema);