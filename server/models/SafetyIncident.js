// server/models/SafetyIncident.js
const mongoose = require('mongoose');

const SafetyIncidentSchema = new mongoose.Schema({
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
    incidentDate: {
        type: Date,
        required: true,
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    actionsTaken: {
        type: String,
        trim: true,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker', // Or User
        required: true,
    },
    documents: [{ // Photos, reports related to the incident
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

module.exports = mongoose.model('SafetyIncident', SafetyIncidentSchema);