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
    assignedTo: [{ // Array of Worker ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
    }],
    parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
    },
    dependencies: [{ // More complex dependencies: taskId, type (FS, SS, FF), lag (days)
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
        type: { type: String, enum: ['FS', 'SS', 'FF'], default: 'FS' }, // Finish-to-Start, Start-to-Start, Finish-to-Finish
        lag: { type: Number, default: 0 }, // Lag in days
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
    },
    // Resource Allocation
    allocatedWorkers: [{
        worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
        estimatedHours: { type: Number, min: 0, default: 0 },
        actualHours: { type: Number, min: 0, default: 0 }, // Updated from Timesheets
    }],
    allocatedEquipment: [{
        equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
        estimatedHours: { type: Number, min: 0, default: 0 }, // Or usage units
        actualHours: { type: Number, min: 0, default: 0 },
    }],
    requiredMaterials: [{
        materialName: { type: String, required: true }, // For simplicity, just name and quantity. Could reference a full Inventory Material
        quantity: { type: Number, min: 0, required: true },
        unit: { type: String, trim: true },
        actualConsumption: { type: Number, min: 0, default: 0 },
    }],
    // Costing
    estimatedLaborCost: { type: Number, min: 0, default: 0 },
    estimatedMaterialCost: { type: Number, min: 0, default: 0 },
    estimatedEquipmentCost: { type: Number, min: 0, default: 0 },
    actualLaborCost: { type: Number, min: 0, default: 0 },
    actualMaterialCost: { type: Number, min: 0, default: 0 },
    actualEquipmentCost: { type: Number, min: 0, default: 0 },
    documents: [{ // Task-specific documents
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
}, {
    timestamps: true,
});

// Update actual completion date logic
TaskSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'Completed' && !this.actualCompletionDate) {
            this.actualCompletionDate = new Date();
        } else if (this.status !== 'Completed' && this.actualCompletionDate) {
            this.actualCompletionDate = null;
        }
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Task', TaskSchema);