const mongoose = require('mongoose');

const ConstructionSiteSchema = new mongoose.Schema({
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
    projectCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['Commercial', 'Residential', 'Industrial', 'Infrastructure', 'Other'],
        default: 'Commercial',
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    actualEndDate: {
        type: Date,
    },
    budget: {
        type: Number,
        required: true,
        min: 0,
    },
    expenditure: {
        type: Number,
        default: 0,
        min: 0,
    },
    manager: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled'],
        default: 'Planning',
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    workers: {
        type: Number,
        default: 0,
        min: 0,
    },
    equipmentCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    tasks: [{ // Reference to Task model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

ConstructionSiteSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ConstructionSite', ConstructionSiteSchema);