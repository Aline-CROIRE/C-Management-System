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
            .populate({ 
                path: 'items.item', 
                select: 'name sku unit packagingType packagingDeposit isReusablePackaging linkedReusablePackagingItem' // Include new fields
            })
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

        const processedItems = []; 

        for (const saleItem of items) {
            const inventoryItem = await Inventory.findOne({ _id: saleItem.item, user: userId }).session(session);
            if (!inventoryItem) throw new Error(`Inventory item not found or does not belong to user.`);
            if (inventoryItem.quantity < saleItem.quantity) throw new Error(`Not enough stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${saleItem.quantity}.`);
            
            inventoryItem.quantity -= saleItem.quantity; // Deduct from product stock
            saleItem.costPrice = inventoryItem.costPrice || 0; 

            // Handle reusable packaging logic:
            // If the product sold uses a linked reusable packaging item
            if (inventoryItem.packagingType === 'Reusable' && inventoryItem.linkedReusablePackagingItem) {
                const reusablePackagingItem = await Inventory.findOne({ 
                    _id: inventoryItem.linkedReusablePackagingItem, 
                    user: userId,
                    isReusablePackaging: true // Ensure it's marked as actual reusable packaging
                }).session(session);

                if (!reusablePackagingItem) {
                    throw new Error(`Linked reusable packaging item not found for ${inventoryItem.name}. Please check inventory settings.`);
                }
                if (reusablePackagingItem.quantity < saleItem.quantity) {
                    throw new Error(`Not enough reusable packaging (${reusablePackagingItem.name}) in stock for ${inventoryItem.name}. Available: ${reusablePackagingItem.quantity}, Requested: ${saleItem.quantity}.`);
                }

                reusablePackagingItem.quantity -= saleItem.quantity; // Deduct from reusable packaging stock (issuance of empty container)
                await reusablePackagingItem.save({ session });

                saleItem.packagingIncluded = true;
                saleItem.packagingDepositCharged = inventoryItem.packagingDeposit || 0;
                saleItem.packagingTypeSnapshot = inventoryItem.packagingType;
                saleItem.reusablePackagingItemIdSnapshot = reusablePackagingItem._id; // Store the ID of the actual reusable item
            } else {
                // For non-reusable packaging, just capture type snapshot
                saleItem.packagingIncluded = false;
                saleItem.packagingDepositCharged = 0;
                saleItem.packagingTypeSnapshot = inventoryItem.packagingType;
                saleItem.reusablePackagingItemIdSnapshot = null;
            }

            processedItems.push(saleItem); 
            
            // Update product's stock status and create notifications
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
            receiptNumber, customer, items: processedItems, totalAmount, 
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


// @desc    Process a return for a sale (product returned)
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

            if (returnedItem.quantity > originalSaleItem.quantity) {
                throw new Error(`Cannot return more than sold quantity for ${originalSaleItem.item.name}. Sold: ${originalSaleItem.quantity}, Attempted Return: ${returnedItem.quantity}.`);
            }

            const inventoryProduct = await Inventory.findOne({ _id: returnedItem.item, user: userId }).session(session);
            if (!inventoryProduct) throw new Error(`Inventory product ${returnedItem.item} not found or does not belong to user for return.`);

            inventoryProduct.quantity += returnedItem.quantity; // Restock product inventory

            // Update product's stock status
            const newQuantity = inventoryProduct.quantity;
            const minStockLevel = inventoryProduct.minStockLevel || 0;
            if (newQuantity <= 0 && inventoryProduct.status !== 'out-of-stock') {
                inventoryProduct.status = 'out-of-stock';
            } else if (newQuantity <= minStockLevel && newQuantity > 0 && inventoryProduct.status !== 'low-stock') {
                inventoryProduct.status = 'low-stock';
            } else if (newQuantity > minStockLevel && newQuantity > 0 && (inventoryProduct.status === 'low-stock' || inventoryProduct.status === 'out-of-stock')) {
                inventoryProduct.status = 'in-stock';
            }
            await inventoryProduct.save({ session });

            totalReturnedValue += originalSaleItem.price * returnedItem.quantity;

            // Handle reusable packaging return associated with this product return
            // If the product was sold with a linked reusable packaging item, and it's being returned,
            // assume the packaging comes back with it.
            if (originalSaleItem.reusablePackagingItemIdSnapshot) {
                const reusablePackagingItem = await Inventory.findOne({
                    _id: originalSaleItem.reusablePackagingItemIdSnapshot,
                    user: userId,
                    isReusablePackaging: true
                }).session(session);

                if (reusablePackagingItem) {
                    // Increment reusable packaging item stock (receiving back the empty container)
                    reusablePackagingItem.quantity += returnedItem.quantity; 
                    await reusablePackagingItem.save({ session });

                    // Update the saleItem's tracking for packaging return
                    sale.items[originalSaleItemIndex].packagingQuantityReturned = (sale.items[originalSaleItemIndex].packagingQuantityReturned || 0) + returnedItem.quantity;
                    if (sale.items[originalSaleItemIndex].packagingQuantityReturned >= sale.items[originalSaleItemIndex].quantity) {
                        sale.items[originalSaleItemIndex].packagingReturned = true; // Mark as fully returned
                    }
                }
            }
        }

        // Determine overall sale status (simplified)
        const totalSoldItemsQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPhysicalItemsReturnedQuantity = returnedItems.reduce((sum, item) => sum + item.quantity, 0); 
        
        sale.status = totalPhysicalItemsReturnedQuantity >= totalSoldItemsQuantity ? 'Returned' : 'Partially Returned';

        // Calculate total packaging deposit to refund from THIS product return operation
        const totalPackagingDepositRefundedByThisReturn = returnedItems.reduce((sum, returnedItem) => {
            const originalSaleItem = sale.items.find(i => i.item.toString() === returnedItem.item);
            if (originalSaleItem?.reusablePackagingItemIdSnapshot && originalSaleItem?.packagingDepositCharged > 0) { // Check for reusable packaging link
                 return sum + (returnedItem.quantity * originalSaleItem.packagingDepositCharged);
            }
            return sum;
        }, 0);


        sale.amountPaid = Math.max(0, sale.amountPaid - totalReturnedValue - totalPackagingDepositRefundedByThisReturn); // Adjust amount paid
        sale.totalAmount = Math.max(0, sale.totalAmount - totalReturnedValue); // Adjust sale total if items are returned.
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

// @desc    Track packaging return and refund deposit (packaging only returned)
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
        const { saleId, itemId } = req.params; // itemId here refers to the *product* item ID in the sale
        const { quantityReturned, refundMethod } = req.body; 

        const sale = await Sale.findOne({ _id: saleId, user: userId }).session(session);
        if (!sale) {
            throw new Error("Sale not found or does not belong to user.");
        }

        const saleItemIndex = sale.items.findIndex(item => item.item.toString() === itemId);
        if (saleItemIndex === -1) {
            throw new Error("Product item not found in this sale.");
        }
        const saleItem = sale.items[saleItemIndex];

        if (!saleItem.reusablePackagingItemIdSnapshot) { // Check for the new linked ID
            throw new Error("No reusable packaging was associated with this product item in the sale.");
        }
        if (saleItem.packagingDepositCharged <= 0) {
             throw new Error("Packaging deposit was not charged for this product item.");
        }

        const currentReturnedQuantity = saleItem.packagingQuantityReturned || 0;
        const maxReturnable = saleItem.quantity - currentReturnedQuantity;

        if (quantityReturned <= 0) {
            throw new Error("Quantity returned for packaging must be a positive number.");
        }
        if (quantityReturned > maxReturnable) {
             throw new Error(`Cannot return more packaging than outstanding for product '${saleItem.item.name}'. Max returnable: ${maxReturnable}.`);
        }

        const depositToRefund = saleItem.packagingDepositCharged * quantityReturned;

        // Find and update the actual reusable packaging inventory item
        const reusablePackagingItem = await Inventory.findOne({
            _id: saleItem.reusablePackagingItemIdSnapshot,
            user: userId,
            isReusablePackaging: true // Ensure it's the correct type of item
        }).session(session);

        if (!reusablePackagingItem) {
            throw new Error(`Associated reusable packaging item (ID: ${saleItem.reusablePackagingItemIdSnapshot}) not found or is not marked as reusable packaging.`);
        }

        reusablePackagingItem.quantity += quantityReturned; // Increment reusable packaging stock
        await reusablePackagingItem.save({ session });

        // Update saleItem's tracking for packaging return
        sale.items[saleItemIndex].packagingQuantityReturned = currentReturnedQuantity + quantityReturned;
        if (sale.items[saleItemIndex].packagingQuantityReturned >= sale.items[saleItemIndex].quantity) {
             sale.items[saleItemIndex].packagingReturned = true; // Mark as fully returned if applicable
        }

        // Refund the deposit to the customer's balance
        if (sale.customer) {
            const customerToUpdate = await Customer.findOne({ _id: sale.customer, user: userId }).session(session);
            if (!customerToUpdate) throw new Error("Associated customer not found or does not belong to user.");
            
            customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - depositToRefund); 
            customerToUpdate.totalSpent = Math.max(0, customerToUpdate.totalSpent - depositToRefund); 
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
                    _id: "$items.item", // Group by the product ID
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
                packagingTypeSnapshot: '$itemDetails.packagingType', 
                totalChargedQuantity: 1,
                totalChargedDeposit: 1,
                // Include details of the reusable packaging item itself if linked for more advanced reporting
                reusablePackagingItem: '$itemDetails.linkedReusablePackagingItem' 
            }}
        ]);

        // Aggregate packaging deposits refunded/returned
        const depositsRefunded = await Sale.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), ...dateMatch } },
            { $unwind: "$items" },
            { $match: { "items.packagingQuantityReturned": { $gt: 0 } } }, 
            {
                $group: {
                    _id: "$items.item", // Group by the product ID
                    totalReturnedQuantity: { $sum: "$items.packagingQuantityReturned" },
                    totalRefundedDeposit: { $sum: { $multiply: ["$items.packagingQuantityReturned", "$items.packagingDepositCharged"] } },
                }
            }
        ]);
        const depositsRefundedWithDetails = await Promise.all(depositsRefunded.map(async (entry) => {
            const itemDetails = await Inventory.findById(entry._id).select('name sku'); 
            return {
                ...entry,
                itemName: itemDetails?.name || 'Unknown Item',
                itemSku: itemDetails?.sku || 'N/A',
            };
        }));

        // NEW: Reusable Packaging Inventory Tracking
        // 1. Total Reusable Packaging Issued with products
        const reusablePackagingIssued = await Sale.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), ...dateMatch, "items.reusablePackagingItemIdSnapshot": { $ne: null } } },
            { $unwind: "$items" },
            { $match: { "items.reusablePackagingItemIdSnapshot": { $ne: null } } },
            {
                $group: {
                    _id: "$items.reusablePackagingItemIdSnapshot", // Group by the actual reusable packaging item ID
                    totalIssuedQuantity: { $sum: "$items.quantity" },
                }
            },
            { $lookup: { from: 'inventories', localField: '_id', foreignField: '_id', as: 'packagingDetails' } },
            { $unwind: '$packagingDetails' },
            { $project: {
                _id: 1,
                name: '$packagingDetails.name',
                sku: '$packagingDetails.sku',
                unit: '$packagingDetails.unit',
                totalIssuedQuantity: 1,
            }}
        ]);

        // 2. Total Reusable Packaging Returned to Stock (from returns)
        const reusablePackagingReturnedToStock = await Sale.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), ...dateMatch, "items.packagingQuantityReturned": { $gt: 0 }, "items.reusablePackagingItemIdSnapshot": { $ne: null } } },
            { $unwind: "$items" },
            { $match: { "items.packagingQuantityReturned": { $gt: 0 }, "items.reusablePackagingItemIdSnapshot": { $ne: null } } },
            {
                $group: {
                    _id: "$items.reusablePackagingItemIdSnapshot", // Group by the actual reusable packaging item ID
                    totalReceivedQuantity: { $sum: "$items.packagingQuantityReturned" },
                }
            },
            { $lookup: { from: 'inventories', localField: '_id', foreignField: '_id', as: 'packagingDetails' } },
            { $unwind: '$packagingDetails' },
            { $project: {
                _id: 1,
                name: '$packagingDetails.name',
                sku: '$packagingDetails.sku',
                unit: '$packagingDetails.unit',
                totalReceivedQuantity: 1,
            }}
        ]);

        // 3. Current live stock of actual reusable packaging items (empty inventory)
        const currentReusablePackagingStock = await Inventory.find({
            user: userId,
            isReusablePackaging: true,
            quantity: { $gt: 0 } // Only show those currently in stock
        }).select('name sku quantity unit');


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
                depositsRefundedDetails: depositsRefundedWithDetails, 
                otherPackagingSoldDetails: otherPackagingSold,
                // NEW: Reusable Packaging Tracking details
                reusablePackagingIssued,
                reusablePackagingReturnedToStock,
                currentReusablePackagingStock,
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
            const inventoryProduct = await Inventory.findById(saleItem.item).session(session);
            if (inventoryProduct) {
                inventoryProduct.quantity += saleItem.quantity;

                // Also revert stock for linked reusable packaging item if applicable
                if (saleItem.reusablePackagingItemIdSnapshot) {
                    const reusablePackagingItem = await Inventory.findOne({
                        _id: saleItem.reusablePackagingItemIdSnapshot,
                        user: userId,
                        isReusablePackaging: true
                    }).session(session);
                    if (reusablePackagingItem) {
                        // Only add back what was actually issued and NOT already returned via a separate packaging return
                        reusablePackagingItem.quantity += saleItem.quantity - (saleItem.packagingQuantityReturned || 0); 
                        await reusablePackagingItem.save({ session });
                    }
                }

                // Update product's stock status if it was out-of-stock or low-stock
                const newQuantity = inventoryProduct.quantity;
                const minStockLevel = inventoryProduct.minStockLevel || 0;
                if (newQuantity > minStockLevel && newQuantity > 0 && (inventoryProduct.status === 'low-stock' || inventoryProduct.status === 'out-of-stock')) {
                    inventoryProduct.status = 'in-stock';
                } else if (newQuantity > 0 && newQuantity <= minStockLevel && inventoryProduct.status !== 'low-stock') {
                    inventoryProduct.status = 'low-stock';
                }
                await inventoryProduct.save({ session });
            }
        }

        // Adjust customer's total spent and current balance
        if (saleToDelete.customer) {
            const customerToUpdate = await Customer.findById(saleToDelete.customer).session(session);
            if (customerToUpdate) {
                customerToUpdate.totalSpent = Math.max(0, customerToUpdate.totalSpent - saleToDelete.totalAmount);
                customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - (saleToDelete.totalAmount - saleToDelete.amountPaid)); 
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