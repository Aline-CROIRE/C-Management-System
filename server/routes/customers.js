const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { verifyToken } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose'); // For ObjectId validation

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        // Add user filter to the query
        const customers = await Customer.find({ user: userId }).sort({ name: 1 });
        res.json({ success: true, data: customers });
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ success: false, message: "Server Error fetching customers." });
    }
});

router.get("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Customer not found (invalid ID format)." });
        }

        // Add user filter to the query
        const customer = await Customer.findOne({ _id: id, user: userId });
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found or does not belong to user." });
        }
        res.json({ success: true, data: customer });
    } catch (err) {
        console.error("Error fetching customer by ID:", err);
        res.status(500).json({ success: false, message: "Server Error fetching customer." });
    }
});


router.post("/", verifyToken, [
    body('name', 'Customer name is required').not().isEmpty().trim(),
    body('email', 'Invalid email format').optional().isEmail(),
    body('phone', 'Phone number is required').optional().not().isEmpty().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const userId = req.user._id; // Get user ID
        const { name, email, phone, address } = req.body;

        // Check for duplicate name, email, or phone for THIS USER
        const existingCustomer = await Customer.findOne({
            user: userId,
            $or: [
                { name: name },
                { email: email || null, email: { $ne: null } },
                { phone: phone || null, phone: { $ne: null } }
            ]
        });

        if (existingCustomer) {
            let message = "A customer with this name already exists for this user.";
            if (existingCustomer.email === email && email) message = "A customer with this email already exists for this user.";
            if (existingCustomer.phone === phone && phone) message = "A customer with this phone number already exists for this user.";
            return res.status(400).json({ success: false, message });
        }

        const newCustomer = new Customer({
            user: userId, // Assign user ID
            name, email, phone, address
        });
        await newCustomer.save();
        res.status(201).json({ success: true, message: "Customer created successfully!", data: newCustomer });
    } catch (err) {
        console.error("Error creating customer:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error creating customer." });
    }
});

router.put("/:id", verifyToken, [
    body('name', 'Customer name is required').not().isEmpty().trim(),
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
        const { name, email, phone, address } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Customer not found (invalid ID format)." });
        }

        // Check for duplicate name, email, or phone for THIS USER, excluding the current customer
        const existingCustomer = await Customer.findOne({
            user: userId,
            _id: { $ne: id }, // Exclude the current customer being updated
            $or: [
                { name: name },
                { email: email || null, email: { $ne: null } },
                { phone: phone || null, phone: { $ne: null } }
            ]
        });

        if (existingCustomer) {
            let message = "A customer with this name already exists for this user.";
            if (existingCustomer.email === email && email) message = "A customer with this email already exists for this user.";
            if (existingCustomer.phone === phone && phone) message = "A customer with this phone number already exists for this user.";
            return res.status(400).json({ success: false, message });
        }

        const updatedCustomer = await Customer.findOneAndUpdate(
            { _id: id, user: userId }, // Find and update only if it belongs to the user
            { $set: { name, email, phone, address } },
            { new: true, runValidators: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ success: false, message: "Customer not found or does not belong to user." });
        }
        res.json({ success: true, message: "Customer updated successfully!", data: updatedCustomer });
    } catch (err) {
        console.error("Error updating customer:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error updating customer." });
    }
});

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Customer not found (invalid ID format)." });
        }

        // Find and delete only if it belongs to the user
        const deletedCustomer = await Customer.findOneAndDelete({ _id: id, user: userId });
        if (!deletedCustomer) {
            return res.status(404).json({ success: false, message: "Customer not found or does not belong to user." });
        }
        res.json({ success: true, message: "Customer deleted successfully!" });
    } catch (err) {
        console.error("Error deleting customer:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting customer." });
    }
});

module.exports = router;