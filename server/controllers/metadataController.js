// server/controllers/metadataController.js
const Category = require("../models/Category");
const Location = require("../models/Location");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// --- CATEGORY CONTROLLERS ---

// @desc    Get all categories
// @route   GET /api/metadata/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    // IMPORTANT: Return full objects so frontend can use category._id and category.name
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Error fetching categories." });
  }
};

// @desc    Create a new category
// @route   POST /api/metadata/categories
// @access  Private
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
        const newCategory = new Category({ name /* createdBy: req.user.id */ }); // If user-specific, add req.user.id
        await newCategory.save();
        // IMPORTANT: Return the full object including _id
        res.status(201).json({ success: true, data: newCategory, message: `Category "${name}" created successfully!` });
    } catch (error) {
        console.error("Server error creating category:", error);
        res.status(500).json({ success: false, message: "Server error creating category." });
    }
};

// --- LOCATION CONTROLLERS ---

// @desc    Get all locations
// @route   GET /api/metadata/locations
// @access  Private
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({}).sort({ name: 1 });
    // IMPORTANT: Return full objects so frontend can use location._id and location.name
    res.json({ success: true, data: locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ success: false, message: "Error fetching locations." });
  }
};

// @desc    Create a new location
// @route   POST /api/metadata/locations
// @access  Private
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
        const newLocation = new Location({ name }); // If user-specific, add req.user.id
        await newLocation.save();
        // IMPORTANT: Return the full object including _id
        res.status(201).json({ success: true, data: newLocation, message: `Location "${name}" created successfully!` });
    } catch (error) {
        console.error("Server error creating location:", error);
        res.status(500).json({ success: false, message: "Server error creating location." });
    }
};