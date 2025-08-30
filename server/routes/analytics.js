const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const { verifyToken } = require("../middleware/auth");
const moment = require("moment"); // You may need to run: npm install moment

router.get("/sales", verifyToken, async (req, res) => {
    try {
        const thirtyDaysAgo = moment().subtract(30, 'days').toDate();

        const salesOverTime = await Sale.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$totalAmount" },
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const topSellingProducts = await Sale.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.item",
                    totalQuantitySold: { $sum: "$items.quantity" },
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "inventories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { $project: { name: "$productDetails.name", sku: "$productDetails.sku", totalQuantitySold: 1 } }
        ]);

        const mostProfitableProducts = await Sale.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.item",
                    totalProfit: { $sum: { $multiply: ["$items.quantity", { $subtract: ["$items.price", "$items.costPrice"] }] } }
                }
            },
            { $sort: { totalProfit: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "inventories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { $project: { name: "$productDetails.name", sku: "$productDetails.sku", totalProfit: 1 } }
        ]);

        const topCustomers = await Sale.aggregate([
            { $match: { customer: { $ne: null } } },
            {
                $group: {
                    _id: "$customer",
                    totalSpent: { $sum: "$totalAmount" },
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customerDetails"
                }
            },
            { $unwind: "$customerDetails" },
            { $project: { name: "$customerDetails.name", email: "$customerDetails.email", totalSpent: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                salesOverTime,
                topSellingProducts,
                mostProfitableProducts,
                topCustomers
            }
        });
    } catch (err) {
        console.error("Sales analytics error:", err);
        res.status(500).json({ success: false, message: "Server Error fetching analytics." });
    }
});

module.exports = router;