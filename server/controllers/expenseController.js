// server/controllers/expenseController.js
const Expense = require("../models/Expense");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// @desc    Get all expenses for a user
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, startDate, endDate, search, page = 1, limit = 10, sort = 'date', order = 'desc' } = req.query;

    const query = { user: userId };

    if (category) query.category = category;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { payee: { $regex: search, $options: "i" } },
      ];
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'desc' ? -1 : 1;

    const expenses = await Expense.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limitNum);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ success: false, message: "Server Error fetching expenses." });
  }
};

// @desc    Get single expense by ID for a user
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Expense not found (invalid ID format)." });
    }

    const expense = await Expense.findOne({ _id: id, user: userId });
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found or does not belong to user." });
    }
    res.json({ success: true, data: expense });
  } catch (err) {
    console.error("Error fetching expense by ID:", err);
    res.status(500).json({ success: false, message: "Server Error fetching expense." });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.user._id;
    const { date, amount, category, description, payee } = req.body;

    const newExpense = new Expense({
      user: userId,
      date,
      amount,
      category,
      description,
      payee,
    });

    await newExpense.save();
    res.status(201).json({ success: true, message: "Expense recorded successfully!", data: newExpense });
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ success: false, message: err.message || "Server Error creating expense." });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { date, amount, category, description, payee } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Expense not found (invalid ID format)." });
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { date, amount, category, description, payee } },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ success: false, message: "Expense not found or does not belong to user." });
    }
    res.json({ success: true, message: "Expense updated successfully!", data: updatedExpense });
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ success: false, message: err.message || "Server Error updating expense." });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Expense not found (invalid ID format)." });
    }

    const deletedExpense = await Expense.findOneAndDelete({ _id: id, user: userId });
    if (!deletedExpense) {
      return res.status(404).json({ success: false, message: "Expense not found or does not belong to user." });
    }
    res.json({ success: true, message: "Expense deleted successfully!" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ success: false, message: err.message || "Server Error deleting expense." });
  }
};