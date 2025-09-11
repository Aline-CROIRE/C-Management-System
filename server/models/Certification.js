// server/models/Certification.js
const mongoose = require('mongoose');

const CertificationSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true,
        trim: true,
    },
    issuingBody: {
        type: String,
        trim: true,
    },
    issueDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
    },
    document: { // Reference to a Document containing the certification scan
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    },
    isExpired: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Update isExpired status before saving
CertificationSchema.pre('save', function (next) {
    if (this.expiryDate && this.expiryDate < new Date()) {
        this.isExpired = true;
    } else {
        this.isExpired = false;
    }
    next();
});

module.exports = mongoose.model('Certification', CertificationSchema);