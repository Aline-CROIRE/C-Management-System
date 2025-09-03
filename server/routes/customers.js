const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { verifyToken } = require("../middleware/auth");
const { body, validationResult } = require("express-validator"); // Added validation

router.get("/", verifyToken, async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json({ success: true, data: customers });
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.post("/", verifyToken, [
    body('name', 'Customer name is required').not().isEmpty().trim(),
    body('email', 'Invalid email format').optional().isEmail(),
    body('phone', 'Invalid phone number').optional().isString().isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { name, email, phone, address } = req.body;
        // Optional: Check if customer with same email/phone already exists
        const existingCustomer = await Customer.findOne({ $or: [{ email: email }, { phone: phone }] });
        if (existingCustomer) {
            return res.status(400).json({ success: false, message: "A customer with this email or phone already exists." });
        }

        const newCustomer = new Customer({ name, email, phone, address });
        await newCustomer.save();
        res.status(201).json({ success: true, data: newCustomer });
    } catch (err) {
        console.error("Error creating customer:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// You can add update, delete, getById routes here as well

module.exports = router;