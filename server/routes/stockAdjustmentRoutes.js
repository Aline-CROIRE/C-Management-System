// server/routes/stockAdjustmentRoutes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const stockAdjustmentController = require("../controllers/stockAdjustmentController");
const { verifyToken } = require("../middleware/auth");

// Middleware to protect routes
router.use(verifyToken);

// Validation rules for stock adjustment creation
const stockAdjustmentValidationRules = [
  body('item', 'Item ID is required and must be a valid Mongo ID').isMongoId(),
  body('quantity', 'Quantity is required and must be a positive number').isInt({ min: 1 }),
  body('type', 'Adjustment type is required').isIn(['damaged', 'expired', 'lost', 'shrinkage', 'other']),
  body('reason', 'Reason for adjustment is required').not().isEmpty().trim(),
  body('date', 'Date must be a valid ISO 8601 date').optional().isISO8601().toDate(),
  body('notes').optional().trim(),
];

// --- IMPORTANT: Place /total-impact BEFORE /:id ---
router.get("/total-impact", stockAdjustmentController.getTotalStockAdjustmentImpact);
// --- END IMPORTANT ---

// Routes
router.route("/")
  .get(stockAdjustmentController.getStockAdjustments)
  .post(stockAdjustmentValidationRules, stockAdjustmentController.createStockAdjustment);

router.route("/:id")
  .get(stockAdjustmentController.getStockAdjustmentById)
  .delete(stockAdjustmentController.deleteStockAdjustment);


module.exports = router;