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
        const { customerId, startDate, endDate, paymentMethod, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
        const query = {};
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        if (customerId) query.customer = customerId;
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (paymentMethod) query.paymentMethod = paymentMethod;

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
        const { items, customer, totalAmount, subtotal, taxAmount, paymentMethod, notes } = req.body;

        for (const saleItem of items) {
            const inventoryItem = await Inventory.findById(saleItem.item).session(session);
            if (!inventoryItem) throw new Error(`Inventory item not found.`);
            if (inventoryItem.quantity < saleItem.quantity) throw new Error(`Not enough stock for ${inventoryItem.name}.`);
            
            inventoryItem.quantity -= saleItem.quantity;
            saleItem.costPrice = inventoryItem.costPrice || 0; 
            
            if (inventoryItem.quantity <= inventoryItem.minStockLevel && inventoryItem.status !== 'low-stock') {
                 const notification = new Notification({
                    type: 'low_stock',
                    title: 'Low Stock Alert',
                    message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is running low. Quantity: ${inventoryItem.quantity}.`,
                    user: req.user._id,
                    link: `/inventory`
                });
                await notification.save({ session });
            }
            
            await inventoryItem.save({ session });
        }
        
        const receiptNumber = await Sale.generateReceiptNumber();
        const newSale = new Sale({
            receiptNumber, customer, items, totalAmount,
            subtotal, taxAmount, paymentMethod, notes,
        });
        
        if (customer) {
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
        res.status(500).json({ success: false, message: err.message || "Server error while creating sale." });
    } finally {
        session.endSession();
    }
});

router.post("/analytics", verifyToken, async (req, res) => {
    try {
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
        };

        const salesOverTime = await Sale.aggregate([
            { $match: dateQuery },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } } } },
            { $sort: { _id: 1 } }
        ]);

        const mostProfitableProducts = await Sale.aggregate([
            { $match: dateQuery }, 
            { $unwind: "$items" },
            { $group: { 
                _id: "$items.item", 
                totalProfit: { $sum: { $multiply: [{ $ifNull: ["$items.quantity", 0] }, { $subtract: [{ $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.costPrice", 0] }] }] } } 
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
                totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } }, 
                count: { $sum: 1 } 
            }},
            { $sort: { totalAmount: -1 } }
        ]);

        const topSellingProductsByQuantity = await Sale.aggregate([
            { $match: dateQuery }, 
            { $unwind: "$items" },
            { $group: { _id: "$items.item", totalQuantitySold: { $sum: { $ifNull: ["$items.quantity", 0] } } } },
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
                    totalRevenue: { $sum: { $multiply: [{ $ifNull: ["$items.quantity", 0] }, { $ifNull: ["$items.price", 0] }] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $project: { _id: 0, name: "$_id", value: "$totalRevenue" } }
        ]);


        const overallStats = await Sale.aggregate([
            { $match: dateQuery },
            { $group: {
                _id: null,
                totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
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
            {
                $group: {
                    _id: null,
                    totalProfit: { $sum: { $multiply: [{ $ifNull: ["$items.quantity", 0] }, { $subtract: [{ $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.costPrice", 0] }] }] } }
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
        res.status(500).json({ success: false, message: "Server Error fetching analytics." });
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
        const { returnedItems } = req.body;
        const sale = await Sale.findById(req.params.id).session(session);
        if (!sale) throw new Error("Original sale not found.");

        let totalReturnedValue = 0;
        let totalItemsInSale = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        let totalItemsReturnedSoFar = 0;

        for (const returnedItem of returnedItems) {
            const originalItem = sale.items.find(i => i.item.toString() === returnedItem.item);
            if (!originalItem) throw new Error("Item not found in original sale.");

            await Inventory.updateOne(
                { _id: returnedItem.item },
                { $inc: { quantity: returnedItem.quantity } },
                { session }
            );
            totalReturnedValue += originalItem.price * returnedItem.quantity;
            totalItemsReturnedSoFar += returnedItem.quantity;
        }

        sale.status = totalItemsReturnedSoFar >= totalItemsInSale ? 'Returned' : 'Partially Returned';
        await sale.save({ session });
        
        if (sale.customer) {
             await Customer.findByIdAndUpdate(sale.customer, {
                $inc: { totalSpent: -totalReturnedValue }
            }).session(session);
        }

        await session.commitTransaction();
        res.json({ success: true, message: "Items returned and inventory restocked." });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: err.message || "Server error processing return." });
    } finally {
        session.endSession();
    }
});

router.delete("/:id", verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const saleToDelete = await Sale.findById(req.params.id).session(session);
        if (!saleToDelete) {
            throw new Error("Sale not found.");
        }

        for (const soldItem of saleToDelete.items) {
            await Inventory.updateOne(
                { _id: soldItem.item },
                { $inc: { quantity: soldItem.quantity } },
                { session }
            );
        }

        await Sale.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        res.json({ success: true, message: "Sale deleted and inventory restocked." });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: err.message || "Server error deleting sale." });
    } finally {
        session.endSession();
    }
});

router.get("/:id/pdf", verifyToken, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id).populate('customer').populate('items.item', 'name sku');
        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale not found." });
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
        doc.moveDown(2);

        const tableTop = doc.y;
        const itemX = 50;
        const quantityX = 300;
        const unitPriceX = 380;
        const totalX = 470;

        doc.font('Helvetica-Bold');
        doc.text('Item', itemX, tableTop);
        doc.text('Quantity', quantityX, tableTop, { width: 80, align: 'center' });
        doc.text('Unit Price', unitPriceX, tableTop, { width: 90, align: 'right' });
        doc.text('Total', totalX, tableTop, { width: 90, align: 'right' });

        const tableHeaderY = tableTop + 20;
        doc.moveTo(itemX, tableHeaderY).lineTo(doc.page.width - itemX, tableHeaderY).stroke();
        
        let currentY = tableHeaderY + 10;
        doc.font('Helvetica');

        sale.items.forEach(item => {
            doc.text(item.item.name, itemX, currentY);
            doc.text(item.quantity.toString(), quantityX, currentY, { width: 80, align: 'center' });
            doc.text(`Rwf ${item.price.toLocaleString()}`, unitPriceX, currentY, { width: 90, align: 'right' });
            doc.text(`Rwf ${(item.quantity * item.price).toLocaleString()}`, totalX, currentY, { width: 90, align: 'right' });
            currentY += 20;
        });

        const tableFooterY = currentY;
        doc.moveTo(itemX, tableFooterY).lineTo(doc.page.width - itemX, tableFooterY).stroke();
        doc.y = tableFooterY + 20;

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Grand Total:', 350, doc.y, { align: 'right' });
        doc.text(formatCurrency(sale.totalAmount), 450, doc.y, { align: 'right' });

        doc.end();
    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).json({ success: false, message: "Server error generating PDF." });
    }
});

module.exports = router;