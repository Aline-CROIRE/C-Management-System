const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const moment = require("moment");

const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");
const PurchaseOrder = require("../models/PurchaseOrder");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Category = require("../models/Category");

const { verifyToken } = require("../middleware/auth");

router.post("/comprehensive", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate || !moment(startDate).isValid() || !moment(endDate).isValid()) {
            return res.status(400).json({ success: false, message: "Invalid or missing start/end dates." });
        }

        const queryStartDate = moment(startDate).startOf('day').toDate();
        const queryEndDate = moment(endDate).endOf('day').toDate();

        const dateRangeQuery = {
            createdAt: {
                $gte: queryStartDate,
                $lte: queryEndDate,
            },
            user: userId,
        };

        const salesProfitAndCogs = await Sale.aggregate([
            { $match: dateRangeQuery },
            { $unwind: "$items" },
            { $group: {
                _id: null,
                totalGrossProfit: { 
                    $sum: { 
                        $multiply: [
                            { $ifNull: [{ $toDouble: "$items.quantity" }, 0] }, 
                            { $subtract: [{ $ifNull: [{ $toDouble: "$items.price" }, 0] }, { $ifNull: [{ $toDouble: "$items.costPrice" }, 0] }] }
                        ] 
                    } 
                },
                totalCostOfGoodsSold: { 
                    $sum: { 
                        $multiply: [
                            { $ifNull: [{ $toDouble: "$items.quantity" }, 0] }, 
                            { $ifNull: [{ $toDouble: "$items.costPrice" }, 0] }
                        ] 
                    } 
                }
            }},
            { $project: { _id: 0, totalGrossProfit: 1, totalCostOfGoodsSold: 1 } }
        ]);
        const calculatedTotalProfit = salesProfitAndCogs[0]?.totalGrossProfit || 0;
        const totalCostOfGoodsSold = salesProfitAndCogs[0]?.totalCostOfGoodsSold || 0;

        const overallSalesStats = await Sale.aggregate([
            { $match: dateRangeQuery },
            { $group: {
                _id: null,
                totalRevenue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } },
                totalSalesCount: { $sum: 1 },
            }},
            { $project: { _id: 0, totalRevenue: 1, totalSalesCount: 1 } }
        ]);

        const salesOverTime = await Sale.aggregate([
            { $match: dateRangeQuery },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalRevenue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $sort: { _id: 1 } }
        ]);

        const poSpendOverTime = await PurchaseOrder.aggregate([
            { $match: { ...dateRangeQuery, status: "Completed" } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalSpend: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $sort: { _id: 1 } }
        ]);
        
        const mergedRevenuePoDataMap = {};
        salesOverTime.forEach(s => mergedRevenuePoDataMap[s._id] = { Revenue: s.totalRevenue, POSpend: 0 });
        poSpendOverTime.forEach(p => {
            if (mergedRevenuePoDataMap[p._id]) {
                mergedRevenuePoDataMap[p._id].POSpend = p.totalSpend;
            } else {
                mergedRevenuePoDataMap[p._id] = { Revenue: 0, POSpend: p.totalSpend };
            }
        });
        const revenueVsPoData = Object.keys(mergedRevenuePoDataMap).sort().map(date => ({
            date,
            Revenue: mergedRevenuePoDataMap[date].Revenue,
            POSpend: mergedRevenuePoDataMap[date].POSpend
        }));


        const mostProfitableProducts = await Sale.aggregate([
            { $match: dateRangeQuery }, 
            { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $match: { "product.user": userId } },
            { $group: { 
                _id: "$items.item", 
                totalProfit: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$items.quantity" }, 0] }, { $subtract: [{ $ifNull: [{ $toDouble: "$items.price" }, 0] }, { $ifNull: [{ $toDouble: "$items.costPrice" }, 0] }] }] } } 
            }},
            { $sort: { totalProfit: -1 } }, 
            { $limit: 5 },
            { $lookup: { from: "inventories", localField: "_id", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $project: { _id: 0, name: "$product.name", sku: "$product.sku", totalProfit: 1 } }
        ]);

        const topSellingProducts = await Sale.aggregate([
            { $match: dateRangeQuery }, 
            { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $match: { "product.user": userId } },
            { $group: { _id: "$items.item", totalQuantitySold: { $sum: { $ifNull: [{ $toDouble: "$items.quantity" }, 0] } } } },
            { $sort: { totalQuantitySold: -1 } }, 
            { $limit: 5 },
            { $lookup: { from: "inventories", localField: "_id", foreignField: "_id", as: "product" }},
            { $unwind: "$product" },
            { $project: { _id: 0, name: "$product.name", sku: "$product.sku", totalQuantitySold: 1 } }
        ]);

        const salesByCategory = await Sale.aggregate([
            { $match: dateRangeQuery },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "inventories",
                    localField: "items.item",
                    foreignField: "_id",
                    as: "inventoryItem"
                }
            },
            { $unwind: "$inventoryItem" },
            { $match: { "inventoryItem.user": userId } },
            {
                $lookup: {
                    from: "categories",
                    localField: "inventoryItem.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$categoryDetails.name", "Uncategorized"] },
                    totalRevenue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$items.quantity" }, 0] }, { $ifNull: [{ $toDouble: "$items.price" }, 0] }] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $project: { _id: 0, name: "$_id", value: "$totalRevenue" } }
        ]);

        const ninetyDaysAgo = moment().subtract(90, 'days').toDate();
        const recentSaleItems = await Sale.distinct("items.item", { createdAt: { $gte: ninetyDaysAgo }, user: userId });
        const deadStock = await Inventory.find({ user: userId, _id: { $nin: recentSaleItems }, quantity: { $gt: 0 } })
            .limit(5).select('name sku quantity').lean();
        
        const outOfStockItems = await Inventory.find({ user: userId, quantity: { $lte: 0 } })
            .limit(5).select('name sku quantity').lean();

        const lowStockItems = await Inventory.find({ user: userId,
                $expr: { $lte: [{ $toDouble: "$quantity" }, { $toDouble: "$minStockLevel" }] },
                quantity: { $gt: 0 },
                status: { $ne: 'out-of-stock' }
            })
            .sort({ quantity: 1 })
            .limit(5)
            .select('name sku quantity minStockLevel').lean();

        const inventoryValuation = await Inventory.aggregate([
            { $match: { user: userId, quantity: { $gt: 0 } } },
            { $group: {
                _id: null,
                totalCostValue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$quantity" }, 0] }, { $ifNull: [{ $toDouble: "$costPrice" }, 0] }] } },
                totalRetailValue: { $sum: { $multiply: [{ $ifNull: [{ $toDouble: "$quantity" }, 0] }, { $ifNull: [{ $toDouble: "$price" }, 0] }] } },
                totalItems: { $sum: { $ifNull: [{ $toDouble: "$quantity" }, 0] } },
                uniqueProducts: { $sum: 1 }
            }},
            { $project: { _id: 0, totalCostValue: 1, totalRetailValue: 1, totalItems: 1, uniqueProducts: 1 } }
        ]);

        const poStatusOverview = await PurchaseOrder.aggregate([
            { $match: dateRangeQuery },
            { $group: { _id: "$status", count: { $sum: 1 }, totalValue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $project: { status: "$_id", count: 1, totalValue: 1, _id: 0 } }
        ]);

        const totalCompletedPOValueResult = await PurchaseOrder.aggregate([
            { $match: { ...dateRangeQuery, status: "Completed" } },
            { $group: { _id: null, totalValue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $project: { _id: 0, totalValue: 1 } }
        ]);
        const totalCompletedPOValue = totalCompletedPOValueResult[0]?.totalValue || 0;

        // --- UPDATED: Top Suppliers aggregation ---
        const topSuppliers = await PurchaseOrder.aggregate([
            { $match: { ...dateRangeQuery, status: "Completed" } },
            { $group: { _id: "$supplier", totalPurchasedValue: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $sort: { totalPurchasedValue: -1 } },
            { $limit: 5 },
            { $lookup: { 
                from: "suppliers", 
                localField: "_id", 
                foreignField: "_id", 
                as: "supplierDetails",
                pipeline: [{ $match: { user: userId } }] // Filter suppliers by user during lookup
            } },
            { $unwind: "$supplierDetails" }, // This will only unwind if supplierDetails is found for the user
            { $project: { _id: 0, name: "$supplierDetails.name", totalPurchasedValue: 1 } }
        ]);

        // --- UPDATED: Top Customers aggregation ---
        const topCustomers = await Sale.aggregate([
            { $match: { ...dateRangeQuery, customer: { $ne: null } } },
            { $group: { _id: "$customer", totalSpent: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } } } },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            { $lookup: { 
                from: "customers", 
                localField: "_id", 
                foreignField: "_id", 
                as: "customerDetails",
                pipeline: [{ $match: { user: userId } }] // Filter customers by user during lookup
            } },
            { $unwind: "$customerDetails" }, // This will only unwind if customerDetails is found for the user
            { $project: { _id: 0, name: "$customerDetails.name", email: "$customerDetails.email", totalSpent: 1 } }
        ]);

        const salesByPaymentMethod = await Sale.aggregate([
            { $match: dateRangeQuery },
            { $group: {
                _id: { $ifNull: ["$paymentMethod", "Other/Unknown Payment"] },
                totalAmount: { $sum: { $ifNull: [{ $toDouble: "$totalAmount" }, 0] } },
                count: { $sum: 1 }
            }},
            { $sort: { totalAmount: -1 } }
        ]);

        const grossRoi = totalCostOfGoodsSold > 0 ? (calculatedTotalProfit / totalCostOfGoodsSold) * 100 : 0;

        res.json({
            success: true,
            data: {
                overallSalesStats: {
                    totalRevenue: overallSalesStats[0]?.totalRevenue || 0,
                    totalSalesCount: overallSalesStats[0]?.totalSalesCount || 0,
                    totalProfit: calculatedTotalProfit,
                    totalCostOfGoodsSold: totalCostOfGoodsSold,
                    grossRoi: grossRoi,
                },
                salesOverTime,
                revenueVsPoData,
                mostProfitableProducts,
                topSellingProducts,
                salesByCategory,
                deadStock,
                outOfStockItems,
                lowStockItems,
                inventoryValuation: inventoryValuation[0] || { totalCostValue: 0, totalRetailValue: 0, totalItems: 0, uniqueProducts: 0 },
                poStatusOverview,
                totalCompletedPOValue,
                topSuppliers,
                topCustomers,
                salesByPaymentMethod,
            }
        });

    } catch (err) {
        console.error("Comprehensive reports error:", err);
        res.status(500).json({ success: false, message: "Server Error fetching comprehensive reports." });
    }
});

module.exports = router;