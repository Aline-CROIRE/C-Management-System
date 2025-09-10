// server/models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
        default: 'To Do',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    startDate: {
        type: Date,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    actualCompletionDate: {
        type: Date,
    },
    // --- UPDATED: assignedTo to be an array of Worker ObjectIds ---
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker', // Reference the new Worker model
    }],
    // --- END UPDATED ---
    parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
    },
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    notes: {
        type: String,
        trim: true,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

TaskSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Task', TaskSchema);