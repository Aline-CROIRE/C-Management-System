const Customer = require("../models/Customer");
const { validationResult } = require("express-validator");
const mongoose = require('mongoose');

// @desc    Get all customers for a user
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
    try {
        const userId = req.user._id;
        const customers = await Customer.find({ user: userId }).sort({ name: 1 });
        res.json({ success: true, data: customers });
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ success: false, message: "Server Error fetching customers." });
    }
};

// @desc    Get single customer by ID for a user
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Customer not found (invalid ID format)." });
        }

        const customer = await Customer.findOne({ _id: id, user: userId });
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found or does not belong to user." });
        }
        res.json({ success: true, data: customer });
    } catch (err) {
        console.error("Error fetching customer by ID:", err);
        res.status(500).json({ success: false, message: "Server Error fetching customer." });
    }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const userId = req.user._id;
        const { name, email, phone, address } = req.body;

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
            user: userId,
            name, email, phone, address
        });
        await newCustomer.save();
        res.status(201).json({ success: true, message: "Customer created successfully!", data: newCustomer });
    } catch (err) {
        console.error("Error creating customer:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error creating customer." });
    }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Customer not found (invalid ID format)." });
        }

        const existingCustomer = await Customer.findOne({
            user: userId,
            _id: { $ne: id },
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
            { _id: id, user: userId },
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
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Customer not found (invalid ID format)." });
        }

        const deletedCustomer = await Customer.findOneAndDelete({ _id: id, user: userId });
        if (!deletedCustomer) {
            return res.status(404).json({ success: false, message: "Customer not found or does not belong to user." });
        }
        res.json({ success: true, message: "Customer deleted successfully!" });
    } catch (err) {
        console.error("Error deleting customer:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting customer." });
    }
};

// @desc    Record a payment directly to a customer's balance
// @route   POST /api/customers/:id/payments
// @access  Private
exports.recordCustomerPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { amount, paymentMethod, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Customer not found (invalid ID format).");
        }

        const customer = await Customer.findOne({ _id: id, user: userId }).session(session);
        if (!customer) {
            throw new Error("Customer not found or does not belong to user.");
        }

        const paymentAmount = Number(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error("Payment amount must be a positive number.");
        }

        customer.currentBalance = Math.max(0, customer.currentBalance - paymentAmount);

        await customer.save({ session });
        await session.commitTransaction();

        res.json({ success: true, message: "Customer payment recorded successfully!", data: customer });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error recording customer payment:", err);
        res.status(500).json({ success: false, message: err.message || "Server error recording customer payment." });
    } finally {
        session.endSession();
    }
};