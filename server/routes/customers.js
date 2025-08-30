const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json({ success: true, data: customers });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.post("/", verifyToken, async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Customer name is required" });
        }
        const newCustomer = new Customer({ name, email, phone, address });
        await newCustomer.save();
        res.status(201).json({ success: true, data: newCustomer });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;