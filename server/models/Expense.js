// server/models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user: { // Ensure expenses are associated with a user
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required.'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required.'],
      min: [0, 'Amount cannot be negative.'],
    },
    category: {
      type: String,
      required: [true, 'Expense category is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    payee: { // Who was paid (e.g., "Electricity Company", "Office Supplies Store")
      type: String,
      trim: true,
    },
    // You might add an account for detailed financial tracking
    // account: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Account',
    // },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Indexes for efficient querying
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);