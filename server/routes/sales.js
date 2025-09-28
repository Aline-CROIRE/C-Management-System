// server/routes/sales.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const saleController = require("../controllers/salesController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// router.get("/total-value", saleController.getTotalSalesValue); // Example route, if you have one.
router.get("/packaging-report", saleController.getPackagingReport); // NEW ROUTE

router.route("/")
    .get(saleController.getSales)
    .post(
        [
            body('items', 'At least one item is required').isArray({ min: 1 }),
            body('totalAmount', 'Total amount is required').isNumeric(),
            body('paymentMethod', 'Payment method is required').not().isEmpty(),
            body('amountPaid', 'Amount paid must be a non-negative number').optional().isFloat({ min: 0 }),
        ],
        saleController.createSale
    );

router.post("/:id/record-payment", 
    [
        body('amount', 'Payment amount is required and must be a positive number').isFloat({ min: 0.01 }),
        body('paymentMethod', 'Payment method is required').not().isEmpty(),
    ], 
    saleController.recordPayment
);

router.post("/:id/return", 
    [
        body('returnedItems', 'Returned items data is required').isArray({ min: 1 })
    ], 
    saleController.processReturn
);

// NEW ROUTE: For explicit packaging return (e.g., customer returns bottles)
router.post("/:saleId/items/:itemId/return-packaging", 
    [
        body('quantityReturned', 'Quantity returned for packaging is required and must be a positive number').isInt({ min: 1 }),
        body('refundMethod', 'Refund method is required').not().isEmpty().trim(),
    ],
    saleController.returnPackaging
);

router.delete("/:id", saleController.deleteSale); 
router.get("/:id/pdf", saleController.generatePDF); 
router.post("/analytics", saleController.getSalesAnalytics); 

module.exports = router;