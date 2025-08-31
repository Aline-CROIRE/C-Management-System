const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const { verifyToken } = require("../middleware/auth");
const moment = require("moment");

// --- NEW, ADVANCED INVENTORY ANALYTICS ENDPOINT ---
router.post("/inventory", verifyToken, async (req, res) => {
    try {
        const [
            summary,
            inventoryByCategory,
            mostValuableItems
        ] = await Promise.all([
            Inventory.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRetailValue: { $sum: "$totalValue" },
                        totalCostValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
                        totalUnits: { $sum: "$quantity" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalRetailValue: 1,
                        totalCostValue: 1,
                        totalUnits: 1,
                        potentialProfit: { $subtract: ["$totalRetailValue", "$totalCostValue"] }
                    }
                }
            ]),
            Inventory.aggregate([
                { $group: { _id: "$category", totalValue: { $sum: "$totalValue" } } },
                { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" }},
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                { $project: { name: { $ifNull: [ "$category.name", "Uncategorized" ] }, value: "$totalValue", _id: 0 } },
                { $sort: { value: -1 } },
                { $limit: 7 }
            ]),
            Inventory.find({ quantity: { $gt: 0 } }).sort({ totalValue: -1 }).limit(5).select('name sku totalValue').lean()
        ]);

        const ninetyDaysAgo = moment().subtract(90, 'days').toDate();
        const recentSaleItems = await Sale.distinct("items.item", { createdAt: { $gte: ninetyDaysAgo } });
        const deadStock = await Inventory.find({ 
            _id: { $nin: recentSaleItems }, 
            quantity: { $gt: 0 } 
        }).sort({ totalValue: -1 }).limit(5).select('name sku quantity totalValue').lean();

        res.json({
            success: true,
            data: {
                summary: summary[0] || {},
                inventoryByCategory,
                mostValuableItems,
                deadStock
            }
        });

    } catch (err) {
        console.error("Inventory analytics error:", err);
        res.status(500).json({ success: false, message: "Server Error fetching inventory analytics." });
    }
});


// --- YOUR EXISTING SALES ANALYTICS ENDPOINT (PRESERVED) ---
router.post("/sales", verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const dateQuery = {};
        if (startDate && endDate) {
            dateQuery.createdAt = {
                $gte: moment(startDate).startOf('day').toDate(),
                $lte: moment(endDate).endOf('day').toDate(),
            };
        }

        const salesOverTime = await Sale.aggregate([
            { $match: dateQuery },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalRevenue: { $sum: "$totalAmount" } } },
            { $sort: { _id: 1 } }
        ]);

        const mostProfitableProducts = await Sale.aggregate([
            { $match: dateQuery }, { $unwind: "$items" },
            { $group: { _id: "$items.item", totalProfit: { $sum: { $multiply: ["$items.quantity", { $subtract: ["$items.price", "$items.costPrice"] }] } } } },
            { $sort: { totalProfit: -1 } }, { $limit: 5 },
            { $lookup: { from: "inventories", localField: "_id", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $project: { name: "$product.name", sku: "$product.sku", totalProfit: 1 } }
        ]);

        const topCustomers = await Sale.aggregate([
            { $match: { customer: { $ne: null } } },
            { $group: { _id: "$customer", totalSpent: { $sum: "$totalAmount" } } },
            { $sort: { totalSpent: -1 } }, { $limit: 5 },
            { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customerDetails" }},
            { $unwind: "$customerDetails" },
            { $project: { name: "$customerDetails.name", email: "$customerDetails.email", totalSpent: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                salesOverTime,
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