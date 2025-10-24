const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const WasteLog = require('../models/WasteLog');
const ResourceLog = require('../models/ResourceLog');
const Restaurant = require('../models/Restaurant');
const RestaurantCustomer = require('../models/RestaurantCustomer');
const User = require('../models/User');
const QRCode = require('qrcode');

exports.validateRestaurantAccess = async (req, res, next) => {
  const restaurantId = req.params.restaurantId || req.query.restaurantId || req.body.restaurantId;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({ success: false, message: 'Invalid Restaurant ID format.' });
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ success: false, message: 'Restaurant not found or is inactive.' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    if (req.user.role !== 'admin' && restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not manage this restaurant.' });
    }

    req.restaurantId = restaurantId;
    next();
  } catch (error) {
    console.error("Controller: validateRestaurantAccess - Error during database operation:", error);
    return res.status(500).json({ success: false, message: 'Server error during restaurant access validation.', error: error.message });
  }
};

exports.autoCreateMyRestaurant = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    const userAlreadyOwnsRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (userAlreadyOwnsRestaurant) {
      const updatedUserDoc = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            'permissions.restaurant.read': true,
            'permissions.restaurant.write': true,
            'permissions.restaurant.delete': true
          }
        },
        { new: true, runValidators: true }
      );
      const userWithUpdatedPermissions = { 
        ...req.user, 
        restaurantId: userAlreadyOwnsRestaurant._id.toString(),
        permissions: updatedUserDoc.permissions 
      };
      return res.status(200).json({
        success: true,
        message: 'You already own a restaurant.',
        data: userAlreadyOwnsRestaurant,
        user: userWithUpdatedPermissions
      });
    }

    const defaultName = `${req.user.firstName}'s Restaurant ${Math.floor(Math.random() * 1000)}`;

    const newRestaurant = new Restaurant({
      name: defaultName,
      address: {
        street: 'Default St',
        city: 'Default City',
        state: 'Default State',
        zip: '00000',
        country: 'Default Country',
      },
      phone: req.user.profile?.phone || 'N/A',
      email: req.user.email,
      description: `Default restaurant for ${req.user.firstName} ${req.user.lastName}. Please update details.`,
      owner: req.user._id,
    });
    await newRestaurant.save();

    const updatedUserDoc = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            restaurantId: newRestaurant._id,
            'permissions.restaurant.read': true,
            'permissions.restaurant.write': true,
            'permissions.restaurant.delete': true
          }
        },
        { new: true }
    );

    const userToReturn = {
      ...req.user,
      restaurantId: newRestaurant._id.toString(),
      permissions: updatedUserDoc.permissions
    };

    res.status(201).json({
      success: true,
      message: 'Default restaurant created automatically.',
      data: newRestaurant,
      user: userToReturn
    });

  } catch (error) {
    console.error("Controller: Error auto-creating restaurant:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
    }
    res.status(500).json({ success: false, message: 'Server error auto-creating restaurant.', error: error.message });
  }
};

exports.createRestaurant = async (req, res) => {
  try {
    const { name, address, phone, email, logoUrl, description } = req.body;

    if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, message: "User not authenticated or user ID missing." });
    }

    if (!name || !address || !phone || !email || !address.street || !address.city || !address.country) {
      return res.status(400).json({ success: false, message: 'Missing required restaurant fields (name, email, phone, and full address).' });
    }

    const existingRestaurant = await Restaurant.findOne({ name });
    if (existingRestaurant) {
      return res.status(409).json({ success: false, message: 'Restaurant with this name already exists.' });
    }
    
    const userAlreadyOwnsRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (userAlreadyOwnsRestaurant) {
      return res.status(409).json({ success: false, message: 'You already own a restaurant. Only one restaurant per owner is currently supported via this route.' });
    }

    const restaurant = new Restaurant({
      name,
      address,
      phone,
      email,
      logoUrl,
      description,
      owner: req.user._id,
    });
    await restaurant.save();

    const updatedUserDoc = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            restaurantId: restaurant._id,
            'permissions.restaurant.read': true,
            'permissions.restaurant.write': true,
            'permissions.restaurant.delete': true
          }
        },
        { new: true, runValidators: true }
    );
    
    const userToReturn = {
      ...req.user,
      restaurantId: restaurant._id.toString(),
      permissions: updatedUserDoc.permissions
    };

    res.status(201).json({ success: true, message: 'Restaurant created successfully.', data: restaurant, user: userToReturn });
  } catch (error) {
    console.error("Controller: Error creating restaurant:", error);

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({ success: false, message: `Validation failed: ${errors.join(', ')}` });
    }
    
    res.status(500).json({ success: false, message: 'Server error creating restaurant.', error: error.message });
  }
};

exports.getRestaurants = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const restaurants = await Restaurant.find(query);
    res.status(200).json({ success: true, data: restaurants });
  } catch (error) {
    console.error('Controller: Error fetching restaurants:', error);
    res.status(500).json({ success: false, message: 'Server error fetching restaurants.', error: error.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurantId); 
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Controller: Error fetching restaurant by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching restaurant.', error: error.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    delete updateData.qrCodeSecret;
    delete updateData.owner;

    Object.assign(restaurant, updateData);
    await restaurant.save();

    res.status(200).json({ success: true, message: 'Restaurant updated successfully.', data: restaurant });
  } catch (error) {
    console.error('Controller: Error updating restaurant:', error);
    res.status(500).json({ success: false, message: 'Server error updating restaurant.', error: error.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    await restaurant.deleteOne();
    
    await User.findByIdAndUpdate(
      restaurant.owner,
      {
        $set: {
          restaurantId: null,
          'permissions.restaurant.read': false,
          'permissions.restaurant.write': false,
          'permissions.restaurant.delete': false
        }
      }
    );

    res.status(200).json({ success: true, message: 'Restaurant deleted successfully.' });
  } catch (error) {
    console.error('Controller: Error deleting restaurant:', error);
    res.status(500).json({ success: false, message: 'Server error deleting restaurant.', error: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, category, price, isActive, imageUrl, prepTimeMinutes, allergens } = req.body;
    const restaurantId = req.restaurantId;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required menu item fields (name, category, price).' });
    }

    const existingMenuItem = await MenuItem.findOne({ restaurantId, name });
    if (existingMenuItem) {
      return res.status(409).json({ success: false, message: 'Menu item with this name already exists in this restaurant.' });
    }

    const menuItem = new MenuItem({
      restaurantId, name, description, category, price, isActive, imageUrl, prepTimeMinutes, allergens
    });
    await menuItem.save();
    res.status(201).json({ success: true, message: 'Menu item created successfully.', data: menuItem });
  } catch (error) {
    console.error('Controller: Error creating menu item:', error);
    res.status(500).json({ success: false, message: 'Server error creating menu item.', error: error.message });
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const query = { restaurantId };
    if (req.query.category) query.category = req.query.category;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.status(200).json({ success: true, data: menuItems });
  } catch (error) {
    console.error('Controller: Error fetching menu items:', error);
    res.status(500).json({ success: false, message: 'Server error fetching menu items.', error: error.message });
  }
};

exports.getMenuItemById = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const menuItem = await MenuItem.findOne({ _id: req.params.id, restaurantId });
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found or not in this restaurant.' });
    }
    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Controller: Error fetching menu item by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching menu item.', error: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.restaurantId;

    const menuItem = await MenuItem.findOneAndUpdate({ _id: id, restaurantId }, updateData, { new: true, runValidators: true });
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found or not in this restaurant.' });
    }
    res.status(200).json({ success: true, message: 'Menu item updated successfully.', data: menuItem });
  } catch (error) {
    console.error('Controller: Error updating menu item:', error);
    res.status(500).json({ success: false, message: 'Server error updating menu item.', error: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found or not in this restaurant.' });
    }
    res.status(200).json({ success: true, message: 'Menu item deleted successfully.' });
  } catch (error) {
    console.error('Controller: Error deleting menu item:', error);
    res.status(500).json({ success: false, message: 'Server error deleting menu item.', error: error.message });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status, location } = req.body;
    const restaurantId = req.restaurantId;

    if (!tableNumber || !capacity) {
      return res.status(400).json({ success: false, message: 'Missing required table fields (tableNumber, capacity).' });
    }

    const existingTable = await Table.findOne({ restaurantId, tableNumber });
    if (existingTable) {
      return res.status(409).json({ success: false, message: 'Table with this number already exists in this restaurant.' });
    }

    const table = new Table({ restaurantId, tableNumber, capacity, status, location });
    await table.save();
    res.status(201).json({ success: true, message: 'Table created successfully.', data: table });
  } catch (error) {
    console.error('Controller: Error creating table:', error);
    res.status(500).json({ success: false, message: 'Server error creating table.', error: error.message });
  }
};

exports.getTables = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const query = { restaurantId };
    if (req.query.status) query.status = req.query.status;
    const tables = await Table.find(query).sort({ tableNumber: 1 });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    console.error('Controller: Error fetching tables:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tables.', error: error.message });
  }
};

exports.getTableById = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const table = await Table.findOne({ _id: req.params.id, restaurantId });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found or not in this restaurant.' });
    }
    res.status(200).json({ success: true, data: table });
  } catch (error) {
    console.error('Controller: Error fetching table by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching table.', error: error.message });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.restaurantId;
    delete updateData.currentOrderId;

    const table = await Table.findOneAndUpdate({ _id: id, restaurantId }, updateData, { new: true, runValidators: true });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found or not in this restaurant.' });
    }
    res.status(200).json({ success: true, message: 'Table updated successfully.', data: table });
  } catch (error) {
    console.error('Controller: Error updating table:', error);
    res.status(500).json({ success: false, message: 'Server error updating table.', error: error.message });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const table = await Table.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found or not in this restaurant.' });
    }
    res.status(200).json({ success: true, message: 'Table deleted successfully.' });
  } catch (error) {
    console.error('Controller: Error deleting table:', error);
    res.status(500).json({ success: false, message: 'Server error deleting table.', error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { table, customerId, customerName, customerPhone, customerEmail, orderType, items, notes } = req.body;
    const restaurantId = req.restaurantId;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required.' });
    }

    const populatedItems = [];
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findOne({ _id: item.menuItem, restaurantId, isActive: true });
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item with ID ${item.menuItem} not found or inactive.` });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Quantity for item ${menuItem.name} must be greater than 0.` });
      }
      populatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes,
        status: 'pending'
      });
      totalAmount += item.quantity * menuItem.price;
    }

    let customer = null;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await RestaurantCustomer.findOne({ _id: customerId, restaurantId });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Restaurant customer not found.' });
      }
      customer.lastOrderAt = new Date();
      await customer.save();
    } else if (customerEmail || customerPhone) {
      customer = await RestaurantCustomer.findOneAndUpdate(
        { restaurantId, $or: [{ email: customerEmail }, { phone: customerPhone }] },
        { $set: { firstName: customerName?.split(' ')[0] || '', lastName: customerName?.split(' ')[1] || '', lastOrderAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const order = new Order({
      restaurantId,
      table: table || null,
      customer: customer ? customer._id : null,
      customerName, customerPhone, customerEmail,
      orderType: orderType || 'dine_in',
      items: populatedItems,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      notes,
      servedBy: req.user ? req.user._id : null,
    });
    await order.save();

    if (table) {
      await Table.findOneAndUpdate({ _id: table, restaurantId }, { status: 'occupied', currentOrderId: order._id });
    }

    res.status(201).json({ success: true, message: 'Order created successfully.', data: order });
  } catch (error) {
    console.error('Controller: Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server error creating order.', error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const query = { restaurantId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;
    if (req.query.table) query.table = req.query.table;
    if (req.query.orderType) query.orderType = req.query.orderType;

    const orders = await Order.find(query)
      .populate('table', 'tableNumber')
      .populate('customer', 'firstName lastName email')
      .populate('servedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Controller: Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders.', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const order = await Order.findOne({ _id: req.params.id, restaurantId })
      .populate('table', 'tableNumber')
      .populate('customer', 'firstName lastName email')
      .populate('servedBy', 'firstName lastName');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not in this restaurant.' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Controller: Error fetching order by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order.', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.restaurantId;
    delete updateData.totalAmount;
    delete updateData.paymentStatus;
    delete updateData.paymentMethod;
    delete updateData.completedAt;

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not in this restaurant.' });
    }

    if (updateData.items && Array.isArray(updateData.items)) {
      let newTotalAmount = 0;
      for (const item of updateData.items) {
        if (!item.menuItem || !item.quantity || item.price === undefined) {
          return res.status(400).json({ success: false, message: 'Invalid item structure in update.' });
        }
        newTotalAmount += item.quantity * item.price;
      }
      order.items = updateData.items;
      order.totalAmount = newTotalAmount;
      delete updateData.items;
    }

    Object.assign(order, updateData);
    await order.save();
    res.status(200).json({ success: true, message: 'Order updated successfully.', data: order });
  } catch (error) {
    console.error('Controller: Error updating order:', error);
    res.status(500).json({ success: false, message: 'Server error updating order.', error: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { id } = req.params;
    const { paymentMethod, amountPaid } = req.body;
    if (!paymentMethod || amountPaid === undefined || amountPaid < 0) {
      return res.status(400).json({ success: false, message: 'Payment method and valid amount paid are required.' });
    }

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not in this restaurant.' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid.' });
    }
    if (amountPaid < order.totalAmount) {
      return res.status(400).json({ success: false, message: `Amount paid (${amountPaid}) is less than total amount (${order.totalAmount}).` });
    }

    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod;
    order.completedAt = new Date();
    order.status = 'completed';

    if (order.table) {
      const otherUnpaidOrders = await Order.countDocuments({
        restaurantId,
        table: order.table,
        _id: { $ne: order._id },
        paymentStatus: 'pending',
        status: { $nin: ['cancelled', 'completed'] }
      });

      if (otherUnpaidOrders === 0) {
        await Table.findOneAndUpdate({ _id: order.table, restaurantId }, { status: 'vacant', currentOrderId: null });
      }
    }
    await order.save();

    res.status(200).json({ success: true, message: 'Payment processed successfully.', data: order });
  } catch (error) {
    console.error('Controller: Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Server error processing payment.', error: error.message });
  }
};

exports.getKdsOrders = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const orders = await Order.find({
      restaurantId,
      status: { $in: ['pending', 'preparing', 'ready'] },
      'items.status': { $in: ['pending', 'preparing', 'ready'] }
    })
    .populate('table', 'tableNumber')
    .select('table orderType items createdAt customerName customerPhone notes');
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Controller: Error fetching KDS orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching KDS orders.', error: error.message });
  }
};

exports.updateKdsOrderItemStatus = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    if (!status || !['preparing', 'ready', 'served', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid item status provided.' });
    }

    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not in this restaurant.' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }

    item.status = status;
    if (status === 'preparing' && !item.preparedAt) item.preparedAt = new Date();
    if (status === 'ready' && !item.preparedAt) item.preparedAt = new Date();
    if (status === 'served' && !item.servedAt) item.servedAt = new Date();

    const allItemsReady = order.items.every(i => ['ready', 'served', 'cancelled'].includes(i.status));
    const allItemsServed = order.items.every(i => i.status === 'served' || i.status === 'cancelled');
    const allItemsCancelled = order.items.every(i => i.status === 'cancelled');

    if (allItemsCancelled) {
      order.status = 'cancelled';
    } else if (allItemsServed) {
      order.status = 'served';
    } else if (allItemsReady) {
      order.status = 'ready';
    } else {
      order.status = 'preparing';
    }

    await order.save();
    res.status(200).json({ success: true, message: `Order item ${itemId} status updated to ${status}.`, data: order });
  } catch (error) {
    console.error('Controller: Error updating KDS item status:', error);
    res.status(500).json({ success: false, message: 'Server error updating KDS item status.', error: error.message });
  }
};

exports.logWaste = async (req, res) => {
  try {
    const { date, type, category, quantity, unit, disposalMethod, notes } = req.body;
    const restaurantId = req.restaurantId;

    if (!type || !quantity || !unit || !disposalMethod) {
      return res.status(400).json({ success: false, message: 'Missing required waste log fields (type, quantity, unit, disposalMethod).' });
    }
    const wasteLog = new WasteLog({
      restaurantId, date: date || Date.now(), type, category, quantity, unit, disposalMethod, notes, loggedBy: req.user._id
    });
    await wasteLog.save();
    res.status(201).json({ success: true, message: 'Waste logged successfully.', data: wasteLog });
  } catch (error) {
    console.error('Controller: Error logging waste:', error);
    res.status(500).json({ success: false, message: 'Server error logging waste.', error: error.message });
  }
};

exports.getWasteReports = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { startDate, endDate, type, disposalMethod } = req.query;
    let query = { restaurantId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (type) query.type = type;
    if (disposalMethod) query.disposalMethod = disposalMethod;

    const wasteLogs = await WasteLog.find(query).sort({ date: -1 });

    const aggregatedWaste = await WasteLog.aggregate([
      { $match: query },
      { $group: {
          _id: { type: "$type", disposalMethod: "$disposalMethod", unit: "$unit" },
          totalQuantity: { $sum: "$quantity" }
      }},
      { $sort: { "_id.type": 1 } }
    ]);

    res.status(200).json({ success: true, data: wasteLogs, aggregated: aggregatedWaste });
  } catch (error) {
    console.error('Controller: Error fetching waste reports:', error);
    res.status(500).json({ success: false, message: 'Server error fetching waste reports.', error: error.message });
  }
};

exports.logResourceConsumption = async (req, res) => {
  try {
    const { date, type, value, unit, period, notes } = req.body;
    const restaurantId = req.restaurantId;

    if (!type || !value || !unit || !period) {
      return res.status(400).json({ success: false, message: 'Missing required resource log fields (type, value, unit, period).' });
    }
    const resourceLog = new ResourceLog({
      restaurantId, date: date || Date.now(), type, value, unit, period, notes, loggedBy: req.user._id
    });
    await resourceLog.save();
    res.status(201).json({ success: true, message: 'Resource consumption logged successfully.', data: resourceLog });
  } catch (error) {
    console.error('Controller: Error logging resource consumption:', error);
    res.status(500).json({ success: false, message: 'Server error logging resource consumption.', error: error.message });
  }
};

exports.getResourceReports = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { startDate, endDate, type, period } = req.query;
    let query = { restaurantId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (type) query.type = type;
    if (period) query.period = period;

    const resourceLogs = await ResourceLog.find(query).sort({ date: -1 });

    const aggregatedResources = await ResourceLog.aggregate([
      { $match: query },
      { $group: {
          _id: { type: "$type", unit: "$unit", period: "$period" },
          totalValue: { $sum: "$value" }
      }},
      { $sort: { "_id.type": 1, "_id.period": 1 } }
    ]);

    res.status(200).json({ success: true, data: resourceLogs, aggregated: aggregatedResources });
  } catch (error) {
    console.error('Controller: Error fetching resource reports:', error);
    res.status(500).json({ success: false, message: 'Server error fetching resource reports.', error: error.message });
  }
};

exports.getRestaurantSummary = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const totalOrdersToday = await Order.countDocuments({
      restaurantId,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled', 'pending'] }
    });
    const revenueToday = await Order.aggregate([
      { $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          createdAt: { $gte: today, $lt: tomorrow },
          paymentStatus: 'paid'
      }},
      { $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
      }}
    ]);

    const activeTables = await Table.countDocuments({ restaurantId, status: { $in: ['occupied', 'reserved', 'ordering'] } });
    const pendingKdsItems = await Order.aggregate([
      { $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          status: { $in: ['pending', 'preparing', 'ready'] }
      }},
      { $unwind: '$items' },
      { $match: {
          'items.status': { $in: ['pending', 'preparing'] }
      }},
      { $count: 'count' }
    ]);


    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0,0,0,0);

    const recentWaste = await WasteLog.aggregate([
      { $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: sevenDaysAgo }
      }},
      { $group: {
          _id: "$disposalMethod",
          totalQuantity: { $sum: "$quantity" }
      }},
      { $sort: { _id: 1 } }
    ]);

    const recentResources = await ResourceLog.aggregate([
      { $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: sevenDaysAgo }
      }},
      { $group: {
          _id: "$type",
          totalValue: { $sum: "$value" }
      }},
      { $sort: { _id: 1 } }
    ]);


    res.status(200).json({
      success: true,
      data: {
        totalOrdersToday,
        revenueToday: revenueToday.length > 0 ? revenueToday[0].totalRevenue : 0,
        activeTables,
        pendingKdsItems: pendingKdsItems.length > 0 ? pendingKdsItems[0].count : 0,
        circularEconomySummary: {
          last7DaysWasteByDisposal: recentWaste,
          last7DaysResourceConsumption: recentResources
        }
      }
    });
  } catch (error) {
    console.error('Controller: Error fetching restaurant summary:', error);
    res.status(500).json({ success: false, message: 'Server error fetching restaurant summary.', error: error.message });
  }
};


exports.validateQrContext = async (req, res, next) => {
  const { restaurantId, tableId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(tableId)) {
    return res.status(400).json({ success: false, message: 'Invalid Restaurant or Table ID format.' });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    return res.status(404).json({ success: false, message: 'Restaurant not found or is inactive.' });
  }

  const table = await Table.findOne({ _id: tableId, restaurantId });
  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found or not in this restaurant.' });
  }

  req.qrRestaurant = restaurant;
  req.qrTable = table;
  next();
};

exports.getPublicMenuItemsForQr = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.qrRestaurant._id, isActive: true }).sort({ category: 1, name: 1 });
    res.status(200).json({ success: true, data: menuItems, restaurantName: req.qrRestaurant.name, tableNumber: req.qrTable.tableNumber });
  } catch (error) {
    console.error('Controller: Error fetching public menu items:', error);
    res.status(500).json({ success: false, message: 'Server error fetching public menu items.', error: error.message });
  }
};

exports.createQrOrder = async (req, res) => {
  try {
    const { items, customerName, customerPhone, customerEmail, notes } = req.body;
    const restaurantId = req.qrRestaurant._id;
    const tableId = req.qrTable._id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required.' });
    }

    const populatedItems = [];
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findOne({ _id: item.menuItem, restaurantId, isActive: true });
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item with ID ${item.menuItem} not found or inactive.` });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Quantity for item ${menuItem.name} must be greater than 0.` });
      }
      populatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes,
        status: 'pending'
      });
      totalAmount += item.quantity * menuItem.price;
    }

    let customer = null;
    if (customerEmail || customerPhone) {
      customer = await RestaurantCustomer.findOneAndUpdate(
        { restaurantId, $or: [{ email: customerEmail }, { phone: customerPhone }] },
        { $set: { firstName: customerName?.split(' ')[0] || '', lastName: customerName?.split(' ')[1] || '', lastOrderAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const order = new Order({
      restaurantId,
      table: tableId,
      customer: customer ? customer._id : null,
      customerName, customerPhone, customerEmail,
      orderType: 'qr_code',
      items: populatedItems,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'unpaid_table',
      notes,
      servedBy: null,
    });
    await order.save();

    await Table.findOneAndUpdate({ _id: tableId, restaurantId }, { status: 'ordering', currentOrderId: order._id });

    res.status(201).json({ success: true, message: 'QR Code order placed successfully!', data: order });
  } catch (error) {
    console.error('Controller: Error creating QR order:', error);
    res.status(500).json({ success: false, message: 'Server error creating QR order.', error: error.message });
  }
};

exports.generateQrCodeLink = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({ success: false, message: 'Invalid Restaurant or Table ID format.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }

    const qrCodeBaseUrl = process.env.CLIENT_QR_ORDER_BASE_URL;
    if (!qrCodeBaseUrl) {
        return res.status(500).json({ success: false, message: 'CLIENT_QR_ORDER_BASE_URL not configured in environment variables.' });
    }

    const qrData = `${qrCodeBaseUrl}/${restaurantId}/${tableId}`;

    const qrCodeImage = await QRCode.toDataURL(qrData);

    res.status(200).json({
      success: true,
      message: 'QR Code generated.',
      qrCodeDataUrl: qrCodeImage,
      qrCodeLink: qrData,
      restaurantId,
      tableId,
    });

  } catch (error) {
    console.error('Controller: Error generating QR code link:', error);
    res.status(500).json({ success: false, message: 'Server error generating QR code link.', error: error.message });
  }
};

exports.createRestaurantCustomer = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { firstName, lastName, email, phone, loyaltyPoints, dietaryRestrictions, notes } = req.body;
    if (!firstName && !lastName && !email && !phone) {
      return res.status(400).json({ success: false, message: 'At least one of firstName, lastName, email, or phone is required.' });
    }

    let existingCustomer = null;
    if (email) existingCustomer = await RestaurantCustomer.findOne({ restaurantId, email });
    if (!existingCustomer && phone) existingCustomer = await RestaurantCustomer.findOne({ restaurantId, phone });

    if (existingCustomer) {
      return res.status(409).json({ success: false, message: 'Customer with this email or phone already exists in this restaurant.' });
    }

    const customer = new RestaurantCustomer({ restaurantId, firstName, lastName, email, phone, loyaltyPoints, dietaryRestrictions, notes });
    await customer.save();
    res.status(201).json({ success: true, message: 'Restaurant customer added successfully.', data: customer });
  } catch (error) {
    console.error('Controller: Error adding restaurant customer:', error);
    res.status(500).json({ success: false, message: 'Server error adding restaurant customer.', error: error.message });
  }
};

exports.getRestaurantCustomers = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { search, limit = 10, skip = 0 } = req.query;
    const query = { restaurantId };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, 'i': true } },
        { email: { $regex: search, 'i': true } },
        { phone: { $regex: search, 'i': true } },
      ];
    }
    const customers = await RestaurantCustomer.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ lastName: 1, firstName: 1 });
    const total = await RestaurantCustomer.countDocuments(query);
    res.status(200).json({ success: true, data: customers, total });
  } catch (error) {
    console.error('Controller: Error fetching restaurant customers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching restaurant customers.', error: error.message });
  }
};

exports.getRestaurantCustomerById = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const customer = await RestaurantCustomer.findOne({ _id: req.params.id, restaurantId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Restaurant customer not found.' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error('Controller: Error fetching restaurant customer by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching restaurant customer.', error: error.message });
  }
};

exports.updateRestaurantCustomer = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const { id } = req.params;
    const updateData = req.body;
    delete updateData.restaurantId;

    const customer = await RestaurantCustomer.findOneAndUpdate({ _id: id, restaurantId }, updateData, { new: true, runValidators: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Restaurant customer not found.' });
    }
    res.status(200).json({ success: true, message: 'Restaurant customer updated successfully.', data: customer });
  } catch (error) {
    console.error('Controller: Error updating restaurant customer:', error);
    res.status(500).json({ success: false, message: 'Server error updating restaurant customer.', error: error.message });
  }
};

exports.deleteRestaurantCustomer = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;
    const customer = await RestaurantCustomer.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Restaurant customer not found.' });
    }
    res.status(200).json({ success: true, message: 'Restaurant customer deleted successfully.' });
  } catch (error) {
    console.error('Controller: Error deleting restaurant customer:', error);
    res.status(500).json({ success: false, message: 'Server error deleting restaurant customer.', error: error.message });
  }
};