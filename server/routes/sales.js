const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const saleController = require("../controllers/saleController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

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

router.delete("/:id", saleController.deleteSale);

router.get("/:id/pdf", saleController.generatePDF);
router.post("/analytics", saleController.getSalesAnalytics);

module.exports = router;