// server/models/Worker.js
const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
    user: { // The user who created this worker
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['General Labor', 'Skilled Labor', 'Supervisor', 'Electrician', 'Plumber', 'Heavy Equipment Operator', 'Safety Officer', 'Foreman', 'Other'],
        default: 'General Labor',
    },
    contactNumber: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
    },
    hourlyRate: {
        type: Number,
        min: 0,
        default: 0,
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contractor'],
        default: 'Full-time',
    },
    hireDate: {
        type: Date,
    },
    emergencyContact: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        relationship: { type: String, trim: true },
    },
    skills: [{ // Array of strings for skills
        type: String,
        trim: true,
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    certifications: [{ // References to Certification model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certification',
    }],
    documents: [{ // References to Document (e.g., resume, ID, contracts)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
    timesheets: [{ // References to Timesheet for this worker
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Timesheet',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Worker', WorkerSchema);