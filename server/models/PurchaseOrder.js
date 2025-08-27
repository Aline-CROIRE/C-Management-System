const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
    item: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Inventory', 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: [true, 'Item quantity is required.'], 
        min: [1, 'Quantity must be at least 1.'] 
    },
    unitPrice: { 
        type: Number, 
        required: [true, 'Item unit price is required.'], 
        min: [0, 'Unit price cannot be negative.'] 
    },
}, { _id: false });


const purchaseOrderSchema = new mongoose.Schema({
    orderNumber: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    
    supplier: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Supplier', 
        required: true 
    },

    items: [poItemSchema],
    
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Ordered', 'Shipped', 'Completed', 'Cancelled'],
        default: 'Pending',
    },

    orderDate: { type: Date, default: Date.now },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    
    paymentTerms: { type: String, default: 'net30' },
    notes: { type: String, trim: true, default: '' },

}, { 
    timestamps: true 
});

/**
 * @statics generateOrderNumber
 * A static helper method on the PurchaseOrder model to create a new, unique
 * sequential order number. This is attached directly to the schema.
 */
purchaseOrderSchema.statics.generateOrderNumber = async function() {
    try {
        // `this` refers to the PurchaseOrder model itself.
        const lastPO = await this.findOne().sort({ orderNumber: -1 });
        
        let nextOrderNum = 1;

        if (lastPO && lastPO.orderNumber) {
            const lastNumStr = lastPO.orderNumber.split('-')[1];
            
            if (lastNumStr && !isNaN(parseInt(lastNumStr))) {
                nextOrderNum = parseInt(lastNumStr) + 1;
            }
        }
        
        return `PO-${String(nextOrderNum).padStart(5, '0')}`;

    } catch (error) {
        console.error("Error in generateOrderNumber:", error);
        throw new Error("Could not generate a unique order number.");
    }
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);