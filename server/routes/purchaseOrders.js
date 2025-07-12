const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   GET /api/purchase-orders
 * @desc    Get all purchase orders
 * @access  Protected
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const purchaseOrders = await PurchaseOrder.find()
            .populate('supplier', 'name email phone')
            .sort({ orderDate: -1 });
        res.json({ success: true, data: purchaseOrders });
    } catch (err) {
        console.error("Error fetching purchase orders:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @route   POST /api/purchase-orders
 * @desc    Create a new purchase order with advanced item/supplier handling
 * @access  Protected
 */
router.post("/", verifyToken, [
    body('supplierId', 'Supplier is required').not().isEmpty(),
    body('items', 'At least one item is required').isArray({ min: 1 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    
    try {
        await session.startTransaction();

        let { supplierId, newSupplier, items, ...poData } = req.body;
        
        if (supplierId === '_add_new_' && newSupplier) {
            let supplier = await Supplier.findOne({ email: newSupplier.email }).session(session);
            if (!supplier) supplier = await new Supplier(newSupplier).save({ session });
            supplierId = supplier._id;
        }
        
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
             throw new Error("A valid supplier could not be determined.");
        }

        // Process items: find existing or create new "placeholder" inventory items
        const processedItems = await Promise.all(items.map(async (item) => {
            if (item.isNew) {
                // If a new category was created on the frontend, it will be in item.category
                const newInventoryItem = new Inventory({
                    name: item.name,
                    sku: item.sku,
                    category: item.category || 'General', // Use category from form or default
                    unit: 'pcs',
                    price: item.unitPrice,
                    quantity: 0,
                    status: 'on-order',
                });
                const savedItem = await newInventoryItem.save({ session });
                return { ...item, item: savedItem._id };
            }
            return item;
        }));

        const orderNumber = await PurchaseOrder.generateOrderNumber();

        const newPurchaseOrder = new PurchaseOrder({
            ...poData,
            orderNumber,
            supplier: supplierId,
            items: processedItems,
            status: 'Pending',
        });

        const savedPO = await newPurchaseOrder.save({ session });
        await session.commitTransaction();
        const populatedPO = await savedPO.populate('supplier', 'name email');
        
        res.status(201).json({ success: true, message: "Purchase Order created!", data: populatedPO });

    } catch (err) {
        await session.abortTransaction();
        console.error("--- PO CREATION FAILED ---", err);
        res.status(500).json({ success: false, message: err.message || "Server error creating PO." });
    } finally {
        session.endSession();
    }
});

/**
 * @route   PATCH /api/purchase-orders/:id/status
 * @desc    Update a PO's status and finalize inventory
 * @access  Protected
 */
router.patch("/:id/status", verifyToken, async (req, res) => {
    const { status } = req.body;
    if (!status || !['Pending', 'Ordered', 'Shipped', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: "A valid status is required." });
    }

    const session = await mongoose.startSession();
    
    try {
        await session.startTransaction();
        const po = await PurchaseOrder.findById(req.params.id).session(session);
        if (!po) throw new Error("Purchase Order not found.");
        if (po.status === 'Completed' || po.status === 'Cancelled') throw new Error(`Order is already ${po.status}.`);
        
        if (status === 'Completed') {
            const inventoryUpdatePromises = po.items.map(async (poItem) => {
                const inventoryItem = await Inventory.findById(poItem.item).session(session);
                if (!inventoryItem) return; // Skip if item somehow doesn't exist

                inventoryItem.quantity += poItem.quantity;
                if (inventoryItem.category === 'Pending Arrival') {
                    inventoryItem.category = poItem.category || 'General';
                }
                inventoryItem.status = 'in-stock';
                return inventoryItem.save({ session });
            });
            await Promise.all(inventoryUpdatePromises);
            po.receivedDate = new Date();
        }
        po.status = status;
        const updatedPO = await po.save({ session });
        await session.commitTransaction();
        res.json({ success: true, message: `Order status updated.`, data: updatedPO });
    } catch (err) {
        await session.abortTransaction();
        console.error("--- PO STATUS UPDATE FAILED ---", err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
});

module.exports = router;