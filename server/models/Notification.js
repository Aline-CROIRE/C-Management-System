// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'low_stock', 'out_of_stock', 'po_completed', 'system', 'other'],
        default: 'info',
    },
    read: {
        type: Boolean,
        default: false,
    },
    priority: { // Optional: for visual urgency in frontend
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    link: { // Optional: URL to navigate to when clicking notification
        type: String,
    },
    relatedId: { // Optional: ID of the related item (e.g., Inventory, PO, Sale)
        type: mongoose.Schema.Types.ObjectId,
        // No ref here, as it could relate to different models
    },
}, { timestamps: true }); // `createdAt` and `updatedAt` will be automatically added

module.exports = mongoose.model('Notification', notificationSchema);