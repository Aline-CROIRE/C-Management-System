const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const moment = require("moment");

const ConstructionSite = require("../models/ConstructionSite");
const Equipment = require("../models/Equipment");
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/auth");

const sendValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
};

// --- Construction Site Routes ---

// GET all sites for the authenticated user
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

// GET a single site by ID
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

// POST create a new site
router.post("/sites", verifyToken, [
    body('name', 'Site name is required').not().isEmpty().trim(),
    body('projectCode', 'Project code is required').not().isEmpty().trim(), // Removed .uppercase() here
    body('location', 'Location is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('endDate', 'Valid end date is required').isISO8601().toDate(),
    body('budget', 'Budget must be a non-negative number').isFloat({ min: 0 }),
    body('manager', 'Manager name is required').not().isEmpty().trim(),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return validationErrors;

    try {
        const userId = req.user._id;
        const { projectCode, name, type, location, startDate, endDate, budget, manager, description, notes } = req.body;

        if (moment(endDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        const uppercaseProjectCode = projectCode.toUpperCase(); // Perform uppercase here
        const existingSite = await ConstructionSite.findOne({ user: userId, projectCode: uppercaseProjectCode }); // Use uppercased code for check
        if (existingSite) {
            return res.status(400).json({ success: false, message: "A site with this project code already exists for this user." });
        }

        const newSite = new ConstructionSite({
            user: userId,
            name, projectCode: uppercaseProjectCode, type, location, startDate, endDate, budget, manager, description, notes, // Use uppercased code
            status: 'Planning',
            progress: 0,
            expenditure: 0,
            workers: 0,
            equipmentCount: 0,
        });

        await newSite.save();
        res.status(201).json({ success: true, message: "Construction site created successfully!", data: newSite });
    } catch (err) {
        console.error("Error creating site:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error creating site." });
    }
});

// PUT update an existing site
router.put("/sites/:id", verifyToken, [
    body('name', 'Site name is required').not().isEmpty().trim(),
    body('projectCode', 'Project code is required').not().isEmpty().trim(), // Removed .uppercase() here
    body('location', 'Location is required').not().isEmpty().trim(),
    body('startDate', 'Valid start date is required').isISO8601().toDate(),
    body('endDate', 'Valid end date is required').isISO8601().toDate(),
    body('budget', 'Budget must be a non-negative number').isFloat({ min: 0 }),
    body('manager', 'Manager name is required').not().isEmpty().trim(),
    body('status', 'Invalid site status').optional().isIn(['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled']),
    body('progress', 'Progress must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
    body('expenditure', 'Expenditure must be a non-negative number').optional().isFloat({ min: 0 }),
    body('workers', 'Workers must be a non-negative integer').optional().isInt({ min: 0 }),
    body('equipmentCount', 'Equipment count must be a non-negative integer').optional().isInt({ min: 0 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return validationErrors;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { projectCode, startDate, endDate, ...restOfUpdateData } = req.body; // Destructure projectCode

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Construction site not found (invalid ID format)." });
        }

        if (moment(endDate).isBefore(moment(startDate))) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        const uppercaseProjectCode = projectCode.toUpperCase(); // Perform uppercase here

        // Check for duplicate project code for THIS USER, excluding the current site
        const existingSiteWithCode = await ConstructionSite.findOne({
            user: userId,
            projectCode: uppercaseProjectCode, // Use uppercased code for check
            _id: { $ne: id }
        });
        if (existingSiteWithCode) {
            return res.status(400).json({ success: false, message: "Another site with this project code already exists for this user." });
        }

        const updateData = { ...restOfUpdateData, projectCode: uppercaseProjectCode, startDate, endDate }; // Apply uppercased code

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
        res.status(500).json({ success: false, message: err.message || "Server Error updating site." });
    }
});

// DELETE a site
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
        res.json({ success: true, message: "Construction site deleted successfully!" });
    } catch (err) {
        console.error("Error deleting site:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error deleting site." });
    }
});

// --- Equipment Routes ---

// GET all equipment for the authenticated user
router.get("/equipment", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, search, siteId, page = 1, limit = 10, sort = 'name', order = 'asc' } = req.query;

        const query = { user: userId };
        if (status) query.status = status;
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

// GET a single equipment by ID
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

// POST create new equipment
router.post("/equipment", verifyToken, [
    body('name', 'Equipment name is required').not().isEmpty().trim(),
    body('assetTag', 'Asset tag is required').not().isEmpty().trim(), // Removed .uppercase() here
    body('type', 'Equipment type is required').not().isEmpty().trim().isIn(['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other']),
    body('currentSite', 'Current site must be a valid ID').optional().isMongoId(),
    body('purchaseDate', 'Valid purchase date is required').isISO8601().toDate(),
    body('purchaseCost', 'Purchase cost must be a non-negative number').isFloat({ min: 0 }),
    body('condition', 'Invalid equipment condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
    body('lastMaintenance', 'Valid last maintenance date is required').optional().isISO8601().toDate(),
    body('nextMaintenance', 'Valid next maintenance date is required').optional().isISO8601().toDate(),
    body('utilization', 'Utilization must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return validationErrors;

    try {
        const userId = req.user._id;
        const { assetTag, name, type, currentSite, purchaseDate, purchaseCost, condition, lastMaintenance, nextMaintenance, utilization, notes } = req.body;

        const uppercaseAssetTag = assetTag.toUpperCase(); // Perform uppercase here
        const existingEquipment = await Equipment.findOne({ user: userId, assetTag: uppercaseAssetTag }); // Use uppercased tag for check
        if (existingEquipment) {
            return res.status(400).json({ success: false, message: "Equipment with this asset tag already exists for this user." });
        }

        if (currentSite && mongoose.Types.ObjectId.isValid(currentSite)) {
          const site = await ConstructionSite.findOne({ _id: currentSite, user: userId });
          if (site) {
            site.equipmentCount = (site.equipmentCount || 0) + 1;
            await site.save();
          }
        }

        const newEquipment = new Equipment({
            user: userId,
            name, assetTag: uppercaseAssetTag, type, currentSite, purchaseDate, purchaseCost, condition, lastMaintenance, nextMaintenance, utilization, notes, // Use uppercased tag
            status: 'Operational',
            currentValue: purchaseCost,
        });

        await newEquipment.save();
        res.status(201).json({ success: true, message: "Equipment created successfully!", data: newEquipment });
    } catch (err) {
        console.error("Error creating equipment:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error creating equipment." });
    }
});

// PUT update an existing equipment
router.put("/equipment/:id", verifyToken, [
    body('name', 'Equipment name is required').not().isEmpty().trim(),
    body('assetTag', 'Asset tag is required').not().isEmpty().trim(), // Removed .uppercase() here
    body('type', 'Equipment type is required').not().isEmpty().trim().isIn(['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other']),
    body('currentSite', 'Current site must be a valid ID').optional().isMongoId().withMessage('Invalid current site ID.'),
    body('status', 'Invalid equipment status').optional().isIn(['Operational', 'In Maintenance', 'Idle', 'Broken', 'In Transit', 'Out of Service']),
    body('condition', 'Invalid equipment condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
    body('lastMaintenance', 'Valid last maintenance date is required').optional().isISO8601().toDate(),
    body('nextMaintenance', 'Valid next maintenance date is required').optional().isISO8601().toDate(),
    body('purchaseDate', 'Valid purchase date is required').optional().isISO8601().toDate(),
    body('purchaseCost', 'Purchase cost must be a non-negative number').optional().isFloat({ min: 0 }),
    body('currentValue', 'Current value must be a non-negative number').optional().isFloat({ min: 0 }),
    body('utilization', 'Utilization must be between 0 and 100').optional().isFloat({ min: 0, max: 100 }),
], async (req, res) => {
    const validationErrors = sendValidationErrors(req, res);
    if (validationErrors) return validationErrors;

    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { assetTag, currentSite, _prevCurrentSite, ...restOfUpdateData } = req.body; // _prevCurrentSite is for frontend bookkeeping

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Equipment not found (invalid ID format)." });
        }

        const uppercaseAssetTag = assetTag.toUpperCase(); // Perform uppercase here

        // Check for duplicate asset tag for THIS USER, excluding the current equipment
        const existingEquipmentWithTag = await Equipment.findOne({
            user: userId,
            assetTag: uppercaseAssetTag, // Use uppercased tag for check
            _id: { $ne: id }
        });
        if (existingEquipmentWithTag) {
            return res.status(400).json({ success: false, message: "Another equipment with this asset tag already exists for this user." });
        }

        const updatedEquipment = await Equipment.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: { assetTag: uppercaseAssetTag, currentSite, ...restOfUpdateData } }, // Apply uppercased tag
            { new: true, runValidators: true }
        );

        if (!updatedEquipment) {
            return res.status(404).json({ success: false, message: "Equipment not found or does not belong to user." });
        }

        // Adjust equipmentCount on associated ConstructionSites if site changed
        if (_prevCurrentSite && String(_prevCurrentSite) !== String(currentSite)) {
            // Decrement old site's count
            const prevSite = await ConstructionSite.findOne({ _id: _prevCurrentSite, user: userId });
            if (prevSite) {
                prevSite.equipmentCount = Math.max(0, (prevSite.equipmentCount || 0) - 1);
                await prevSite.save();
            }
            // Increment new site's count
            if (currentSite) {
                const newSite = await ConstructionSite.findOne({ _id: currentSite, user: userId });
                if (newSite) {
                    newSite.equipmentCount = (newSite.equipmentCount || 0) + 1;
                    await newSite.save();
                }
            }
        } else if (!_prevCurrentSite && currentSite) { // If it was unassigned and now assigned
             const newSite = await ConstructionSite.findOne({ _id: currentSite, user: userId });
             if (newSite) {
                 newSite.equipmentCount = (newSite.equipmentCount || 0) + 1;
                 await newSite.save();
             }
        }


        res.json({ success: true, message: "Equipment updated successfully!", data: updatedEquipment });
    } catch (err) {
        console.error("Error updating equipment:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error updating equipment." });
    }
});

// DELETE equipment
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

        // Decrement equipmentCount on the associated ConstructionSite
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
        res.status(500).json({ success: false, message: err.message || "Server Error deleting equipment." });
    }
});


module.exports = router;