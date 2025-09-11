// server/models/ConstructionSite.js
const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    targetDate: { type: Date, required: true }, // Renamed from dueDate for clarity
    actualCompletionDate: Date, // Renamed from completionDate
    status: {
        type: String,
        enum: ['Planned', 'In Progress', 'Completed', 'Delayed'], // Renamed 'Pending' to 'Planned'
        default: 'Planned'
    },
    description: String,
    criticalPath: { type: Boolean, default: false },
}, { _id: true }); // Ensure sub-documents get an _id

const BudgetLineItemSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Permits', 'Overhead', 'Other']
    },
    description: String,
    plannedAmount: { type: Number, required: true, min: 0 },
    actualAmount: { type: Number, default: 0, min: 0 },
    variance: { type: Number, default: 0 } // Calculated field
}, { _id: true });

const SiteMaterialInventoryItemSchema = new mongoose.Schema({
    materialName: { // Could link to a global inventory model if available
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
    minStockLevel: { // For reorder alerts
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
    assignedRole: { // Specific role for this assignment on this site
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
    clientName: { // New: Client details
        type: String,
        trim: true,
    },
    contractValue: { // New: Total contract value
        type: Number,
        min: 0,
        default: 0,
    },
    manager: { // Can be a User ID or just a name
        type: String,
        required: true,
        trim: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: { // Planned end date
        type: Date,
        required: true,
    },
    actualEndDate: { // Actual completion date
        type: Date,
    },
    phase: { // New: Project phase
        type: String,
        enum: ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closing'],
        default: 'Planning',
    },
    status: {
        type: String,
        enum: ['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled'],
        default: 'Planning',
    },
    progress: { // Overall project progress
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    riskLevel: { // New: Project risk level
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
    budget: { // Total allocated budget for the project
        type: Number,
        required: true,
        min: 0,
    },
    expenditure: { // Total actual expenditure
        type: Number,
        default: 0,
        min: 0,
    },
    budgetDetails: [BudgetLineItemSchema], // Detailed budget breakdown
    paymentRequests: [{ // References to PaymentRequest
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentRequest',
    }],
    // Resources summary (can be calculated or explicitly stored)
    workersCount: { // Total active workers assigned to tasks on this site
        type: Number,
        default: 0,
        min: 0,
    },
    equipmentCount: { // Total equipment assigned to this site
        type: Number,
        default: 0,
        min: 0,
    },
    // Management aspects
    milestones: [MilestoneSchema], // Embedded milestones
    tasks: [{ // References to Task model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    changeOrders: [{ // References to ChangeOrder model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChangeOrder',
    }],
    documents: [{ // References to Document (e.g., permits, drawings, contracts, photos)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
    siteMaterialInventory: [SiteMaterialInventoryItemSchema], // Embedded material inventory for this site
    materialRequests: [{ // References to MaterialRequest
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialRequest',
    }],
    assignedWorkers: [AssignedWorkerToSiteSchema], // Direct worker assignments to the site
    safetyIncidents: [{ // References to SafetyIncident
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

module.exports = mongoose.model('ConstructionSite', ConstructionSiteSchema);