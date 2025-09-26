// server/controllers/stockAdjustmentController.js
const StockAdjustment = require("../models/StockAdjustment");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// @desc    Get all stock adjustment records for a user
// @route   GET /api/stock-adjustments
// @access  Private
exports.getStockAdjustments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { item, type, startDate, endDate, search, page = 1, limit = 10, sort = 'date', order = 'desc' } = req.query;

    const query = { user: userId };

    if (item) query.item = item;
    if (type) query.type = type;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { itemName: { $regex: search, $options: "i" } },
        { itemSku: { $regex: search, $options: "i" } },
      ];
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'desc' ? -1 : 1;

    const adjustments = await StockAdjustment.find(query)
      .populate('item', 'name sku unit quantity minStockLevel') // Populate item for current status, if available
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limitNum);

    const total = await StockAdjustment.countDocuments(query);

    res.json({
      success: true,
      data: adjustments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Error fetching stock adjustment records:", err);
    res.status(500).json({ success: false, message: "Server Error fetching stock adjustment records." });
  }
};

// @desc    Get single stock adjustment record by ID for a user
// @route   GET /api/stock-adjustments/:id
// @access  Private
exports.getStockAdjustmentById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Stock adjustment record not found (invalid ID format)." });
    }

    const adjustment = await StockAdjustment.findOne({ _id: id, user: userId })
      .populate('item', 'name sku unit quantity minStockLevel');
    if (!adjustment) {
      return res.status(404).json({ success: false, message: "Stock adjustment record not found or does not belong to user." });
    }
    res.json({ success: true, data: adjustment });
  } catch (err) {
    console.error("Error fetching stock adjustment record by ID:", err);
    res.status(500).json({ success: false, message: "Server Error fetching stock adjustment record." });
  }
};

// @desc    Create a new stock adjustment record and update inventory
// @route   POST /api/stock-adjustments
// @access  Private
exports.createStockAdjustment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { item: itemId, quantity, type, reason, date, notes } = req.body;

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
          message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is now out of stock due to ${type} adjustment.`,
          priority: 'critical', link: `/inventory/${inventoryItem._id}`, relatedId: inventoryItem._id,
        });
        await notification.save({ session });
        inventoryItem.status = 'out-of-stock';
    } else if (newQuantity <= minStockLevel && newQuantity > 0 && inventoryItem.status !== 'low-stock') {
            const notification = new Notification({
              user: userId, type: 'low_stock', title: 'Low Stock Alert',
              message: `${inventoryItem.name} (SKU: ${inventoryItem.sku}) is running low due to ${type} adjustment. Quantity: ${newQuantity}.`,
              priority: 'high', link: `/inventory/${inventoryItem._id}`, relatedId: inventoryItem._id,
            });
            await notification.save({ session });
            inventoryItem.status = 'low-stock';
        } else if (newQuantity > minStockLevel && newQuantity > 0 && (inventoryItem.status === 'low-stock' || inventoryItem.status === 'out-of-stock')) {
            inventoryItem.status = 'in-stock';
        }
        await inventoryItem.save({ session });

        // NEW: Save item details and cost at the time of adjustment
        const newAdjustment = new StockAdjustment({
          user: userId,
          item: itemId,
          itemName: inventoryItem.name,
          itemSku: inventoryItem.sku,
          unit: inventoryItem.unit,
          quantity: quantity,
          unitCost: inventoryItem.costPrice || 0, // Use costPrice for financial impact, default to 0 if null
          totalCostImpact: quantity * (inventoryItem.costPrice || 0), // Calculate total value
          type: type,
          reason: reason,
          date: date,
          notes: notes,
        });

        const savedAdjustment = await newAdjustment.save({ session });
        await session.commitTransaction();
        
        const populatedAdjustment = await StockAdjustment.findById(savedAdjustment._id)
                                                .populate('item', 'name sku unit quantity minStockLevel');

        res.status(201).json({ success: true, message: "Stock adjustment recorded successfully!", data: populatedAdjustment });
      } catch (err) {
        await session.abortTransaction();
        console.error("Error creating stock adjustment record:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error creating stock adjustment record." });
      } finally {
        session.endSession();
      }
    };

    // @desc    Delete a stock adjustment record and restock inventory (only if logical for "undo")
    // @route   DELETE /api/stock-adjustments/:id
    // @access  Private
    exports.deleteStockAdjustment = async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error("Stock adjustment record not found (invalid ID format).");
        }

        const adjustmentToDelete = await StockAdjustment.findOne({ _id: id, user: userId }).session(session);
        if (!adjustmentToDelete) {
          throw new Error("Stock adjustment record not found or does not belong to user.");
        }

        const inventoryItem = await Inventory.findOne({ _id: adjustmentToDelete.item, user: userId }).session(session);
        if (!inventoryItem) {
          throw new Error("Associated inventory item not found or does not belong to user.");
        }

        inventoryItem.quantity += adjustmentToDelete.quantity; // Restock inventory

        // Update inventory status
        const newQuantity = inventoryItem.quantity;
        const minStockLevel = inventoryItem.minStockLevel || 0;
        if (inventoryItem.status === 'out-of-stock' && newQuantity > 0) {
            inventoryItem.status = (newQuantity <= minStockLevel) ? 'low-stock' : 'in-stock';
        } else if (inventoryItem.status === 'low-stock' && newQuantity > minStockLevel) {
            inventoryItem.status = 'in-stock';
        }
        await inventoryItem.save({ session });

        await StockAdjustment.findByIdAndDelete({ _id: id, user: userId }).session(session);
        await session.commitTransaction();
        res.json({ success: true, message: "Stock adjustment record deleted and inventory restocked." });
      } catch (err) {
        await session.abortTransaction();
        console.error("Error deleting stock adjustment record:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting stock adjustment record." });
      } finally {
        session.endSession();
      }
    };

// @desc    Get total cost impact of stock adjustments for a user over a period
// @route   GET /api/stock-adjustments/total-impact
// @access  Private
exports.getTotalStockAdjustmentImpact = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate, type } = req.query;

        const query = { user: userId };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (type) query.type = type;

        const aggregateResult = await StockAdjustment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCostImpact: { $sum: "$totalCostImpact" },
                    totalQuantityAdjusted: { $sum: "$quantity" },
                    recordCount: { $sum: 1 },
                }
            },
            { $project: { _id: 0, totalCostImpact: 1, totalQuantityAdjusted: 1, recordCount: 1 } }
        ]);

        const stats = aggregateResult[0] || { totalCostImpact: 0, totalQuantityAdjusted: 0, recordCount: 0 };

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error("Error fetching total stock adjustment impact:", err);
        res.status(500).json({ success: false, message: "Server Error fetching total stock adjustment impact." });
    }
};