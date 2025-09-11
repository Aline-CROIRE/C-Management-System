// server/models/MaterialRequest.js
const mongoose = require('mongoose');

const MaterialRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    site: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConstructionSite',
        required: true,
    },
    materialName: { // Storing name directly for simplicity, or can reference Inventory Material
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        required: true,
        trim: true,
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker', // Or 'User'
        required: true,
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    requiredByDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Ordered', 'Partially Received', 'Received'],
        default: 'Pending',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('MaterialRequest', MaterialRequestSchema);