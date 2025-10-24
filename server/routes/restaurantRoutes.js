// server/routes/restaurantRoutes.js
const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { verifyToken, checkModuleAccess, checkPermission, requireAdmin } = require('../middleware/auth');

// Public QR Code Ordering Routes (no auth token required by backend)
router.get('/public/:restaurantId/:tableId/menu', restaurantController.validateQrContext, restaurantController.getPublicMenuItemsForQr);
router.post('/public/:restaurantId/:tableId/order', restaurantController.validateQrContext, restaurantController.createQrOrder);

// NEW: Endpoint for a user to auto-create their first default restaurant
router.post('/auto-create-my-restaurant', verifyToken, checkModuleAccess('Restaurant'), restaurantController.autoCreateMyRestaurant);

// Admin-level management of ALL restaurants (only for 'admin' role)
router.post('/admin/restaurants', verifyToken, requireAdmin, restaurantController.createRestaurant); 
router.get('/admin/restaurants', verifyToken, requireAdmin, restaurantController.getRestaurants);
router.get('/admin/restaurants/:id', verifyToken, requireAdmin, restaurantController.getRestaurantById); // Admin gets ANY restaurant
router.put('/admin/restaurants/:id', verifyToken, requireAdmin, restaurantController.updateRestaurant);
router.delete('/admin/restaurants/:id', verifyToken, requireAdmin, restaurantController.deleteRestaurant);

// --- Middleware for all subsequent authenticated routes under /api/restaurant/:restaurantId ---
router.use('/:restaurantId', 
  verifyToken, 
  checkModuleAccess('Restaurant'), 
  restaurantController.validateRestaurantAccess
);

// --- All routes BELOW this point will automatically have the above middleware applied ---

// Authenticated user (owner or admin) can get their *own* associated restaurant data
router.get('/:restaurantId', checkPermission('restaurant', 'read'), restaurantController.getRestaurantById); 

// --- Menu Item Routes ---
router.post('/:restaurantId/menu-items', checkPermission('restaurant', 'write'), restaurantController.createMenuItem);
router.get('/:restaurantId/menu-items', checkPermission('restaurant', 'read'), restaurantController.getMenuItems);
router.get('/:restaurantId/menu-items/:id', checkPermission('restaurant', 'read'), restaurantController.getMenuItemById);
router.put('/:restaurantId/menu-items/:id', checkPermission('restaurant', 'write'), restaurantController.updateMenuItem);
router.delete('/:restaurantId/menu-items/:id', checkPermission('restaurant', 'delete'), restaurantController.deleteMenuItem);

// --- Table Routes ---
router.post('/:restaurantId/tables', checkPermission('restaurant', 'write'), restaurantController.createTable);
router.get('/:restaurantId/tables', checkPermission('restaurant', 'read'), restaurantController.getTables);
router.get('/:restaurantId/tables/:id', checkPermission('restaurant', 'read'), restaurantController.getTableById);
router.put('/:restaurantId/tables/:id', checkPermission('restaurant', 'write'), restaurantController.updateTable);
router.delete('/:restaurantId/tables/:id', checkPermission('restaurant', 'delete'), restaurantController.deleteTable);
router.post('/:restaurantId/tables/:tableId/qrcode', checkPermission('restaurant', 'read'), restaurantController.generateQrCodeLink);

// --- Order Routes (POS & General) ---
router.post('/:restaurantId/orders', checkPermission('restaurant', 'write'), restaurantController.createOrder);
router.get('/:restaurantId/orders', checkPermission('restaurant', 'read'), restaurantController.getOrders);
router.get('/:restaurantId/orders/:id', checkPermission('restaurant', 'read'), restaurantController.getOrderById);
router.put('/:restaurantId/orders/:id', checkPermission('restaurant', 'write'), restaurantController.updateOrder);
router.post('/:restaurantId/orders/:id/payment', checkPermission('restaurant', 'write'), restaurantController.processPayment);

// --- KDS (Kitchen Display System) Routes ---
router.get('/:restaurantId/kds/orders', checkPermission('restaurant', 'read'), restaurantController.getKdsOrders);
router.put('/:restaurantId/kds/orders/:orderId/items/:itemId/status', checkPermission('restaurant', 'write'), restaurantController.updateKdsOrderItemStatus);

// --- Circular Economy & Sustainability Routes ---
router.post('/:restaurantId/waste-logs', checkPermission('restaurant', 'write'), restaurantController.logWaste);
router.get('/:restaurantId/waste-reports', checkPermission('restaurant', 'read'), restaurantController.getWasteReports);
router.post('/:restaurantId/resource-logs', checkPermission('restaurant', 'write'), restaurantController.logResourceConsumption);
router.get('/:restaurantId/resource-reports', checkPermission('restaurant', 'read'), restaurantController.getResourceReports);

// --- Restaurant-Specific Analytics/Summary ---
router.get('/:restaurantId/summary', checkPermission('restaurant', 'read'), restaurantController.getRestaurantSummary);

// --- Restaurant Customer Management Routes (using the new RestaurantCustomer model) ---
router.post('/:restaurantId/restaurant-customers', checkPermission('restaurant', 'write'), restaurantController.createRestaurantCustomer);
router.get('/:restaurantId/restaurant-customers', checkPermission('restaurant', 'read'), restaurantController.getRestaurantCustomers);
router.get('/:restaurantId/restaurant-customers/:id', checkPermission('restaurant', 'read'), restaurantController.getRestaurantCustomerById);
router.put('/:restaurantId/restaurant-customers/:id', checkPermission('restaurant', 'write'), restaurantController.updateRestaurantCustomer);
router.delete('/:restaurantId/restaurant-customers/:id', checkPermission('restaurant', 'delete'), restaurantController.deleteRestaurantCustomer);

module.exports = router;