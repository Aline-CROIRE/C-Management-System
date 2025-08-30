const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const PDFDocument = require('pdfkit');

const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate({ path: 'items.item', select: 'name sku' })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: sales });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.post("/", verifyToken, [
    body('items', 'At least one item is required').isArray({ min: 1 }),
    body('totalAmount', 'Total amount is required').isNumeric(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, customerName, totalAmount } = req.body;

        for (const saleItem of items) {
            const inventoryItem = await Inventory.findById(saleItem.item).session(session);
            if (!inventoryItem) {
                throw new Error(`Inventory item not found.`);
            }
            if (inventoryItem.quantity < saleItem.quantity) {
                throw new Error(`Not enough stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${saleItem.quantity}.`);
            }
            inventoryItem.quantity -= saleItem.quantity;
            await inventoryItem.save({ session });
        }
        
        const receiptNumber = await Sale.generateReceiptNumber();
        const newSale = new Sale({
            receiptNumber,
            customerName,
            items,
            totalAmount,
        });
        
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

router.delete("/:id", verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const saleToDelete = await Sale.findById(req.params.id).session(session);
        if (!saleToDelete) {
            throw new Error("Sale not found.");
        }

        // Add back the sold quantities to the inventory
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
        const sale = await Sale.findById(req.params.id).populate('items.item', 'name sku');
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
        doc.font('Helvetica').text(sale.customerName);
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
        res.status(500).json({ success: false, message: "Server error generating PDF." });
    }
});

module.exports = router;