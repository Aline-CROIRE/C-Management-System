// server/models/ConstructionSite.js
const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    targetDate: { type: Date, required: true },
    actualCompletionDate: Date,
    status: {
        type: String,
        enum: ['Planned', 'In Progress', 'Completed', 'Delayed'],
        default: 'Planned'
    },
    description: String,
    criticalPath: { type: Boolean, default: false },
}, { _id: true });

const BudgetLineItemSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Permits', 'Overhead', 'Other']
    },
    description: String,
    plannedAmount: { type: Number, required: true, min: 0 },
    actualAmount: { type: Number, default: 0, min: 0 },
    variance: { type: Number, default: 0 }
}, { _id: true });

const SiteMaterialInventoryItemSchema = new mongoose.Schema({
    materialName: {
        type: String,
        required: true,
        trim: true,
    },
    quantityOnHand: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    unit: {
        type: String,
        required: true,
        trim: true,
    },
    minStockLevel: {
        type: Number,
        min: 0,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });

const AssignedWorkerToSiteSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true,
    },
    assignedRole: {
        type: String,
        trim: true,
    },
    assignmentStartDate: {
        type: Date,
        default: Date.now,
    },
    assignmentEndDate: {
        type: Date,
    },
}, { _id: true });


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
    clientName: {
        type: String,
        trim: true,
    },
    contractValue: {
        type: Number,
        min: 0,
        default: 0,
    },
    manager: {
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
    phase: {
        type: String,
        enum: ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closing'],
        default: 'Planning',
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
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low',
    },
    description: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    // Financials
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
    budgetDetails: [BudgetLineItemSchema],
    paymentRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentRequest',
    }],
    // Resources summary (can be calculated or explicitly stored)
    workersCount: { // Total active workers assigned to tasks on this site, or linked via currentSite
        type: Number,
        default: 0,
        min: 0,
    },
    equipmentCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Management aspects
    milestones: [MilestoneSchema],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    changeOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChangeOrder',
    }],
    documents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
    siteMaterialInventory: [SiteMaterialInventoryItemSchema],
    materialRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialRequest',
    }],
    assignedWorkers: [AssignedWorkerToSiteSchema], // Direct worker assignments to the site for more granular control
    safetyIncidents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SafetyIncident',
    }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for remaining budget
ConstructionSiteSchema.virtual('remainingBudget').get(function() {
    return this.budget - this.expenditure;
});

// Virtual for progress status (updated for clarity)
ConstructionSiteSchema.virtual('progressStatus').get(function() {
    if (this.progress === 100) return 'Completed';
    if (this.progress >= 75) return 'Near Completion';
    if (this.progress >= 25) return 'In Progress';
    return 'Early Stages';
});

// Pre-save hook to calculate variance for budget line items
ConstructionSiteSchema.pre('save', function(next) {
    if (this.isModified('budgetDetails')) {
        this.budgetDetails.forEach(item => {
            item.variance = item.plannedAmount - (item.actualAmount || 0);
        });
    }
    // Set actualEndDate if status becomes Completed and it's not already set
    if (this.isModified('status') && this.status === 'Completed' && !this.actualEndDate) {
        this.actualEndDate = new Date();
    } else if (this.isModified('status') && this.status !== 'Completed' && this.actualEndDate) {
        // If status changes from completed, clear actualEndDate
        this.actualEndDate = null;
    }
    next();
});

module.exports = mongoose.models.ConstructionSite || mongoose.model('ConstructionSite', ConstructionSiteSchema);