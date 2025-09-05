const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const moment = require("moment");

const ConstructionSite = require("../models/ConstructionSite");
const Equipment = require("../models/Equipment");
const Notification = require("../models/Notification"); // Assuming you might use this for future notifications related to construction
const { verifyToken } = require("../middleware/auth");

const sendValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null; // Return null if no errors, indicating validation passed
};

// --- Construction Site Routes ---

/**
 * @route GET /api/construction/sites
 * @desc Get all construction sites for the authenticated user
 * @access Private
 */
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

/**
 * @route GET /api/construction/sites/:id
 * @desc Get a single construction site by ID for the authenticated user
 * @access Private
 */
router.get("/sites/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Construction site not found (invalid ID format)." });
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

/**
 * @route POST /api/construction/sites
 * @desc Create a new construction site for the authenticated user
 * @access Private
 */
router.post("/sites", verifyToken, [
    body('name', 'Site name is required').not().isEmpty().trim(),
    body('projectCode', 'Project code is required').not().isEmpty().trim(),
    body('location', 'Location is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('endDate', 'Valid end date is required').isISO8601().toDate(),
    body('budget', 'Budget must be a non-negative number').isFloat({ min: 0 }).withMessage('Budget must be a non-negative number.'),
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
            status: 'Planning', // Default status for a new site
            progress: 0,
            expenditure: 0,
            workers: 0,
            equipmentCount: 0,
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

/**
 * @route PUT /api/construction/sites/:id
 * @desc Update an existing construction site for the authenticated user
 * @access Private
 */
router.put("/sites/:id", verifyToken, [
    body('name', 'Site name is required').not().isEmpty().trim(),
    body('projectCode', 'Project code is required').not().isEmpty().trim(),
    body('location', 'Location is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('endDate', 'Valid end date is required').isISO8601().toDate(),
    body('budget', 'Budget must be a non-negative number').isFloat({ min: 0 }).withMessage('Budget must be a non-negative number.'),
    body('manager', 'Manager name is required').not().isEmpty().trim(),
    body('status', 'Invalid site status').optional().isIn(['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled']),
    body('progress', 'Progress must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100.'),
    body('expenditure', 'Expenditure must be a non-negative number').optional().isFloat({ min: 0 }).withMessage('Expenditure must be a non-negative number.'),
    body('workers', 'Workers must be a non-negative integer').optional().isInt({ min: 0 }).withMessage('Workers count must be a non-negative integer.'),
    body('equipmentCount', 'Equipment count must be a non-negative integer').optional().isInt({ min: 0 }).withMessage('Equipment count must be a non-negative integer.'),
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
            return res.status(404).json({ success: false, message: "Construction site not found (invalid ID format)." });
        }

        if (moment(endDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        const uppercaseProjectCode = projectCode.toUpperCase();

        const existingSiteWithCode = await ConstructionSite.findOne({
            user: userId,
            projectCode: uppercaseProjectCode,
            _id: { $ne: id } // Exclude the current site being updated
        });
        if (existingSiteWithCode) {
            return res.status(400).json({ success: false, message: "Another site with this project code already exists for this user." });
        }

        const updateData = { ...restOfUpdateData, projectCode: uppercaseProjectCode, startDate, endDate, status };
        
        const updatedSite = await ConstructionSite.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: updateData },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedSite) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        // Set actualEndDate if status is 'Completed' and actualEndDate is not already set
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

/**
 * @route DELETE /api/construction/sites/:id
 * @desc Delete a construction site for the authenticated user
 * @access Private
 */
router.delete("/sites/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Construction site not found (invalid ID format)." });
        }

        const deletedSite = await ConstructionSite.findOneAndDelete({ _id: id, user: userId });
        if (!deletedSite) {
            return res.status(404).json({ success: false, message: "Construction site not found or does not belong to user." });
        }

        // Optionally, remove all equipment associated with this site
        // await Equipment.updateMany({ currentSite: id, user: userId }, { $unset: { currentSite: "" } });
        // Or delete them: await Equipment.deleteMany({ currentSite: id, user: userId });
        // For now, just decrement equipmentCount, consider if equipment should be disassociated or deleted.

        res.json({ success: true, message: "Construction site deleted successfully!" });
    } catch (err) {
        console.error("Error deleting site:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting site." });
    }
});

// --- Equipment Routes ---

/**
 * @route GET /api/construction/equipment
 * @desc Get all equipment for the authenticated user
 * @access Private
 */
router.get("/equipment", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, search, siteId, type, page = 1, limit = 10, sort = 'name', order = 'asc' } = req.query;

        const query = { user: userId };
        if (status) query.status = status;
        if (type) query.type = type; // Filter by equipment type
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
            .populate('currentSite', 'name projectCode') // Populate site details
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

/**
 * @route GET /api/construction/equipment/:id
 * @desc Get a single equipment item by ID for the authenticated user
 * @access Private
 */
router.get("/equipment/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Equipment not found (invalid ID format)." });
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

/**
 * @route POST /api/construction/equipment
 * @desc Create a new equipment item for the authenticated user
 * @access Private
 */
router.post("/equipment", verifyToken, [
    body('name', 'Equipment name is required').not().isEmpty().trim(),
    body('assetTag', 'Asset tag is required').not().isEmpty().trim(),
    body('type', 'Equipment type is required').not().isEmpty().trim().isIn(['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other']),
    body('currentSite', 'Current site must be a valid ID').optional().isMongoId().withMessage('Invalid current site ID.'),
    body('purchaseDate', 'Valid purchase date is required').isISO8601().toDate(),
    body('purchaseCost', 'Purchase cost must be a non-negative number').isFloat({ min: 0 }).withMessage('Purchase cost must be a non-negative number.'),
    body('condition', 'Invalid equipment condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
    body('lastMaintenance', 'Valid last maintenance date is required').optional().isISO8601().toDate(),
    body('nextMaintenance', 'Valid next maintenance date is required').optional().isISO8601().toDate(),
    body('utilization', 'Utilization must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }).withMessage('Utilization must be between 0 and 100.'),
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

        // If a currentSite is provided, increment its equipmentCount
        if (currentSite && mongoose.Types.ObjectId.isValid(currentSite)) {
          const site = await ConstructionSite.findOne({ _id: currentSite, user: userId });
          if (site) {
            site.equipmentCount = (site.equipmentCount || 0) + 1;
            await site.save();
          } else {
              // Handle case where site ID is valid but doesn't exist or belong to user
              return res.status(400).json({ success: false, message: "Provided current site does not exist or does not belong to the user." });
          }
        }

        const newEquipment = new Equipment({
            user: userId,
            name, assetTag: uppercaseAssetTag, type, currentSite, purchaseDate, purchaseCost, condition, lastMaintenance, nextMaintenance, utilization, notes,
            status: 'Operational', // Default status for new equipment
            currentValue: purchaseCost, // Initial current value is purchase cost
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

/**
 * @route PUT /api/construction/equipment/:id
 * @desc Update an existing equipment item for the authenticated user
 * @access Private
 */
router.put("/equipment/:id", verifyToken, [
    body('name', 'Equipment name is required').not().isEmpty().trim(),
    body('assetTag', 'Asset tag is required').not().isEmpty().trim(),
    body('type', 'Equipment type is required').not().isEmpty().trim().isIn(['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other']),
    body('currentSite', 'Current site must be a valid ID').optional().isMongoId().withMessage('Invalid current site ID.'),
    body('status', 'Invalid equipment status').optional().isIn(['Operational', 'In Maintenance', 'Idle', 'Broken', 'In Transit', 'Out of Service']),
    body('condition', 'Invalid equipment condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
    body('lastMaintenance', 'Valid last maintenance date is required').optional().isISO8601().toDate(),
    body('nextMaintenance', 'Valid next maintenance date is required').optional().isISO8601().toDate(),
    body('purchaseDate', 'Valid purchase date is required').optional().isISO8601().toDate(),
    body('purchaseCost', 'Purchase cost must be a non-negative number').optional().isFloat({ min: 0 }).withMessage('Purchase cost must be a non-negative number.'),
    body('currentValue', 'Current value must be a non-negative number').optional().isFloat({ min: 0 }).withMessage('Current value must be a non-negative number.'),
    body('utilization', 'Utilization must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }).withMessage('Utilization must be between 0 and 100.'),
    body('notes', 'Notes must be a string').optional().isString().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { assetTag, currentSite, _prevCurrentSite, ...restOfUpdateData } = req.body; // _prevCurrentSite is a client-side hint

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Equipment not found (invalid ID format)." });
        }

        const uppercaseAssetTag = assetTag.toUpperCase();

        const existingEquipmentWithTag = await Equipment.findOne({
            user: userId,
            assetTag: uppercaseAssetTag,
            _id: { $ne: id } // Exclude the current equipment being updated
        });
        if (existingEquipmentWithTag) {
            return res.status(400).json({ success: false, message: "Another equipment with this asset tag already exists for this user." });
        }

        const updateData = { assetTag: uppercaseAssetTag, currentSite, ...restOfUpdateData };
        
        const updatedEquipment = await Equipment.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedEquipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }

        // Logic to update equipmentCount on associated construction sites
        const prevSiteId = String(_prevCurrentSite); // Convert to string for comparison
        const newSiteId = String(currentSite); // Convert to string for comparison

        // Case 1: Site changed (prevSiteId exists and is different from newSiteId)
        if (prevSiteId && prevSiteId !== 'undefined' && prevSiteId !== 'null' && prevSiteId !== newSiteId) {
            // Decrement count from previous site
            const prevSite = await ConstructionSite.findOne({ _id: prevSiteId, user: userId });
            if (prevSite) {
                prevSite.equipmentCount = Math.max(0, (prevSite.equipmentCount || 0) - 1);
                await prevSite.save();
            }

            // Increment count for new site (if newSiteId is valid)
            if (newSiteId && mongoose.Types.ObjectId.isValid(newSiteId)) {
                const newSite = await ConstructionSite.findOne({ _id: newSiteId, user: userId });
                if (newSite) {
                    newSite.equipmentCount = (newSite.equipmentCount || 0) + 1;
                    await newSite.save();
                } else {
                    return res.status(400).json({ success: false, message: "Provided new current site does not exist or does not belong to the user." });
                }
            }
        } 
        // Case 2: Equipment was not assigned to any site, but is now assigned to a new site
        else if ((!prevSiteId || prevSiteId === 'undefined' || prevSiteId === 'null') && newSiteId && mongoose.Types.ObjectId.isValid(newSiteId)) {
            const newSite = await ConstructionSite.findOne({ _id: newSiteId, user: userId });
            if (newSite) {
                newSite.equipmentCount = (newSite.equipmentCount || 0) + 1;
                await newSite.save();
            } else {
                return res.status(400).json({ success: false, message: "Provided current site does not exist or does not belong to the user." });
            }
        }
        // Case 3: Equipment was assigned to a site, but is now unassigned
        else if (prevSiteId && prevSiteId !== 'undefined' && prevSiteId !== 'null' && (!newSiteId || newSiteId === 'undefined' || newSiteId === 'null')) {
             const prevSite = await ConstructionSite.findOne({ _id: prevSiteId, user: userId });
            if (prevSite) {
                prevSite.equipmentCount = Math.max(0, (prevSite.equipmentCount || 0) - 1);
                await prevSite.save();
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

/**
 * @route DELETE /api/construction/equipment/:id
 * @desc Delete an equipment item for the authenticated user
 * @access Private
 */
router.delete("/equipment/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Equipment not found (invalid ID format)." });
        }

        const deletedEquipment = await Equipment.findOneAndDelete({ _id: id, user: userId });
        if (!deletedEquipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }

        // If the deleted equipment was assigned to a site, decrement that site's equipmentCount
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

// --- Construction Statistics Route ---
/**
 * @route GET /api/construction/stats
 * @desc Get aggregated statistics for construction sites and equipment for the authenticated user
 * @access Private
 */
router.get("/stats", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;

        // General Site Stats
        const totalSites = await ConstructionSite.countDocuments({ user: userId });
        const activeSites = await ConstructionSite.countDocuments({ user: userId, status: 'Active' });
        const completedSites = await ConstructionSite.countDocuments({ user: userId, status: 'Completed' });
        const planningSites = await ConstructionSite.countDocuments({ user: userId, status: 'Planning' });
        const onHoldSites = await ConstructionSite.countDocuments({ user: userId, status: 'On-Hold' });
        const delayedSites = await ConstructionSite.countDocuments({ user: userId, status: 'Delayed' });

        // Financial Stats (Site Expenditure vs. Budget)
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

        // General Equipment Stats
        const totalEquipment = await Equipment.countDocuments({ user: userId });
        const operationalEquipment = await Equipment.countDocuments({ user: userId, status: 'Operational' });
        const inMaintenanceEquipment = await Equipment.countDocuments({ user: userId, status: 'In Maintenance' });
        const outOfServiceEquipment = await Equipment.countDocuments({ user: userId, status: 'Out of Service' });

        // Equipment Value Stats
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
                }
            },
        });
    } catch (err) {
        console.error("Error fetching construction stats:", err);
        res.status(500).json({ success: false, message: "Server Error fetching construction statistics." });
    }
});


module.exports = router;