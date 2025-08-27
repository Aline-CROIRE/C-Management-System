const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Supplier = require('../models/Supplier');
const { verifyToken } = require('../middleware/auth');

// --- GET all suppliers ---
router.get("/", verifyToken, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) { res.status(500).json({ success: false, message: "Server Error fetching suppliers." }); }
});

// --- POST a new supplier ---
router.post("/", verifyToken, [
    body("name", "Supplier name is required.").not().isEmpty().trim(),
    body("email", "Please provide a valid email.").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { name, email } = req.body;
    let supplier = await Supplier.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (supplier) return res.status(400).json({ success: false, message: "A supplier with this name already exists." });
    
    if (email) {
        let supplierByEmail = await Supplier.findOne({ email });
        if (supplierByEmail) return res.status(400).json({ success: false, message: "A supplier with this email already exists." });
    }

    supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ success: true, message: "Supplier created successfully!", data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: "Server Error creating supplier." }); }
});

// --- PUT (Update) an existing supplier ---
router.put("/:id", verifyToken, [
    body("name", "Supplier name is required.").not().isEmpty().trim(),
    body("email", "Please provide a valid email.").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Supplier not found." });
        }
        const updatedSupplier = await Supplier.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        if (!updatedSupplier) return res.status(404).json({ success: false, message: "Supplier not found." });
        res.json({ success: true, message: "Supplier updated successfully!", data: updatedSupplier });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error updating supplier." });
    }
});

// --- DELETE a supplier ---
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Supplier not found." });
        }
        const supplier = await Supplier.findByIdAndDelete(id);
        if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found." });
        res.json({ success: true, message: "Supplier deleted successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error deleting supplier." });
    }
});

module.exports = router;