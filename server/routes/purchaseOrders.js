const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const PDFDocument = require('pdfkit');
const moment = require("moment");

const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const Notification = require("../models/Notification"); // Import Notification model
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
                select: 'name sku price status quantity costPrice',
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
        res.status(500).json({ success: false, message: "Server Error: Could not fetch purchase orders." });
    }
});

router.post("/", verifyToken, [
    body('supplier').isMongoId(),
    body('items').isArray(),
    body('newItems').optional().isArray(),
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
                    price: newItemData.sellingPrice || 0,
                    costPrice: newItemData.unitPrice,
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
        
        if (['Completed', 'Cancelled'].includes(po.status) && po.status !== status) {
            throw new Error(`Order is already ${po.status}. Cannot change its status.`);
        }

        if (status === 'Completed') {
            if (!receivedItems || receivedItems.length === 0) {
                throw new Error("Received items data is required to complete an order.");
            }
            for (const receivedItem of receivedItems) {
                if (!mongoose.Types.ObjectId.isValid(receivedItem.item)) {
                    console.warn(`Skipping invalid item ID in received items for PO ${po._id}: ${receivedItem.item}`);
                    continue; 
                }
                const inventoryItem = await Inventory.findById(receivedItem.item).session(session);
                if (inventoryItem) {
                    const currentCostPrice = inventoryItem.costPrice || 0;
                    if (Number(receivedItem.sellingPrice) < currentCostPrice) {
                        throw new Error(`Selling price for ${inventoryItem.name} (Rwf ${receivedItem.sellingPrice.toLocaleString()}) cannot be below its cost price (Rwf ${currentCostPrice.toLocaleString()}).`);
                    }

                    inventoryItem.quantity += receivedItem.quantityReceived;
                    inventoryItem.price = receivedItem.sellingPrice;

                    const originalPoItem = po.items.find(item => item.item.toString() === receivedItem.item);
                    if (originalPoItem) {
                        if (!inventoryItem.costPrice) { 
                            inventoryItem.costPrice = originalPoItem.unitPrice;
                        }
                    } else {
                        console.warn(`Original PO item not found for inventory item ${receivedItem.item} in PO ${po._id}. Cost price not updated.`);
                    }
                    inventoryItem.status = 'in-stock';
                    
                    await inventoryItem.save({ session });
                } else {
                    console.warn(`Inventory item with ID ${receivedItem.item} not found when receiving PO ${po._id}.`);
                }
            }
            po.receivedDate = new Date();

            // --- Notification for PO Completion ---
            const notification = new Notification({
                user: req.user._id,
                title: 'Purchase Order Completed',
                message: `Purchase Order #${po.orderNumber} has been successfully completed.`,
                type: 'po_completed',
                priority: 'low',
                link: `/purchase-orders/${po._id}`,
                relatedId: po._id,
            });
            await notification.save({ session });
        }

        if (status === 'Cancelled') {
            for (const poItem of po.items) {
                 if (!mongoose.Types.ObjectId.isValid(poItem.item)) {
                    console.warn(`Skipping invalid item ID in PO items for cancellation of PO ${po._id}: ${poItem.item}`);
                    continue; 
                }
                const inventoryItem = await Inventory.findById(poItem.item).session(session);
                if (inventoryItem && inventoryItem.status === 'on-order') {
                    inventoryItem.status = inventoryItem.quantity > 0 ? 'in-stock' : 'out-of-stock';
                    await inventoryItem.save({ session });
                }
            }
            // --- Notification for PO Cancellation ---
            const notification = new Notification({
                user: req.user._id,
                title: 'Purchase Order Cancelled',
                message: `Purchase Order #${po.orderNumber} has been cancelled.`,
                type: 'warning',
                priority: 'medium',
                link: `/purchase-orders/${po._id}`,
                relatedId: po._id,
            });
            await notification.save({ session });
        }

        po.status = status;
        const updatedPO = await po.save({ session });
        await session.commitTransaction();
        res.json({ success: true, message: `Order status updated to ${status}.`, data: updatedPO });
    } catch (err) {
        await session.abortTransaction();
        if (err.message.includes("Selling price for")) {
             return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: err.message || "Server error updating Purchase Order status." });
    } finally {
        session.endSession();
    }
});

router.delete("/:id", verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const poId = req.params.id;
        const poToDelete = await PurchaseOrder.findById(poId).session(session);

        if (!poToDelete) {
            throw new Error("Purchase Order not found.");
        }

        if (['Pending', 'Ordered', 'Shipped'].includes(poToDelete.status)) {
            for (const poItem of poToDelete.items) {
                 if (!mongoose.Types.ObjectId.isValid(poItem.item)) {
                    console.warn(`Skipping invalid item ID in PO items for deletion of PO ${poToDelete._id}: ${poItem.item}`);
                    continue; 
                }
                const inventoryItem = await Inventory.findById(poItem.item).session(session);
                if (inventoryItem && inventoryItem.status === 'on-order') {
                    inventoryItem.status = inventoryItem.quantity > 0 ? 'in-stock' : 'out-of-stock';
                    await inventoryItem.save({ session });
                }
            }
        }

        await PurchaseOrder.findByIdAndDelete(poId).session(session);
        await session.commitTransaction();
        res.json({ success: true, message: "Purchase Order deleted successfully." });

    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: err.message || "Server error deleting Purchase Order." });
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

        const formatCurrency = (amount) => `Rwf ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System User';

        doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'center' });
        doc.moveDown(2);

        const headerTopY = doc.y;
        doc.fontSize(10).font('Helvetica').text(userName, 50, headerTopY);
        doc.text('123 Business Rd, Kigali, Rwanda');
        
        doc.font('Helvetica-Bold').text('PO Number:', 400, headerTopY, { width: 80, align: 'left' });
        doc.font('Helvetica').text(po.orderNumber, 480, headerTopY, { align: 'left' });
        doc.font('Helvetica-Bold').text('Order Date:', 400, headerTopY + 15, { width: 80, align: 'left' });
        doc.font('Helvetica').text(new Date(po.orderDate).toLocaleDateString(), 480, headerTopY + 15, { align: 'left' });

        doc.y = headerTopY + 50;
        doc.moveDown(1);
        
        doc.font('Helvetica-Bold').text('Supplier:');
        doc.font('Helvetica').text(po.supplier.name);
        doc.text(po.supplier.email || 'No email provided');
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

        po.items.forEach(item => {
            doc.text(item.item.name, itemX, currentY);
            doc.text(item.quantity.toString(), quantityX, currentY, { width: 80, align: 'center' });
            doc.text(`Rwf ${item.unitPrice.toLocaleString()}`, unitPriceX, currentY, { width: 90, align: 'right' });
            doc.text(`Rwf ${(item.quantity * item.unitPrice).toLocaleString()}`, totalX, currentY, { width: 90, align: 'right' });
            currentY += 20;
        });

        const tableFooterY = currentY;
        doc.moveTo(itemX, tableFooterY).lineTo(doc.page.width - itemX, tableFooterY).stroke();
        doc.y = tableFooterY + 10;
        
        const totalsXLabel = 380;
        const totalsXValue = 470;
        let totalsY = doc.y;

        doc.font('Helvetica');
        doc.text('Subtotal:', totalsXLabel, totalsY, { align: 'left' });
        doc.text(formatCurrency(po.subtotal), totalsXValue, totalsY, { align: 'right' });
        totalsY += 15;
        doc.text('Tax:', totalsXLabel, totalsY, { align: 'left' });
        doc.text(formatCurrency(po.taxAmount), totalsXValue, totalsY, { align: 'right' });
        totalsY += 15;
        doc.text('Shipping:', totalsXLabel, totalsY, { align: 'left' });
        doc.text(formatCurrency(po.shippingCost), totalsXValue, totalsY, { align: 'right' });
        doc.moveDown(1);
        
        totalsY = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Grand Total:', totalsXLabel, totalsY, { align: 'left' });
        doc.text(formatCurrency(po.totalAmount), totalsXValue, totalsY, { align: 'right' });

        doc.end();

    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).json({ success: false, message: "Server error generating PDF." });
    }
});

module.exports = router;