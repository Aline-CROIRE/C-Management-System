const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const moment = require("moment");

const ConstructionSite = require("../models/ConstructionSite");
const Equipment = require("../models/Equipment");
const Task = require("../models/Task");
const Worker = require("../models/Worker");
const { verifyToken } = require("../middleware/auth");

const sendValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
};

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

        const site = await ConstructionSite.findOne({ _id: id, user: userId });
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
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { projectCode, name, type, location, startDate, endDate, budget, manager, description, notes } = req.body;

        if (moment(endDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        const uppercaseProjectCode = projectCode.toUpperCase();
        const existingSite = await ConstructionSite.findOne({ user: userId, projectCode: uppercaseProjectCode });
        if (existingSite) {
            return res.status(400).json({ success: false, message: "A site with this project code already exists for this user." });
        }

        const newSite = new ConstructionSite({
            user: userId,
            name, projectCode: uppercaseProjectCode, type, location, startDate, endDate, budget, manager, description, notes,
            status: 'Planning',
            progress: 0,
            expenditure: 0,
            workers: 0,
            equipmentCount: 0,
            tasks: [],
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

        if (updatedSite.status === 'Completed' && !updatedSite.actualEndDate) {
            updatedSite.actualEndDate = new Date();
            await updatedSite.save();
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

        await Task.deleteMany({ site: id, user: userId });
        await Equipment.updateMany({ currentSite: id, user: userId }, { $set: { currentSite: null } });

        res.json({ success: true, message: "Construction site deleted successfully!" });
    } catch (err) {
        console.error("Error deleting site:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting site." });
    }
});

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

        const equipmentItem = await Equipment.findOne({ _id: id, user: userId }).populate('currentSite', 'name projectCode');
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
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { assetTag, name, type, currentSite, purchaseDate, purchaseCost, condition, lastMaintenance, nextMaintenance, utilization, notes } = req.body;

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
            user: userId,
            name, assetTag: uppercaseAssetTag, type, currentSite: currentSite || null, purchaseDate, purchaseCost, condition, lastMaintenance, nextMaintenance, utilization, notes,
            status: 'Operational',
            currentValue: purchaseCost,
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
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { assetTag, currentSite, _prevCurrentSite, ...restOfUpdateData } = req.body;

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

        const prevSiteId = String(_prevCurrentSite);
        const oldSiteIdValid = prevSiteId && prevSiteId !== 'undefined' && prevSiteId !== 'null' && mongoose.Types.ObjectId.isValid(prevSiteId);

        if (oldSiteIdValid && String(oldSiteIdValid) !== String(newCurrentSiteId)) {
            const prevSite = await ConstructionSite.findOne({ _id: oldSiteIdValid, user: userId });
            if (prevSite) {
                prevSite.equipmentCount = Math.max(0, (prevSite.equipmentCount || 0) - 1);
                await prevSite.save();
            }
        }

        if (newCurrentSiteId && String(oldSiteIdValid) !== String(newCurrentSiteId)) {
            const newSite = await ConstructionSite.findOne({ _id: newCurrentSiteId, user: userId });
            if (newSite) {
                newSite.equipmentCount = (newSite.equipmentCount || 0) + 1;
                await newSite.save();
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
            const site = await ConstructionSite.findOne({ _id: deletedEquipment.currentSite, user: userId });
            if (site) {
                site.equipmentCount = Math.max(0, (site.equipmentCount || 0) - 1);
                await site.save();
            }
        }

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

router.get("/stats", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;

        const totalSites = await ConstructionSite.countDocuments({ user: userId });
        const activeSites = await ConstructionSite.countDocuments({ user: userId, status: 'Active' });
        const completedSites = await ConstructionSite.countDocuments({ user: userId, status: 'Completed' });
        const planningSites = await ConstructionSite.countDocuments({ user: userId, status: 'Planning' });
        const onHoldSites = await ConstructionSite.countDocuments({ user: userId, status: 'On-Hold' });
        const delayedSites = await ConstructionSite.countDocuments({ user: userId, status: 'Delayed' });

        const totalBudgetResult = await ConstructionSite.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, totalBudget: { $sum: "$budget" } } }
        ]);
        const totalExpenditureResult = await ConstructionSite.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, totalExpenditure: { $sum: "$expenditure" } } }
        ]);

        const totalBudget = totalBudgetResult.length > 0 ? totalBudgetResult[0].totalBudget : 0;
        const totalExpenditure = totalExpenditureResult.length > 0 ? totalExpenditureResult[0].totalExpenditure : 0;
        const remainingBudget = totalBudget - totalExpenditure;

        const totalEquipment = await Equipment.countDocuments({ user: userId });
        const operationalEquipment = await Equipment.countDocuments({ user: userId, status: 'Operational' });
        const inMaintenanceEquipment = await Equipment.countDocuments({ user: userId, status: 'In Maintenance' });
        const outOfServiceEquipment = await Equipment.countDocuments({ user: userId, status: 'Out of Service' });

        const totalPurchaseCostResult = await Equipment.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, totalPurchaseCost: { $sum: "$purchaseCost" } } }
        ]);
        const totalCurrentValueResult = await Equipment.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, totalCurrentValue: { $sum: "$currentValue" } } }
        ]);

        const totalPurchaseCost = totalPurchaseCostResult.length > 0 ? totalPurchaseCostResult[0].totalPurchaseCost : 0;
        const totalCurrentValue = totalCurrentValueResult.length > 0 ? totalCurrentValueResult[0].totalCurrentValue : 0;
        const depreciation = totalPurchaseCost - totalCurrentValue;

        const totalTasks = await Task.countDocuments({ user: userId });
        const pendingTasks = await Task.countDocuments({ user: userId, status: { $in: ['To Do', 'In Progress', 'Blocked'] } });
        const completedTasks = await Task.countDocuments({ user: userId, status: 'Completed' });
        const delayedTasks = await Task.countDocuments({
            user: userId,
            dueDate: { $lt: new Date() },
            status: { $nin: ['Completed', 'Cancelled'] }
        });

        res.json({
            success: true,
            data: {
                sites: {
                    total: totalSites,
                    active: activeSites,
                    completed: completedSites,
                    planning: planningSites,
                    onHold: onHoldSites,
                    delayed: delayedSites,
                    totalBudget,
                    totalExpenditure,
                    remainingBudget,
                },
                equipment: {
                    total: totalEquipment,
                    operational: operationalEquipment,
                    inMaintenance: inMaintenanceEquipment,
                    outOfService: outOfServiceEquipment,
                    totalPurchaseCost,
                    totalCurrentValue,
                    depreciation,
                },
                tasks: {
                    total: totalTasks,
                    pending: pendingTasks,
                    completed: completedTasks,
                    delayed: delayedTasks,
                }
            },
        });
    } catch (err) {
        console.error("Error fetching construction stats:", err);
        res.status(500).json({ success: false, message: "Server Error fetching construction statistics." });
    }
});

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
            .populate('dependencies', 'name startDate')
            .populate('assignedTo', 'fullName role')
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
            .populate('dependencies', 'name startDate')
            .populate('assignedTo', 'fullName role');
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
        .optional({ nullable: true, checkFalsy: true })
        .isArray().withMessage('Assigned To must be an array.')
        .custom(async (value, { req }) => {
            if (value && value.length > 0) {
                if (!value.every(mongoose.Types.ObjectId.isValid)) {
                    throw new Error('Each assigned worker must be a valid Worker ID.');
                }
                const existingWorkers = await Worker.find({ _id: { $in: value }, user: req.user._id });
                if (existingWorkers.length !== value.length) {
                    throw new Error('One or more assigned worker IDs are invalid or do not belong to you.');
                }
            }
            return true;
        }),
    body('progress', 'Progress must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('parentTask', 'Parent task must be a valid ID if provided')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage('Invalid parent task ID.'),
    body('dependencies', 'Dependencies must be an array of valid IDs').optional().isArray().custom(value => {
        if (!value.every(mongoose.Types.ObjectId.isValid)) throw new Error('Each dependency must be a valid MongoDB ID');
        return true;
    }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { site: siteId, name, description, startDate, dueDate, status, priority, assignedTo, progress, parentTask, dependencies, notes } = req.body;

        if (moment(dueDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "Due date cannot be before start date." });
        }

        if (dependencies && parentTask && dependencies.includes(parentTask)) {
             return res.status(400).json({ success: false, message: "A task cannot be a dependency of its parent." });
        }

        const site = await ConstructionSite.findOne({ _id: siteId, user: userId });
        if (!site) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }
        
        const newTask = new Task({
            user: userId,
            site: siteId,
            name, description, startDate, dueDate, status: status || 'To Do', priority: priority || 'Medium',
            assignedTo: assignedTo || [],
            progress: progress || 0, parentTask: parentTask || null, dependencies, notes,
        });

        await newTask.save();
        site.tasks.push(newTask._id);
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
        .optional({ nullable: true, checkFalsy: true })
        .isArray().withMessage('Assigned To must be an array.')
        .custom(async (value, { req }) => {
            if (value && value.length > 0) {
                if (!value.every(mongoose.Types.ObjectId.isValid)) {
                    throw new Error('Each assigned worker must be a valid Worker ID.');
                }
                const existingWorkers = await Worker.find({ _id: { $in: value }, user: req.user._id });
                if (existingWorkers.length !== value.length) {
                    throw new Error('One or more assigned worker IDs are invalid or do not belong to you.');
                }
            }
            return true;
        }),
    body('progress', 'Progress must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('parentTask', 'Parent task must be a valid ID if provided')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage('Invalid parent task ID.'),
    body('dependencies', 'Dependencies must be an array of valid IDs').optional().isArray().custom(value => {
        if (!value.every(mongoose.Types.ObjectId.isValid)) throw new Error('Each dependency must be a valid MongoDB ID');
        return true;
    }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { site: newSiteId, startDate, dueDate, status, parentTask, assignedTo, dependencies, ...restOfUpdateData } = req.body;

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

        if (dependencies && dependencies.includes(id)) {
            return res.status(400).json({ success: false, message: "A task cannot depend on itself." });
        }
        if (dependencies && parentTask && dependencies.includes(parentTask)) {
             return res.status(400).json({ success: false, message: "A task cannot be a dependency of its parent." });
        }
        if (parentTask === id) {
            return res.status(400).json({ success: false, message: "A task cannot be its own parent." });
        }
        
        const oldSiteId = currentTask.site ? currentTask.site.toString() : null;
        if (newSiteId && newSiteId !== oldSiteId) {
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
            startDate,
            dueDate,
            status,
            parentTask: parentTask || null,
            assignedTo: assignedTo || [],
            dependencies: dependencies || [],
        };

        if (status === 'Completed' && !currentTask.actualCompletionDate) {
            updateData.actualCompletionDate = new Date();
        } else if (status !== 'Completed' && currentTask.actualCompletionDate) {
            updateData.actualCompletionDate = null;
        }

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
            { dependencies: deletedTask._id, user: userId },
            { $pull: { dependencies: deletedTask._id } }
        );

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

        const worker = await Worker.findOne({ _id: id, user: userId });
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
    body('role', 'Invalid worker role').optional().isIn(['General Labor', 'Skilled Labor', 'Supervisor', 'Electrician', 'Plumber', 'Heavy Equipment Operator', 'Other']),
    body('email', 'Invalid email format').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('contactNumber', 'Contact number must be a string').optional().isString().trim(),
    body('skills', 'Skills must be an array of strings').optional().isArray().custom(value => {
        if (!value.every(s => typeof s === 'string')) throw new Error('Each skill must be a string');
        return true;
    }),
    body('isActive', 'isActive must be a boolean').optional().isBoolean(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { fullName, role, contactNumber, email, skills, isActive, notes } = req.body;

        const newWorker = new Worker({
            user: userId,
            fullName, role: role || 'General Labor', contactNumber, email, skills: skills || [], isActive: isActive ?? true, notes,
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
    body('role', 'Invalid worker role').optional().isIn(['General Labor', 'Skilled Labor', 'Supervisor', 'Electrician', 'Plumber', 'Heavy Equipment Operator', 'Other']),
    body('email', 'Invalid email format').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('contactNumber', 'Contact number must be a string').optional().isString().trim(),
    body('skills', 'Skills must be an array of strings').optional().isArray().custom(value => {
        if (!value.every(s => typeof s === 'string')) throw new Error('Each skill must be a string');
        return true;
    }),
    body('isActive', 'isActive must be a boolean').optional().isBoolean(),
    body('notes', 'Notes must be a string').optional().isString().trim(),
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

        await Task.updateMany(
            { assignedTo: deletedWorker._id, user: userId },
            { $pull: { assignedTo: deletedWorker._id } }
        );

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


router.get("/sites/:siteId/milestones", verifyToken, async (req, res) => { 
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
        
        // Assuming milestones are stored within the site model or a separate Milestone model linked to site
        // For this example, let's assume a dedicated Milestone model which is not provided.
        // If milestones were an array on ConstructionSite:
        // res.json({ success: true, data: site.milestones });
        // If there's a separate Milestone model:
        // const milestones = await Milestone.find({ site: siteId, user: userId });
        res.status(501).json({ success: false, message: "Milestone management not yet implemented." });
    } catch (err) {
        console.error("Error fetching milestones:", err);
        res.status(500).json({ success: false, message: "Server Error fetching milestones." });
    }
});
router.post("/sites/:siteId/milestones", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Milestone creation not yet implemented." });
});

router.get("/sites/:siteId/change-orders", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Change order management not yet implemented." });
});
router.post("/sites/:siteId/change-orders", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Change order creation not yet implemented." });
});

router.get("/sites/:siteId/inventory", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Site material inventory not yet implemented." });
});
router.patch("/sites/:siteId/inventory/:materialId", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Site material inventory update not yet implemented." });
});

router.get("/sites/:siteId/budget-analytics", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Budget analytics not yet implemented." });
});
router.get("/sites/:siteId/reports/:reportType", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Report generation not yet implemented." });
});

router.post("/sites/:siteId/workers/:workerId", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Worker assignment to site not yet implemented." });
});
router.get("/sites/:siteId/workers", verifyToken, async (req, res) => { 
    res.status(501).json({ success: false, message: "Fetching worker assignments for site not yet implemented." });
});


module.exports = router;