const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { body, validationResult } = require("express-validator");
const { verifyToken } = require('../middleware/auth');

// Multer is needed here for image upload in inventory items
const multer = require("multer");
const path = require('path');
const fs = require('fs');

// Multer setup for image uploads (copied from inventoryController)
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


router.use(verifyToken); // Protect all inventory routes

// --- METADATA ROUTES (Place these BEFORE dynamic item routes) ---
router.get("/categories", inventoryController.getCategories);
router.post("/categories", body("name", "Name is required").not().isEmpty().trim(), inventoryController.createCategory);

router.get("/locations", inventoryController.getLocations);
router.post("/locations", body("name", "Name is required").not().isEmpty().trim(), inventoryController.createLocation);

router.get("/units", inventoryController.getDistinctUnits);
router.post("/units", body("name", "Unit name is required").not().isEmpty().trim(), inventoryController.createUnit);


// --- INVENTORY ITEM CRUD ROUTES ---
router.get("/stats", inventoryController.getInventoryStats);
router.get("/export/:format", inventoryController.exportInventory);
router.get("/", inventoryController.getInventoryItems);
router.get("/:id", inventoryController.getInventoryItemById); // This MUST come AFTER all specific GET routes like /categories, /locations, /units, /stats, /export/:format

router.post("/", upload.single('itemImage'), [
  body("name", "Name is required").not().isEmpty().trim(),
  body("sku", "SKU is required").not().isEmpty().trim().toUpperCase(),
  body("category", "Category is required").isMongoId(),
  body("location", "Location is required").isMongoId(),
  body("supplier").optional().isMongoId(),
  body("quantity").isFloat({ min: 0 }).withMessage("Quantity must be a non-negative number."),
  body("price").isFloat({ min: 0 }).withMessage("Selling price must be a non-negative number."),
  body("costPrice").isFloat({ min: 0 }).withMessage("Cost price must be a non-negative number."),
  body("minStockLevel").isFloat({ min: 0 }).withMessage("Minimum stock level must be a non-negative number."),
], inventoryController.createInventoryItem);

router.put("/:id", upload.single('itemImage'), [
  body("name", "Name cannot be empty").not().isEmpty().trim(),
  body("sku", "SKU is required").not().isEmpty().trim().toUpperCase(),
  body("category", "Category is required").isMongoId(),
  body("location", "Location is required").isMongoId(),
  body("supplier").optional().isMongoId(),
  body("quantity").isFloat({ min: 0 }).withMessage("Quantity must be a non-negative number."),
  body("price").isFloat({ min: 0 }).withMessage("Selling price must be a non-negative number."),
  body("costPrice").isFloat({ min: 0 }).withMessage("Cost price must be a non-negative number."),
  body("minStockLevel").isFloat({ min: 0 }).withMessage("Minimum stock level must be a non-negative number."),
], inventoryController.updateInventoryItem);

router.delete("/:id", inventoryController.deleteInventoryItem);


module.exports = router;