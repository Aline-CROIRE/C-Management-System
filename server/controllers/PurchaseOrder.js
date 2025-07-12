const asyncHandler = require('express-async-handler');
const PurchaseOrder = require('../models/PurchaseOrder');

// Helper function to generate a unique poNumber (customize as needed)
const generatePONumber = () => {
  return `PO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
const getPurchaseOrders = asyncHandler(async (req, res) => {
  const purchaseOrders = await PurchaseOrder.find({})
    .populate('supplier', 'name') // Populate supplier's name
    .sort({ createdAt: -1 }); // Show newest first

  res.status(200).json({
    success: true,
    count: purchaseOrders.length,
    data: purchaseOrders,
  });
});

// @desc    Create a new purchase order
// @route   POST /api/purchase-orders
// @access  Private
const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplierId, items, notes, expectedDate } = req.body;

  if (!supplierId || !items || items.length === 0) {
    res.status(400);
    throw new Error('Supplier and at least one item are required');
  }

  // Calculate total amount
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Generate a unique poNumber
  const poNumber = generatePONumber();

  const po = new PurchaseOrder({
    poNumber, // assign generated poNumber here
    supplier: supplierId,
    items,
    totalAmount,
    notes,
    expectedDate,
    // status, etc. will use model defaults/hooks
  });

  const createdPO = await po.save();

  // Respond with the newly created PO, populated with supplier details
  const populatedPO = await PurchaseOrder.findById(createdPO._id).populate(
    'supplier',
    'name'
  );

  res.status(201).json({
    success: true,
    data: populatedPO,
  });
});

// @desc    Get a single purchase order by ID
// @route   GET /api/purchase-orders/:id
// @access  Private
const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id).populate(
    'supplier',
    'name email phone address'
  );

  if (po) {
    res.status(200).json({
      success: true,
      data: po,
    });
  } else {
    res.status(404);
    throw new Error('Purchase Order not found');
  }
});

module.exports = {
  getPurchaseOrders,
  createPurchaseOrder,
  getPurchaseOrderById,
};
