// server/controllers/snapshotController.js
const DailyStockSnapshot = require("../models/DailyStockSnapshot");
const Inventory = require("../models/Inventory"); 
const mongoose = require("mongoose");
const moment = require("moment");

// @desc    Get daily stock snapshots for a user
// @route   GET /api/snapshots/daily-stock
// @access  Private
exports.getDailyStockSnapshots = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate, itemId, page = 1, limit = 20, sort = 'date', order = 'asc' } = req.query;

        const query = { user: new mongoose.Types.ObjectId(userId) };

        if (startDate && endDate) {
            query.date = { $gte: moment(startDate).startOf('day').toDate(), $lte: moment(endDate).endOf('day').toDate() };
        }
        if (itemId) {
            query.item = new mongoose.Types.ObjectId(itemId);
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const snapshots = await DailyStockSnapshot.find(query)
            .populate('item', 'name sku unit') // Populate item details for readability
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await DailyStockSnapshot.countDocuments(query);

        res.json({
            success: true,
            data: snapshots,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            }
        });

    } catch (err) {
        console.error("Error fetching daily stock snapshots:", err);
        res.status(500).json({ success: false, message: "Server Error fetching daily stock snapshots." });
    }
};

// @desc    Generate a single snapshot (for testing/manual trigger, NOT for production cron)
// @route   POST /api/snapshots/generate-one
// @access  Private (Admin or specific roles - for testing purposes here)
exports.generateSingleDailySnapshot = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { date: rawDate, itemId } = req.body;
        const targetDate = moment(rawDate).startOf('day').toDate();

        // Check if snapshot for this item and date already exists
        const existingSnapshot = await DailyStockSnapshot.findOne({ user: userId, item: itemId, date: targetDate }).session(session);
        if (existingSnapshot) {
            throw new Error(`Snapshot for item ${itemId} on ${targetDate.toLocaleDateString()} already exists.`);
        }

        const inventoryItem = await Inventory.findOne({ _id: itemId, user: userId }).session(session);
        if (!inventoryItem) {
            throw new Error("Inventory item not found or does not belong to user.");
        }

        // For this manual test function:
        // - Opening quantity: Assume previous day's closing, or 0 if no previous snapshot.
        // - Closing quantity: Use the *current live quantity* from the Inventory item.
        // NOTE: A production-grade automated daily snapshot would calculate opening/closing based on
        // all transactions within the specific day, not just live quantity.
        const previousDay = moment(targetDate).subtract(1, 'day').startOf('day').toDate();
        const previousSnapshot = await DailyStockSnapshot.findOne({ user: userId, item: itemId, date: previousDay }).session(session);
        const openingQuantity = previousSnapshot ? previousSnapshot.closingQuantity : 0;
        const closingQuantity = inventoryItem.quantity; // Live read for simplicity here

        const newSnapshot = new DailyStockSnapshot({
            user: userId,
            item: itemId,
            date: targetDate,
            openingQuantity: openingQuantity,
            closingQuantity: closingQuantity,
        });

        await newSnapshot.save({ session });
        await session.commitTransaction();

        res.status(201).json({ success: true, message: "Daily stock snapshot generated.", data: newSnapshot });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error generating single daily stock snapshot:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error generating snapshot." });
    } finally {
        session.endSession();
    }
};