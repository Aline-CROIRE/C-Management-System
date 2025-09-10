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
        trim: true,
        default: 'General Labor',
    },
    contactNumber: {
        type: String,
        trim: true,
        default: '',
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        // unique: true, // Consider if email should be unique across all workers or just per user
        default: '',
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

WorkerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Worker', WorkerSchema);