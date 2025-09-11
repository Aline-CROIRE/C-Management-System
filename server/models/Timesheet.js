// server/models/Timesheet.js
const mongoose = require('mongoose');

const TimesheetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true,
    },
    site: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConstructionSite',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    hoursWorked: {
        type: Number,
        required: true,
        min: 0,
    },
    overtimeHours: {
        type: Number,
        min: 0,
        default: 0,
    },
    task: { // Optional: Link hours to a specific task
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    notes: {
        type: String,
        trim: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Timesheet', TimesheetSchema);