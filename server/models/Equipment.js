// server/models/Equipment.js
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
    serialNumber: {
        type: String,
        trim: true,
    },
    manufacturer: {
        type: String,
        trim: true,
    },
    model: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: ['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other'],
        default: 'Heavy Machinery',
    },
    currentSite: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConstructionSite',
        default: null, // Null if in storage/warehouse
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
        default: function() { return this.purchaseCost; },
    },
    warrantyExpiry: {
        type: Date,
    },
    lastMaintenance: {
        type: Date,
    },
    nextMaintenance: {
        type: Date,
    },
    hourlyRate: { // For billing or internal cost tracking per hour
        type: Number,
        min: 0,
        default: 0,
    },
    fuelType: {
        type: String,
        trim: true,
    },
    utilization: { // Percentage utilization
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    rentalInfo: { // Details if the equipment is rented
        isRented: { type: Boolean, default: false },
        rentalCompany: { type: String, trim: true },
        rentalCost: { type: Number, min: 0, default: 0 },
        returnDate: { type: Date },
    },
    notes: {
        type: String,
        trim: true,
    },
    maintenanceLogs: [{ // References to MaintenanceLog
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaintenanceLog',
    }],
    documents: [{ // References to Document (e.g., manuals, purchase receipts)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Equipment', EquipmentSchema);