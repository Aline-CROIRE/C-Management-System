// server/models/PaymentRequest.js
const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'Rwf', // Assuming Rwandan Francs based on previous code
    },
    purpose: {
        type: String,
        required: true,
        trim: true,
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
        default: 'Pending',
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Usually a Site Engineer or Project Manager
        required: true,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
    invoiceRef: { // Reference to an invoice number or ID
        type: String,
        trim: true,
    },
    receipts: [{ // References to uploaded receipt documents
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);