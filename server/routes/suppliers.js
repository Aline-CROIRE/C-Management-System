const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose'); // For ObjectId validation

const Supplier = require("../models/Supplier");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        // Add user filter to the query
        const suppliers = await Supplier.find({ user: userId }).sort({ name: 1 });
        res.json({ success: true, data: suppliers });
    } catch (err) {
        console.error("Error fetching suppliers:", err);
        res.status(500).json({ success: false, message: "Server Error fetching suppliers." });
    }
});

router.get("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Supplier not found (invalid ID format)." });
        }

        // Add user filter to the query
        const supplier = await Supplier.findOne({ _id: id, user: userId });
        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier not found or does not belong to user." });
        }
        res.json({ success: true, data: supplier });
    } catch (err) {
        console.error("Error fetching supplier by ID:", err);
        res.status(500).json({ success: false, message: "Server Error fetching supplier." });
    }
});

router.post("/", verifyToken, [
    body('name', 'Supplier name is required').not().isEmpty().trim(),
    body('email', 'Invalid email format').optional().isEmail(),
    body('phone', 'Phone number is required').optional().not().isEmpty().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const userId = req.user._id; // Get user ID
        const { name, email, phone, address, contactPerson, notes } = req.body;

        // Check for duplicate name, email, or phone for THIS USER
        const existingSupplier = await Supplier.findOne({
            user: userId,
            $or: [
                { name: name },
                { email: email || null, email: { $ne: null } }, // Only check email if provided
                { phone: phone || null, phone: { $ne: null } }  // Only check phone if provided
            ]
        });

        if (existingSupplier) {
            let message = "A supplier with this name already exists for this user.";
            if (existingSupplier.email === email && email) message = "A supplier with this email already exists for this user.";
            if (existingSupplier.phone === phone && phone) message = "A supplier with this phone number already exists for this user.";
            return res.status(400).json({ success: false, message });
        }

        const newSupplier = new Supplier({
            user: userId, // Assign user ID
            name, contactPerson, email, phone, address, notes
        });
        await newSupplier.save();
        res.status(201).json({ success: true, message: "Supplier created successfully!", data: newSupplier });
    } catch (err) {
        console.error("Error creating supplier:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error creating supplier." });
    }
});

router.put("/:id", verifyToken, [
    body('name', 'Supplier name is required').not().isEmpty().trim(),
    body('email', 'Invalid email format').optional().isEmail(),
    body('phone', 'Phone number is required').optional().not().isEmpty().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const userId = req.user._id; // Get user ID
        const { id } = req.params;
        const { name, email, phone, address, contactPerson, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Supplier not found (invalid ID format)." });
        }

        // Check for duplicate name, email, or phone for THIS USER, excluding the current supplier
        const existingSupplier = await Supplier.findOne({
            user: userId,
            _id: { $ne: id }, // Exclude the current supplier being updated
            $or: [
                { name: name },
                { email: email || null, email: { $ne: null } },
                { phone: phone || null, phone: { $ne: null } }
            ]
        });

        if (existingSupplier) {
            let message = "A supplier with this name already exists for this user.";
            if (existingSupplier.email === email && email) message = "A supplier with this email already exists for this user.";
            if (existingSupplier.phone === phone && phone) message = "A supplier with this phone number already exists for this user.";
            return res.status(400).json({ success: false, message });
        }

        const updatedSupplier = await Supplier.findOneAndUpdate(
            { _id: id, user: userId }, // Find and update only if it belongs to the user
            { $set: { name, contactPerson, email, phone, address, notes } },
            { new: true, runValidators: true }
        );

        if (!updatedSupplier) {
            return res.status(404).json({ success: false, message: "Supplier not found or does not belong to user." });
        }
        res.json({ success: true, message: "Supplier updated successfully!", data: updatedSupplier });
    } catch (err) {
        console.error("Error updating supplier:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error updating supplier." });
    }
});

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Supplier not found (invalid ID format)." });
        }

        // Find and delete only if it belongs to the user
        const deletedSupplier = await Supplier.findOneAndDelete({ _id: id, user: userId });
        if (!deletedSupplier) {
            return res.status(404).json({ success: false, message: "Supplier not found or does not belong to user." });
        }
        res.json({ success: true, message: "Supplier deleted successfully!" });
    } catch (err) {
        console.error("Error deleting supplier:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting supplier." });
    }
});

module.exports = router;