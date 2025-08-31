const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const PurchaseOrder = require("../models/PurchaseOrder");
const { verifyToken } = require("../middleware/auth");
const moment = require("moment");
const PDFDocument = require('pdfkit');

const getAnalyticsData = async (filters) => {
    const { startDate, endDate } = filters;
    const dateQuery = {};
    if (startDate && endDate) {
        const start = moment(startDate).startOf('day').toDate();
        const end = moment(endDate).endOf('day').toDate();
        dateQuery.createdAt = { $gte: start, $lte: end };
    }

    const salesQuery = { ...dateQuery };
    const poQuery = { orderDate: dateQuery.createdAt };

    const [
        salesData,
        inventoryData,
        poData,
        salesOverTime,
        inventoryByCategory,
        locationPerformance
    ] = await Promise.all([
        Sale.aggregate([
            { $match: salesQuery },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalProfit: { $sum: { $subtract: ["$totalAmount", { $sum: "$items.costPrice" }] } } } }
        ]),
        Inventory.aggregate([
            { $group: { _id: null, totalValue: { $sum: "$totalValue" }, totalCost: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } }
        ]),
        PurchaseOrder.aggregate([
            { $match: poQuery },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),
        Sale.aggregate([
            { $match: salesQuery },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" } } },
            { $sort: { _id: 1 } }
        ]),
        Inventory.aggregate([
            { $group: { _id: "$category", totalValue: { $sum: "$totalValue" } } },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" }},
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: [ "$category.name", "Uncategorized" ] }, value: "$totalValue", _id: 0 } },
            { $sort: { value: -1 } },
            { $limit: 5 }
        ]),
        Sale.aggregate([
            { $match: salesQuery }, { $unwind: "$items" },
            { $lookup: { from: "inventories", localField: "items.item", foreignField: "_id", as: "inventory" }},
            { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "locations", localField: "inventory.location", foreignField: "_id", as: "location" }},
            { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$location.name", value: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
            { $sort: { value: -1 } },
            { $limit: 5 },
            { $project: { name: { $ifNull: [ "$_id", "No Location" ] }, value: "$value", _id: 0 } }
        ])
    ]);

    const salesSummary = salesData[0] || { totalRevenue: 0, totalProfit: 0 };
    const inventorySummary = inventoryData[0] || { totalValue: 0, totalCost: 0 };
    const poSummary = poData.reduce((acc, status) => {
        acc[status._id.toLowerCase()] = status.count;
        return acc;
    }, {});

    return { salesSummary, inventorySummary, poSummary, salesOverTime, inventoryByCategory, locationPerformance };
};

router.post("/", verifyToken, async (req, res) => {
    try {
        const data = await getAnalyticsData(req.body);
        res.json({ success: true, data });
    } catch (err) {
        console.error("Analytics data error:", err);
        res.status(500).json({ success: false, message: "Server Error fetching analytics." });
    }
});

router.post("/print", verifyToken, async (req, res) => {
    try {
        const data = await getAnalyticsData(req.body);
        const { startDate, endDate } = req.body;
        const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System User';
        
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 500, height: 250, backgroundColour: '#ffffff' });
        const PIE_CHART_COLORS = ['#2F855A', '#2C7A7B', '#2B6CB0', '#553C9A', '#B83280'];

        const salesChartConfig = {
            type: 'bar',
            data: {
                labels: data.salesOverTime.map(d => moment(d._id).format('MMM D')),
                datasets: [{
                    label: 'Revenue (Rwf)',
                    data: data.salesOverTime.map(d => d.revenue),
                    backgroundColor: 'rgba(47, 133, 90, 0.6)',
                    borderColor: 'rgba(47, 133, 90, 1)',
                    borderWidth: 1
                }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        };
        
        const categoryChartConfig = {
            type: 'pie',
            data: {
                labels: data.inventoryByCategory.map(c => c.name),
                datasets: [{
                    data: data.inventoryByCategory.map(c => c.value),
                    backgroundColor: PIE_CHART_COLORS,
                }]
            }
        };

        const [salesChartImage, categoryChartImage] = await Promise.all([
            chartJSNodeCanvas.renderToBuffer(salesChartConfig),
            chartJSNodeCanvas.renderToBuffer(categoryChartConfig),
        ]);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Comprehensive-Report.pdf`);
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('Comprehensive Business Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Generated by: ${userName}`);
        if(startDate && endDate) {
            doc.text(`Reporting Period: ${moment(startDate).format('MMM D, YYYY')} - ${moment(endDate).format('MMM D, YYYY')}`);
        }
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('Sales Overview');
        doc.image(salesChartImage, { fit: [500, 250] });
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('Inventory Valuation by Category');
        doc.image(categoryChartImage, { fit: [500, 250] });
        
        doc.end();

    } catch (err) {
        console.error("Report PDF Generation Error:", err);
        res.status(500).json({ success: false, message: "Server error generating report PDF." });
    }
});

module.exports = router;