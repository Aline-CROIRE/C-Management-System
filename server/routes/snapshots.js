// server/routes/snapshots.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const snapshotController = require("../controllers/snapshotController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// @route   GET /api/snapshots/daily-stock
// @desc    Get daily stock snapshots for a user
// @access  Private
router.get("/daily-stock", snapshotController.getDailyStockSnapshots);

// @route   POST /api/snapshots/generate-one
// @desc    Manually trigger generation of a single daily stock snapshot (for testing)
// @access  Private (consider admin-only in production)
router.post("/generate-one", [
    body('date', 'Date is required').isISO8601().toDate(),
    body('itemId', 'Item ID is required').isMongoId(),
], snapshotController.generateSingleDailySnapshot);


module.exports = router;