const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const PDFDocument = require('pdfkit');

const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const { verifyToken } = require('../middleware/auth');

router.get("/", verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'orderDate', order = 'desc' } = req.query;
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;
        
        const purchaseOrders = await PurchaseOrder.find()
            .populate('supplier', 'name email phone')
            .populate({
                path: 'items.item',
                select: 'name sku',
                model: 'Inventory'
            })
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await PurchaseOrder.countDocuments();
            
        const validPOs = purchaseOrders.filter(po => 
            po.items.every(item => item.item !== null)
        );

        res.json({ 
            success: true, 
            data: validPOs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            }
        });

    } catch (err) {
        console.error("Error fetching purchase orders:", err);
        res.status(500).json({ success: false, message: "Server Error: Could not fetch purchase orders.", error: err.message });
    }
});

router.post("/", verifyToken, [
    body('supplier', 'Supplier is required').isMongoId(),
    body('items', 'Items must be an array').isArray(),
    body('newItems', 'New items must be an array').optional().isArray(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    
    try {
        await session.startTransaction();

        const { supplier, items, newItems, ...poData } = req.body;
        const allPoItems = [...items];

        if (newItems && newItems.length > 0) {
            for (const newItemData of newItems) {
                const newInventoryItem = new Inventory({
                    name: newItemData.name,
                    sku: newItemData.sku,
                    category: newItemData.category,
                    price: newItemData.unitPrice,
                    unit: 'pcs',
                    quantity: 0,
                    status: 'on-order',
                    location: '60d5ecb4b39b2a1b2c8d5e8a',
                    minStockLevel: 10,
                });
                const savedItem = await newInventoryItem.save({ session });
                
                allPoItems.push({
                    item: savedItem._id,
                    quantity: newItemData.quantity || 1,
                    unitPrice: newItemData.unitPrice
                });
            }
        }
        
        const orderNumber = await PurchaseOrder.generateOrderNumber();

        const newPurchaseOrder = new PurchaseOrder({
            ...poData,
            orderNumber,
            supplier,
            items: allPoItems,
            status: 'Pending',
        });

        const savedPO = await newPurchaseOrder.save({ session });
        
        const existingItemIdsToUpdate = items.map(i => i.item);
        if (existingItemIdsToUpdate.length > 0) {
            await Inventory.updateMany(
                { _id: { $in: existingItemIdsToUpdate } },
                { $set: { status: "on-order" } },
                { session }
            );
        }

        await session.commitTransaction();
        const populatedPO = await PurchaseOrder.findById(savedPO._id).populate('supplier', 'name email');
        
        res.status(201).json({ success: true, message: "Purchase Order created successfully!", data: populatedPO });

    } catch (err) {
        await session.abortTransaction();
        console.error("--- PO CREATION FAILED ---", err);
        res.status(500).json({ success: false, message: err.message || "Server error creating Purchase Order." });
    } finally {
        session.endSession();
    }
});

router.patch("/:id/status", verifyToken, [
    body('status').isIn(['Pending', 'Ordered', 'Shipped', 'Completed', 'Cancelled']).withMessage('A valid status is required.'),
    body('receivedItems').optional().isArray(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    
    try {
        await session.startTransaction();
        const { status, receivedItems } = req.body;
        const po = await PurchaseOrder.findById(req.params.id).session(session);
        
        if (!po) throw new Error("Purchase Order not found.");
        if (['Completed', 'Cancelled'].includes(po.status)) throw new Error(`Order is already ${po.status}.`);
        
        if (status === 'Completed') {
            if (!receivedItems || receivedItems.length === 0) {
                throw new Error("Received items data is required to complete an order.");
            }
            for (const receivedItem of receivedItems) {
                await Inventory.updateOne(
                    { _id: receivedItem.item },
                    { 
                        $inc: { quantity: receivedItem.quantityReceived },
                        $set: { price: receivedItem.sellingPrice }
                    },
                    { session, runValidators: true }
                );
            }
            po.receivedDate = new Date();
        }

        if (status === 'Cancelled') {
            for (const poItem of po.items) {
                const inventoryItem = await Inventory.findById(poItem.item).session(session);
                if (inventoryItem && inventoryItem.status === 'on-order') {
                    const newStatus = inventoryItem.quantity > 0 ? 'in-stock' : 'out-of-stock';
                    inventoryItem.status = newStatus;
                    await inventoryItem.save({ session });
                }
            }
        }

        po.status = status;
        const updatedPO = await po.save({ session });

        await session.commitTransaction();
        res.json({ success: true, message: `Order status updated to ${status}.`, data: updatedPO });
    } catch (err) {
        await session.abortTransaction();
        console.error("--- PO STATUS UPDATE FAILED ---", err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
});

router.get("/:id/pdf", verifyToken, async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('supplier')
            .populate('items.item');

        if (!po) {
            return res.status(404).json({ success: false, message: "Purchase Order not found." });
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PO-${po.orderNumber}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).font('Helvetica').text('Your Company Name', { align: 'left' });
        doc.text('123 Business Rd, Kigali, Rwanda', { align: 'left' });
        
        doc.text(`PO Number: ${po.orderNumber}`, { align: 'right' });
        doc.text(`Order Date: ${new Date(po.orderDate).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);

        doc.font('Helvetica-Bold').text('Supplier:');
        doc.font('Helvetica').text(po.supplier.name);
        doc.text(po.supplier.email || '');
        doc.moveDown(2);

        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Quantity', 250, tableTop, { width: 90, align: 'right' });
        doc.text('Unit Price', 340, tableTop, { width: 90, align: 'right' });
        doc.text('Total', 430, tableTop, { width: 100, align: 'right' });
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown();

        doc.font('Helvetica');
        po.items.forEach(item => {
            const y = doc.y;
            doc.text(item.item.name, 50, y);
            doc.text(item.quantity.toString(), 250, y, { width: 90, align: 'right' });
            doc.text(`Rwf ${item.unitPrice.toLocaleString()}`, 340, y, { width: 90, align: 'right' });
            doc.text(`Rwf ${(item.quantity * item.unitPrice).toLocaleString()}`, 430, y, { width: 100, align: 'right' });
            doc.moveDown();
        });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        
        const totalsY = doc.y;
        doc.font('Helvetica');
        doc.text('Subtotal:', 350, totalsY, { align: 'right' });
        doc.text(`Rwf ${po.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, totalsY, { align: 'right' });
        doc.moveDown(0.5);
        doc.text('Tax:', 350, doc.y, { align: 'right' });
        doc.text(`Rwf ${po.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        doc.text('Shipping:', 350, doc.y, { align: 'right' });
        doc.text(`Rwf ${po.shippingCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, doc.y, { align: 'right' });
        doc.moveDown();
        
        doc.font('Helvetica-Bold');
        doc.text('Grand Total:', 350, doc.y, { align: 'right' });
        doc.text(`Rwf ${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, doc.y, { align: 'right' });

        doc.end();

    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).json({ success: false, message: "Server error generating PDF." });
    }
});

module.exports = router;