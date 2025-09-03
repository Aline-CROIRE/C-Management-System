// routes/metadata.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const Category = require('../models/Category');
const Location = require('../models/Location');
// const { verifyToken, isAdmin } = require('../middleware/auth');

// --- CATEGORY ROUTES ---

// GET all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories.map(c => c.name) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST a new category
router.post("/categories", [
  body("name", "Category name cannot be empty.").not().isEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const { name } = req.body;
    let category = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (category) {
      return res.status(400).json({ success: false, message: "Category already exists." });
    }
    
    category = new Category({ name /* createdBy: req.user.id */ }); // Add user ID when auth is ready
    await category.save();

    res.status(201).json({ success: true, message: "Category created successfully", data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// --- LOCATION ROUTES ---

// GET all locations
router.get("/locations", async (req, res) => {
    try {
        const locations = await Location.find().sort({ name: 1 });
        res.json({ success: true, data: locations.map(l => l.name) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// POST a new location
router.post("/locations", [
    body("name", "Location name cannot be empty.").not().isEmpty().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { name } = req.body;
        let location = await Location.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (location) {
          return res.status(400).json({ success: false, message: "Location already exists." });
        }
        
        location = new Location({ name });
        await location.save();

        res.status(201).json({ success: true, message: "Location created successfully", data: location });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


module.exports = router;