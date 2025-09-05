const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    user: { // For multi-tenancy
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Equipment name is required.'],
        trim: true,
        maxlength: [100, 'Equipment name cannot exceed 100 characters.'],
    },
    assetTag: { // Unique identifier for the equipment
        type: String,
        required: [true, 'Asset tag is required.'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [50, 'Asset tag cannot exceed 50 characters.'],
    },
    type: { // e.g., "Heavy Machinery", "Hand Tool", "Vehicle", "Safety Gear"
        type: String,
        enum: ['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other'],
        default: 'Heavy Machinery',
    },
    currentSite: { // The site where this equipment is currently assigned
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConstructionSite',
        // Not required, as equipment might be in storage or transit
    },
    status: { // e.g., "Operational", "In Maintenance", "Idle", "Broken", "In Transit"
        type: String,
        enum: ['Operational', 'In Maintenance', 'Idle', 'Broken', 'In Transit', 'Out of Service'],
        default: 'Operational',
        index: true,
    },
    condition: { // e.g., "Excellent", "Good", "Fair", "Poor"
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor'],
        default: 'Good',
    },
    lastMaintenance: {
        type: Date,
    },
    nextMaintenance: {
        type: Date,
    },
    purchaseDate: {
        type: Date,
    },
    purchaseCost: {
        type: Number,
        min: [0, 'Purchase cost cannot be negative.'],
    },
    currentValue: { // Depreciated value
        type: Number,
        min: [0, 'Current value cannot be negative.'],
    },
    notes: {
        type: String,
        trim: true,
    },
    // Future fields could include: maintenance_history: [], service_provider: []
}, { timestamps: true });

// Ensure assetTag is unique per user
equipmentSchema.index({ user: 1, assetTag: 1 }, { unique: true });

module.exports = mongoose.model('Equipment', equipmentSchema);