const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

const Inventory = require("../models/Inventory");
const Category = require("../models/Category");
const Location = require("../models/Location");
const Notification = require("../models/Notification");
const { verifyToken } = require('../middleware/auth');

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

router.get("/stats", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from token

    const totalItems = await Inventory.countDocuments({ user: userId }); // Filter by user
    
    const totalValueAggregate = await Inventory.aggregate([
        { $match: { user: userId, quantity: { $gt: 0 } } }, // Filter by user
        { $group: { 
            _id: null, 
            totalRetailValue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$quantity" }, 0] }, { $ifNull: [{ $toDouble: "$price" }, 0] }] } },
            totalCostValue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$quantity" }, 0] }, { $ifNull: [{ $toDouble: "$costPrice" }, 0] }] } }
        }}
    ]);
    const totalRetailValue = totalValueAggregate[0]?.totalRetailValue || 0;
    const totalCostValue = totalValueAggregate[0]?.totalCostValue || 0;

    const lowStockCount = await Inventory.countDocuments({ user: userId, // Filter by user
        $expr: { $lte: [{ $toDouble: "$quantity" }, { $toDouble: "$minStockLevel" }] }, 
        quantity: { $gt: 0 } 
    });
    const outOfStockCount = await Inventory.countDocuments({ user: userId, quantity: { $lte: 0 } }); // Filter by user
    const onOrderCount = await Inventory.countDocuments({ user: userId, status: 'on-order' }); // Filter by user
    
    res.json({ 
        success: true, 
        data: { 
            totalItems, 
            totalValue: totalRetailValue,
            totalCostValue,
            lowStockCount, 
            outOfStockCount, 
            onOrderCount 
        } 
    });
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({ success: false, message: "Server error fetching stats." });
  }
});

router.get("/categories", verifyToken, async (req, res) => {
  try {
    // Categories are usually global, not user-specific. Keep as is.
    const values = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, data: values });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Error fetching categories." });
  }
});

router.post("/categories", verifyToken, body("name", "Name is required").not().isEmpty().trim(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, message: "Category already exists." });
        }
        const newCategory = new Category({ name }); // If categories were user-specific, add user: req.user._id here
        await newCategory.save();
        res.status(201).json({ success: true, data: newCategory, message: "Category created successfully!" });
    } catch (error) {
        console.error("Server error creating category:", error);
        res.status(500).json({ success: false, message: "Server error creating category." });
    }
});

router.get("/locations", verifyToken, async (req, res) => {
  try {
    // Locations are usually global, not user-specific. Keep as is.
    const values = await Location.find({}).sort({ name: 1 });
    res.json({ success: true, data: values });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ success: false, message: "Error fetching locations." });
  }
});

router.post("/locations", verifyToken, body("name", "Name is required").not().isEmpty().trim(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const existing = await Location.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, message: "Location already exists." });
        }
        const newLocation = new Location({ name }); // If locations were user-specific, add user: req.user._id here
        await newLocation.save();
        res.status(201).json({ success: true, data: newLocation, message: "Location created successfully!" });
    } catch (error) {
        console.error("Server error creating location:", error);
        res.status(500).json({ success: false, message: "Server error creating location." });
    }
});

router.get("/units", verifyToken, async (req, res) => {
  try {
    // Units might be global or user-defined. If user-defined, filter by user here.
    const values = await Inventory.distinct("unit", { user: req.user._id }); // Filter by user
    res.json({ success: true, data: values.filter(v => v && v.trim() !== "").sort() });
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({ success: false, message: "Error fetching units." });
  }
});

router.post("/units", verifyToken, body("name", "Unit name is required").not().isEmpty().trim(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const existingUnits = await Inventory.distinct("unit", { user: req.user._id }); // Check existing units for this user
        if (existingUnits.includes(name)) {
            return res.status(400).json({ success: false, message: `Unit "${name}" already exists.` });
        }
        res.status(201).json({ success: true, data: { name }, message: `Unit "${name}" added to selectable list.` });
    } catch (error) {
        console.error("Server error creating unit:", error);
        res.status(500).json({ success: false, message: "Server error creating unit." });
    }
});

router.get("/export/csv", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID
    const inventoryItems = await Inventory.find({ user: userId }).lean(); // Filter by user
    if (!inventoryItems || inventoryItems.length === 0) {
      return res.status(404).json({ success: false, message: "No inventory data to export." });
    }
    const fields = ['_id', 'name', 'sku', 'category', 'status', 'quantity', 'price', 'totalValue', 'location', 'unit', 'costPrice', 'minStockLevel', 'createdAt', 'updatedAt'];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(inventoryItems);
    res.setHeader("Content-Disposition", "attachment; filename=inventory-export.csv");
    res.setHeader("Content-Type", "text/csv");
    res.status(200).end(csv);
  } catch (error) {
    console.error("Failed to export inventory data:", error);
    res.status(500).json({ success: false, message: "Failed to export inventory data." });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID
    const { search, category, status, location, page = 1, limit = 10, sort = 'updatedAt', order = 'desc' } = req.query;
    const query = { user: userId }; // Filter by user ID here!

    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = location;
    
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const items = await Inventory.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name')
      .populate('location', 'name')
      .populate('supplier', 'name');

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
    console.error("Error fetching inventory items:", error);
    res.status(500).json({ success: false, message: "Error fetching inventory items." });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Item not found (invalid ID format)." });
    }
    // Filter by user ID when getting a single item
    const item = await Inventory.findOne({ _id: req.params.id, user: userId }).populate('category location supplier', 'name');
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error("Server error fetching item:", error);
    res.status(500).json({ success: false, message: "Server error fetching item." });
  }
});

router.post("/", verifyToken, upload.single('itemImage'), [
  body("name", "Name is required").not().isEmpty().trim(),
  body("sku", "SKU is required").not().isEmpty().trim().toUpperCase(),
  body("category", "Category is required").isMongoId(),
  body("location", "Location is required").isMongoId(),
  body("supplier").optional().isMongoId(),
  body("quantity").isFloat({ min: 0 }).withMessage("Quantity must be a non-negative number."),
  body("price").isFloat({ min: 0 }).withMessage("Selling price must be a non-negative number."),
  body("costPrice").isFloat({ min: 0 }).withMessage("Cost price must be a non-negative number."),
  body("minStockLevel").isFloat({ min: 0 }).withMessage("Minimum stock level must be a non-negative number."),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { sku, quantity, minStockLevel, price, costPrice } = req.body;
    const userId = req.user._id; // Get user ID

    if (await Inventory.findOne({ sku: sku.toUpperCase(), user: userId })) { // Check SKU uniqueness per user
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "An item with this SKU already exists for this user." });
    }

    let status = 'in-stock';
    const numQuantity = Number(quantity);
    const numMinStockLevel = Number(minStockLevel);

    if (numQuantity <= 0) {
        status = 'out-of-stock';
    } else if (numQuantity <= numMinStockLevel) {
        status = 'low-stock';
    }
    
    const newItem = new Inventory({
      ...req.body,
      user: userId, // <-- IMPORTANT: Assign user ID
      sku: sku.toUpperCase(),
      quantity: numQuantity,
      price: Number(price),
      costPrice: Number(costPrice),
      minStockLevel: numMinStockLevel,
      status: status,
      imageUrl: req.file ? `uploads/${req.file.filename}` : undefined,
    });
    const savedItem = await newItem.save();
    const populatedItem = await Inventory.findById(savedItem._id).populate('category location supplier', 'name');
    res.status(201).json({ success: true, message: "Item created successfully!", data: populatedItem });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("POST /inventory Error:", error);
    res.status(500).json({ success: false, message: "Server error while creating item." });
  }
});

router.put("/:id", verifyToken, upload.single('itemImage'), [
  body("name", "Name cannot be empty").not().isEmpty().trim(),
  body("sku", "SKU is required").not().isEmpty().trim().toUpperCase(),
  body("category", "Category is required").isMongoId(),
  body("location", "Location is required").isMongoId(),
  body("supplier").optional().isMongoId(),
  body("quantity").isFloat({ min: 0 }).withMessage("Quantity must be a non-negative number."),
  body("price").isFloat({ min: 0 }).withMessage("Selling price must be a non-negative number."),
  body("costPrice").isFloat({ min: 0 }).withMessage("Cost price must be a non-negative number."),
  body("minStockLevel").isFloat({ min: 0 }).withMessage("Minimum stock level must be a non-negative number."),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const userId = req.user._id; // Get user ID
    const { sku, quantity, minStockLevel, price, costPrice, ...rest } = req.body;

    // Find item, ensuring it belongs to the user
    const itemToUpdate = await Inventory.findOne({ _id: id, user: userId });
    if (!itemToUpdate) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Inventory item not found or does not belong to user." });
    }

    // Check for duplicate SKU if SKU is being changed for this user
    if (sku && sku.toUpperCase() !== itemToUpdate.sku && await Inventory.findOne({ sku: sku.toUpperCase(), user: userId })) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "An item with this SKU already exists for this user." });
    }

    let status = itemToUpdate.status;
    const updatedQuantity = Number(quantity);
    const updatedMinStockLevel = Number(minStockLevel);

    if (updatedQuantity <= 0) {
        status = 'out-of-stock';
    } else if (updatedQuantity <= updatedMinStockLevel) {
        status = 'low-stock';
    } else {
        status = 'in-stock';
    }

    const updateData = { 
        ...rest,
        sku: sku.toUpperCase(),
        quantity: updatedQuantity,
        price: Number(price),
        costPrice: Number(costPrice),
        minStockLevel: updatedMinStockLevel,
        status: status,
    };

    if (req.file) {
      if (itemToUpdate.imageUrl) {
        try { fs.unlinkSync(path.join(__dirname, '..', itemToUpdate.imageUrl)); }
        catch (err) { console.error("Could not delete old image:", err.message); }
      }
      updateData.imageUrl = `uploads/${req.file.filename}`;
    }

    const updatedItem = await Inventory.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('category location supplier', 'name');
    
    // Check if status changed to trigger notification
    if (itemToUpdate.status !== status && req.user && (status === 'low-stock' || status === 'out-of-stock')) {
        const notification = new Notification({
            user: req.user._id,
            title: status === 'low-stock' ? 'Low Stock Alert' : 'Out of Stock Alert',
            message: `${itemToUpdate.name} (SKU: ${itemToUpdate.sku}) is now ${status.replace('-', ' ')}. Quantity: ${updatedQuantity}.`,
            type: status === 'low-stock' ? 'low_stock' : 'out_of_stock',
            priority: status === 'low-stock' ? 'high' : 'critical',
            link: `/inventory/${itemToUpdate._id}`,
            relatedId: itemToUpdate._id,
        });
        await notification.save();
    }

    res.json({ success: true, message: "Item updated successfully!", data: updatedItem });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("PUT /inventory Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while updating item." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // Get user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }
    // Find item, ensuring it belongs to the user
    const itemToDelete = await Inventory.findOne({ _id: id, user: userId });
    if (!itemToDelete) {
      return res.status(404).json({ success: false, message: "Inventory item not found or does not belong to user." });
    }
    if (itemToDelete.imageUrl) {
      const imagePath = path.join(__dirname, '..', itemToDelete.imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Could not delete image file at ${imagePath}:`, err.message);
      });
    }
    await Inventory.findByIdAndDelete(id); // Delete only if owned by user
    res.json({ success: true, message: "Item deleted successfully." });
  } catch (error) {
    console.error("DELETE /inventory Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while deleting item." });
  }
});

module.exports = router;