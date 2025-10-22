const mongoose = require('mongoose');

const restaurantCustomerSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true,
    },
    firstName: {
        type: String,
        trim: true,
        default: '',
    },
    lastName: {
        type: String,
        trim: true,
        default: '',
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    phone: {
        type: String,
        trim: true,
        sparse: true,
        match: [/^\+?\d{10,15}$/, 'Please fill a valid phone number'],
    },
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    dietaryRestrictions: [{
        type: String,
        trim: true,
    }],
    notes: {
        type: String,
        trim: true,
    },
    lastOrderAt: {
        type: Date,
    },
}, { timestamps: true });

restaurantCustomerSchema.index({ restaurantId: 1, email: 1 }, { unique: true, sparse: true });
restaurantCustomerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true, sparse: true });
restaurantCustomerSchema.index({ restaurantId: 1, lastName: 1, firstName: 1 });

module.exports = mongoose.model('RestaurantCustomer', restaurantCustomerSchema);