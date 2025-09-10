const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dueDate: { type: Date, required: true },
  completionDate: Date,
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Delayed'],
    default: 'Pending'
  },
  description: String,
  criticalPath: { type: Boolean, default: false }
});

const BudgetLineItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Permits', 'Other']
  },
  description: String,
  plannedAmount: { type: Number, required: true },
  actualAmount: { type: Number, default: 0 },
  variance: { type: Number, default: 0 }
});

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
    milestones: [MilestoneSchema],
    
    budgetDetails: [BudgetLineItemSchema],
    
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },

    changeOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChangeOrder'
    }],

    documents: [{
        name: String,
        type: String,
        url: String,
        uploadDate: Date
    }],

    materialInventory: [{
        material: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material'
        },
        quantity: Number,
        unit: String,
        lastUpdated: Date
    }],

    assignedWorkers: [{
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Worker'
        },
        role: String,
        startDate: Date,
        endDate: Date
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for remaining budget
ConstructionSiteSchema.virtual('remainingBudget').get(function() {
  return this.budget - this.expenditure;
});

// Virtual for progress status
ConstructionSiteSchema.virtual('progressStatus').get(function() {
  if (this.progress >= 90) return 'Near Completion';
  if (this.progress >= 50) return 'On Track';
  return 'Early Stages';
});

module.exports = mongoose.model('ConstructionSite', ConstructionSiteSchema);