const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    assetTag: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other'],
        required: true,
    },
    currentSite: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConstructionSite',
        default: null, // Can be unassigned
    },
    status: {
        type: String,
        enum: ['Operational', 'In Maintenance', 'Idle', 'Broken', 'In Transit', 'Out of Service'],
        default: 'Operational',
    },
    condition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor'],
        default: 'Good',
    },
    purchaseDate: {
        type: Date,
        required: true,
    },
    purchaseCost: {
        type: Number,
        required: true,
        min: 0,
    },
    currentValue: { // Depreciated value
        type: Number,
        min: 0,
    },
    lastMaintenance: {
        type: Date,
    },
    nextMaintenance: {
        type: Date,
    },
    utilization: { // Percentage
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    notes: {
        type: String,
        trim: true,
    },
    // Future fields:
    // assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    // scheduledAvailability: [{ startDate: Date, endDate: Date, site: ObjectId }],
    // fuelConsumptionLogs: [{ date: Date, quantity: Number }],
    // gpsCoordinates: { lat: Number, lng: Number, timestamp: Date },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

EquipmentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Equipment', EquipmentSchema);