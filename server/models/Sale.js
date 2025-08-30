const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // Price at the time of sale
}, { _id: false });

const saleSchema = new mongoose.Schema({
    receiptNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, trim: true, default: 'Walk-in Customer' },
    items: [saleItemSchema],
    totalAmount: { type: Number, required: true },
}, { timestamps: true });

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

module.exports = mongoose.model('Sale', saleSchema);