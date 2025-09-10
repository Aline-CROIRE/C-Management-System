// server/routes/workers.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Worker = require("../models/Worker");
const Task = require("../models/Task"); // Ensure Task model is correctly imported and its path is valid
const { verifyToken } = require("../middleware/auth");

const sendValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
};

// --- Worker Routes ---

// GET all workers for the authenticated user
router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { search, role, isActive, page = 1, limit = 10, sort = 'fullName', order = 'asc' } = req.query;

        // --- AGGRESSIVE ANTI-CACHING HEADERS ---
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store'); // For proxies
        res.setHeader('Vary', 'Origin, Accept-Encoding'); // Important if different content based on these
        // Explicitly remove ETag to force full re-download
        res.removeHeader('ETag');
        // --- END AGGRESSIVE ANTI-CACHING HEADERS ---

        // --- DEBUGGING LOGS ---
        console.log(`[Workers API] GET /api/workers called.`);
        console.log(`[Workers API] Fetching workers for user ID: ${userId}`);
        const query = { user: userId }; // Define query here for logging
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = (isActive === 'true');
        console.log(`[Workers API] Effective Query:`, query);
        // --- END DEBUGGING LOGS ---

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;

        const workers = await Worker.find(query)
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum);

        const total = await Worker.countDocuments(query);

        // --- DEBUGGING LOGS ---
        console.log(`[Workers API] Found ${workers.length} workers.`);
        if (workers.length > 0) {
            console.log(`[Workers API] First worker name: ${workers[0].fullName}, ID: ${workers[0]._id}`);
        } else {
            console.log(`[Workers API] No workers found for user ID: ${userId}.`);
        }
        // --- END DEBUGGING LOGS ---

        res.json({
            success: true,
            data: workers,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("[Workers API] Error fetching workers:", err); // More specific log
        res.status(500).json({ success: false, message: "Server Error fetching workers." });
    }
});

// GET worker by ID
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        // --- AGGRESSIVE ANTI-CACHING HEADERS (for single worker fetch too) ---
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.setHeader('Vary', 'Origin, Accept-Encoding');
        res.removeHeader('ETag');
        // --- END AGGRESSIVE ANTI-CACHING HEADERS ---

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Worker not found (Invalid ID format)." });
        }

        const worker = await Worker.findOne({ _id: id, user: userId });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found or does not belong to user." });
        }
        res.json({ success: true, data: worker });
    } catch (err) {
        console.error("[Workers API] Error fetching worker by ID:", err); // More specific log
        res.status(500).json({ success: false, message: "Server Error fetching worker." });
    }
});

// CREATE new worker
router.post("/", verifyToken, [
    body('fullName', 'Full name is required').not().isEmpty().trim(),
    body('role', 'Role must be a string').optional().isString().trim(),
    body('contactNumber', 'Contact number must be a string').optional().isString().trim(),
    body('email', 'Invalid email format').optional().isEmail().normalizeEmail(),
    body('skills', 'Skills must be an array of strings').optional().isArray().custom((value) => {
        if (!value.every(skill => typeof skill === 'string' && skill.trim().length > 0)) {
            throw new Error('Each skill must be a non-empty string.');
        }
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
            fullName, role, contactNumber, email, skills, isActive, notes
        });

        await newWorker.save();
        res.status(201).json({ success: true, message: "Worker created successfully!", data: newWorker });
    } catch (err) {
        console.error("[Workers API] Error creating worker:", err); // More specific log
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error creating worker." });
    }
});

// UPDATE worker
router.put("/:id", verifyToken, [
    body('fullName', 'Full name is required').not().isEmpty().trim(),
    body('role', 'Role must be a string').optional().isString().trim(),
    body('contactNumber', 'Contact number must be a string').optional().isString().trim(),
    body('email', 'Invalid email format').optional().isEmail().normalizeEmail(),
    body('skills', 'Skills must be an array of strings').optional().isArray().custom((value) => {
        if (!value.every(skill => typeof skill === 'string' && skill.trim().length > 0)) {
            throw new Error('Each skill must be a non-empty string.');
        }
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
        console.error("[Workers API] Error updating worker:", err); // More specific log
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
        }
        res.status(500).json({ success: false, message: err.message || "Server Error updating worker." });
    }
});

// DELETE worker
router.delete("/:id", verifyToken, async (req, res) => {
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

        // Optional: Remove this worker from any tasks they were assigned to
        await Task.updateMany(
            { assignedTo: deletedWorker._id, user: userId },
            { $pull: { assignedTo: deletedWorker._id } }
        );

        res.json({ success: true, message: "Worker deleted successfully!" });
    } catch (err) {
        console.error("[Workers API] Error deleting worker:", err); // More specific log
        res.status(500).json({ success: false, message: err.message || "Server Error deleting worker." });
    }
});

module.exports = router;