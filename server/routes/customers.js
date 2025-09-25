 const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose');

const customerController = require("../controllers/customerController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.route("/")
    .get(customerController.getCustomers)
    .post(
        [
            body('name', 'Customer name is required').not().isEmpty().trim(),
            body('email', 'Invalid email format').optional().isEmail(),
            body('phone', 'Phone number is required').optional().not().isEmpty().trim(),
        ],
        customerController.createCustomer
    );

router.route("/:id")
    .get(customerController.getCustomerById)
    .put(
        [
            body('name', 'Customer name is required').not().isEmpty().trim(),
            body('email', 'Invalid email format').optional().isEmail(),
            body('phone', 'Phone number is required').optional().not().isEmpty().trim(),
        ],
        customerController.updateCustomer
    )
    .delete(customerController.deleteCustomer);

router.post("/:id/payments", 
    [
        body('amount', 'Payment amount is required and must be a positive number').isFloat({ min: 0.01 }),
        body('paymentMethod', 'Payment method is required').not().isEmpty(),
        body('notes').optional().trim(),
    ], 
    customerController.recordCustomerPayment
);

module.exports = router;