const Inventory = require("../models/Inventory");
const Category = require("../models/Category");
const Location = require("../models/Location");
const Supplier = require("../models/Supplier"); 
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const mongoose = require('mongoose');
const multer = require("multer"); 
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');


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


// --- INVENTORY ITEM CRUD ---

exports.getInventoryStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalItems = await Inventory.countDocuments({ user: userId });
    
    const totalValueAggregate = await Inventory.aggregate([
        { $match: { user: userId, quantity: { $gt: 0 } } },
        { $group: { 
            _id: null, 
            totalRetailValue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$quantity" }, 0] }, { $ifNull: [{ $toDouble: "$price" }, 0] }] } },
            totalCostValue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$quantity" }, 0] }, { $ifNull: [{ $toDouble: "$costPrice" }, 0] }] } }
        }}
    ]);
    const totalRetailValue = totalValueAggregate[0]?.totalRetailValue || 0;
    const totalCostValue = totalValueAggregate[0]?.totalCostValue || 0;

    const lowStockCount = await Inventory.countDocuments({ user: userId, 
        $expr: { $lte: [{ $toDouble: "$quantity" }, { $toDouble: "$minStockLevel" }] }, 
        quantity: { $gt: 0 } 
    });
    const outOfStockCount = await Inventory.countDocuments({ user: userId, quantity: { $lte: 0 } });
    const onOrderCount = await Inventory.countDocuments({ user: userId, status: 'on-order' });
    
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
};

exports.exportInventory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { format } = req.params;
    const inventoryItems = await Inventory.find({ user: userId }).lean();
    
    if (!inventoryItems || inventoryItems.length === 0) {
      return res.status(404).json({ success: false, message: "No inventory data to export." });
    }

    const populatedItems = await Promise.all(inventoryItems.map(async item => {
        const category = await Category.findById(item.category);
        const location = await Location.findById(item.location);
        const supplier = await Supplier.findById(item.supplier);
        return {
            ...item,
            categoryName: category ? category.name : 'N/A',
            locationName: location ? location.name : 'N/A',
            supplierName: supplier ? supplier.name : 'N/A',
        };
    }));

    if (format === 'csv') {
      const fields = [
          '_id', 'name', 'sku', 'description', 'quantity', 'unit', 'price', 
          'costPrice', 'totalValue', 'minStockLevel', 'maxStockLevel', 
          'categoryName', 'locationName', 'supplierName', 'status', 'barcode', 
          'expiryDate', 'lastRestocked', 'packagingType', 'packagingDeposit',
          'createdAt', 'updatedAt'
      ];
      const json2csv = new Parser({ fields });
      const csv = json2csv.parse(populatedItems);
      res.setHeader("Content-Disposition", "attachment; filename=inventory-export.csv");
      res.setHeader("Content-Type", "text/csv");
      res.status(200).end(csv);
    } else if (format === 'json') {
        res.setHeader("Content-Disposition", "attachment; filename=inventory-export.json");
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(populatedItems);
    } else {
        return res.status(400).json({ success: false, message: "Invalid export format. Choose 'csv' or 'json'." });
    }
  } catch (error) {
    console.error("Failed to export inventory data:", error);
    res.status(500).json({ success: false, message: "Failed to export inventory data." });
  }
};


// @desc    Get distinct units used by a user
// @route   GET /api/inventory/units
// @access  Private
exports.getDistinctUnits = async (req, res) => {
  try {
    const userId = req.user._id;
    const values = await Inventory.distinct("unit", { user: userId });
    res.json({ success: true, data: values.filter(v => v && v.trim() !== "").sort() });
  } catch (error) {
    console.error("Error fetching distinct units:", error);
    res.status(500).json({ success: false, message: "Error fetching distinct units." });
  }
};


exports.getInventoryItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, category, status, location, page = 1, limit = 10, sort = 'updatedAt', order = 'desc' } = req.query;
    const query = { user: userId };

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
};

exports.getInventoryItemById = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Item not found (invalid ID format)." });
    }
    const item = await Inventory.findOne({ _id: req.params.id, user: userId }).populate('category location supplier', 'name');
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error("Server error fetching item:", error);
    res.status(500).json({ success: false, message: "Server error fetching item." });
  }
};

exports.createInventoryItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { sku, quantity, minStockLevel, price, costPrice } = req.body;
    const userId = req.user._id;

    if (await Inventory.findOne({ sku: sku.toUpperCase(), user: userId })) {
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
      user: userId,
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
    console.error("POST /api/inventory Error:", error);
    res.status(500).json({ success: false, message: "Server error while creating item." });
  }
};

exports.updateInventoryItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { sku, quantity, minStockLevel, price, costPrice, ...rest } = req.body;

    const itemToUpdate = await Inventory.findOne({ _id: id, user: userId });
    if (!itemToUpdate) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Inventory item not found or does not belong to user." });
    }

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
    
    if (itemToUpdate.status !== status && req.user && (status === 'low-stock' || status === 'out-of-stock')) {
        const notification = new Notification({
            user: req.user._id,
            title: status === 'low-stock' ? 'Low Stock Alert' : 'Out of Stock Alert',
            message: `${itemToUpdate.name} (SKU: ${itemToUpdate.sku}) is now ${status.replace('-', ' ')}. Quantity: ${updatedItem.quantity}.`,
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
    console.error("PUT /api/inventory Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while updating item." });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }
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
    await Inventory.findByIdAndDelete(id);
    res.json({ success: true, message: "Item deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/inventory Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while deleting item." });
  }
};


// --- METADATA (CATEGORY, LOCATION, UNIT) CREATION/GET ---
// These functions will now be EXPORTED from this controller and used by inventoryRoutes.

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, data: categories }); // Return objects
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Error fetching categories." });
  }
};

exports.createCategory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ success: false, message: `Category "${name}" already exists.` });
        }
        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(201).json({ success: true, data: newCategory, message: `Category "${name}" created successfully!` });
    } catch (error) {
        console.error("Server error creating category:", error);
        res.status(500).json({ success: false, message: "Server error creating category." });
    }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({}).sort({ name: 1 });
    res.json({ success: true, data: locations }); // Return objects
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ success: false, message: "Error fetching locations." });
  }
};

exports.createLocation = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const existing = await Location.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ success: false, message: `Location "${name}" already exists.` });
        }
        const newLocation = new Location({ name });
        await newLocation.save();
        res.status(201).json({ success: true, data: newLocation, message: `Location "${name}" created successfully!` });
    } catch (error) {
        console.error("Server error creating location:", error);
        res.status(500).json({ success: false, message: "Server error creating location." });
    }
};

exports.createUnit = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const userId = req.user._id;

        const existingUnits = await Inventory.distinct("unit", { user: userId });
        if (existingUnits.map(u => u.toLowerCase()).includes(name.trim().toLowerCase())) {
            return res.status(400).json({ success: false, message: `Unit "${name}" already exists for this user.` });
        }
        
        res.status(201).json({ success: true, data: { name: name.trim() }, message: `Unit "${name}" is now available.` });
    } catch (error) {
        console.error("Server error creating unit:", error);
        res.status(500).json({ success: false, message: "Server error creating unit." });
    }
};