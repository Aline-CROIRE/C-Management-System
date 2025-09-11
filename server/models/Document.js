// server/models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
        trim: true,
    },
    fileUrl: { // URL to the stored document (e.g., S3, Google Cloud Storage)
        type: String,
        required: true,
    },
    fileType: { // e.g., 'application/pdf', 'image/jpeg'
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Permit', 'Drawing', 'Contract', 'Photo', 'Report', 'Certificate', 'Other'],
        default: 'Other',
    },
    description: {
        type: String,
        trim: true,
    },
    // Polymorphic reference to link document to various entities
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'refModel',
    },
    refModel: {
        type: String,
        required: true,
        enum: ['ConstructionSite', 'Task', 'Equipment', 'Worker', 'ChangeOrder', 'SafetyIncident'], // Add other models as needed
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // User who uploaded the document
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Document', DocumentSchema);