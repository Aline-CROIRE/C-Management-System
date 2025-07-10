// routes/purchaseOrders.js

const express = require("express");
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');

// Note: All routes in this file should be protected by authentication middleware

// --- GET All Purchase Orders ---
router.get("/", async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, data: pos });
  } catch (err) {
    console.error("Error fetching purchase orders:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --- POST a New Purchase Order ---
router.post("/", async (req, res) => {
  try {
    const { supplier, items, expectedDate, notes } = req.body;

    if (!supplier || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Supplier and at least one item are required." });
    }

    // Server-side calculation of total amount is more secure
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

    const newPO = new PurchaseOrder({
      supplier,
      items,
      totalAmount,
      expectedDate,
      notes,
      // createdBy: req.user.id // Add this when auth is ready
    });

    const savedPO = await newPO.save();
    res.status(201).json({ success: true, message: "Purchase Order created successfully!", data: savedPO });
  } catch (err) {
    console.error("Error creating purchase order:", err);
    res.status(500).json({ success: false, message: "Server Error while creating purchase order." });
  }
});

// --- PATCH (Update) a PO's Status ---
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['Pending', 'Ordered', 'Partial', 'Received', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status provided." });
        }

        const po = await PurchaseOrder.findById(id);
        if (!po) {
            return res.status(404).json({ success: false, message: "Purchase Order not found" });
        }
        
        // When a PO is marked "Received", update the main inventory stock
        if (status === 'Received' && po.status !== 'Received') {
            for (const poItem of po.items) {
                await Inventory.findByIdAndUpdate(poItem.item, {
                    $inc: { quantity: poItem.quantity }
                });
            }
            po.receivedDate = new Date();
        }

        po.status = status;
        const updatedPO = await po.save();
        
        res.json({ success: true, message: `PO status updated to ${status}`, data: updatedPO });
    } catch (err) {
        console.error("Error updating PO status:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;