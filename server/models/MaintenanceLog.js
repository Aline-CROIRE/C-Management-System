// server/models/MaintenanceLog.js
const mongoose = require('mongoose');

const MaintenanceLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    cost: {
        type: Number,
        min: 0,
        default: 0,
    },
    partsUsed: [{ // Simple embedded structure for parts used
        materialName: String, // Can link to an Inventory Material later
        quantity: Number,
        unit: String,
    }],
    performedBy: {
        type: String, // Can be a Worker ID or external company name
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    documents: [{ // Associated documents like invoices, service reports
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('MaintenanceLog', MaintenanceLogSchema);