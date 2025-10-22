const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { verifyToken, checkModuleAccess, checkPermission, requireAdmin } = require('../middleware/auth');

router.get('/public/:restaurantId/:tableId/menu', restaurantController.validateQrContext, restaurantController.getPublicMenuItemsForQr);
router.post('/public/:restaurantId/:tableId/order', restaurantController.validateQrContext, restaurantController.createQrOrder);

router.post('/admin/restaurants', verifyToken, requireAdmin, restaurantController.createRestaurant);
router.get('/admin/restaurants', verifyToken, requireAdmin, restaurantController.getRestaurants);
router.get('/admin/restaurants/:id', verifyToken, requireAdmin, restaurantController.getRestaurantById);
router.put('/admin/restaurants/:id', verifyToken, requireAdmin, restaurantController.updateRestaurant);
router.delete('/admin/restaurants/:id', verifyToken, requireAdmin, restaurantController.deleteRestaurant);

router.use('/:restaurantId', verifyToken, checkModuleAccess('Restaurant'), restaurantController.validateRestaurantAccess);

router.post('/:restaurantId/menu-items', checkPermission('restaurant', 'write'), restaurantController.createMenuItem);
router.get('/:restaurantId/menu-items', checkPermission('restaurant', 'read'), restaurantController.getMenuItems);
router.get('/:restaurantId/menu-items/:id', checkPermission('restaurant', 'read'), restaurantController.getMenuItemById);
router.put('/:restaurantId/menu-items/:id', checkPermission('restaurant', 'write'), restaurantController.updateMenuItem);
router.delete('/:restaurantId/menu-items/:id', checkPermission('restaurant', 'delete'), restaurantController.deleteMenuItem);

router.post('/:restaurantId/tables', checkPermission('restaurant', 'write'), restaurantController.createTable);
router.get('/:restaurantId/tables', checkPermission('restaurant', 'read'), restaurantController.getTables);
router.get('/:restaurantId/tables/:id', checkPermission('restaurant', 'read'), restaurantController.getTableById);
router.put('/:restaurantId/tables/:id', checkPermission('restaurant', 'write'), restaurantController.updateTable);
router.delete('/:restaurantId/tables/:id', checkPermission('restaurant', 'delete'), restaurantController.deleteTable);
router.post('/:restaurantId/tables/:tableId/qrcode', checkPermission('restaurant', 'read'), restaurantController.generateQrCodeLink);

router.post('/:restaurantId/orders', checkPermission('restaurant', 'write'), restaurantController.createOrder);
router.get('/:restaurantId/orders', checkPermission('restaurant', 'read'), restaurantController.getOrders);
router.get('/:restaurantId/orders/:id', checkPermission('restaurant', 'read'), restaurantController.getOrderById);
router.put('/:restaurantId/orders/:id', checkPermission('restaurant', 'write'), restaurantController.updateOrder);
router.post('/:restaurantId/orders/:id/payment', checkPermission('restaurant', 'write'), restaurantController.processPayment);

router.get('/:restaurantId/kds/orders', checkPermission('restaurant', 'read'), restaurantController.getKdsOrders);
router.put('/:restaurantId/kds/orders/:orderId/items/:itemId/status', checkPermission('restaurant', 'write'), restaurantController.updateKdsOrderItemStatus);

router.post('/:restaurantId/waste-logs', checkPermission('restaurant', 'write'), restaurantController.logWaste);
router.get('/:restaurantId/waste-reports', checkPermission('restaurant', 'read'), restaurantController.getWasteReports);
router.post('/:restaurantId/resource-logs', checkPermission('restaurant', 'write'), restaurantController.logResourceConsumption);
router.get('/:restaurantId/resource-reports', checkPermission('restaurant', 'read'), restaurantController.getResourceReports);

router.get('/:restaurantId/summary', checkPermission('restaurant', 'read'), restaurantController.getRestaurantSummary);

router.post('/:restaurantId/restaurant-customers', checkPermission('restaurant', 'write'), restaurantController.createRestaurantCustomer);
router.get('/:restaurantId/restaurant-customers', checkPermission('restaurant', 'read'), restaurantController.getRestaurantCustomers);
router.get('/:restaurantId/restaurant-customers/:id', checkPermission('restaurant', 'read'), restaurantController.getRestaurantCustomerById);
router.put('/:restaurantId/restaurant-customers/:id', checkPermission('restaurant', 'write'), restaurantController.updateRestaurantCustomer);
router.delete('/:restaurantId/restaurant-customers/:id', checkPermission('restaurant', 'delete'), restaurantController.deleteRestaurantCustomer);

module.exports = router;