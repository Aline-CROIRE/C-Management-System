// server/models/ChangeOrder.js
const mongoose = require('mongoose');

const ChangeOrderSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    requestedBy: {
        type: String, // Could be a Worker or User ID, or just a name
        required: true,
        trim: true,
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    costImpact: { // Positive for increase, negative for decrease
        type: Number,
        default: 0,
    },
    timelineImpactDays: { // Positive for delay, negative for acceleration
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Implemented'],
        default: 'Pending',
    },
    approvalDate: {
        type: Date,
    },
    approvedBy: { // User who approved it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reason: {
        type: String,
        trim: true,
    },
    comments: [{ // Internal comments on the change order
        text: String,
        commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        commentedAt: { type: Date, default: Date.now },
    }],
    documents: [{ // Associated documents
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('ChangeOrder', ChangeOrderSchema);