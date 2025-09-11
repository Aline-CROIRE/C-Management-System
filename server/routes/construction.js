// server/routes/construction.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const moment = require("moment");
const multer = require('multer'); // For handling file uploads

// Import all models
const ConstructionSite = require("../models/ConstructionSite");
const Equipment = require("../models/Equipment");
const Task = require("../models/Task");
const Worker = require("../models/Worker");
const Document = require("../models/Document"); // New
const Certification = require("../models/Certification"); // New
const MaintenanceLog = require("../models/MaintenanceLog"); // New
const Timesheet = require("../models/Timesheet"); // New
const ChangeOrder = require("../models/ChangeOrder"); // New
const MaterialRequest = require("../models/MaterialRequest"); // New
const PaymentRequest = require("../models/PaymentRequest"); // New
const SafetyIncident = require("../models/SafetyIncident"); // New

const { verifyToken } = require("../middleware/auth"); // Assuming this middleware exists
const { isAdmin, isProjectManager, isSiteEngineer } = require("../middleware/roleMiddleware"); // Assuming role-based middleware for some routes

// --- Multer Configuration for File Uploads (Placeholder) ---
// Configure storage for multer
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only PDF, Word, Excel, and image files are allowed!'), false);
        }
        cb(null, true);
    },
});

// Placeholder for actual file upload to cloud storage (e.g., S3, GCP Storage)
const uploadFileToStorage = async (file, folderName = 'documents') => {
    // In a real application, this would interact with your cloud storage SDK
    // Example: const s3 = new AWS.S3();
    // const params = {
    //   Bucket: process.env.AWS_S3_BUCKET_NAME,
    //   Key: `${folderName}/${Date.now()}-${file.originalname}`,
    //   Body: file.buffer,
    //   ContentType: file.mimetype,
    // };
    // const data = await s3.upload(params).promise();
    // return data.Location; // Return the public URL of the uploaded file

    // For now, return a dummy URL
    console.log(`Simulating upload for: ${file.originalname} to ${folderName}`);
    return `https://example.com/uploads/${folderName}/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
};
// --- End Multer Configuration ---


// Helper to send validation errors
const sendValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
};

// --- GENERAL STATS ---
router.get("/stats", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;

        const totalSites = await ConstructionSite.countDocuments({ user: userId });
        const activeSites = await ConstructionSite.countDocuments({ user: userId, status: 'Active' });
        const completedSites = await ConstructionSite.countDocuments({ user: userId, status: 'Completed' });
        const delayedSites = await ConstructionSite.countDocuments({
            user: userId,
            endDate: { $lt: new Date() },
            status: { $nin: ['Completed', 'Cancelled'] }
        });

        const totalBudgetResult = await ConstructionSite.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, totalBudget: { $sum: "$budget" }, totalExpenditure: { $sum: "$expenditure" } } }
        ]);
        const totalBudget = totalBudgetResult.length > 0 ? totalBudgetResult[0].totalBudget : 0;
        const totalExpenditure = totalBudgetResult.length > 0 ? totalBudgetResult[0].totalExpenditure : 0;
        const remainingBudget = totalBudget - totalExpenditure;

        const totalEquipment = await Equipment.countDocuments({ user: userId });
        const operationalEquipment = await Equipment.countDocuments({ user: userId, status: 'Operational' });
        const inMaintenanceEquipment = await Equipment.countDocuments({ user: userId, status: 'In Maintenance' });
        const brokenEquipment = await Equipment.countDocuments({ user: userId, status: 'Broken' });

        const totalTasks = await Task.countDocuments({ user: userId });
        const pendingTasks = await Task.countDocuments({ user: userId, status: { $in: ['To Do', 'In Progress', 'Blocked'] } });
        const overdueTasks = await Task.countDocuments({
            user: userId,
            dueDate: { $lt: new Date() },
            status: { $nin: ['Completed', 'Cancelled'] }
        });

        const totalWorkers = await Worker.countDocuments({ user: userId });
        const activeWorkers = await Worker.countDocuments({ user: userId, isActive: true });

        const pendingChangeOrders = await ChangeOrder.countDocuments({ user: userId, status: 'Pending' });
        const pendingMaterialRequests = await MaterialRequest.countDocuments({ user: userId, status: 'Pending' });
        const pendingPaymentRequests = await PaymentRequest.countDocuments({ user: userId, status: 'Pending' });

        res.json({
            success: true,
            data: {
                sites: {
                    total: totalSites,
                    active: activeSites,
                    completed: completedSites,
                    delayed: delayedSites,
                    totalBudget,
                    totalExpenditure,
                    remainingBudget,
                },
                equipment: {
                    total: totalEquipment,
                    operational: operationalEquipment,
                    inMaintenance: inMaintenanceEquipment,
                    broken: brokenEquipment,
                },
                tasks: {
                    total: totalTasks,
                    pending: pendingTasks,
                    overdue: overdueTasks,
                },
                workers: {
                    total: totalWorkers,
                    active: activeWorkers,
                },
                financials: {
                    pendingChangeOrders,
                    pendingMaterialRequests,
                    pendingPaymentRequests,
                }
            },
        });
    } catch (err) {
        console.error("Error fetching construction stats:", err);
        res.status(500).json({ success: false, message: "Server Error fetching construction statistics." });
    }
});

// --- CONSTRUCTION SITES ---
router.get("/sites", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, search, page = 1, limit = 10, sort = 'startDate', order = 'desc' } = req.query;

        const query = { user: userId };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { projectCode: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { manager: { $regex: search, $options: 'i' } },
                { clientName: { $regex: search, $options: 'i' } },
            ];
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const sites = await ConstructionSite.find(query)
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await ConstructionSite.countDocuments(query);

        res.json({
            success: true,
            data: sites,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching construction sites:", err);
        res.status(500).json({ success: false, message: "Server Error fetching sites." });
    }
});

router.get("/sites/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Construction site not found (Invalid ID format)." });
        }

        const site = await ConstructionSite.findOne({ _id: id, user: userId })
            .populate('tasks')
            .populate('changeOrders')
            .populate('documents')
            .populate('paymentRequests')
            .populate('materialRequests')
            .populate({
                path: 'assignedWorkers.worker',
                select: 'fullName role'
            })
            .populate('safetyIncidents');
            
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        res.json({ success: true, data: site });
    } catch (err) {
        console.error("Error fetching site by ID:", err);
        res.status(500).json({ success: false, message: "Server Error fetching site." });
    }
});

router.post("/sites", verifyToken, [
    body('name', 'Site name is required').not().isEmpty().trim(),
    body('projectCode', 'Project code is required').not().isEmpty().trim(),
    body('location', 'Location is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('endDate', 'Valid end date is required').isISO8601().toDate(),
    body('budget', 'Budget must be a non-negative number').isFloat({ min: 0 }),
    body('manager', 'Manager name is required').not().isEmpty().trim(),
    body('description', 'Description must be a string').optional().isString().trim(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('clientName', 'Client name must be a string').optional().isString().trim(),
    body('contractValue', 'Contract value must be a non-negative number').optional().isFloat({ min: 0 }),
    body('phase', 'Invalid project phase').optional().isIn(['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closing']),
    body('riskLevel', 'Invalid risk level').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('budgetDetails', 'Budget details must be an array').optional().isArray(),
    body('budgetDetails.*.category', 'Invalid budget category').optional().isIn(['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Permits', 'Overhead', 'Other']),
    body('budgetDetails.*.plannedAmount', 'Planned amount must be a non-negative number').optional().isFloat({ min: 0 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { projectCode, name, type, location, startDate, endDate, budget, manager, description, notes,
            clientName, contractValue, phase, riskLevel, budgetDetails } = req.body;

        if (moment(endDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        const uppercaseProjectCode = projectCode.toUpperCase();
        const existingSite = await ConstructionSite.findOne({ user: userId, projectCode: uppercaseProjectCode });
        if (existingSite) {
            return res.status(400).json({ success: false, message: "A site with this project code already exists for this user." });
        }

        const newSite = new ConstructionSite({
            user: userId, name, projectCode: uppercaseProjectCode, type, location, startDate, endDate, budget, manager, description, notes,
            clientName, contractValue, phase, riskLevel, budgetDetails,
            status: 'Planning', progress: 0, expenditure: 0, workersCount: 0, equipmentCount: 0,
        });

        await newSite.save();
        res.status(201).json({ success: true, message: "Construction site created successfully!", data: newSite });
    } catch (err) {
        console.error("Error creating site:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error creating site." });
    }
});

router.put("/sites/:id", verifyToken, [
    body('name', 'Site name is required').not().isEmpty().trim(),
    body('projectCode', 'Project code is required').not().isEmpty().trim(),
    body('location', 'Location is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('endDate', 'Valid end date is required').isISO8601().toDate(),
    body('budget', 'Budget must be a non-negative number').isFloat({ min: 0 }),
    body('manager', 'Manager name is required').not().isEmpty().trim(),
    body('status', 'Invalid site status').optional().isIn(['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled']),
    body('progress', 'Progress must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('expenditure', 'Expenditure must be a non-negative number').optional().isFloat({ min: 0 }),
    body('description', 'Description must be a string').optional().isString().trim(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('clientName', 'Client name must be a string').optional().isString().trim(),
    body('contractValue', 'Contract value must be a non-negative number').optional().isFloat({ min: 0 }),
    body('phase', 'Invalid project phase').optional().isIn(['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closing']),
    body('riskLevel', 'Invalid risk level').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('budgetDetails', 'Budget details must be an array').optional().isArray(),
    body('budgetDetails.*.category', 'Invalid budget category').optional().isIn(['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Permits', 'Overhead', 'Other']),
    body('budgetDetails.*.plannedAmount', 'Planned amount must be a non-negative number').optional().isFloat({ min: 0 }),
    body('budgetDetails.*.actualAmount', 'Actual amount must be a non-negative number').optional().isFloat({ min: 0 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { projectCode, startDate, endDate, status, ...restOfUpdateData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Construction site not found (Invalid ID format)." });
        }
        if (moment(endDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        const uppercaseProjectCode = projectCode.toUpperCase();
        const existingSiteWithCode = await ConstructionSite.findOne({
            user: userId,
            projectCode: uppercaseProjectCode,
            _id: { $ne: id }
        });
        if (existingSiteWithCode) {
            return res.status(400).json({ success: false, message: "Another site with this project code already exists for this user." });
        }

        const updateData = { ...restOfUpdateData, projectCode: uppercaseProjectCode, startDate, endDate, status };
        
        const updatedSite = await ConstructionSite.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedSite) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        res.json({ success: true, message: "Construction site updated successfully!", data: updatedSite });
    } catch (err) {
        console.error("Error updating site:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error updating site." });
    }
});

router.delete("/sites/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Construction site not found (Invalid ID format)." });
        }

        const deletedSite = await ConstructionSite.findOneAndDelete({ _id: id, user: userId });
        if (!deletedSite) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        // Clean up related documents, tasks, equipment, etc.
        await Task.deleteMany({ site: id, user: userId });
        await Equipment.updateMany({ currentSite: id, user: userId }, { $set: { currentSite: null } });
        await ChangeOrder.deleteMany({ site: id, user: userId });
        await MaterialRequest.deleteMany({ site: id, user: userId });
        await PaymentRequest.deleteMany({ site: id, user: userId });
        await SafetyIncident.deleteMany({ site: id, user: userId });
        // Documents linked to the site will be handled via refId/refModel logic, if needed.
        // For simplicity, we'll assume direct deletion here for now.
        await Document.deleteMany({ refId: id, refModel: 'ConstructionSite', user: userId });


        res.json({ success: true, message: "Construction site deleted successfully!" });
    } catch (err) {
        console.error("Error deleting site:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting site." });
    }
});

// --- EQUIPMENT ---
router.get("/equipment", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, search, siteId, type, page = 1, limit = 10, sort = 'name', order = 'asc' } = req.query;

        const query = { user: userId };
        if (status) query.status = status;
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { assetTag: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } },
            ];
        }
        if (siteId && mongoose.Types.ObjectId.isValid(siteId)) query.currentSite = siteId;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const equipment = await Equipment.find(query)
            .populate('currentSite', 'name projectCode')
            .populate('documents') // Populate linked documents
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await Equipment.countDocuments(query);

        res.json({
            success: true,
            data: equipment,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching equipment:", err);
        res.status(500).json({ success: false, message: "Server Error fetching equipment." });
    }
});

router.get("/equipment/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Equipment not found (Invalid ID format)." });
        }

        const equipmentItem = await Equipment.findOne({ _id: id, user: userId })
            .populate('currentSite', 'name projectCode')
            .populate('documents')
            .populate('maintenanceLogs'); // Populate linked maintenance logs
            
        if (!equipmentItem) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }
        res.json({ success: true, data: equipmentItem });
    } catch (err) {
        console.error("Error fetching equipment by ID:", err);
        res.status(500).json({ success: false, message: "Server Error fetching equipment." });
    }
});

router.post("/equipment", verifyToken, [
    body('name', 'Equipment name is required').not().isEmpty().trim(),
    body('assetTag', 'Asset tag is required').not().isEmpty().trim(),
    body('type', 'Equipment type is required').not().isEmpty().trim().isIn(['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other']),
    body('currentSite', 'Current site must be a valid ID').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid current site ID.'),
    body('purchaseDate', 'Valid purchase date is required').isISO8601().toDate(),
    body('purchaseCost', 'Purchase cost must be a non-negative number').isFloat({ min: 0 }),
    body('condition', 'Invalid equipment condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
    body('lastMaintenance', 'Valid last maintenance date is required').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('nextMaintenance', 'Valid next maintenance date is required').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('utilization', 'Utilization must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('serialNumber', 'Serial number must be a string').optional().isString().trim(),
    body('manufacturer', 'Manufacturer must be a string').optional().isString().trim(),
    body('model', 'Model must be a string').optional().isString().trim(),
    body('warrantyExpiry', 'Valid warranty expiry date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('hourlyRate', 'Hourly rate must be a non-negative number').optional().isFloat({ min: 0 }),
    body('fuelType', 'Fuel type must be a string').optional().isString().trim(),
    body('rentalInfo.isRented', 'isRented must be a boolean').optional().isBoolean(),
    body('rentalInfo.rentalCompany', 'Rental company must be a string').optional().isString().trim(),
    body('rentalInfo.rentalCost', 'Rental cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('rentalInfo.returnDate', 'Valid rental return date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { assetTag, name, type, currentSite, purchaseDate, purchaseCost, condition, lastMaintenance, nextMaintenance, utilization, notes,
            serialNumber, manufacturer, model, warrantyExpiry, hourlyRate, fuelType, rentalInfo } = req.body;

        const uppercaseAssetTag = assetTag.toUpperCase();
        const existingEquipment = await Equipment.findOne({ user: userId, assetTag: uppercaseAssetTag });
        if (existingEquipment) {
            return res.status(400).json({ success: false, message: "Equipment with this asset tag already exists for this user." });
        }

        if (currentSite && mongoose.Types.ObjectId.isValid(currentSite)) {
            const site = await ConstructionSite.findOne({ _id: currentSite, user: userId });
            if (site) {
                site.equipmentCount = (site.equipmentCount || 0) + 1;
                await site.save();
            } else {
                return res.status(400).json({ success: false, message: "Provided current site does not exist or does not belong to the user." });
            }
        }

        const newEquipment = new Equipment({
            user: userId, name, assetTag: uppercaseAssetTag, type, currentSite: currentSite || null, purchaseDate, purchaseCost, condition,
            lastMaintenance, nextMaintenance, utilization, notes, serialNumber, manufacturer, model, warrantyExpiry, hourlyRate, fuelType, rentalInfo,
            status: 'Operational', currentValue: purchaseCost,
        });

        await newEquipment.save();
        res.status(201).json({ success: true, message: "Equipment created successfully!", data: newEquipment });
    } catch (err) {
        console.error("Error creating equipment:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error creating equipment." });
    }
});

router.put("/equipment/:id", verifyToken, [
    body('name', 'Equipment name is required').not().isEmpty().trim(),
    body('assetTag', 'Asset tag is required').not().isEmpty().trim(),
    body('type', 'Equipment type is required').not().isEmpty().trim().isIn(['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other']),
    body('currentSite', 'Current site must be a valid ID').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid current site ID.'),
    body('status', 'Invalid equipment status').optional().isIn(['Operational', 'In Maintenance', 'Idle', 'Broken', 'In Transit', 'Out of Service']),
    body('condition', 'Invalid equipment condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
    body('lastMaintenance', 'Valid last maintenance date is required').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('nextMaintenance', 'Valid next maintenance date is required').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('purchaseDate', 'Valid purchase date is required').optional().isISO8601().toDate(),
    body('purchaseCost', 'Purchase cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('currentValue', 'Current value must be a non-negative number').optional().isFloat({ min: 0 }),
    body('utilization', 'Utilization must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('serialNumber', 'Serial number must be a string').optional().isString().trim(),
    body('manufacturer', 'Manufacturer must be a string').optional().isString().trim(),
    body('model', 'Model must be a string').optional().isString().trim(),
    body('warrantyExpiry', 'Valid warranty expiry date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('hourlyRate', 'Hourly rate must be a non-negative number').optional().isFloat({ min: 0 }),
    body('fuelType', 'Fuel type must be a string').optional().isString().trim(),
    body('rentalInfo.isRented', 'isRented must be a boolean').optional().isBoolean(),
    body('rentalInfo.rentalCompany', 'Rental company must be a string').optional().isString().trim(),
    body('rentalInfo.rentalCost', 'Rental cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('rentalInfo.returnDate', 'Valid rental return date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { assetTag, currentSite, _prevCurrentSite, ...restOfUpdateData } = req.body; // _prevCurrentSite is a frontend hint

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Equipment not found (Invalid ID format)." });
        }

        const uppercaseAssetTag = assetTag.toUpperCase();
        const existingEquipmentWithTag = await Equipment.findOne({
            user: userId,
            assetTag: uppercaseAssetTag,
            _id: { $ne: id }
        });
        if (existingEquipmentWithTag) {
            return res.status(400).json({ success: false, message: "Another equipment with this asset tag already exists for this user." });
        }

        const newCurrentSiteId = (currentSite && mongoose.Types.ObjectId.isValid(currentSite)) ? currentSite : null;
        const updateData = { assetTag: uppercaseAssetTag, currentSite: newCurrentSiteId, ...restOfUpdateData };
        
        const updatedEquipment = await Equipment.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedEquipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }

        // Update equipmentCount on sites if currentSite changed
        const prevSiteId = String(_prevCurrentSite);
        const oldSiteIdValid = prevSiteId && prevSiteId !== 'undefined' && prevSiteId !== 'null' && mongoose.Types.ObjectId.isValid(prevSiteId);

        if (oldSiteIdValid && String(oldSiteIdValid) !== String(newCurrentSiteId)) {
            await ConstructionSite.updateOne(
                { _id: oldSiteIdValid, user: userId },
                { $inc: { equipmentCount: -1 } }
            );
        }

        if (newCurrentSiteId && String(oldSiteIdValid) !== String(newCurrentSiteId)) {
            const newSite = await ConstructionSite.findOne({ _id: newCurrentSiteId, user: userId });
            if (newSite) {
                await ConstructionSite.updateOne(
                    { _id: newCurrentSiteId, user: userId },
                    { $inc: { equipmentCount: 1 } }
                );
            } else {
                return res.status(400).json({ success: false, message: "Provided new current site does not exist or does not belong to the user." });
            }
        }

        res.json({ success: true, message: "Equipment updated successfully!", data: updatedEquipment });
    } catch (err) {
        console.error("Error updating equipment:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error updating equipment." });
    }
});

router.delete("/equipment/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Equipment not found (Invalid ID format)." });
        }

        const deletedEquipment = await Equipment.findOneAndDelete({ _id: id, user: userId });
        if (!deletedEquipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }

        if (deletedEquipment.currentSite && mongoose.Types.ObjectId.isValid(deletedEquipment.currentSite)) {
            await ConstructionSite.updateOne(
                { _id: deletedEquipment.currentSite, user: userId },
                { $inc: { equipmentCount: -1 } }
            );
        }
        // Remove equipment from any tasks it was allocated to
        await Task.updateMany(
            { 'allocatedEquipment.equipment': deletedEquipment._id, user: userId },
            { $pull: { allocatedEquipment: { equipment: deletedEquipment._id } } }
        );
        // Delete related maintenance logs and documents
        await MaintenanceLog.deleteMany({ equipment: id, user: userId });
        await Document.deleteMany({ refId: id, refModel: 'Equipment', user: userId });


        res.json({ success: true, message: "Equipment deleted successfully!" });
    } catch (err) {
        console.error("Error deleting equipment:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error deleting equipment." });
    }
});

// --- TASKS ---
router.get("/tasks", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, status, search, page = 1, limit = 10, sort = 'dueDate', order = 'asc' } = req.query;

        const query = { user: userId };
        if (siteId && mongoose.Types.ObjectId.isValid(siteId)) query.site = siteId;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
            ];
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const tasks = await Task.find(query)
            .populate('site', 'name projectCode')
            .populate('parentTask', 'name')
            .populate({
                path: 'dependencies.taskId', // Populate the taskId field within the dependencies array
                select: 'name startDate dueDate'
            })
            .populate('assignedTo', 'fullName role') // Old 'assignedTo'
            .populate({
                path: 'allocatedWorkers.worker', // New 'allocatedWorkers'
                select: 'fullName role'
            })
            .populate({
                path: 'allocatedEquipment.equipment', // New 'allocatedEquipment'
                select: 'name assetTag'
            })
            .populate('documents')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await Task.countDocuments(query);

        res.json({
            success: true,
            data: tasks,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ success: false, message: "Server Error fetching tasks." });
    }
});

router.get("/tasks/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Task not found (Invalid ID format)." });
        }

        const task = await Task.findOne({ _id: id, user: userId })
            .populate('site', 'name projectCode')
            .populate('parentTask', 'name')
            .populate({
                path: 'dependencies.taskId',
                select: 'name startDate dueDate'
            })
            .populate('assignedTo', 'fullName role')
            .populate({
                path: 'allocatedWorkers.worker',
                select: 'fullName role hourlyRate'
            })
            .populate({
                path: 'allocatedEquipment.equipment',
                select: 'name assetTag hourlyRate'
            })
            .populate('documents');

        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found or does not belong to user." });
        }
        res.json({ success: true, data: task });
    }
    catch (err) {
        console.error("Error fetching task by ID:", err);
        res.status(500).json({ success: false, message: "Server Error fetching task." });
    }
});

router.post("/tasks", verifyToken, [
    body('site', 'Site ID is required').isMongoId().withMessage('Invalid site ID.'),
    body('name', 'Task name is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('dueDate', 'Valid due date is required').isISO8601().toDate(),
    body('status', 'Invalid task status').optional().isIn(['To Do', 'In Progress', 'Blocked', 'Completed', 'Cancelled']),
    body('priority', 'Invalid task priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('assignedTo', 'Assigned To must be an array of valid Worker IDs')
        .optional({ nullable: true, checkFalsy: true }).isArray().withMessage('Assigned To must be an array.')
        .custom(async (value, { req }) => {
            if (value && value.length > 0) {
                if (!value.every(mongoose.Types.ObjectId.isValid)) { throw new Error('Each assigned worker must be a valid Worker ID.'); }
                const existingWorkers = await Worker.find({ _id: { $in: value }, user: req.user._id });
                if (existingWorkers.length !== value.length) { throw new Error('One or more assigned worker IDs are invalid or do not belong to you.'); }
            } return true;
        }),
    body('progress', 'Progress must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('parentTask', 'Parent task must be a valid ID if provided')
        .optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid parent task ID.'),
    body('dependencies', 'Dependencies must be an array of valid dependency objects').optional().isArray(),
    body('dependencies.*.taskId', 'Dependency taskId must be a valid MongoDB ID').optional().isMongoId(),
    body('dependencies.*.type', 'Invalid dependency type').optional().isIn(['FS', 'SS', 'FF']),
    body('dependencies.*.lag', 'Dependency lag must be a number').optional().isNumeric(),
    body('allocatedWorkers', 'Allocated workers must be an array').optional().isArray(),
    body('allocatedWorkers.*.worker', 'Allocated worker ID must be valid').isMongoId(),
    body('allocatedWorkers.*.estimatedHours', 'Estimated hours must be a non-negative number').isFloat({ min: 0 }),
    body('allocatedEquipment', 'Allocated equipment must be an array').optional().isArray(),
    body('allocatedEquipment.*.equipment', 'Allocated equipment ID must be valid').isMongoId(),
    body('allocatedEquipment.*.estimatedHours', 'Estimated equipment hours must be a non-negative number').isFloat({ min: 0 }),
    body('requiredMaterials', 'Required materials must be an array').optional().isArray(),
    body('requiredMaterials.*.materialName', 'Material name is required').not().isEmpty().trim(),
    body('requiredMaterials.*.quantity', 'Material quantity must be a positive number').isFloat({ min: 0.01 }),
    body('requiredMaterials.*.unit', 'Material unit is required').not().isEmpty().trim(),
    body('estimatedLaborCost', 'Estimated labor cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('estimatedMaterialCost', 'Estimated material cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('estimatedEquipmentCost', 'Estimated equipment cost must be a non-negative number').optional().isFloat({ min: 0 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { site: siteId, name, description, startDate, dueDate, status, priority, assignedTo, progress, parentTask, dependencies, notes,
            allocatedWorkers, allocatedEquipment, requiredMaterials, estimatedLaborCost, estimatedMaterialCost, estimatedEquipmentCost } = req.body;

        if (moment(dueDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "Due date cannot be before start date." });
        }
        if (dependencies && dependencies.some(dep => dep.taskId === parentTask)) {
             return res.status(400).json({ success: false, message: "A task cannot be a dependency of its parent." });
        }

        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        
        const newTask = new Task({
            user: userId, site: siteId, name, description, startDate, dueDate, status: status || 'To Do', priority: priority || 'Medium',
            assignedTo: assignedTo || [], progress: progress || 0, parentTask: parentTask || null, dependencies: dependencies || [], notes,
            allocatedWorkers: allocatedWorkers || [], allocatedEquipment: allocatedEquipment || [], requiredMaterials: requiredMaterials || [],
            estimatedLaborCost, estimatedMaterialCost, estimatedEquipmentCost,
        });

        await newTask.save();
        site.tasks.push(newTask._id);
        // Recalculate workersCount for the site based on tasks, or directly assign workers to site
        // For now, simple push. More complex logic needed for full connection
        await site.save();

        res.status(201).json({ success: true, message: "Task created successfully!", data: newTask });
    } catch (err) {
        console.error("Error creating task:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error creating task." });
    }
});

router.put("/tasks/:id", verifyToken, [
    body('site', 'Site ID is required').isMongoId().withMessage('Invalid site ID.'),
    body('name', 'Task name is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('dueDate', 'Valid due date is required').isISO8601().toDate(),
    body('status', 'Invalid task status').optional().isIn(['To Do', 'In Progress', 'Blocked', 'Completed', 'Cancelled']),
    body('priority', 'Invalid task priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('assignedTo', 'Assigned To must be an array of valid Worker IDs')
        .optional({ nullable: true, checkFalsy: true }).isArray().withMessage('Assigned To must be an array.')
        .custom(async (value, { req }) => {
            if (value && value.length > 0) {
                if (!value.every(mongoose.Types.ObjectId.isValid)) { throw new Error('Each assigned worker must be a valid Worker ID.'); }
                const existingWorkers = await Worker.find({ _id: { $in: value }, user: req.user._id });
                if (existingWorkers.length !== value.length) { throw new Error('One or more assigned worker IDs are invalid or do not belong to you.'); }
            } return true;
        }),
    body('progress', 'Progress must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('parentTask', 'Parent task must be a valid ID if provided')
        .optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid parent task ID.'),
    body('dependencies', 'Dependencies must be an array of valid dependency objects').optional().isArray(),
    body('dependencies.*.taskId', 'Dependency taskId must be a valid MongoDB ID').optional().isMongoId(),
    body('dependencies.*.type', 'Invalid dependency type').optional().isIn(['FS', 'SS', 'FF']),
    body('dependencies.*.lag', 'Dependency lag must be a number').optional().isNumeric(),
    body('allocatedWorkers', 'Allocated workers must be an array').optional().isArray(),
    body('allocatedWorkers.*.worker', 'Allocated worker ID must be valid').isMongoId(),
    body('allocatedWorkers.*.estimatedHours', 'Estimated hours must be a non-negative number').isFloat({ min: 0 }),
    body('allocatedEquipment', 'Allocated equipment must be an array').optional().isArray(),
    body('allocatedEquipment.*.equipment', 'Allocated equipment ID must be valid').isMongoId(),
    body('allocatedEquipment.*.estimatedHours', 'Estimated equipment hours must be a non-negative number').isFloat({ min: 0 }),
    body('requiredMaterials', 'Required materials must be an array').optional().isArray(),
    body('requiredMaterials.*.materialName', 'Material name is required').not().isEmpty().trim(),
    body('requiredMaterials.*.quantity', 'Material quantity must be a positive number').isFloat({ min: 0.01 }),
    body('requiredMaterials.*.unit', 'Material unit is required').not().isEmpty().trim(),
    body('estimatedLaborCost', 'Estimated labor cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('estimatedMaterialCost', 'Estimated material cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('estimatedEquipmentCost', 'Estimated equipment cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('actualLaborCost', 'Actual labor cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('actualMaterialCost', 'Actual material cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('actualEquipmentCost', 'Actual equipment cost must be a non-negative number').optional().isFloat({ min: 0 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { site: newSiteId, startDate, dueDate, status, parentTask, assignedTo, dependencies, allocatedWorkers, allocatedEquipment, requiredMaterials, ...restOfUpdateData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Task not found (Invalid ID format)." });
        }

        const currentTask = await Task.findOne({ _id: id, user: userId });
        if (!currentTask) {
            return res.status(404).json({ success: false, message: "Task not found or does not belong to user." });
        }

        if (moment(dueDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "Due date cannot be before start date." });
        }
        if (dependencies && dependencies.some(dep => String(dep.taskId) === id)) {
            return res.status(400).json({ success: false, message: "A task cannot depend on itself." });
        }
        if (dependencies && dependencies.some(dep => String(dep.taskId) === String(parentTask))) {
             return res.status(400).json({ success: false, message: "A task cannot be a dependency of its parent." });
        }
        if (parentTask && String(parentTask) === id) {
            return res.status(400).json({ success: false, message: "A task cannot be its own parent." });
        }
        
        const oldSiteId = currentTask.site ? String(currentTask.site) : null;
        if (newSiteId && String(newSiteId) !== oldSiteId) {
            if (oldSiteId && mongoose.Types.ObjectId.isValid(oldSiteId)) {
                 await ConstructionSite.updateOne(
                     { _id: oldSiteId, user: userId },
                     { $pull: { tasks: currentTask._id } }
                 );
            }
            const newSite = await ConstructionSite.findOne({ _id: newSiteId, user: userId });
            if (!newSite) {
                return res.status(404).json({ success: false, message: "New construction site not found or does not belong to user." });
            }
            await ConstructionSite.updateOne(
                { _id: newSiteId, user: userId },
                { $addToSet: { tasks: currentTask._id } }
            );
        }

        const updateData = {
            ...restOfUpdateData,
            site: newSiteId,
            startDate, dueDate, status,
            parentTask: parentTask || null,
            assignedTo: assignedTo || [],
            dependencies: dependencies || [],
            allocatedWorkers: allocatedWorkers || [],
            allocatedEquipment: allocatedEquipment || [],
            requiredMaterials: requiredMaterials || [],
        };

        const updatedTask = await Task.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ success: false, message: "Task not found or does not belong to user." });
        }

        res.json({ success: true, message: "Task updated successfully!", data: updatedTask });
    } catch (err) {
        console.error("Error updating task:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error updating task." });
    }
});

router.delete("/tasks/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Task not found (Invalid ID format)." });
        }

        const deletedTask = await Task.findOneAndDelete({ _id: id, user: userId });
        if (!deletedTask) {
            return res.status(404).json({ success: false, message: "Task not found or does not belong to user." });
        }

        if (deletedTask.site && mongoose.Types.ObjectId.isValid(deletedTask.site)) {
            await ConstructionSite.updateOne(
                { _id: deletedTask.site, user: userId },
                { $pull: { tasks: deletedTask._id } }
            );
        }
       
        await Task.updateMany(
            { parentTask: deletedTask._id, user: userId },
            { $set: { parentTask: null } }
        );

        await Task.updateMany(
            { 'dependencies.taskId': deletedTask._id, user: userId },
            { $pull: { dependencies: { taskId: deletedTask._id } } }
        );

        await Document.deleteMany({ refId: id, refModel: 'Task', user: userId });

        res.json({ success: true, message: "Task deleted successfully!" });
    } catch (err) {
        console.error("Error deleting task:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error deleting task." });
    }
});

// --- WORKERS ---
router.get("/workers", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { search, role, isActive, page = 1, limit = 10, sort = 'fullName', order = 'asc' } = req.query;

        const query = { user: userId };
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { skills: { $elemMatch: { $regex: search, $options: 'i' } } },
            ];
        }
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const workers = await Worker.find(query)
            .populate('certifications') // Populate linked certifications
            .populate('documents') // Populate linked documents
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await Worker.countDocuments(query);

        res.json({
            success: true,
            data: workers,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching workers:", err);
        res.status(500).json({ success: false, message: "Server Error fetching workers." });
    }
});

router.get("/workers/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }

        const worker = await Worker.findOne({ _id: id, user: userId })
            .populate('certifications')
            .populate('documents')
            .populate('timesheets');
            
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }
        res.json({ success: true, data: worker });
    } catch (err) {
        console.error("Error fetching worker by ID:", err);
        res.status(500).json({ success: false, message: "Server Error fetching worker." });
    }
});

router.post("/workers", verifyToken, [
    body('fullName', 'Full name is required').not().isEmpty().trim(),
    body('role', 'Invalid worker role').optional().isIn(['General Labor', 'Skilled Labor', 'Supervisor', 'Electrician', 'Plumber', 'Heavy Equipment Operator', 'Safety Officer', 'Foreman', 'Other']),
    body('email', 'Invalid email format').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('contactNumber', 'Contact number must be a string').optional().isString().trim(),
    body('skills', 'Skills must be an array of strings').optional().isArray().custom(value => {
        if (!value.every(s => typeof s === 'string')) throw new Error('Each skill must be a string');
        return true;
    }),
    body('isActive', 'isActive must be a boolean').optional().isBoolean(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('hourlyRate', 'Hourly rate must be a non-negative number').optional().isFloat({ min: 0 }),
    body('employmentType', 'Invalid employment type').optional().isIn(['Full-time', 'Part-time', 'Contractor']),
    body('hireDate', 'Valid hire date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('emergencyContact.name', 'Emergency contact name must be a string').optional().isString().trim(),
    body('emergencyContact.phone', 'Emergency contact phone must be a string').optional().isString().trim(),
    body('emergencyContact.relationship', 'Emergency contact relationship must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { fullName, role, contactNumber, email, skills, isActive, notes,
            hourlyRate, employmentType, hireDate, emergencyContact } = req.body;

        const newWorker = new Worker({
            user: userId, fullName, role: role || 'General Labor', contactNumber, email, skills: skills || [], isActive: isActive ?? true, notes,
            hourlyRate, employmentType, hireDate, emergencyContact,
        });

        await newWorker.save();
        res.status(201).json({ success: true, message: "Worker created successfully!", data: newWorker });
    } catch (err) {
        console.error("Error creating worker:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error creating worker." });
    }
});

router.put("/workers/:id", verifyToken, [
    body('fullName', 'Full name is required').not().isEmpty().trim(),
    body('role', 'Invalid worker role').optional().isIn(['General Labor', 'Skilled Labor', 'Supervisor', 'Electrician', 'Plumber', 'Heavy Equipment Operator', 'Safety Officer', 'Foreman', 'Other']),
    body('email', 'Invalid email format').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('contactNumber', 'Contact number must be a string').optional().isString().trim(),
    body('skills', 'Skills must be an array of strings').optional().isArray().custom(value => {
        if (!value.every(s => typeof s === 'string')) throw new Error('Each skill must be a string');
        return true;
    }),
    body('isActive', 'isActive must be a boolean').optional().isBoolean(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('hourlyRate', 'Hourly rate must be a non-negative number').optional().isFloat({ min: 0 }),
    body('employmentType', 'Invalid employment type').optional().isIn(['Full-time', 'Part-time', 'Contractor']),
    body('hireDate', 'Valid hire date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('emergencyContact.name', 'Emergency contact name must be a string').optional().isString().trim(),
    body('emergencyContact.phone', 'Emergency contact phone must be a string').optional().isString().trim(),
    body('emergencyContact.relationship', 'Emergency contact relationship must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }

        const updatedWorker = await Worker.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedWorker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }
        res.json({ success: true, message: "Worker updated successfully!", data: updatedWorker });
    } catch (err) {
        console.error("Error updating worker:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error updating worker." });
    }
});

router.delete("/workers/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }

        const deletedWorker = await Worker.findOneAndDelete({ _id: id, user: userId });
        if (!deletedWorker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }

        // Remove worker from any tasks or site assignments
        await Task.updateMany(
            { assignedTo: deletedWorker._id, user: userId },
            { $pull: { assignedTo: deletedWorker._id } }
        );
        await Task.updateMany(
            { 'allocatedWorkers.worker': deletedWorker._id, user: userId },
            { $pull: { allocatedWorkers: { worker: deletedWorker._id } } }
        );
        await ConstructionSite.updateMany(
            { 'assignedWorkers.worker': deletedWorker._id, user: userId },
            { $pull: { assignedWorkers: { worker: deletedWorker._id } } }
        );
        // Delete related certifications, timesheets, and documents
        await Certification.deleteMany({ worker: id, user: userId });
        await Timesheet.deleteMany({ worker: id, user: userId });
        await Document.deleteMany({ refId: id, refModel: 'Worker', user: userId });

        res.json({ success: true, message: "Worker deleted successfully!" });
    } catch (err) {
        console.error("Error deleting worker:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error deleting worker." });
    }
});


// --- MILESTONES (Embedded in Site) ---
router.post("/sites/:siteId/milestones", verifyToken, [
    body('name', 'Milestone name is required').not().isEmpty().trim(),
    body('targetDate', 'Valid target date is required').isISO8601().toDate(),
    body('status', 'Invalid milestone status').optional().isIn(['Planned', 'In Progress', 'Completed', 'Delayed']),
    body('description', 'Description must be a string').optional().isString().trim(),
    body('criticalPath', 'Critical path must be a boolean').optional().isBoolean(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const newMilestoneData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }

        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        site.milestones.push(newMilestoneData);
        await site.save();

        res.status(201).json({ success: true, message: "Milestone added successfully!", data: site.milestones[site.milestones.length - 1] });
    } catch (err) {
        console.error("Error adding milestone:", err);
        res.status(500).json({ success: false, message: "Server Error adding milestone." });
    }
});

router.put("/sites/:siteId/milestones/:milestoneId", verifyToken, [
    body('name', 'Milestone name is required').not().isEmpty().trim(),
    body('targetDate', 'Valid target date is required').isISO8601().toDate(),
    body('status', 'Invalid milestone status').optional().isIn(['Planned', 'In Progress', 'Completed', 'Delayed']),
    body('description', 'Description must be a string').optional().isString().trim(),
    body('criticalPath', 'Critical path must be a boolean').optional().isBoolean(),
    body('actualCompletionDate', 'Valid actual completion date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId, milestoneId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
            return res.status(404).json({ success: false, message: "Site or Milestone not found (Invalid ID format)." });
        }

        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        const milestone = site.milestones.id(milestoneId);
        if (!milestone) {
            return res.status(404).json({ success: false, message: "Milestone not found within this site." });
        }

        Object.assign(milestone, updateData);
        await site.save();

        res.json({ success: true, message: "Milestone updated successfully!", data: milestone });
    } catch (err) {
        console.error("Error updating milestone:", err);
        res.status(500).json({ success: false, message: "Server Error updating milestone." });
    }
});

router.delete("/sites/:siteId/milestones/:milestoneId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, milestoneId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
            return res.status(404).json({ success: false, message: "Site or Milestone not found (Invalid ID format)." });
        }

        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        site.milestones.id(milestoneId).deleteOne(); // Use deleteOne() on the subdocument
        await site.save();

        res.json({ success: true, message: "Milestone deleted successfully!" });
    } catch (err) {
        console.error("Error deleting milestone:", err);
        res.status(500).json({ success: false, message: "Server Error deleting milestone." });
    }
});

// --- SITE MATERIAL INVENTORY (Embedded in Site) ---
router.post("/sites/:siteId/material-inventory", verifyToken, [
    body('materialName', 'Material name is required').not().isEmpty().trim(),
    body('quantityOnHand', 'Quantity must be a non-negative number').isFloat({ min: 0 }),
    body('unit', 'Unit is required').not().isEmpty().trim(),
    body('minStockLevel', 'Minimum stock level must be a non-negative number').optional().isFloat({ min: 0 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const newItemData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        // Prevent duplicate material names
        const existingMaterial = site.siteMaterialInventory.find(item => item.materialName.toLowerCase() === newItemData.materialName.toLowerCase());
        if (existingMaterial) {
            return res.status(400).json({ success: false, message: "Material with this name already exists in site inventory." });
        }

        site.siteMaterialInventory.push(newItemData);
        await site.save();

        res.status(201).json({ success: true, message: "Material added to site inventory successfully!", data: site.siteMaterialInventory[site.siteMaterialInventory.length - 1] });
    } catch (err) {
        console.error("Error adding material to site inventory:", err);
        res.status(500).json({ success: false, message: "Server Error adding material to site inventory." });
    }
});

router.put("/sites/:siteId/material-inventory/:itemId", verifyToken, [
    body('materialName', 'Material name is required').not().isEmpty().trim(),
    body('quantityOnHand', 'Quantity must be a non-negative number').isFloat({ min: 0 }),
    body('unit', 'Unit is required').not().isEmpty().trim(),
    body('minStockLevel', 'Minimum stock level must be a non-negative number').optional().isFloat({ min: 0 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId, itemId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ success: false, message: "Site or Material Item not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        const materialItem = site.siteMaterialInventory.id(itemId);
        if (!materialItem) {
            return res.status(404).json({ success: false, message: "Material item not found in site inventory." });
        }

        // Prevent changing materialName to an existing one
        const existingMaterialWithSameName = site.siteMaterialInventory.find(item =>
            String(item._id) !== itemId && item.materialName.toLowerCase() === updateData.materialName.toLowerCase()
        );
        if (existingMaterialWithSameName) {
            return res.status(400).json({ success: false, message: "Another material with this name already exists in site inventory." });
        }

        Object.assign(materialItem, updateData);
        materialItem.lastUpdated = Date.now();
        await site.save();

        res.json({ success: true, message: "Material inventory updated successfully!", data: materialItem });
    } catch (err) {
        console.error("Error updating material inventory:", err);
        res.status(500).json({ success: false, message: "Server Error updating material inventory." });
    }
});

router.delete("/sites/:siteId/material-inventory/:itemId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, itemId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ success: false, message: "Site or Material Item not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        site.siteMaterialInventory.id(itemId).deleteOne();
        await site.save();

        res.json({ success: true, message: "Material removed from site inventory successfully!" });
    } catch (err) {
        console.error("Error deleting material from site inventory:", err);
        res.status(500).json({ success: false, message: "Server Error deleting material from site inventory." });
    }
});


// --- ASSIGNED WORKERS TO SITE (Embedded in Site) ---
router.post("/sites/:siteId/assigned-workers", verifyToken, [
    body('worker', 'Worker ID is required').isMongoId().withMessage('Invalid Worker ID.'),
    body('assignedRole', 'Assigned role is required').not().isEmpty().trim(),
    body('assignmentStartDate', 'Valid assignment start date is required').isISO8601().toDate(),
    body('assignmentEndDate', 'Valid assignment end date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const { worker: workerId, assignedRole, assignmentStartDate, assignmentEndDate } = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }

        const existingAssignment = site.assignedWorkers.find(aw => String(aw.worker) === String(workerId));
        if (existingAssignment) {
            return res.status(400).json({ success: false, message: "Worker is already directly assigned to this site." });
        }

        site.assignedWorkers.push({ worker: workerId, assignedRole, assignmentStartDate, assignmentEndDate });
        site.workersCount = (site.workersCount || 0) + 1; // Increment site worker count
        await site.save();
        await site.populate({ path: 'assignedWorkers.worker', select: 'fullName role' });


        res.status(201).json({ success: true, message: "Worker assigned to site successfully!", data: site.assignedWorkers[site.assignedWorkers.length - 1] });
    } catch (err) {
        console.error("Error assigning worker to site:", err);
        res.status(500).json({ success: false, message: "Server Error assigning worker to site." });
    }
});

router.put("/sites/:siteId/assigned-workers/:assignmentId", verifyToken, [
    body('worker', 'Worker ID is required').isMongoId().withMessage('Invalid Worker ID.'),
    body('assignedRole', 'Assigned role is required').not().isEmpty().trim(),
    body('assignmentStartDate', 'Valid assignment start date is required').isISO8601().toDate(),
    body('assignmentEndDate', 'Valid assignment end date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId, assignmentId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(404).json({ success: false, message: "Site or Assignment not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        const assignment = site.assignedWorkers.id(assignmentId);
        if (!assignment) {
            return res.status(404).json({ success: false, message: "Worker assignment not found on this site." });
        }

        // Ensure the worker ID itself isn't changed if it would conflict with another existing assignment
        const { worker: newWorkerId } = updateData;
        if (String(assignment.worker) !== String(newWorkerId)) {
             const existingAssignmentWithNewWorker = site.assignedWorkers.find(aw => String(aw.worker) === String(newWorkerId) && String(aw._id) !== assignmentId);
             if (existingAssignmentWithNewWorker) {
                 return res.status(400).json({ success: false, message: "New worker ID is already assigned to this site." });
             }
        }
        
        Object.assign(assignment, updateData);
        await site.save();
        await site.populate({ path: 'assignedWorkers.worker', select: 'fullName role' });

        res.json({ success: true, message: "Worker assignment updated successfully!", data: assignment });
    } catch (err) {
        console.error("Error updating worker assignment to site:", err);
        res.status(500).json({ success: false, message: "Server Error updating worker assignment to site." });
    }
});

router.delete("/sites/:siteId/assigned-workers/:assignmentId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, assignmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(404).json({ success: false, message: "Site or Assignment not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        const assignment = site.assignedWorkers.id(assignmentId);
        if (!assignment) {
            return res.status(404).json({ success: false, message: "Worker assignment not found on this site." });
        }
        
        assignment.deleteOne();
        site.workersCount = Math.max(0, (site.workersCount || 0) - 1); // Decrement site worker count
        await site.save();

        res.json({ success: true, message: "Worker unassigned from site successfully!" });
    } catch (err) {
        console.error("Error unassigning worker from site:", err);
        res.status(500).json({ success: false, message: "Server Error unassigning worker from site." });
    }
});


// --- CHANGE ORDERS ---
router.get("/sites/:siteId/change-orders", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const { status, search, page = 1, limit = 10, sort = 'requestDate', order = 'desc' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }

        const query = { user: userId, site: siteId };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { requestedBy: { $regex: search, $options: 'i' } },
            ];
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const changeOrders = await ChangeOrder.find(query)
            .populate('approvedBy', 'fullName email')
            .populate({
                path: 'comments.commentedBy',
                select: 'fullName email'
            })
            .populate('documents')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await ChangeOrder.countDocuments(query);

        res.json({
            success: true,
            data: changeOrders,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching change orders:", err);
        res.status(500).json({ success: false, message: "Server Error fetching change orders." });
    }
});

router.post("/sites/:siteId/change-orders", verifyToken, [
    body('title', 'Title is required').not().isEmpty().trim(),
    body('description', 'Description is required').not().isEmpty().trim(),
    body('requestedBy', 'Requested by is required').not().isEmpty().trim(),
    body('costImpact', 'Cost impact must be a number').optional().isFloat(),
    body('timelineImpactDays', 'Timeline impact must be an integer').optional().isInt(),
    body('reason', 'Reason must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const newChangeOrderData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        const newChangeOrder = new ChangeOrder({
            ...newChangeOrderData,
            user: userId,
            site: siteId,
            status: 'Pending',
        });
        await newChangeOrder.save();

        site.changeOrders.push(newChangeOrder._id);
        await site.save();

        res.status(201).json({ success: true, message: "Change order created successfully!", data: newChangeOrder });
    } catch (err) {
        console.error("Error creating change order:", err);
        res.status(500).json({ success: false, message: "Server Error creating change order." });
    }
});

router.put("/sites/:siteId/change-orders/:changeOrderId", verifyToken, [
    body('title', 'Title is required').not().isEmpty().trim(),
    body('description', 'Description is required').not().isEmpty().trim(),
    body('requestedBy', 'Requested by is required').not().isEmpty().trim(),
    body('costImpact', 'Cost impact must be a number').optional().isFloat(),
    body('timelineImpactDays', 'Timeline impact must be an integer').optional().isInt(),
    body('status', 'Invalid status').optional().isIn(['Pending', 'Approved', 'Rejected', 'Implemented']),
    body('reason', 'Reason must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId, changeOrderId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(changeOrderId)) {
            return res.status(404).json({ success: false, message: "Site or Change Order not found (Invalid ID format)." });
        }

        const changeOrder = await ChangeOrder.findOne({ _id: changeOrderId, site: siteId, user: userId });
        if (!changeOrder) {
            return res.status(404).json({ success: false, message: "Change order not found or does not belong to user/site." });
        }

        // Handle approval/rejection logic
        if (updateData.status && (updateData.status === 'Approved' || updateData.status === 'Rejected') && changeOrder.status === 'Pending') {
            updateData.approvedBy = userId;
            updateData.approvalDate = Date.now();
        }

        const updatedChangeOrder = await ChangeOrder.findOneAndUpdate(
            { _id: changeOrderId, site: siteId, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json({ success: true, message: "Change order updated successfully!", data: updatedChangeOrder });
    } catch (err) {
        console.error("Error updating change order:", err);
        res.status(500).json({ success: false, message: "Server Error updating change order." });
    }
});

router.delete("/sites/:siteId/change-orders/:changeOrderId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, changeOrderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(changeOrderId)) {
            return res.status(404).json({ success: false, message: "Site or Change Order not found (Invalid ID format)." });
        }

        const deletedChangeOrder = await ChangeOrder.findOneAndDelete({ _id: changeOrderId, site: siteId, user: userId });
        if (!deletedChangeOrder) {
            return res.status(404).json({ success: false, message: "Change order not found or does not belong to user/site." });
        }

        await ConstructionSite.updateOne(
            { _id: siteId, user: userId },
            { $pull: { changeOrders: deletedChangeOrder._id } }
        );
        await Document.deleteMany({ refId: changeOrderId, refModel: 'ChangeOrder', user: userId });

        res.json({ success: true, message: "Change order deleted successfully!" });
    } catch (err) {
        console.error("Error deleting change order:", err);
        res.status(500).json({ success: false, message: "Server Error deleting change order." });
    }
});


// --- MATERIAL REQUESTS ---
router.get("/sites/:siteId/material-requests", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const { status, search, page = 1, limit = 10, sort = 'requestDate', order = 'desc' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }

        const query = { user: userId, site: siteId };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { materialName: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
            ];
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const materialRequests = await MaterialRequest.find(query)
            .populate('requestedBy', 'fullName role')
            .populate('approvedBy', 'fullName email')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await MaterialRequest.countDocuments(query);

        res.json({
            success: true,
            data: materialRequests,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching material requests:", err);
        res.status(500).json({ success: false, message: "Server Error fetching material requests." });
    }
});

router.post("/sites/:siteId/material-requests", verifyToken, [
    body('materialName', 'Material name is required').not().isEmpty().trim(),
    body('quantity', 'Quantity must be a positive number').isFloat({ min: 0.01 }),
    body('unit', 'Unit is required').not().isEmpty().trim(),
    body('requestedBy', 'Requested by (worker ID) is required').isMongoId().withMessage('Invalid worker ID for requestedBy.'),
    body('requiredByDate', 'Valid required by date is required').isISO8601().toDate(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const { requestedBy: workerId, ...newRequestData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "RequestedBy worker not found or does not belong to user." });
        }

        const newMaterialRequest = new MaterialRequest({
            ...newRequestData,
            user: userId,
            site: siteId,
            requestedBy: workerId,
            status: 'Pending',
        });
        await newMaterialRequest.save();

        site.materialRequests.push(newMaterialRequest._id);
        await site.save();

        res.status(201).json({ success: true, message: "Material request created successfully!", data: newMaterialRequest });
    } catch (err) {
        console.error("Error creating material request:", err);
        res.status(500).json({ success: false, message: "Server Error creating material request." });
    }
});

router.patch("/sites/:siteId/material-requests/:requestId/status", verifyToken, [
    body('status', 'New status is required').not().isEmpty().trim().isIn(['Pending', 'Approved', 'Rejected', 'Ordered', 'Partially Received', 'Received']),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId, requestId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(404).json({ success: false, message: "Site or Material Request not found (Invalid ID format)." });
        }

        const materialRequest = await MaterialRequest.findOne({ _id: requestId, site: siteId, user: userId });
        if (!materialRequest) {
            return res.status(404).json({ success: false, message: "Material request not found or does not belong to user/site." });
        }

        materialRequest.status = status;
        if (status === 'Approved' || status === 'Rejected') {
            materialRequest.approvedBy = userId;
            materialRequest.approvedAt = Date.now();
        }
        // Add logic here to update site material inventory if status is 'Received'
        // For 'Received' status, you would typically update the site's materialInventory array.
        // Example:
        // if (status === 'Received') {
        //     await ConstructionSite.updateOne(
        //         { _id: siteId, 'siteMaterialInventory.materialName': materialRequest.materialName },
        //         { $inc: { 'siteMaterialInventory.$.quantityOnHand': materialRequest.quantity } }
        //     );
        //     // If material doesn't exist, add it
        //     await ConstructionSite.updateOne(
        //         { _id: siteId, 'siteMaterialInventory.materialName': { $ne: materialRequest.materialName } },
        //         { $push: { siteMaterialInventory: { materialName: materialRequest.materialName, quantityOnHand: materialRequest.quantity, unit: materialRequest.unit, lastUpdated: Date.now() } } }
        //     );
        // }

        await materialRequest.save();
        res.json({ success: true, message: "Material request status updated!", data: materialRequest });
    } catch (err) {
        console.error("Error updating material request status:", err);
        res.status(500).json({ success: false, message: "Server Error updating material request status." });
    }
});

router.delete("/sites/:siteId/material-requests/:requestId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(404).json({ success: false, message: "Site or Material Request not found (Invalid ID format)." });
        }

        const deletedMaterialRequest = await MaterialRequest.findOneAndDelete({ _id: requestId, site: siteId, user: userId });
        if (!deletedMaterialRequest) {
            return res.status(404).json({ success: false, message: "Material request not found or does not belong to user/site." });
        }

        await ConstructionSite.updateOne(
            { _id: siteId, user: userId },
            { $pull: { materialRequests: deletedMaterialRequest._id } }
        );

        res.json({ success: true, message: "Material request deleted successfully!" });
    } catch (err) {
        console.error("Error deleting material request:", err);
        res.status(500).json({ success: false, message: "Server Error deleting material request." });
    }
});


// --- PAYMENT REQUESTS ---
router.get("/sites/:siteId/payment-requests", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const { status, search, page = 1, limit = 10, sort = 'requestDate', order = 'desc' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }

        const query = { user: userId, site: siteId };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { purpose: { $regex: search, $options: 'i' } },
                { invoiceRef: { $regex: search, $options: 'i' } },
            ];
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const paymentRequests = await PaymentRequest.find(query)
            .populate('requestedBy', 'fullName email') // Assuming requestedBy is a User
            .populate('approvedBy', 'fullName email')
            .populate('receipts')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await PaymentRequest.countDocuments(query);

        res.json({
            success: true,
            data: paymentRequests,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching payment requests:", err);
        res.status(500).json({ success: false, message: "Server Error fetching payment requests." });
    }
});

router.post("/sites/:siteId/payment-requests", verifyToken, [
    body('amount', 'Amount is required and must be a non-negative number').isFloat({ min: 0 }),
    body('purpose', 'Purpose is required').not().isEmpty().trim(),
    body('requestedBy', 'Requested by (User ID) is required').isMongoId().withMessage('Invalid User ID for requestedBy.'),
    body('invoiceRef', 'Invoice reference must be a string').optional().isString().trim(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const { requestedBy: reqUserId, ...newRequestData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        // Assuming req.user._id is the requester for simplicity, or validate reqUserId
        if (String(reqUserId) !== String(userId)) {
             // For strict validation, ensure the requestedBy user is part of the project or has permission
        }

        const newPaymentRequest = new PaymentRequest({
            ...newRequestData,
            user: userId,
            site: siteId,
            requestedBy: reqUserId, // Or just userId
            status: 'Pending',
        });
        await newPaymentRequest.save();

        site.paymentRequests.push(newPaymentRequest._id);
        await site.save();

        res.status(201).json({ success: true, message: "Payment request created successfully!", data: newPaymentRequest });
    } catch (err) {
        console.error("Error creating payment request:", err);
        res.status(500).json({ success: false, message: "Server Error creating payment request." });
    }
});

router.patch("/sites/:siteId/payment-requests/:requestId/status", verifyToken, [
    body('status', 'New status is required').not().isEmpty().trim().isIn(['Pending', 'Approved', 'Paid', 'Rejected']),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id; // User approving/rejecting
        const { siteId, requestId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(404).json({ success: false, message: "Site or Payment Request not found (Invalid ID format)." });
        }

        const paymentRequest = await PaymentRequest.findOne({ _id: requestId, site: siteId, user: userId });
        if (!paymentRequest) {
            return res.status(404).json({ success: false, message: "Payment request not found or does not belong to user/site." });
        }

        // Only allow status change from Pending to Approved/Rejected/Paid
        if (paymentRequest.status !== 'Pending' && status === 'Approved' || status === 'Rejected') {
            return res.status(400).json({ success: false, message: "Only pending requests can be approved or rejected." });
        }
        if (paymentRequest.status !== 'Approved' && status === 'Paid') {
            return res.status(400).json({ success: false, message: "Only approved requests can be marked as paid." });
        }

        paymentRequest.status = status;
        if (status === 'Approved' || status === 'Rejected' || status === 'Paid') {
            paymentRequest.approvedBy = userId;
            paymentRequest.approvedAt = Date.now();
        }
        // If approved/paid, update site expenditure
        if (status === 'Approved' || status === 'Paid') {
            await ConstructionSite.updateOne(
                { _id: siteId, user: userId },
                { $inc: { expenditure: paymentRequest.amount } }
            );
        }

        await paymentRequest.save();
        res.json({ success: true, message: "Payment request status updated!", data: paymentRequest });
    } catch (err) {
        console.error("Error updating payment request status:", err);
        res.status(500).json({ success: false, message: "Server Error updating payment request status." });
    }
});

router.delete("/sites/:siteId/payment-requests/:requestId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(404).json({ success: false, message: "Site or Payment Request not found (Invalid ID format)." });
        }

        const deletedPaymentRequest = await PaymentRequest.findOneAndDelete({ _id: requestId, site: siteId, user: userId });
        if (!deletedPaymentRequest) {
            return res.status(404).json({ success: false, message: "Payment request not found or does not belong to user/site." });
        }

        await ConstructionSite.updateOne(
            { _id: siteId, user: userId },
            { $pull: { paymentRequests: deletedPaymentRequest._id } }
        );
        await Document.deleteMany({ refId: requestId, refModel: 'PaymentRequest', user: userId });

        res.json({ success: true, message: "Payment request deleted successfully!" });
    } catch (err) {
        console.error("Error deleting payment request:", err);
        res.status(500).json({ success: false, message: "Server Error deleting payment request." });
    }
});


// --- DOCUMENTS ---
router.post("/documents/upload", verifyToken, upload.single('file'), [
    body('refId', 'Reference ID is required').isMongoId().withMessage('Invalid reference ID.'),
    body('refModel', 'Reference model is required').not().isEmpty().trim().isIn(['ConstructionSite', 'Task', 'Equipment', 'Worker', 'ChangeOrder', 'SafetyIncident']),
    body('category', 'Invalid document category').optional().isIn(['Permit', 'Drawing', 'Contract', 'Photo', 'Report', 'Certificate', 'Other']),
    body('description', 'Description must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    try {
        const userId = req.user._id;
        const { refId, refModel, category, description } = req.body;
        const file = req.file;

        // Verify refId and refModel actually exist and belong to user
        let parentDoc;
        switch (refModel) {
            case 'ConstructionSite': parentDoc = await ConstructionSite.findOne({ _id: refId, user: userId }); break;
            case 'Task': parentDoc = await Task.findOne({ _id: refId, user: userId }); break;
            case 'Equipment': parentDoc = await Equipment.findOne({ _id: refId, user: userId }); break;
            case 'Worker': parentDoc = await Worker.findOne({ _id: refId, user: userId }); break;
            case 'ChangeOrder': parentDoc = await ChangeOrder.findOne({ _id: refId, user: userId }); break;
            case 'SafetyIncident': parentDoc = await SafetyIncident.findOne({ _id: refId, user: userId }); break;
            default: return res.status(400).json({ success: false, message: "Invalid refModel provided." });
        }
        if (!parentDoc) {
            return res.status(404).json({ success: false, message: `${refModel} with ID ${refId} not found or does not belong to you.` });
        }

        const fileUrl = await uploadFileToStorage(file, refModel.toLowerCase()); // Implement actual upload to S3/GCS
        if (!fileUrl) {
            return res.status(500).json({ success: false, message: "Failed to upload file to storage." });
        }

        const newDocument = new Document({
            user: userId,
            fileName: file.originalname,
            fileUrl,
            fileType: file.mimetype,
            category: category || 'Other',
            description,
            refId,
            refModel,
            uploadedBy: userId,
        });
        await newDocument.save();

        // Add document reference to the parent document's array (if applicable, or handled by populate)
        if (refModel !== 'Certification') { // Certifications handled by link field, not array
             if (!parentDoc.documents) parentDoc.documents = []; // Initialize if not exists
             parentDoc.documents.push(newDocument._id);
             await parentDoc.save();
        }

        res.status(201).json({ success: true, message: "Document uploaded successfully!", data: newDocument });
    } catch (err) {
        console.error("Error uploading document:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error uploading document." });
    }
});

router.get("/documents/:refModel/:refId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { refModel, refId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(refId)) {
            return res.status(404).json({ success: false, message: "Invalid reference ID format." });
        }
        if (!['ConstructionSite', 'Task', 'Equipment', 'Worker', 'ChangeOrder', 'SafetyIncident'].includes(refModel)) {
            return res.status(400).json({ success: false, message: "Invalid refModel provided." });
        }

        // Verify refId and refModel actually exist and belong to user
        let parentDoc;
        switch (refModel) {
            case 'ConstructionSite': parentDoc = await ConstructionSite.findOne({ _id: refId, user: userId }); break;
            case 'Task': parentDoc = await Task.findOne({ _id: refId, user: userId }); break;
            case 'Equipment': parentDoc = await Equipment.findOne({ _id: refId, user: userId }); break;
            case 'Worker': parentDoc = await Worker.findOne({ _id: refId, user: userId }); break;
            case 'ChangeOrder': parentDoc = await ChangeOrder.findOne({ _id: refId, user: userId }); break;
            case 'SafetyIncident': parentDoc = await SafetyIncident.findOne({ _id: refId, user: userId }); break;
        }
        if (!parentDoc) {
            return res.status(404).json({ success: false, message: `${refModel} with ID ${refId} not found or does not belong to you.` });
        }

        const documents = await Document.find({ refId, refModel, user: userId }).populate('uploadedBy', 'fullName');
        res.json({ success: true, data: documents });
    } catch (err) {
        console.error("Error fetching documents:", err);
        res.status(500).json({ success: false, message: "Server Error fetching documents." });
    }
});

router.delete("/documents/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Document not found (Invalid ID format)." });
        }

        const deletedDocument = await Document.findOneAndDelete({ _id: id, user: userId });
        if (!deletedDocument) {
            return res.status(404).json({ success: false, message: "Document not found or does not belong to user." });
        }

        // Remove reference from parent document
        if (deletedDocument.refId && deletedDocument.refModel) {
            switch (deletedDocument.refModel) {
                case 'ConstructionSite':
                case 'Task':
                case 'Equipment':
                case 'Worker':
                case 'ChangeOrder':
                case 'SafetyIncident':
                    await mongoose.model(deletedDocument.refModel).updateOne(
                        { _id: deletedDocument.refId, user: userId },
                        { $pull: { documents: deletedDocument._id } }
                    );
                    break;
            }
        }
        // TODO: In a real app, delete the file from cloud storage as well

        res.json({ success: true, message: "Document deleted successfully!" });
    } catch (err) {
        console.error("Error deleting document:", err);
        res.status(500).json({ success: false, message: "Server Error deleting document." });
    }
});


// --- CERTIFICATIONS ---
router.get("/workers/:workerId/certifications", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { workerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }

        const certifications = await Certification.find({ worker: workerId, user: userId })
            .populate('document');
        res.json({ success: true, data: certifications });
    } catch (err) {
        console.error("Error fetching worker certifications:", err);
        res.status(500).json({ success: false, message: "Server Error fetching worker certifications." });
    }
});

router.post("/workers/:workerId/certifications", verifyToken, [
    body('name', 'Certification name is required').not().isEmpty().trim(),
    body('issuingBody', 'Issuing body is required').not().isEmpty().trim(),
    body('issueDate', 'Valid issue date is required').isISO8601().toDate(),
    body('expiryDate', 'Valid expiry date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('document', 'Document ID must be valid').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid document ID.'),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { workerId } = req.params;
        const newCertificationData = req.body;

        if (!mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }
        if (newCertificationData.document) {
            const document = await Document.findOne({ _id: newCertificationData.document, user: userId, refId: workerId, refModel: 'Worker' });
            if (!document) {
                return res.status(400).json({ success: false, message: "Provided document not found or not linked to this worker." });
            }
        }

        const newCertification = new Certification({
            ...newCertificationData,
            user: userId,
            worker: workerId,
        });
        await newCertification.save();

        worker.certifications.push(newCertification._id);
        await worker.save();

        res.status(201).json({ success: true, message: "Certification added successfully!", data: newCertification });
    } catch (err) {
        console.error("Error adding certification:", err);
        res.status(500).json({ success: false, message: "Server Error adding certification." });
    }
});

router.put("/workers/:workerId/certifications/:certId", verifyToken, [
    body('name', 'Certification name is required').not().isEmpty().trim(),
    body('issuingBody', 'Issuing body is required').not().isEmpty().trim(),
    body('issueDate', 'Valid issue date is required').isISO8601().toDate(),
    body('expiryDate', 'Valid expiry date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
    body('document', 'Document ID must be valid').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid document ID.'),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { workerId, certId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(workerId) || !mongoose.Types.ObjectId.isValid(certId)) {
            return res.status(404).json({ success: false, message: "Worker or Certification not found (Invalid ID format)." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }
        if (updateData.document) {
            const document = await Document.findOne({ _id: updateData.document, user: userId, refId: workerId, refModel: 'Worker' });
            if (!document) {
                return res.status(400).json({ success: false, message: "Provided document not found or not linked to this worker." });
            }
        }

        const updatedCertification = await Certification.findOneAndUpdate(
            { _id: certId, worker: workerId, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!updatedCertification) {
            return res.status(404).json({ success: false, message: "Certification not found or does not belong to user/worker." });
        }

        res.json({ success: true, message: "Certification updated successfully!", data: updatedCertification });
    } catch (err) {
        console.error("Error updating certification:", err);
        res.status(500).json({ success: false, message: "Server Error updating certification." });
    }
});

router.delete("/workers/:workerId/certifications/:certId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { workerId, certId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(workerId) || !mongoose.Types.ObjectId.isValid(certId)) {
            return res.status(404).json({ success: false, message: "Worker or Certification not found (Invalid ID format)." });
        }

        const deletedCertification = await Certification.findOneAndDelete({ _id: certId, worker: workerId, user: userId });
        if (!deletedCertification) {
            return res.status(404).json({ success: false, message: "Certification not found or does not belong to user/worker." });
        }

        await Worker.updateOne(
            { _id: workerId, user: userId },
            { $pull: { certifications: deletedCertification._id } }
        );
        if (deletedCertification.document) { // Also delete the associated document
            await Document.deleteOne({ _id: deletedCertification.document, user: userId });
        }

        res.json({ success: true, message: "Certification deleted successfully!" });
    } catch (err) {
        console.error("Error deleting certification:", err);
        res.status(500).json({ success: false, message: "Server Error deleting certification." });
    }
});


// --- MAINTENANCE LOGS ---
router.get("/equipment/:equipmentId/maintenance-logs", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { equipmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
            return res.status(404).json({ success: false, message: "Equipment not found (Invalid ID format)." });
        }
        const equipment = await Equipment.findOne({ _id: equipmentId, user: userId });
        if (!equipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }

        const maintenanceLogs = await MaintenanceLog.find({ equipment: equipmentId, user: userId })
            .populate('documents');
        res.json({ success: true, data: maintenanceLogs });
    } catch (err) {
        console.error("Error fetching equipment maintenance logs:", err);
        res.status(500).json({ success: false, message: "Server Error fetching equipment maintenance logs." });
    }
});

router.post("/equipment/:equipmentId/maintenance-logs", verifyToken, [
    body('date', 'Maintenance date is required').isISO8601().toDate(),
    body('description', 'Description is required').not().isEmpty().trim(),
    body('cost', 'Cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('performedBy', 'Performed by is required').not().isEmpty().trim(),
    body('partsUsed', 'Parts used must be an array').optional().isArray(),
    body('partsUsed.*.materialName', 'Material name is required').not().isEmpty().trim(),
    body('partsUsed.*.quantity', 'Quantity must be a positive number').isFloat({ min: 0.01 }),
    body('partsUsed.*.unit', 'Unit is required').not().isEmpty().trim(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('documents', 'Documents must be an array of valid IDs').optional().isArray().custom(value => {
        if (!value.every(mongoose.Types.ObjectId.isValid)) throw new Error('Each document must be a valid MongoDB ID');
        return true;
    }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { equipmentId } = req.params;
        const newMaintenanceLogData = req.body;

        if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
            return res.status(404).json({ success: false, message: "Equipment not found (Invalid ID format)." });
        }
        const equipment = await Equipment.findOne({ _id: equipmentId, user: userId });
        if (!equipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }
        // Validate provided document IDs
        if (newMaintenanceLogData.documents && newMaintenanceLogData.documents.length > 0) {
            const existingDocs = await Document.find({ _id: { $in: newMaintenanceLogData.documents }, user: userId, refId: equipmentId, refModel: 'Equipment' });
            if (existingDocs.length !== newMaintenanceLogData.documents.length) {
                return res.status(400).json({ success: false, message: "One or more provided document IDs are invalid or not linked to this equipment." });
            }
        }

        const newMaintenanceLog = new MaintenanceLog({
            ...newMaintenanceLogData,
            user: userId,
            equipment: equipmentId,
        });
        await newMaintenanceLog.save();

        equipment.maintenanceLogs.push(newMaintenanceLog._id);
        // Optionally update lastMaintenance/nextMaintenance on the equipment
        equipment.lastMaintenance = newMaintenanceLog.date;
        // Logic for nextMaintenance update would be here
        await equipment.save();

        res.status(201).json({ success: true, message: "Maintenance log added successfully!", data: newMaintenanceLog });
    } catch (err) {
        console.error("Error adding maintenance log:", err);
        res.status(500).json({ success: false, message: "Server Error adding maintenance log." });
    }
});

router.put("/equipment/:equipmentId/maintenance-logs/:logId", verifyToken, [
    body('date', 'Maintenance date is required').isISO8601().toDate(),
    body('description', 'Description is required').not().isEmpty().trim(),
    body('cost', 'Cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('performedBy', 'Performed by is required').not().isEmpty().trim(),
    body('partsUsed', 'Parts used must be an array').optional().isArray(),
    body('partsUsed.*.materialName', 'Material name is required').not().isEmpty().trim(),
    body('partsUsed.*.quantity', 'Quantity must be a positive number').isFloat({ min: 0.01 }),
    body('partsUsed.*.unit', 'Unit is required').not().isEmpty().trim(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('documents', 'Documents must be an array of valid IDs').optional().isArray().custom(value => {
        if (!value.every(mongoose.Types.ObjectId.isValid)) throw new Error('Each document must be a valid MongoDB ID');
        return true;
    }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { equipmentId, logId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(equipmentId) || !mongoose.Types.ObjectId.isValid(logId)) {
            return res.status(404).json({ success: false, message: "Equipment or Maintenance Log not found (Invalid ID format)." });
        }
        const equipment = await Equipment.findOne({ _id: equipmentId, user: userId });
        if (!equipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }
        // Validate provided document IDs
        if (updateData.documents && updateData.documents.length > 0) {
            const existingDocs = await Document.find({ _id: { $in: updateData.documents }, user: userId, refId: equipmentId, refModel: 'Equipment' });
            if (existingDocs.length !== updateData.documents.length) {
                return res.status(400).json({ success: false, message: "One or more provided document IDs are invalid or not linked to this equipment." });
            }
        }

        const updatedMaintenanceLog = await MaintenanceLog.findOneAndUpdate(
            { _id: logId, equipment: equipmentId, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!updatedMaintenanceLog) {
            return res.status(404).json({ success: false, message: "Maintenance log not found or does not belong to user/equipment." });
        }

        res.json({ success: true, message: "Maintenance log updated successfully!", data: updatedMaintenanceLog });
    } catch (err) {
        console.error("Error updating maintenance log:", err);
        res.status(500).json({ success: false, message: "Server Error updating maintenance log." });
    }
});

router.delete("/equipment/:equipmentId/maintenance-logs/:logId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { equipmentId, logId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(equipmentId) || !mongoose.Types.ObjectId.isValid(logId)) {
            return res.status(404).json({ success: false, message: "Equipment or Maintenance Log not found (Invalid ID format)." });
        }

        const deletedMaintenanceLog = await MaintenanceLog.findOneAndDelete({ _id: logId, equipment: equipmentId, user: userId });
        if (!deletedMaintenanceLog) {
            return res.status(404).json({ success: false, message: "Maintenance log not found or does not belong to user/equipment." });
        }

        await Equipment.updateOne(
            { _id: equipmentId, user: userId },
            { $pull: { maintenanceLogs: deletedMaintenanceLog._id } }
        );
        await Document.deleteMany({ refId: logId, refModel: 'MaintenanceLog', user: userId });

        res.json({ success: true, message: "Maintenance log deleted successfully!" });
    } catch (err) {
        console.error("Error deleting maintenance log:", err);
        res.status(500).json({ success: false, message: "Server Error deleting maintenance log." });
    }
});


// --- TIMESHEETS ---
router.get("/workers/:workerId/timesheets", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { workerId } = req.params;
        const { status, siteId, page = 1, limit = 10, sort = 'date', order = 'desc' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }

        const query = { user: userId, worker: workerId };
        if (status) query.status = status;
        if (siteId && mongoose.Types.ObjectId.isValid(siteId)) query.site = siteId;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const timesheets = await Timesheet.find(query)
            .populate('site', 'name projectCode')
            .populate('task', 'name')
            .populate('approvedBy', 'fullName email')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await Timesheet.countDocuments(query);

        res.json({
            success: true,
            data: timesheets,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching worker timesheets:", err);
        res.status(500).json({ success: false, message: "Server Error fetching worker timesheets." });
    }
});

router.post("/workers/:workerId/timesheets", verifyToken, [
    body('site', 'Site ID is required').isMongoId().withMessage('Invalid site ID.'),
    body('date', 'Timesheet date is required').isISO8601().toDate(),
    body('hoursWorked', 'Hours worked is required and must be a non-negative number').isFloat({ min: 0 }),
    body('overtimeHours', 'Overtime hours must be a non-negative number').optional().isFloat({ min: 0 }),
    body('task', 'Task ID must be valid').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid task ID.'),
    body('notes', 'Notes must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id; // User who submitted the timesheet
        const { workerId } = req.params;
        const newTimesheetData = req.body;

        if (!mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }
        const site = await ConstructionSite.findOne({ _id: newTimesheetData.site, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        if (newTimesheetData.task) {
            const task = await Task.findOne({ _id: newTimesheetData.task, site: newTimesheetData.site, user: userId });
            if (!task) {
                return res.status(404).json({ success: false, message: "Task not found on this site or does not belong to user." });
            }
        }

        const newTimesheet = new Timesheet({
            ...newTimesheetData,
            user: userId,
            worker: workerId,
            submittedAt: Date.now(),
            status: 'Pending',
        });
        await newTimesheet.save();

        worker.timesheets.push(newTimesheet._id);
        await worker.save();

        res.status(201).json({ success: true, message: "Timesheet submitted successfully!", data: newTimesheet });
    } catch (err) {
        console.error("Error submitting timesheet:", err);
        res.status(500).json({ success: false, message: "Server Error submitting timesheet." });
    }
});

router.put("/workers/:workerId/timesheets/:timesheetId", verifyToken, [
    body('site', 'Site ID is required').isMongoId().withMessage('Invalid site ID.'),
    body('date', 'Timesheet date is required').isISO8601().toDate(),
    body('hoursWorked', 'Hours worked is required and must be a non-negative number').isFloat({ min: 0 }),
    body('overtimeHours', 'Overtime hours must be a non-negative number').optional().isFloat({ min: 0 }),
    body('task', 'Task ID must be valid').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid task ID.'),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('status', 'Invalid status').optional().isIn(['Pending', 'Approved', 'Rejected']),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { workerId, timesheetId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(workerId) || !mongoose.Types.ObjectId.isValid(timesheetId)) {
            return res.status(404).json({ success: false, message: "Worker or Timesheet not found (Invalid ID format)." });
        }
        const worker = await Worker.findOne({ _id: workerId, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }
        const site = await ConstructionSite.findOne({ _id: updateData.site, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        if (updateData.task) {
            const task = await Task.findOne({ _id: updateData.task, site: updateData.site, user: userId });
            if (!task) {
                return res.status(404).json({ success: false, message: "Task not found on this site or does not belong to user." });
            }
        }

        const updatedTimesheet = await Timesheet.findOneAndUpdate(
            { _id: timesheetId, worker: workerId, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!updatedTimesheet) {
            return res.status(404).json({ success: false, message: "Timesheet not found or does not belong to user/worker." });
        }

        res.json({ success: true, message: "Timesheet updated successfully!", data: updatedTimesheet });
    } catch (err) {
        console.error("Error updating timesheet:", err);
        res.status(500).json({ success: false, message: "Server Error updating timesheet." });
    }
});

router.patch("/workers/:workerId/timesheets/:timesheetId/status", verifyToken, [
    body('status', 'New status is required').not().isEmpty().trim().isIn(['Pending', 'Approved', 'Rejected']),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id; // User approving/rejecting
        const { workerId, timesheetId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(workerId) || !mongoose.Types.ObjectId.isValid(timesheetId)) {
            return res.status(404).json({ success: false, message: "Worker or Timesheet not found (Invalid ID format)." });
        }

        const timesheet = await Timesheet.findOne({ _id: timesheetId, worker: workerId, user: userId });
        if (!timesheet) {
            return res.status(404).json({ success: false, message: "Timesheet not found or does not belong to user/worker." });
        }

        if (status === 'Approved' && timesheet.status !== 'Approved') {
            // Update actualHours in allocatedWorkers for the task if applicable
            if (timesheet.task) {
                await Task.updateOne(
                    { _id: timesheet.task, 'allocatedWorkers.worker': workerId, user: userId },
                    { $inc: { 'allocatedWorkers.$.actualHours': timesheet.hoursWorked + timesheet.overtimeHours } }
                );
            }
            // Update site expenditure if hourly rate is tracked
            const worker = await Worker.findById(workerId);
            if (worker && worker.hourlyRate > 0 && timesheet.site) {
                const laborCost = (timesheet.hoursWorked + timesheet.overtimeHours) * worker.hourlyRate;
                await ConstructionSite.updateOne(
                    { _id: timesheet.site, user: userId },
                    { $inc: { expenditure: laborCost } }
                );
            }
        }

        timesheet.status = status;
        timesheet.approvedBy = userId;
        timesheet.approvedAt = Date.now();
        await timesheet.save();

        res.json({ success: true, message: "Timesheet status updated!", data: timesheet });
    } catch (err) {
        console.error("Error updating timesheet status:", err);
        res.status(500).json({ success: false, message: "Server Error updating timesheet status." });
    }
});

router.delete("/workers/:workerId/timesheets/:timesheetId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { workerId, timesheetId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(workerId) || !mongoose.Types.ObjectId.isValid(timesheetId)) {
            return res.status(404).json({ success: false, message: "Worker or Timesheet not found (Invalid ID format)." });
        }

        const deletedTimesheet = await Timesheet.findOneAndDelete({ _id: timesheetId, worker: workerId, user: userId });
        if (!deletedTimesheet) {
            return res.status(404).json({ success: false, message: "Timesheet not found or does not belong to user/worker." });
        }

        await Worker.updateOne(
            { _id: workerId, user: userId },
            { $pull: { timesheets: deletedTimesheet._id } }
        );

        res.json({ success: true, message: "Timesheet deleted successfully!" });
    } catch (err) {
        console.error("Error deleting timesheet:", err);
        res.status(500).json({ success: false, message: "Server Error deleting timesheet." });
    }
});


// --- SAFETY INCIDENTS ---
router.get("/sites/:siteId/safety-incidents", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const { severity, search, page = 1, limit = 10, sort = 'incidentDate', order = 'desc' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }

        const query = { user: userId, site: siteId };
        if (severity) query.severity = severity;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { actionsTaken: { $regex: search, $options: 'i' } },
            ];
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const safetyIncidents = await SafetyIncident.find(query)
            .populate('reportedBy', 'fullName role')
            .populate('documents')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await SafetyIncident.countDocuments(query);

        res.json({
            success: true,
            data: safetyIncidents,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("Error fetching safety incidents:", err);
        res.status(500).json({ success: false, message: "Server Error fetching safety incidents." });
    }
});

router.post("/sites/:siteId/safety-incidents", verifyToken, [
    body('title', 'Title is required').not().isEmpty().trim(),
    body('description', 'Description is required').not().isEmpty().trim(),
    body('incidentDate', 'Incident date is required').isISO8601().toDate(),
    body('severity', 'Invalid severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('actionsTaken', 'Actions taken must be a string').optional().isString().trim(),
    body('reportedBy', 'Reported by (worker ID) is required').isMongoId().withMessage('Invalid Worker ID for reportedBy.'),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('documents', 'Documents must be an array of valid IDs').optional().isArray().custom(value => {
        if (!value.every(mongoose.Types.ObjectId.isValid)) throw new Error('Each document must be a valid MongoDB ID');
        return true;
    }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId } = req.params;
        const newIncidentData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        const worker = await Worker.findOne({ _id: newIncidentData.reportedBy, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "ReportedBy worker not found or does not belong to user." });
        }
        if (newIncidentData.documents && newIncidentData.documents.length > 0) {
            const existingDocs = await Document.find({ _id: { $in: newIncidentData.documents }, user: userId, refId: siteId, refModel: 'ConstructionSite' });
            if (existingDocs.length !== newIncidentData.documents.length) {
                return res.status(400).json({ success: false, message: "One or more provided document IDs are invalid or not linked to this site." });
            }
        }

        const newSafetyIncident = new SafetyIncident({
            ...newIncidentData,
            user: userId,
            site: siteId,
        });
        await newSafetyIncident.save();

        site.safetyIncidents.push(newSafetyIncident._id);
        await site.save();

        res.status(201).json({ success: true, message: "Safety incident reported successfully!", data: newSafetyIncident });
    } catch (err) {
        console.error("Error reporting safety incident:", err);
        res.status(500).json({ success: false, message: "Server Error reporting safety incident." });
    }
});

router.put("/sites/:siteId/safety-incidents/:incidentId", verifyToken, [
    body('title', 'Title is required').not().isEmpty().trim(),
    body('description', 'Description is required').not().isEmpty().trim(),
    body('incidentDate', 'Incident date is required').isISO8601().toDate(),
    body('severity', 'Invalid severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('actionsTaken', 'Actions taken must be a string').optional().isString().trim(),
    body('reportedBy', 'Reported by (worker ID) is required').isMongoId().withMessage('Invalid Worker ID for reportedBy.'),
    body('notes', 'Notes must be a string').optional().isString().trim(),
    body('documents', 'Documents must be an array of valid IDs').optional().isArray().custom(value => {
        if (!value.every(mongoose.Types.ObjectId.isValid)) throw new Error('Each document must be a valid MongoDB ID');
        return true;
    }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;
    try {
        const userId = req.user._id;
        const { siteId, incidentId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(incidentId)) {
            return res.status(404).json({ success: false, message: "Site or Safety Incident not found (Invalid ID format)." });
        }
        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        const worker = await Worker.findOne({ _id: updateData.reportedBy, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "ReportedBy worker not found or does not belong to user." });
        }
        if (updateData.documents && updateData.documents.length > 0) {
            const existingDocs = await Document.find({ _id: { $in: updateData.documents }, user: userId, refId: siteId, refModel: 'ConstructionSite' });
            if (existingDocs.length !== updateData.documents.length) {
                return res.status(400).json({ success: false, message: "One or more provided document IDs are invalid or not linked to this site." });
            }
        }

        const updatedSafetyIncident = await SafetyIncident.findOneAndUpdate(
            { _id: incidentId, site: siteId, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!updatedSafetyIncident) {
            return res.status(404).json({ success: false, message: "Safety incident not found or does not belong to user/site." });
        }

        res.json({ success: true, message: "Safety incident updated successfully!", data: updatedSafetyIncident });
    } catch (err) {
        console.error("Error updating safety incident:", err);
        res.status(500).json({ success: false, message: "Server Error updating safety incident." });
    }
});

router.delete("/sites/:siteId/safety-incidents/:incidentId", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, incidentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId) || !mongoose.Types.ObjectId.isValid(incidentId)) {
            return res.status(404).json({ success: false, message: "Site or Safety Incident not found (Invalid ID format)." });
        }

        const deletedSafetyIncident = await SafetyIncident.findOneAndDelete({ _id: incidentId, site: siteId, user: userId });
        if (!deletedSafetyIncident) {
            return res.status(404).json({ success: false, message: "Safety incident not found or does not belong to user/site." });
        }

        await ConstructionSite.updateOne(
            { _id: siteId, user: userId },
            { $pull: { safetyIncidents: deletedSafetyIncident._id } }
        );
        await Document.deleteMany({ refId: incidentId, refModel: 'SafetyIncident', user: userId });

        res.json({ success: true, message: "Safety incident deleted successfully!" });
    } catch (err) {
        console.error("Error deleting safety incident:", err);
        res.status(500).json({ success: false, message: "Server Error deleting safety incident." });
    }
});


// --- REPORTS & ANALYTICS (Placeholders for complex logic) ---
router.get("/sites/:siteId/budget-analytics", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }

        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        // Example: Calculate budget variance per category
        const budgetSummary = site.budgetDetails.map(item => ({
            category: item.category,
            planned: item.plannedAmount,
            actual: item.actualAmount,
            variance: item.plannedAmount - (item.actualAmount || 0),
        }));

        const overallBudget = site.budget;
        const overallExpenditure = site.expenditure;
        const overallRemaining = overallBudget - overallExpenditure;
        const overallVariance = overallBudget - overallExpenditure;

        res.json({
            success: true,
            data: {
                overall: {
                    budget: overallBudget,
                    expenditure: overallExpenditure,
                    remaining: overallRemaining,
                    variance: overallVariance,
                    progress: site.progress,
                },
                budgetBreakdown: budgetSummary,
                // Add more complex analytics here, e.g., cost per task, cost per worker, equipment costs
            },
        });

    } catch (err) {
        console.error("Error fetching budget analytics:", err);
        res.status(500).json({ success: false, message: "Server Error fetching budget analytics." });
    }
});

router.get("/sites/:siteId/reports/:reportType", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { siteId, reportType } = req.params;

        if (!mongoose.Types.ObjectId.isValid(siteId)) {
            return res.status(404).json({ success: false, message: "Site not found (Invalid ID format)." });
        }

        const site = await ConstructionSite.findOne({ _id: siteId, user: userId })
            .populate('tasks')
            .populate('equipment') // Need to fetch equipment separately or ensure site.equipment is properly denormalized/referenced
            .populate('workers') // Same for workers
            .populate('changeOrders')
            .populate('paymentRequests')
            .populate('materialRequests');
            
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        // This is a placeholder. Actual report generation (PDF, Excel) is complex
        // and would involve libraries like 'pdfkit', 'exceljs', etc.
        // It would construct a document based on the reportType and site data.

        // Example: Simple JSON response for now
        let reportContent = {
            reportType: reportType,
            siteName: site.name,
            siteId: site._id,
            generatedDate: new Date(),
            data: {},
        };

        switch (reportType) {
            case 'financial-summary':
                reportContent.data = {
                    totalBudget: site.budget,
                    totalExpenditure: site.expenditure,
                    remainingBudget: site.remainingBudget,
                    budgetDetails: site.budgetDetails,
                    paymentRequests: site.paymentRequests,
                };
                break;
            case 'progress-report':
                reportContent.data = {
                    progress: site.progress,
                    status: site.status,
                    startDate: site.startDate,
                    endDate: site.endDate,
                    actualEndDate: site.actualEndDate,
                    tasksSummary: site.tasks.map(t => ({ name: t.name, status: t.status, progress: t.progress })),
                    milestones: site.milestones,
                };
                break;
            case 'resource-utilization':
                // This would require more complex aggregations from tasks and timesheets
                reportContent.data = {
                    equipmentCount: site.equipmentCount,
                    workersCount: site.workersCount,
                    // detailed utilization
                };
                break;
            default:
                return res.status(400).json({ success: false, message: "Invalid report type." });
        }

        // In a real application, you'd send a generated file:
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${site.projectCode}.pdf`);
        // pdfDoc.pipe(res);
        // pdfDoc.end();

        res.json({ success: true, message: `Report '${reportType}' generated (placeholder)!`, data: reportContent });

    } catch (err) {
        console.error("Error generating report:", err);
        res.status(500).json({ success: false, message: "Server Error generating report." });
    }
});


module.exports = router;