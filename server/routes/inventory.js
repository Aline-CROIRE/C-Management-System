// routes/inventory.js

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const fs = require('fs');
const path = require('path');

const Inventory = require("../models/Inventory");

// --- Multer and Helper Functions ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and GIF images are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 1024 * 1024 * 5 } });

const getDistinctValues = async (model, field, res) => {
  try {
    const values = await model.distinct(field);
    const cleanValues = values.filter(v => v && v.trim() !== "").sort();
    res.json({ success: true, data: cleanValues });
  } catch (error) {
    console.error(`Error fetching distinct ${field}:`, error);
    res.status(500).json({ success: false, message: `Error fetching ${field}` });
  }
};

// ========================================================
// INVENTORY & METADATA ROUTES
// ========================================================

// --- THE FIX: Define the FULL path for each route, as this file is mounted at '/api' ---

// --- GET All Inventory Items ---
router.get("/inventory", async (req, res) => {
  try {
    const { search, category, status, location, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];
    }
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = location;
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const skip = (pageNum - 1) * limitNum;
    const items = await Inventory.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum);
    const total = await Inventory.countDocuments(query);
    res.json({
      success: true,
      data: items,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching inventory items" });
  }
});

// --- GET Inventory Statistics ---
router.get("/stats", async (req, res) => {
    try {
        const totalItems = await Inventory.countDocuments();
        const lowStockItems = await Inventory.find({ status: 'low-stock' });
        const totalValueResult = await Inventory.aggregate([
            { $group: { _id: null, totalValue: { $sum: "$totalValue" } } }
        ]);
        const totalValue = totalValueResult.length > 0 ? totalValueResult[0].totalValue : 0;
        res.json({ success: true, stats: { totalItems, lowStockItems, totalValue } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching stats" });
    }
});

// --- POST a New Inventory Item ---
router.post("/inventory", upload.single('image'), [
    body("name", "Name is required").not().isEmpty().trim(),
    body("sku", "SKU is required").not().isEmpty().trim(),
    body("category", "Category is required").not().isEmpty(),
    body("quantity").isNumeric().withMessage("Quantity must be a number"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("unit").not().isEmpty().withMessage("Unit is required"),
    body("minStockLevel").optional({ checkFalsy: true }).isNumeric().withMessage("Minimum stock must be a number"),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { name, sku, category, quantity, unit, price, minStockLevel, location, supplier, description, expiryDate } = req.body;
      if (await Inventory.findOne({ sku })) {
        return res.status(400).json({ success: false, message: "Item with this SKU already exists" });
      }
      const numQuantity = Number(quantity);
      const numPrice = Number(price);
      const numMinStock = Number(minStockLevel) || 0;
      let itemStatus = "in-stock";
      if (numQuantity <= 0) itemStatus = "out-of-stock";
      else if (numQuantity <= numMinStock) itemStatus = "low-stock";
      const newItem = new Inventory({
        name, sku, category, unit, supplier, description, expiryDate,
        quantity: numQuantity, price: numPrice, minStockLevel: numMinStock,
        location: location || "Default Warehouse", status: itemStatus,
        totalValue: numQuantity * numPrice,
        imageUrl: req.file ? req.file.path.replace(/\\/g, '/') : null,
      });
      const savedItem = await newItem.save();
      res.status(201).json({ success: true, message: "Item created successfully", data: savedItem });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error creating inventory item" });
    }
});

// --- PUT (Update) an Existing Inventory Item ---
router.put("/inventory/:id", upload.single('image'), async (req, res) => {
    try {
      const { id } = req.params;
      const { sku } = req.body;
      const itemToUpdate = await Inventory.findById(id);
      if (!itemToUpdate) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }
      if (sku && sku !== itemToUpdate.sku) {
        if (await Inventory.findOne({ sku })) {
          return res.status(400).json({ success: false, message: "This SKU is already in use." });
        }
      }
      const updateData = { ...req.body, updatedAt: new Date() };
      // ... (rest of your update logic) ...
      const updatedItem = await Inventory.findByIdAndUpdate(id, updateData, { new: true });
      res.json({ success: true, message: "Item updated successfully", data: updatedItem });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error while updating item." });
    }
});

// --- DELETE an Inventory Item ---
router.delete("/inventory/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const itemToDelete = await Inventory.findById(id);
      if (!itemToDelete) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }
      if (itemToDelete.imageUrl) {
        fs.unlink(path.join(__dirname, '..', itemToDelete.imageUrl), (err) => {
          if (err) console.error("Could not delete item image:", err);
        });
      }
      await Inventory.findByIdAndDelete(id);
      res.json({ success: true, message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error while deleting item." });
    }
});



router.get("/units", (req, res) => getDistinctValues(Inventory, "unit", res));


module.exports = router;