const mongoose = require('mongoose');

const constructionSiteSchema = new mongoose.Schema({
    user: { // For multi-tenancy
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Site name is required.'],
        trim: true,
        maxlength: [100, 'Site name cannot exceed 100 characters.'],
    },
    projectCode: { // Unique identifier for the project
        type: String,
        required: [true, 'Project code is required.'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'Project code cannot exceed 20 characters.'],
    },
    type: { // e.g., "Commercial", "Residential", "Industrial"
        type: String,
        enum: ['Commercial', 'Residential', 'Industrial', 'Infrastructure', 'Other'],
        default: 'Commercial',
    },
    location: { // Physical address or coordinates
        type: String,
        required: [true, 'Location is required.'],
        trim: true,
    },
    status: { // e.g., "Planning", "Active", "On-Hold", "Delayed", "Completed"
        type: String,
        enum: ['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled'],
        default: 'Planning',
        index: true,
    },
    progress: { // Percentage completion
        type: Number,
        default: 0,
        min: [0, 'Progress cannot be negative.'],
        max: [100, 'Progress cannot exceed 100%.'],
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required.'],
    },
    endDate: { // Expected completion date
        type: Date,
        required: [true, 'Expected end date is required.'],
    },
    actualEndDate: { // Actual completion date
        type: Date,
    },
    budget: { // Total allocated budget
        type: Number,
        required: [true, 'Budget is required.'],
        min: [0, 'Budget cannot be negative.'],
    },
    expenditure: { // Total spent so far
        type: Number,
        default: 0,
        min: [0, 'Expenditure cannot be negative.'],
    },
    manager: { // Who is managing this site (e.g., a User ID or string name)
        type: String, // For simplicity, a string name for now
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
    // Future fields could include: materials_needed: [], workers_assigned: [] etc.
}, { timestamps: true });

// Ensure projectCode is unique per user
constructionSiteSchema.index({ user: 1, projectCode: 1 }, { unique: true });

module.exports = mongoose.model('ConstructionSite', constructionSiteSchema);