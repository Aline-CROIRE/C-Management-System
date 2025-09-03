const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const PDFDocument = require('pdfkit');
const moment = require("moment");

const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Customer = require("../models/Customer");
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        const { customerId, startDate, endDate, paymentMethod, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
        const query = { user: userId }; // Filter by user ID here!

        if (customerId) query.customer = customerId;
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (paymentMethod) query.paymentMethod = paymentMethod;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const sales = await Sale.find(query)
            .populate('customer', 'name')
            .populate({ path: 'items.item', select: 'name sku' })
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
});

router.post("/", verifyToken, [
    body('items', 'At least one item is required').isArray({ min: 1 }),
    body('totalAmount', 'Total amount is required').isNumeric(),
    body('paymentMethod', 'Payment method is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id; // Get user ID
        const { items, customer, totalAmount, subtotal, taxAmount, paymentMethod, notes } = req.body;

        for (const saleItem of items) {
            const inventoryItem = await Inventory.findOne({ _id: saleItem.item, user: userId }).session(session); // Filter by user
            if (!inventoryItem) throw new Error(`Inventory item not found or does not belong to user.`);
            if (inventoryItem.quantity < saleItem.quantity) throw new Error(`Not enough stock for ${inventoryItem.name}.`);
            
            inventoryItem.quantity -= saleItem.quantity;
            saleItem.costPrice = inventoryItem.costPrice || 0; 
            
            const newQuantity = inventoryItem.quantity;
            const minStockLevel = inventoryItem.minStockLevel || 0;

            if (newQuantity <= 0 && inventoryItem.status !== 'out-of-stock') {
                 const notification = new Notification({
                    user: userId,
                    type: 'out_of_stock',
                    title: 'Out of Stock Alert',
                    message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is now out of stock.`,
                    priority: 'critical',
                    link: `/inventory/${inventoryItem._id}`,
                    relatedId: inventoryItem._id,
                });
                await notification.save({ session });
                inventoryItem.status = 'out-of-stock';
            } else if (newQuantity <= minStockLevel && newQuantity > 0 && inventoryItem.status !== 'low-stock') {
                 const notification = new Notification({
                    user: userId,
                    type: 'low_stock',
                    title: 'Low Stock Alert',
                    message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is running low. Quantity: ${newQuantity}.`,
                    priority: 'high',
                    link: `/inventory/${inventoryItem._id}`,
                    relatedId: inventoryItem._id,
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
            receiptNumber, customer, items, totalAmount,
            subtotal, taxAmount, paymentMethod, notes,
            user: userId, // <-- IMPORTANT: Assign user ID to the Sale itself
        });
        
        if (customer) {
            // Assuming customer is global or has its own user filtering for updates
            await Customer.findByIdAndUpdate(customer, {
                $inc: { totalSpent: totalAmount },
                $set: { lastSaleDate: new Date() }
            }).session(session);
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
});

router.post("/analytics", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate || !moment(startDate).isValid() || !moment(endDate).isValid()) {
            return res.status(400).json({ success: false, message: "Invalid or missing start/end dates." });
        }

        const queryStartDate = moment(startDate).startOf('day').toDate();
        const queryEndDate = moment(endDate).endOf('day').toDate();

        const dateQuery = {
            createdAt: {
                $gte: queryStartDate,
                $lte: queryEndDate,
            },
            user: userId, // Filter by user ID
        };

        const salesOverTime = await Sale.aggregate([
            { $match: dateQuery },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalRevenue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $sort: { _id: 1 } }
        ]);

        const mostProfitableProducts = await Sale.aggregate([
            { $match: dateQuery }, 
            { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }}, // Lookup inventory
            { $unwind: "$product" },
            { $match: { "product.user": userId } }, // Ensure linked product also belongs to user
            { $group: { 
                _id: "$items.item", 
                totalProfit: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$items.quantity" }, 0] }, { $subtract: [{ $ifNull: [{ $toDouble: "$items.price" }, 0] }, { $ifNull: [{ $toDouble: "$items.costPrice" }, 0] }] }] } } 
            }},
            { $sort: { totalProfit: -1 } }, 
            { $limit: 5 },
            { $lookup: { from: "inventories", localField: "_id", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $project: { name: "$product.name", sku: "$product.sku", totalProfit: 1 } }
        ]);

        const salesByPaymentMethod = await Sale.aggregate([
            { $match: dateQuery },
            { $group: { 
                _id: { $ifNull: ["$paymentMethod", "Other/Unknown Payment"] }, 
                totalAmount: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } }, 
                count: { $sum: 1 } 
            }},
            { $sort: { totalAmount: -1 } }
        ]);

        const topSellingProductsByQuantity = await Sale.aggregate([
            { $match: dateQuery }, 
            { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }}, // Lookup inventory
            { $unwind: "$product" },
            { $match: { "product.user": userId } }, // Ensure linked product also belongs to user
            { $group: { _id: "$items.item", totalQuantitySold: { $sum: { $ifNull: [{ $toDouble: "$items.quantity" }, 0] } } } },
            { $sort: { totalQuantitySold: -1 } }, 
            { $limit: 5 },
            { $lookup: { from: "inventories", localField: "_id", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $project: { name: "$product.name", sku: "$product.sku", totalQuantitySold: 1 } }
        ]);
        
        const salesByCategory = await Sale.aggregate([
            { $match: dateQuery },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "inventories",
                    localField: "items.item",
                    foreignField: "_id",
                    as: "inventoryItem"
                }
            },
            { $unwind: "$inventoryItem" },
            { $match: { "inventoryItem.user": userId } }, // Filter by user for inventory item
            {
                $lookup: {
                    from: "categories",
                    localField: "inventoryItem.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$categoryDetails.name", "Uncategorized"] },
                    totalRevenue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$items.quantity" }, 0] }, { $ifNull: [{ $toDouble: "$items.price" }, 0] }] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $project: { _id: 0, name: "$_id", value: "$totalRevenue" } }
        ]);


        const overallStats = await Sale.aggregate([
            { $match: dateQuery },
            { $group: {
                _id: null,
                totalRevenue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } },
                totalSalesCount: { $sum: 1 },
            }},
            { $project: {
                _id: 0,
                totalRevenue: 1,
                totalSalesCount: 1,
            }}
        ]);
        
        const totalProfitCalculation = await Sale.aggregate([
            { $match: dateQuery },
            { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }}, // Lookup inventory
            { $unwind: "$product" },
            { $match: { "product.user": userId } }, // Ensure linked product also belongs to user
            {
                $group: {
                    _id: null,
                    totalProfit: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$items.quantity" }, 0] }, { $subtract: [{ $ifNull: [{ $toDouble: "$items.price" }, 0] }, { $ifNull: [{ $toDouble: "$items.costPrice" }, 0] }] }] } }
                }
            },
            { $project: { _id: 0, totalProfit: 1 } }
        ]);
        const calculatedTotalProfit = totalProfitCalculation[0]?.totalProfit || 0;


        res.json({
            success: true,
            data: {
                salesOverTime,
                mostProfitableProducts,
                salesByPaymentMethod,
                topSellingProductsByQuantity,
                salesByCategory,
                overallStats: {
                    totalRevenue: overallStats[0]?.totalRevenue || 0,
                    totalSalesCount: overallStats[0]?.totalSalesCount || 0,
                    totalProfit: calculatedTotalProfit,
                },
            }
        });
    } catch (err) {
        console.error("Sales analytics error:", err);
        res.status(500).json({ success: false, message: "Server error fetching analytics." });
    }
});

router.post("/:id/return", verifyToken, [
    body('returnedItems', 'Returned items data is required').isArray({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id; // Get user ID
        const { returnedItems } = req.body;
        const sale = await Sale.findOne({ _id: req.params.id, user: userId }).session(session); // Filter by user
        if (!sale) throw new Error("Original sale not found or does not belong to user.");

        let totalReturnedValue = 0;
        let totalItemsInSale = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        let totalItemsReturnedSoFar = 0;

        for (const returnedItem of returnedItems) {
            const originalItem = sale.items.find(i => i.item.toString() === returnedItem.item);
            if (!originalItem) throw new Error("Item not found in original sale.");

            const inventoryItem = await Inventory.findOne({ _id: returnedItem.item, user: userId }).session(session); // Filter by user
            if (!inventoryItem) throw new Error(`Inventory item ${returnedItem.item} not found or does not belong to user for return.`);

            inventoryItem.quantity += returnedItem.quantity;

            const newQuantity = inventoryItem.quantity;
            const minStockLevel = inventoryItem.minStockLevel || 0;
            if (inventoryItem.status === 'out-of-stock' && newQuantity > 0) {
                inventoryItem.status = (newQuantity <= minStockLevel) ? 'low-stock' : 'in-stock';
            } else if (inventoryItem.status === 'low-stock' && newQuantity > minStockLevel) {
                inventoryItem.status = 'in-stock';
            }
            await inventoryItem.save({ session });


            totalReturnedValue += originalItem.price * returnedItem.quantity;
            totalItemsReturnedSoFar += returnedItem.quantity;
        }

        sale.status = totalItemsReturnedSoFar >= totalItemsInSale ? 'Returned' : 'Partially Returned';
        await sale.save({ session });
        
        if (sale.customer) {
             // Assuming customer is global or has its own user filtering for updates
             await Customer.findByIdAndUpdate(sale.customer, {
                $inc: { totalSpent: -totalReturnedValue }
            }).session(session);
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
});

router.delete("/:id", verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id; // Get user ID
        const saleToDelete = await Sale.findOne({ _id: req.params.id, user: userId }).session(session); // Filter by user
        if (!saleToDelete) {
            throw new Error("Sale not found or does not belong to user.");
        }

        for (const soldItem of saleToDelete.items) {
            const inventoryItem = await Inventory.findOne({ _id: soldItem.item, user: userId }).session(session); // Filter by user
            if (inventoryItem) {
                inventoryItem.quantity += soldItem.quantity;

                const newQuantity = inventoryItem.quantity;
                const minStockLevel = inventoryItem.minStockLevel || 0;
                if (inventoryItem.status === 'out-of-stock' && newQuantity > 0) {
                    inventoryItem.status = (newQuantity <= minStockLevel) ? 'low-stock' : 'in-stock';
                } else if (inventoryItem.status === 'low-stock' && newQuantity > minStockLevel) {
                    inventoryItem.status = 'in-stock';
                }
                await inventoryItem.save({ session });
            }
        }

        await Sale.findByIdAndDelete({ _id: req.params.id, user: userId }).session(session); // Filter by user
        await session.commitTransaction();
        res.json({ success: true, message: "Sale deleted and inventory restocked." });
    } catch (err) {
        await session.abortTransaction();
        console.error("Error deleting sale:", err);
        res.status(500).json({ success: false, message: err.message || "Server error deleting sale." });
    } finally {
        session.endSession();
    }
});

router.get("/:id/pdf", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        const sale = await Sale.findOne({ _id: req.params.id, user: userId }).populate('customer').populate('items.item', 'name sku'); // Filter by user
        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale not found or does not belong to user." });
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt-${sale.receiptNumber}.pdf`);
        doc.pipe(res);

        const formatCurrency = (amount) => `Rwf ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System User';

        doc.fontSize(20).font('Helvetica-Bold').text('SALES RECEIPT', { align: 'center' });
        doc.moveDown(2);

        const headerTopY = doc.y;
        doc.fontSize(10).font('Helvetica').text(userName, 50, headerTopY);
        doc.text('123 Business Rd, Kigali, Rwanda');
        
        doc.font('Helvetica-Bold').text('Receipt Number:', 350, headerTopY, { align: 'right' });
        doc.font('Helvetica').text(sale.receiptNumber, 450, headerTopY, { align: 'right' });
        doc.font('Helvetica-Bold').text('Sale Date:', 350, headerTopY + 15, { align: 'right' });
        doc.font('Helvetica').text(new Date(sale.createdAt).toLocaleDateString(), 450, headerTopY + 15, { align: 'right' });

        doc.y = headerTopY + 50;
        doc.font('Helvetica-Bold').text('Customer:');
        doc.font('Helvetica').text(sale.customer?.name || sale.customerName || 'Walk-in Customer');
    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).json({ success: false, message: "Server error generating PDF." });
    }
});

module.exports = router;