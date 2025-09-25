const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Customer = require("../models/Customer");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const moment = require("moment"); // Ensure moment is installed

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
            .populate({ path: 'items.item', select: 'name sku packagingType packagingDeposit' })
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

        for (const saleItem of items) {
            const inventoryItem = await Inventory.findOne({ _id: saleItem.item, user: userId }).session(session);
            if (!inventoryItem) throw new Error(`Inventory item not found or does not belong to user.`);
            if (inventoryItem.quantity < saleItem.quantity) throw new Error(`Not enough stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${saleItem.quantity}.`);
            
            inventoryItem.quantity -= saleItem.quantity;
            saleItem.costPrice = inventoryItem.costPrice || 0; 
            
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
            receiptNumber, customer, items, totalAmount,
            subtotal, taxAmount, paymentMethod, notes,
            user: userId,
            amountPaid: amountPaid || 0,
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
        let totalItemsInSale = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        let totalItemsReturnedSoFar = 0;

        for (const returnedItem of returnedItems) {
            const originalSaleItem = sale.items.find(i => i.item.toString() === returnedItem.item);
            if (!originalSaleItem) throw new Error(`Item ${returnedItem.item} not found in original sale.`);

            if (returnedItem.quantity > originalSaleItem.quantity) {
                throw new Error(`Cannot return more than sold quantity for ${originalSaleItem.item.name}. Sold: ${originalSaleItem.quantity}, Attempted Return: ${returnedItem.quantity}.`);
            }

            const inventoryItem = await Inventory.findOne({ _id: returnedItem.item, user: userId }).session(session);
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

            totalReturnedValue += originalSaleItem.price * returnedItem.quantity;
            totalItemsReturnedSoFar += returnedItem.quantity;
        }

        sale.status = totalItemsReturnedSoFar >= totalItemsInSale ? 'Returned' : 'Partially Returned';
        
        sale.amountPaid = Math.max(0, sale.amountPaid - totalReturnedValue);

        await sale.save({ session });
        
        if (sale.customer) {
            const customerToUpdate = await Customer.findOne({ _id: sale.customer, user: userId }).session(session);
            if (!customerToUpdate) throw new Error("Associated customer not found or does not belong to user.");
            
            customerToUpdate.totalSpent = Math.max(0, customerToUpdate.totalSpent - totalReturnedValue);
            customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - totalReturnedValue);
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

exports.deleteSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const saleToDelete = await Sale.findOne({ _id: req.params.id, user: userId }).session(session);
        if (!saleToDelete) {
            throw new Error("Sale not found or does not belong to user.");
        }

        for (const soldItem of saleToDelete.items) {
            const inventoryItem = await Inventory.findOne({ _id: soldItem.item, user: userId }).session(session);
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

        if (saleToDelete.customer) {
            const customerToUpdate = await Customer.findOne({ _id: saleToDelete.customer, user: userId }).session(session);
            if (!customerToUpdate) throw new Error("Associated customer not found or does not belong to user.");
            
            customerToUpdate.totalSpent = Math.max(0, customerToUpdate.totalSpent - saleToDelete.totalAmount);
            customerToUpdate.currentBalance = Math.max(0, customerToUpdate.currentBalance - (saleToDelete.totalAmount - saleToDelete.amountPaid));
            await customerToUpdate.save({ session });
        }

        await Sale.findByIdAndDelete({ _id: req.params.id, user: userId }).session(session);
        await session.commitTransaction();
        res.json({ success: true, message: "Sale deleted and inventory restocked." });
    } catch (err) {
        await session.abortTransaction();
        console.error("Error deleting sale:", err);
        res.status(500).json({ success: false, message: err.message || "Server error deleting sale." });
    } finally {
        session.endSession();
    }
};

exports.getSalesAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
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
            user: userId,
        };

        const salesOverTime = await Sale.aggregate([
            { $match: dateQuery },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalRevenue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $sort: { _id: 1 } }
        ]);

        const mostProfitableProducts = await Sale.aggregate([
            { $match: dateQuery }, 
            { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $match: { "product.user": userId } },
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
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $match: { "product.user": userId } },
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
            { $match: { "inventoryItem.user": userId } },
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
                totalOutstandingBalance: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$amountPaid", 0] }] } },
            }},
            { $project: {
                _id: 0,
                totalRevenue: 1,
                totalSalesCount: 1,
                totalOutstandingBalance: 1,
            }}
        ]);
        
        const totalProfitCalculation = await Sale.aggregate([
            { $match: dateQuery },
            { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $match: { "product.user": userId } },
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
                    totalOutstandingBalance: overallStats[0]?.totalOutstandingBalance || 0,
                },
            }
        });
    } catch (err) {
        console.error("Sales analytics error:", err);
        res.status(500).json({ success: false, message: "Server error fetching analytics." });
    }
};

exports.generatePDF = async (req, res) => {
    try {
        const userId = req.user._id;
        const sale = await Sale.findOne({ _id: req.params.id, user: userId })
            .populate('customer')
            .populate('items.item', 'name sku unit packagingType packagingDeposit');

        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale not found or does not belong to user." });
        }

        const doc = new (require('pdfkit'))({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt-${sale.receiptNumber}.pdf`);
        doc.pipe(res);

        const formatCurrency = (amount) => `Rwf ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System User';

        doc.fontSize(20).font('Helvetica-Bold').text('SALES RECEIPT', { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(10).font('Helvetica').text(userName, 50, doc.y);
        doc.text('123 Business Rd, Kigali, Rwanda');
        doc.text('Email: info@cms.com');
        doc.text('Phone: +250 788 123 456');
        doc.moveDown(1);

        doc.font('Helvetica-Bold').text('Receipt Number:', 350, doc.y - 45, { align: 'right' });
        doc.font('Helvetica').text(sale.receiptNumber, 450, doc.y - 45, { align: 'right' });
        doc.font('Helvetica-Bold').text('Sale Date:', 350, doc.y - 30, { align: 'right' });
        doc.font('Helvetica').text(new Date(sale.createdAt).toLocaleDateString(), 450, doc.y - 30, { align: 'right' });
        doc.font('Helvetica-Bold').text('Payment Status:', 350, doc.y - 15, { align: 'right' });
        doc.font('Helvetica').text(sale.paymentStatus, 450, doc.y - 15, { align: 'right' });
        doc.moveDown(1);

        doc.font('Helvetica-Bold').text('Customer:');
        doc.font('Helvetica').text(sale.customer?.name || 'Walk-in Customer');
        if (sale.customer?.email) doc.text(sale.customer.email);
        if (sale.customer?.phone) doc.text(sale.customer.phone);
        doc.moveDown(2);

        const tableHeaders = ['Item', 'Qty', 'Unit Price', 'Packaging Deposit', 'Total'];
        const columnWidths = [200, 50, 90, 100, 90];
        let currentY = doc.y;

        doc.font('Helvetica-Bold').fontSize(10);
        tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown(0.5);
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(9);
        sale.items.forEach(item => {
            currentY = doc.y;
            doc.text(item.item.name, 50, currentY, { width: columnWidths[0] });
            doc.text(item.quantity, 50 + columnWidths[0], currentY, { width: columnWidths[1], align: 'center' });
            doc.text(formatCurrency(item.price), 50 + columnWidths[0] + columnWidths[1], currentY, { width: columnWidths[2], align: 'right' });
            const pkgDepositText = (item.packagingIncluded && item.packagingDepositCharged > 0) ? formatCurrency(item.packagingDepositCharged) : 'N/A';
            doc.text(pkgDepositText, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY, { width: columnWidths[3], align: 'right' });

            const itemTotal = (item.quantity * item.price) + (item.packagingIncluded ? item.quantity * item.packagingDepositCharged : 0);
            doc.text(formatCurrency(itemTotal), 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], currentY, { width: columnWidths[4], align: 'right' });
            doc.moveDown(0.7);
        });

        doc.moveDown(0.5);
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        const addTotalRow = (label, value, isBold = false) => {
            doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
            doc.text(label, 350, doc.y, { width: 100, align: 'right' });
            doc.text(value, 450, doc.y, { width: 100, align: 'right' });
            doc.moveDown(0.2);
        };

        addTotalRow('Subtotal:', formatCurrency(sale.subtotal));
        if (sale.taxAmount > 0) addTotalRow('Tax:', formatCurrency(sale.taxAmount));
        if (sale.items.some(item => item.packagingIncluded && item.packagingDepositCharged > 0)) {
            const totalPkgDeposit = sale.items.reduce((sum, item) => sum + (item.packagingIncluded ? item.quantity * item.packagingDepositCharged : 0), 0);
            addTotalRow('Packaging Deposit:', formatCurrency(totalPkgDeposit));
        }

        doc.moveDown(0.5);
        addTotalRow('Total Amount:', formatCurrency(sale.totalAmount), true);
        addTotalRow('Amount Paid:', formatCurrency(sale.amountPaid), true);
        if (sale.paymentStatus !== 'Paid') {
            const outstanding = sale.totalAmount - sale.amountPaid;
            addTotalRow('Outstanding Balance:', formatCurrency(outstanding), true);
        }
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, doc.y);
        doc.font('Helvetica').fontSize(9).text(sale.notes || 'N/A', 50, doc.y + 15, { width: 400 });
        doc.moveDown(3);

        doc.fontSize(10).font('Helvetica').text('Thank you for your business!', { align: 'center' });
        doc.text('Powered by Comprehensive Management System', { align: 'center' });

        doc.end();

    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).json({ success: false, message: "Server error generating PDF." });
    }
};