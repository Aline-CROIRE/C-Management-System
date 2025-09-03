const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
}, { _id: false });

const saleSchema = new mongoose.Schema({
    user: { // <-- IMPORTANT: Add user reference
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    receiptNumber: { type: String, required: true, unique: true, index: true }, // receiptNumber should still be globally unique
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Assuming customers are global or assigned to a user elsewhere
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
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
    notes: { type: String, trim: true },
}, { timestamps: true });

saleSchema.statics.generateReceiptNumber = async function() {
    // Receipt numbers should likely be unique across all users, not per user.
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

module.exports = mongoose.model('Sale', saleSchema);