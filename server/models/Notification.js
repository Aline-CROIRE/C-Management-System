// models/Notification.js (No changes needed)
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
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    link: {
        type: String,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
    },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);