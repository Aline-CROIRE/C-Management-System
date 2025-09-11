// server/middleware/roleMiddleware.js
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied: Admin role required.' });
    }
};

const isProjectManager = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'project_manager')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied: Project Manager role required.' });
    }
};

const isSiteEngineer = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'project_manager' || req.user.role === 'site_engineer')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied: Site Engineer role required.' });
    }
};

module.exports = {
    isAdmin,
    isProjectManager,
    isSiteEngineer
};