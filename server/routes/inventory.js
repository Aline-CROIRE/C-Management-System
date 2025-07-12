const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Parser } = require('json2csv'); // ✅ CSV generator

// --- Import Models & Middleware ---
const Inventory = require("../models/Inventory");
const { verifyToken } = require('../middleware/auth');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});
const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only specific image types are allowed'), false);
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 1024 * 1024 * 5 } });

// ========================================================
//                  INVENTORY ROUTES
// ========================================================

// --- Specific text-based routes MUST come before generic /:id routes ---
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const lowStockCount = await Inventory.countDocuments({ status: 'low-stock' });
    const outOfStockCount = await Inventory.countDocuments({ status: 'out-of-stock' });
    const onOrderCount = await Inventory.countDocuments({ status: 'on-order' });
    const totalValueResult = await Inventory.aggregate([{ $group: { _id: null, totalValue: { $sum: "$totalValue" } } }]);
    const totalValue = totalValueResult[0]?.totalValue || 0;
    res.json({ success: true, data: { totalItems, totalValue, lowStockCount, outOfStockCount, onOrderCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching stats." });
  }
});

router.get("/categories", verifyToken, async (req, res) => {
  try {
    const values = await Inventory.distinct("category");
    res.json({ success: true, data: values.filter(v => v && v.trim() !== "").sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching categories." });
  }
});

router.get("/locations", verifyToken, async (req, res) => {
  try {
    const values = await Inventory.distinct("location");
    res.json({ success: true, data: values.filter(v => v && v.trim() !== "").sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching locations." });
  }
});

router.get("/units", verifyToken, async (req, res) => {
  try {
    const values = await Inventory.distinct("unit");
    res.json({ success: true, data: values.filter(v => v && v.trim() !== "").sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching units." });
  }
});

// --- Export CSV route ---
router.get("/export/csv", verifyToken, async (req, res) => {
  try {
    const inventoryItems = await Inventory.find().lean(); // `.lean()` for plain JS objects
    if (!inventoryItems || inventoryItems.length === 0) {
      return res.status(404).json({ success: false, message: "No inventory data to export." });
    }

    const fields = ['_id', 'name', 'sku', 'category', 'status', 'quantity', 'price', 'totalValue', 'location', 'unit', 'createdAt', 'updatedAt'];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(inventoryItems);

    res.setHeader("Content-Disposition", "attachment; filename=inventory-export.csv");
    res.setHeader("Content-Type", "text/csv");
    res.status(200).end(csv);
  } catch (error) {
    console.error("CSV export error:", error.message);
    res.status(500).json({ success: false, message: "Failed to export inventory data." });
  }
});

// --- Main collection and CRUD routes ---
router.get("/", verifyToken, async (req, res) => {
  try {
    const { search, category, status, location, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = location;

    const limitNum = parseInt(limit), pageNum = parseInt(page), skip = (pageNum - 1) * limitNum;
    const items = await Inventory.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum);
    const total = await Inventory.countDocuments(query);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching inventory items." });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Item not found (invalid ID format)." });
    }
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching item." });
  }
});

router.post("/", verifyToken, upload.single('image'), [
  body("name", "Name is required").not().isEmpty().trim(),
  body("sku", "SKU is required").not().isEmpty().trim().toUpperCase(),
  body("category", "Category is required").not().isEmpty(),
  body("quantity").isFloat({ min: 0 }),
  body("price").isFloat({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { sku } = req.body;
    if (await Inventory.findOne({ sku: sku.toUpperCase() })) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "An item with this SKU already exists." });
    }
    const newItem = new Inventory({
      ...req.body,
      imageUrl: req.file ? `uploads/${req.file.filename}` : null,
    });
    const savedItem = await newItem.save();
    res.status(201).json({ success: true, message: "Item created successfully!", data: savedItem });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: "Server error while creating item." });
  }
});

router.put("/:id", verifyToken, upload.single('image'), [
  body("name", "Name cannot be empty").not().isEmpty().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const itemToUpdate = await Inventory.findById(id);
    if (!itemToUpdate) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }
    const updateData = { ...req.body };
    if (req.file) {
      if (itemToUpdate.imageUrl) {
        try { fs.unlinkSync(path.join(__dirname, '..', itemToUpdate.imageUrl)); }
        catch (err) { console.error("Could not delete old image:", err.message); }
      }
      updateData.imageUrl = `uploads/${req.file.filename}`;
    }
    const updatedItem = await Inventory.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    res.json({ success: true, message: "Item updated successfully!", data: updatedItem });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message || "Server error while updating item." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }
    const itemToDelete = await Inventory.findById(id);
    if (!itemToDelete) {
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }
    if (itemToDelete.imageUrl) {
      const imagePath = path.join(__dirname, '..', itemToDelete.imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Could not delete image file at ${imagePath}:`, err.message);
      });
    }
    await Inventory.findByIdAndDelete(id);
    res.json({ success: true, message: "Item deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error while deleting item." });
  }
});

module.exports = router;
