// routes/inventory.js

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");

// Import only the models that actually exist.
const Inventory = require("../models/Inventory");

// Import your authentication middleware when ready
// const { verifyToken, isAdmin } = require('../middleware/auth');


// --- Multer Configuration for File Uploads (Unchanged) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and GIF images are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 1024 * 1024 * 5 } });


// --- Helper Function for getting distinct values (Unchanged) ---
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
// INVENTORY CRUD ROUTES (Unchanged)
// ========================================================

// router.use(verifyToken); // Apply auth middleware to all routes below

router.get("/", async (req, res) => {
  // Your existing GET all items logic...
  try {
    const { search, category, status, location, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
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
    console.error("Error fetching inventory:", error);
    res.status(500).json({ success: false, message: "Error fetching inventory items" });
  }
});

router.post("/", upload.single('image'), [ /* ... validation ... */ ], async (req, res) => {
  // Your existing POST new item logic...
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
        quantity: numQuantity,
        price: numPrice,
        minStockLevel: numMinStock,
        location: location || "Default Warehouse",
        status: itemStatus,
        totalValue: numQuantity * numPrice,
        imageUrl: req.file ? req.file.path : null,
      });

      const savedItem = await newItem.save();
      res.status(201).json({ success: true, message: "Item created successfully", data: savedItem });
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ success: false, message: "Error creating inventory item" });
    }
});

// ... other CRUD routes like PUT and DELETE ...


// ========================================================
// METADATA ROUTES (for dropdowns)
// ========================================================

// --- GET Routes (Unchanged) ---
router.get("/categories", (req, res) => getDistinctValues(Inventory, "category", res));
router.get("/locations", (req, res) => getDistinctValues(Inventory, "location", res));
router.get("/units", (req, res) => getDistinctValues(Inventory, "unit", res));


// --- POST Routes (Corrected) ---

router.post(
  "/categories",
  // [verifyToken, isAdmin], // Optional: Protect this route
  [ body("name", "Category name is required").not().isEmpty().trim() ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { name } = req.body;
    try {
      // Check if a category with this name (case-insensitive) already exists in any inventory item.
      const existing = await Inventory.findOne({ category: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existing) {
        return res.status(400).json({ success: false, message: "This category already exists." });
      }
      // If it doesn't exist, we send a success response. The category will be formally
      // added to the database when an inventory item using it is created.
      res.status(201).json({ success: true, message: `Category '${name}' is ready to be used.` });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.post(
  "/locations",
  // [verifyToken, isAdmin], // Optional: Protect this route
  [ body("name", "Location name is required").not().isEmpty().trim() ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { name } = req.body;
    try {
      const existing = await Inventory.findOne({ location: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existing) {
        return res.status(400).json({ success: false, message: "This location already exists." });
      }
      res.status(201).json({ success: true, message: `Location '${name}' is ready to be used.` });
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;