// server/controllers/internalUseController.js
const InternalUse = require("../models/InternalUse");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// @desc    Get all internal use records for a user
// @route   GET /api/internal-use
// @access  Private
exports.getInternalUses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { item, startDate, endDate, search, page = 1, limit = 10, sort = 'date', order = 'desc' } = req.query;

    const query = { user: userId };

    if (item) query.item = item;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { itemName: { $regex: search, $options: "i" } }, // NEW: Search by item name
        { itemSku: { $regex: search, $options: "i" } },   // NEW: Search by item SKU
      ];
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'desc' ? -1 : 1;

    const internalUses = await InternalUse.find(query)
      .populate('item', 'name sku unit quantity minStockLevel') // Still populate for current inventory status
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limitNum);

    const total = await InternalUse.countDocuments(query);

    res.json({
      success: true,
      data: internalUses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Error fetching internal use records:", err);
    res.status(500).json({ success: false, message: "Server Error fetching internal use records." });
  }
};

// @desc    Get single internal use record by ID for a user
// @route   GET /api/internal-use/:id
// @access  Private
exports.getInternalUseById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Internal use record not found (invalid ID format)." });
    }

    const internalUse = await InternalUse.findOne({ _id: id, user: userId })
      .populate('item', 'name sku unit quantity minStockLevel');
    if (!internalUse) {
      return res.status(404).json({ success: false, message: "Internal use record not found or does not belong to user." });
    }
    res.json({ success: true, data: internalUse });
  } catch (err) {
    console.error("Error fetching internal use record by ID:", err);
    res.status(500).json({ success: false, message: "Server Error fetching internal use record." });
  }
};

// @desc    Create a new internal use record and update inventory
// @route   POST /api/internal-use
// @access  Private
exports.createInternalUse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { item: itemId, quantity, reason, date, notes } = req.body;

    const inventoryItem = await Inventory.findOne({ _id: itemId, user: userId }).session(session);
    if (!inventoryItem) {
      throw new Error("Inventory item not found or does not belong to user.");
    }
    if (inventoryItem.quantity < quantity) {
      throw new Error(`Not enough stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${quantity}.`);
    }

    inventoryItem.quantity -= quantity; // Deduct from inventory

    // Update inventory status if needed
    const newQuantity = inventoryItem.quantity;
    const minStockLevel = inventoryItem.minStockLevel || 0;

    if (newQuantity <= 0 && inventoryItem.status !== 'out-of-stock') {
        const notification = new Notification({
          user: userId, type: 'out_of_stock', title: 'Out of Stock Alert',
          message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is now out of stock due to internal use.`,
          priority: 'critical', link: `/inventory/${inventoryItem._id}`, relatedId: inventoryItem._id,
        });
        await notification.save({ session });
        inventoryItem.status = 'out-of-stock';
    } else if (newQuantity <= minStockLevel && newQuantity > 0 && inventoryItem.status !== 'low-stock') {
        const notification = new Notification({
          user: userId, type: 'low_stock', title: 'Low Stock Alert',
          message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is running low due to internal use. Quantity: ${newQuantity}.`,
          priority: 'high', link: `/inventory/${inventoryItem._id}`, relatedId: inventoryItem._id,
        });
        await notification.save({ session });
        inventoryItem.status = 'low-stock';
    } else if (newQuantity > minStockLevel && newQuantity > 0 && (inventoryItem.status === 'low-stock' || inventoryItem.status === 'out-of-stock')) {
        inventoryItem.status = 'in-stock';
    }
    await inventoryItem.save({ session });

    // NEW: Save item details and price at the time of use
    const newInternalUse = new InternalUse({
      user: userId,
      item: itemId,
      itemName: inventoryItem.name, // Store snapshot
      itemSku: inventoryItem.sku,   // Store snapshot
      unit: inventoryItem.unit,     // Store snapshot
      quantity: quantity,
      unitPrice: inventoryItem.price, // Store price at time of use
      totalValue: quantity * inventoryItem.price, // Calculate total value
      reason: reason,
      date: date,
      notes: notes,
    });

    const savedInternalUse = await newInternalUse.save({ session });
    await session.commitTransaction();
    
    const populatedInternalUse = await InternalUse.findById(savedInternalUse._id)
                                                .populate('item', 'name sku unit quantity minStockLevel');

    res.status(201).json({ success: true, message: "Internal use recorded successfully!", data: populatedInternalUse });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error creating internal use record:", err);
    res.status(500).json({ success: false, message: err.message || "Server Error creating internal use record." });
  } finally {
    session.endSession();
  }
};

// @desc    Delete an internal use record and restock inventory
// @route   DELETE /api/internal-use/:id
// @access  Private
exports.deleteInternalUse = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Internal use record not found (invalid ID format).");
    }

    const internalUseToDelete = await InternalUse.findOne({ _id: id, user: userId }).session(session);
    if (!internalUseToDelete) {
      throw new Error("Internal use record not found or does not belong to user.");
    }

    const inventoryItem = await Inventory.findOne({ _id: internalUseToDelete.item, user: userId }).session(session);
    if (!inventoryItem) {
      throw new Error("Associated inventory item not found or does not belong to user.");
    }

    inventoryItem.quantity += internalUseToDelete.quantity; // Restock inventory

    // Update inventory status
    const newQuantity = inventoryItem.quantity;
    const minStockLevel = inventoryItem.minStockLevel || 0;
    if (inventoryItem.status === 'out-of-stock' && newQuantity > 0) {
        inventoryItem.status = (newQuantity <= minStockLevel) ? 'low-stock' : 'in-stock';
    } else if (inventoryItem.status === 'low-stock' && newQuantity > minStockLevel) {
        inventoryItem.status = 'in-stock';
    }
    await inventoryItem.save({ session });

    await InternalUse.findByIdAndDelete({ _id: id, user: userId }).session(session);
    await session.commitTransaction();
    res.json({ success: true, message: "Internal use record deleted and inventory restocked." });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error deleting internal use record:", err);
    res.status(500).json({ success: false, message: err.message || "Server Error deleting internal use record." });
  } finally {
    session.endSession();
  }
};


// @desc    Get total value of internal uses for a user over a period
// @route   GET /api/internal-use/total-value
// @access  Private
exports.getTotalInternalUseValue = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.query;

        const query = { user: userId };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const aggregateResult = await InternalUse.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$totalValue" },
                    totalQuantity: { $sum: "$quantity" },
                    recordCount: { $sum: 1 },
                }
            },
            { $project: { _id: 0, totalValue: 1, totalQuantity: 1, recordCount: 1 } }
        ]);

        const stats = aggregateResult[0] || { totalValue: 0, totalQuantity: 0, recordCount: 0 };

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error("Error fetching total internal use value:", err);
        res.status(500).json({ success: false, message: "Server Error fetching total internal use value." });
    }
};