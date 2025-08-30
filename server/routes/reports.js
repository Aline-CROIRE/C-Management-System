const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");
const { verifyToken } = require("../middleware/auth");
const moment = require("moment");

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

        const ninetyDaysAgo = moment().subtract(90, 'days').toDate();
        const recentSaleItems = await Sale.distinct("items.item", { createdAt: { $gte: ninetyDaysAgo } });
        const deadStock = await Inventory.find({ _id: { $nin: recentSaleItems }, quantity: { $gt: 0 } })
            .limit(5).select('name sku quantity').lean();

        const categoryPerformance = await Sale.aggregate([
            { $match: dateQuery }, { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "inventory" }},
            { $unwind: "$inventory" },
            { $lookup: { from: "categories", localField: "inventory.category", foreignField: "_id", as: "category" }},
            { $unwind: "$category" },
            { $group: { _id: "$category.name", totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
            { $sort: { totalRevenue: -1 } },
            { $project: { name: "$_id", revenue: "$totalRevenue", _id: 0 } }
        ]);
        
        const locationPerformance = await Sale.aggregate([
            { $match: dateQuery }, { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "inventory" }},
            { $unwind: "$inventory" },
            { $lookup: { from: "locations", localField: "inventory.location", foreignField: "_id", as: "location" }},
            { $unwind: "$location" },
            { $group: { _id: "$location.name", totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
            { $sort: { totalRevenue: -1 } },
            { $project: { name: "$_id", revenue: "$totalRevenue", _id: 0 } }
        ]);

        res.json({
            success: true,
            data: {
                salesOverTime,
                mostProfitableProducts,
                deadStock,
                categoryPerformance,
                locationPerformance
            }
        });
    } catch (err) {
        console.error("Sales analytics error:", err);
        res.status(500).json({ success: false, message: "Server Error fetching analytics." });
    }
});

module.exports = router;