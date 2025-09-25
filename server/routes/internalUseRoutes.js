// server/routes/internalUseRoutes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const internalUseController = require("../controllers/internalUseController");
const { verifyToken } = require("../middleware/auth");

// Middleware to protect routes
router.use(verifyToken);

// --- CRITICAL FIX: Move validation rules BEFORE they are used ---
const internalUseValidationRules = [
  body('item', 'Item ID is required and must be a valid Mongo ID').isMongoId(),
  body('quantity', 'Quantity is required and must be a positive number').isInt({ min: 1 }),
  body('reason', 'Reason for internal use is required').not().isEmpty().trim(),
  body('date', 'Date must be a valid ISO 8601 date').optional().isISO8601().toDate(),
  body('notes').optional().trim(),
];
// --- END CRITICAL FIX ---


// Routes
router.get("/total-value", internalUseController.getTotalInternalUseValue); 

router.route("/")
  .get(internalUseController.getInternalUses)
  .post(internalUseValidationRules, internalUseController.createInternalUse); // internalUseValidationRules is now defined

router.route("/:id")
  .get(internalUseController.getInternalUseById)
  .delete(internalUseController.deleteInternalUse);


module.exports = router;