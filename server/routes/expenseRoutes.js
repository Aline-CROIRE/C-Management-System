// server/routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const expenseController = require("../controllers/expenseController");
const { verifyToken } = require("../middleware/auth"); // Assuming you have this middleware

// Middleware to protect routes
router.use(verifyToken);

// Validation rules for expense creation/update
const expenseValidationRules = [
  body('date', 'Expense date is required').isISO8601().toDate(),
  body('amount', 'Amount is required and must be a positive number').isFloat({ min: 0.01 }),
  body('category', 'Category is required').not().isEmpty().trim(),
  body('description').optional().trim(),
  body('payee').optional().trim(),
];

// Routes
router.route("/")
  .get(expenseController.getExpenses)
  .post(expenseValidationRules, expenseController.createExpense);

router.route("/:id")
  .get(expenseController.getExpenseById)
  .put(expenseValidationRules, expenseController.updateExpense)
  .delete(expenseController.deleteExpense);

module.exports = router;