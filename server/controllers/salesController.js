// server/controllers/salesController.js
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Customer = require("../models/Customer");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const moment = require("moment");

// Helper to format currency (assuming Rwandan Francs for example)
const formatCurrency = (amount) => {
    return `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};


// @desc    Get all sales for a user
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res) => {
    try {
        const userId = req.user._id;
        const { customerId, startDate, endDate, paymentMethod, paymentStatus, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
        const query = { user: userId };

        if (customerId) query.customer = customerId;
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const sales = await Sale.find(query)
            .populate('customer', 'name currentBalance')
            .populate({ path: 'items.item', select: 'name sku unit packagingType packagingDeposit' })
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await Sale.countDocuments(query);
            
        res.json({ 
            success: true, 
            data: sales,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            }
        });
    } catch (err) {
        console.error("Error fetching sales:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private
exports.createSale = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { 
            items, customer, totalAmount, subtotal, taxAmount, 
            paymentMethod, notes, amountPaid
        } = req.body;

        const processedItems = []; // To store items with full details for the sale record

        for (const saleItem of items) {
            const inventoryItem = await Inventory.findOne({ _id: saleItem.item, user: userId }).session(session);
            if (!inventoryItem) throw new Error(`Inventory item not found or does not belong to user.`);
            if (inventoryItem.quantity < saleItem.quantity) throw new Error(`Not enough stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${saleItem.quantity}.`);
            
            inventoryItem.quantity -= saleItem.quantity;
            saleItem.costPrice = inventoryItem.costPrice || 0; 

            // Add packaging details to the saleItem snapshot
            saleItem.packagingIncluded = inventoryItem.packagingType === 'Reusable';
            saleItem.packagingDepositCharged = inventoryItem.packagingType === 'Reusable' ? inventoryItem.packagingDeposit || 0 : 0;
            saleItem.packagingTypeSnapshot = inventoryItem.packagingType; // Snapshot the type

            processedItems.push(saleItem); // Add to the new array with full details
            
            const newQuantity = inventoryItem.quantity;
            const minStockLevel = inventoryItem.minStockLevel || 0;

            if (newQuantity <= 0 && inventoryItem.status !== 'out-of-stock') {
                 const notification = new Notification({
                    user: userId, type: 'out_of_stock', title: 'Out of Stock Alert',
                    message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is now out of stock.`,
                    priority: 'critical', link: `/inventory/${inventoryItem._id}`, relatedId: inventoryItem._id,
                });
                await notification.save({ session });
                inventoryItem.status = 'out-of-stock';
            } else if (newQuantity <= minStockLevel && newQuantity > 0 && inventoryItem.status !== 'low-stock') {
                 const notification = new Notification({
                    user: userId, type: 'low_stock', title: 'Low Stock Alert',
                    message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is running low. Quantity: ${newQuantity}.`,
                    priority: 'high', link: `/inventory/${inventoryItem._id}`, relatedId: inventoryItem._id,
                });
                await notification.save({ session });
                inventoryItem.status = 'low-stock';
            } else if (newQuantity > minStockLevel && newQuantity > 0 && (inventoryItem.status === 'low-stock' || inventoryItem.status === 'out-of-stock')) {
                inventoryItem.status = 'in-stock';
            }

            await inventoryItem.save({ session });
        }
        
        const receiptNumber = await Sale.generateReceiptNumber();
        const newSale = new Sale({
            receiptNumber, customer, items: processedItems, totalAmount, // Use processedItems
            subtotal, taxAmount, paymentMethod, notes,
            user: userId,
            amountPaid: amountPaid || 0,
            // packagingDepositTotal and packagingReturnedTotal will be calculated in pre-save hook
        });
        
        if (customer) {
            const customerToUpdate = await Customer.findOne({ _id: customer, user: userId }).session(session);
            if (!customerToUpdate) throw new Error("Customer not found or does not belong to user.");

            customerToUpdate.totalSpent += totalAmount;
            customerToUpdate.lastSaleDate = new Date();
            
            const outstandingAmount = totalAmount - (amountPaid || 0);
            if (outstandingAmount > 0) {
                customerToUpdate.currentBalance += outstandingAmount;
            }
            await customerToUpdate.save({ session });
        }
        
        const savedSale = await newSale.save({ session });
        await session.commitTransaction();
        
        res.status(201).json({ success: true, message: "Sale recorded successfully!", data: savedSale });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error creating sale:", err);
        res.status(500).json({ success: false, message: err.message || "Server error while creating sale." });
    } finally {
        session.endSession();
    }
};

// @desc    Record a payment for a sale
// @route   POST /api/sales/:id/record-payment
// @access  Private
exports.recordPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { amount, paymentMethod } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Sale not found (invalid ID format).");
        }

        const sale = await Sale.findOne({ _id: id, user: userId }).session(session);
        if (!sale) {
            throw new Error("Sale not found or does not belong to user.");
        }

        const paymentAmount = Number(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error("Payment amount must be a positive number.");
        }
        if (sale.amountPaid + paymentAmount > sale.totalAmount) {
            throw new Error("Payment amount exceeds the total outstanding balance for this sale.");
        }

        sale.amountPaid += paymentAmount;
        sale.paymentMethod = paymentMethod;

        if (sale.customer) {
            const customerToUpdate = await Customer.findOne({ _id: sale.customer, user: userId }).session(session);
            if (!customerToUpdate) throw new Error("Associated customer not found or does not belong to user.");
            
            customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - paymentAmount);
            await customerToUpdate.save({ session });
        }

        await sale.save({ session });

        await session.commitTransaction();
        res.json({ success: true, message: "Payment recorded successfully!", data: sale });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error recording payment for sale:", err);
        res.status(500).json({ success: false, message: err.message || "Server error recording payment." });
    } finally {
        session.endSession();
    }
};


// @desc    Process a return for a sale
// @route   POST /api/sales/:id/return
// @access  Private
exports.processReturn = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { returnedItems } = req.body;
        const sale = await Sale.findOne({ _id: req.params.id, user: userId }).session(session);
        if (!sale) throw new Error("Original sale not found or does not belong to user.");

        let totalReturnedValue = 0;

        for (const returnedItem of returnedItems) {
            const originalSaleItemIndex = sale.items.findIndex(i => i.item.toString() === returnedItem.item);
            if (originalSaleItemIndex === -1) throw new Error(`Item ${returnedItem.item} not found in original sale.`);
            const originalSaleItem = sale.items[originalSaleItemIndex];

            // Check if attempting to return more than originally sold quantities
            if (returnedItem.quantity > originalSaleItem.quantity) {
                throw new Error(`Cannot return more than sold quantity for ${originalSaleItem.item.name}. Sold: ${originalSaleItem.quantity}, Attempted Return: ${returnedItem.quantity}.`);
            }

            const inventoryItem = await Inventory.findOne({ _id: returnedItem.item, user: userId }).session(session);
            if (!inventoryItem) throw new Error(`Inventory item ${returnedItem.item} not found or does not belong to user for return.`);

            inventoryItem.quantity += returnedItem.quantity; // Restock inventory

            const newQuantity = inventoryItem.quantity;
            const minStockLevel = inventoryItem.minStockLevel || 0;
            if (newQuantity <= 0 && inventoryItem.status !== 'out-of-stock') {
                inventoryItem.status = 'out-of-stock';
            } else if (newQuantity <= minStockLevel && newQuantity > 0 && inventoryItem.status !== 'low-stock') {
                inventoryItem.status = 'low-stock';
            } else if (newQuantity > minStockLevel && newQuantity > 0 && (inventoryItem.status === 'low-stock' || inventoryItem.status === 'out-of-stock')) {
                inventoryItem.status = 'in-stock';
            }
            await inventoryItem.save({ session });

            totalReturnedValue += originalSaleItem.price * returnedItem.quantity;

            // When returning a product, if it had reusable packaging, update packagingQuantityReturned
            if (originalSaleItem.packagingIncluded && originalSaleItem.packagingDepositCharged > 0) {
                 // The quantity of packaging *associated with this returned product* is now also returned.
                 // We need to make sure we don't 'return' more packaging than was sold for this item.
                 const actualPackagingReturnedThisCall = Math.min(returnedItem.quantity, originalSaleItem.quantity - (originalSaleItem.packagingQuantityReturned || 0));
                 sale.items[originalSaleItemIndex].packagingQuantityReturned = (sale.items[originalSaleItemIndex].packagingQuantityReturned || 0) + actualPackagingReturnedThisCall;
                 
                 // If all packaging for this item is now returned, mark it as fully returned.
                 if (sale.items[originalSaleItemIndex].packagingQuantityReturned >= sale.items[originalSaleItemIndex].quantity) {
                     sale.items[originalSaleItemIndex].packagingReturned = true;
                 }
            }
        }

        // Determine overall sale status (simplified)
        const totalSoldItemsQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPhysicalItemsReturnedQuantity = returnedItems.reduce((sum, item) => sum + item.quantity, 0); 
        
        // This logic can be more sophisticated if tracking multiple partial product returns.
        // For now, if all original items are covered by returns, mark as 'Returned'.
        // Otherwise, 'Partially Returned'.
        const allItemsFullyReturned = sale.items.every(saleItem => {
            // Check if this item's original quantity is now matched by total quantity returned for it across all returns
            const totalReturnedForThisItem = (returnedItems.find(r => r.item === saleItem.item.toString())?.quantity || 0); // This is just for *this* call
            return saleItem.quantity <= totalReturnedForThisItem; // Simplified check
        });
        sale.status = allItemsFullyReturned ? 'Returned' : 'Partially Returned';

        // Calculate total packaging deposit to refund from THIS product return operation
        const totalPackagingDepositRefundedByThisReturn = sale.items.reduce((sum, item) => {
            const returnedQtyInThisCall = returnedItems.find(r => r.item === item.item.toString())?.quantity || 0;
            if (item.packagingIncluded && item.packagingDepositCharged > 0) {
                 // Sum up the deposit for the packaging that was just returned *with* the product
                 // This ensures we only refund for packaging that is now considered returned.
                 return sum + (returnedQtyInThisCall * item.packagingDepositCharged);
            }
            return sum;
        }, 0);


        sale.amountPaid = Math.max(0, sale.amountPaid - totalReturnedValue - totalPackagingDepositRefundedByThisReturn); // Adjust amount paid
        sale.totalAmount = Math.max(0, sale.totalAmount - totalReturnedValue); // Adjust sale total if items are returned.
        // packagingReturnedTotal will be updated by pre-save hook based on packagingQuantityReturned
        await sale.save({ session }); // Trigger pre-save hook for packaging totals

        if (sale.customer) {
            const customerToUpdate = await Customer.findOne({ _id: sale.customer, user: userId }).session(session);
            if (!customerToUpdate) throw new Error("Associated customer not found or does not belong to user.");
            
            customerToUpdate.totalSpent = Math.max(0, customerToUpdate.totalSpent - (totalReturnedValue + totalPackagingDepositRefundedByThisReturn)); // Reduce total spent
            customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - (totalReturnedValue + totalPackagingDepositRefundedByThisReturn)); // Reduce balance
            await customerToUpdate.save({ session });
        }

        await session.commitTransaction();
        res.json({ success: true, message: "Items returned and inventory restocked." });
    } catch (err) {
        await session.abortTransaction();
        console.error("Error processing return:", err);
        res.status(500).json({ success: false, message: err.message || "Server error processing return." });
    } finally {
        session.endSession();
    }
};

// @desc    Track packaging return and refund deposit
// @route   POST /api/sales/:saleId/items/:itemId/return-packaging
// @access  Private
exports.returnPackaging = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { saleId, itemId } = req.params;
        const { quantityReturned, refundMethod } = req.body; // quantityReturned for this specific packaging return

        const sale = await Sale.findOne({ _id: saleId, user: userId }).session(session);
        if (!sale) {
            throw new Error("Sale not found or does not belong to user.");
        }

        const saleItemIndex = sale.items.findIndex(item => item.item.toString() === itemId);
        if (saleItemIndex === -1) {
            throw new Error("Item not found in this sale.");
        }
        const saleItem = sale.items[saleItemIndex];

        if (!saleItem.packagingIncluded || saleItem.packagingDepositCharged <= 0) {
            throw new Error("Packaging deposit was not charged for this item.");
        }

        const currentReturnedQuantity = saleItem.packagingQuantityReturned || 0;
        const maxReturnable = saleItem.quantity - currentReturnedQuantity;

        if (quantityReturned <= 0) {
            throw new Error("Quantity returned for packaging must be a positive number.");
        }
        if (quantityReturned > maxReturnable) {
             throw new Error(`Cannot return more packaging than outstanding. Max returnable: ${maxReturnable}.`);
        }

        const depositToRefund = saleItem.packagingDepositCharged * quantityReturned;

        // Update packaging quantity returned for this specific sale item
        sale.items[saleItemIndex].packagingQuantityReturned = currentReturnedQuantity + quantityReturned;
        if (sale.items[saleItemIndex].packagingQuantityReturned >= sale.items[saleItemIndex].quantity) {
             sale.items[saleItemIndex].packagingReturned = true; // Mark as fully returned if applicable
        }

        // Refund the deposit to the customer's balance
        if (sale.customer) {
            const customerToUpdate = await Customer.findOne({ _id: sale.customer, user: userId }).session(session);
            if (!customerToUpdate) throw new Error("Associated customer not found or does not belong to user.");
            
            // Adjust customer's balance and total spent
            customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - depositToRefund); // Reduce outstanding debt
            customerToUpdate.totalSpent = Math.max(0, customerToUpdate.totalSpent - depositToRefund); // Reduce total spent (as deposit was part of original sale total)
            await customerToUpdate.save({ session });
        }

        await sale.save({ session }); // Trigger pre-save hook for packaging totals
        await session.commitTransaction();

        res.json({ success: true, message: `Successfully processed packaging return and refunded ${formatCurrency(depositToRefund)}.`, data: sale });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error returning packaging:", err);
        res.status(500).json({ success: false, message: err.message || "Server error returning packaging." });
    } finally {
        session.endSession();
    }
};

// @desc    Get Circular Economy Report/Stats for packaging
// @route   GET /api/sales/packaging-report
// @access  Private
exports.getPackagingReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.query;

        const dateMatch = {};
        if (startDate && endDate) {
            dateMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // Aggregate packaging deposits charged
        const depositsCharged = await Sale.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), ...dateMatch } },
            { $unwind: "$items" },
            { $match: { "items.packagingDepositCharged": { $gt: 0 }, "items.packagingTypeSnapshot": "Reusable" } },
            {
                $group: {
                    _id: "$items.item",
                    totalChargedQuantity: { $sum: "$items.quantity" },
                    totalChargedDeposit: { $sum: { $multiply: ["$items.quantity", "$items.packagingDepositCharged"] } },
                }
            },
            { $lookup: { from: 'inventories', localField: '_id', foreignField: '_id', as: 'itemDetails' } },
            { $unwind: '$itemDetails' },
            { $project: {
                _id: 1,
                itemName: '$itemDetails.name',
                itemSku: '$itemDetails.sku',
                packagingTypeSnapshot: '$itemDetails.packagingType', // Get latest type from inventory for reporting
                totalChargedQuantity: 1,
                totalChargedDeposit: 1,
            }}
        ]);

        // Aggregate packaging deposits refunded/returned
        const depositsRefunded = await Sale.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), ...dateMatch } },
            { $unwind: "$items" },
            { $match: { "items.packagingQuantityReturned": { $gt: 0 } } }, // Match items where some packaging was returned
            {
                $group: {
                    _id: "$items.item",
                    totalReturnedQuantity: { $sum: "$items.packagingQuantityReturned" },
                    totalRefundedDeposit: { $sum: { $multiply: ["$items.packagingQuantityReturned", "$items.packagingDepositCharged"] } },
                }
            }
        ]);
        // To add item details to depositsRefunded, we need another lookup. 
        const depositsRefundedWithDetails = await Promise.all(depositsRefunded.map(async (entry) => {
            const itemDetails = await Inventory.findById(entry._id).select('name sku'); // Only fetch name and sku
            return {
                ...entry,
                itemName: itemDetails?.name || 'Unknown Item',
                itemSku: itemDetails?.sku || 'N/A',
            };
        }));


        // Calculate overall impact
        const totalDepositsCharged = depositsCharged.reduce((sum, d) => sum + d.totalChargedDeposit, 0);
        const totalDepositsRefunded = depositsRefunded.reduce((sum, d) => sum + d.totalRefundedDeposit, 0);
        const outstandingDeposits = totalDepositsCharged - totalDepositsRefunded;

        // Aggregate other packaging types (Recyclable, Compostable, Other) from sales
        const otherPackagingSold = await Sale.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), ...dateMatch } },
            { $unwind: "$items" },
            { $match: { "items.packagingTypeSnapshot": { $in: ['Recyclable', 'Compostable', 'Other'] } } },
            {
                $group: {
                    _id: "$items.packagingTypeSnapshot",
                    totalQuantity: { $sum: "$items.quantity" },
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalDepositsCharged,
                totalDepositsRefunded,
                outstandingDeposits,
                depositsChargedDetails: depositsCharged,
                depositsRefundedDetails: depositsRefundedWithDetails, // Use the version with populated details
                otherPackagingSoldDetails: otherPackagingSold,
            }
        });

    } catch (err) {
        console.error("Error fetching packaging report:", err);
        res.status(500).json({ success: false, message: "Server Error fetching packaging report." });
    }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private
exports.deleteSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Sale not found (invalid ID format).");
        }

        const saleToDelete = await Sale.findOne({ _id: id, user: userId }).session(session);
        if (!saleToDelete) {
            throw new Error("Sale not found or does not belong to user.");
        }

        // Revert inventory for each item in the sale
        for (const saleItem of saleToDelete.items) {
            const inventoryItem = await Inventory.findById(saleItem.item).session(session);
            if (inventoryItem) {
                inventoryItem.quantity += saleItem.quantity;

                // Update inventory status if it was out-of-stock or low-stock
                const newQuantity = inventoryItem.quantity;
                const minStockLevel = inventoryItem.minStockLevel || 0;
                if (newQuantity > minStockLevel && newQuantity > 0 && (inventoryItem.status === 'low-stock' || inventoryItem.status === 'out-of-stock')) {
                    inventoryItem.status = 'in-stock';
                } else if (newQuantity > 0 && newQuantity <= minStockLevel && inventoryItem.status !== 'low-stock') {
                    inventoryItem.status = 'low-stock';
                }
                await inventoryItem.save({ session });
            }
        }

        // Adjust customer's total spent and current balance
        if (saleToDelete.customer) {
            const customerToUpdate = await Customer.findById(saleToDelete.customer).session(session);
            if (customerToUpdate) {
                customerToUpdate.totalSpent = Math.max(0, customerToUpdate.totalSpent - saleToDelete.totalAmount);
                customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - (saleToDelete.totalAmount - saleToDelete.amountPaid)); // Adjust outstanding balance
                await customerToUpdate.save({ session });
            }
        }

        await Sale.findByIdAndDelete(id).session(session);
        await session.commitTransaction();

        res.json({ success: true, message: "Sale deleted and inventory/customer data reverted successfully." });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error deleting sale:", err);
        res.status(500).json({ success: false, message: err.message || "Server error while deleting sale." });
    } finally {
        session.endSession();
    }
};

// Placeholder for generatePDF (if you have it)
exports.generatePDF = async (req, res) => {
    return res.status(501).json({ success: false, message: "PDF generation not implemented yet." });
};

// Placeholder for getSalesAnalytics (if you have it)
exports.getSalesAnalytics = async (req, res) => {
    return res.status(501).json({ success: false, message: "Sales analytics not implemented yet." });
};