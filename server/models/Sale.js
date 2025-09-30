// server/models/Sale.js
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    packagingIncluded: { type: Boolean, default: false }, 
    packagingDepositCharged: { type: Number, default: 0 }, 
    packagingReturned: { type: Boolean, default: false }, 
    packagingQuantityReturned: { type: Number, default: 0 }, 
    packagingTypeSnapshot: { type: String, enum: ['None', 'Reusable', 'Recyclable', 'Compostable', 'Other'], default: 'None' }, 
    reusablePackagingItemIdSnapshot: { // NEW: Snapshot the ID of the actual reusable packaging item sold with the product
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        default: null,
    },
}, { _id: false });

const saleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0,
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Partial', 'Unpaid', 'Refunded'],
        default: 'Unpaid',
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Credit Card', 'Mobile Money', 'Bank Transfer'],
        required: true,
        default: 'Cash',
    },
    status: {
        type: String,
        enum: ['Completed', 'Returned', 'Partially Returned'],
        default: 'Completed'
    },
    packagingDepositTotal: { 
        type: Number,
        default: 0,
        min: 0,
    },
    packagingReturnedTotal: { 
        type: Number,
        default: 0,
        min: 0,
    },
    notes: { type: String, trim: true },
}, { timestamps: true });

saleSchema.pre('save', function(next) {
    if (this.isModified('amountPaid') || this.isModified('totalAmount')) {
        if (this.amountPaid >= this.totalAmount) {
            this.paymentStatus = 'Paid';
        } else if (this.amountPaid > 0 && this.amountPaid < this.totalAmount) {
            this.paymentStatus = 'Partial';
        } else {
            this.paymentStatus = 'Unpaid';
        }
    }
    this.packagingDepositTotal = this.items.reduce((sum, item) => sum + (item.packagingIncluded ? item.quantity * item.packagingDepositCharged : 0), 0);
    this.packagingReturnedTotal = this.items.reduce((sum, item) => sum + ((item.packagingQuantityReturned || 0) * item.packagingDepositCharged), 0);

    next();
});

saleSchema.statics.generateReceiptNumber = async function() {
    const lastSale = await this.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastSale && lastSale.receiptNumber) {
        const lastNum = parseInt(lastSale.receiptNumber.split('-')[1]);
        if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
        }
    }
    return `S-${String(nextNum).padStart(5, '0')}`;
};

module.exports = mongoose.model("Sale", saleSchema);