// client/src/services/api.js
import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://c-management-system.onrender.com/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    let errorMessage = "An unexpected error occurred.";
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } 
      else if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors.map(err => err.msg).join('; ');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (error.response?.status === 401 && typeof window !== 'undefined' && window.location.pathname !== "/login") {
      toast.error("Session expired. Please log in again.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    } else {
      toast.error(errorMessage);
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  signup: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivity: () => api.get("/dashboard/recent-activity"),
  getNotifications: () => api.get("/notifications"),
};

export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post("/users", userData),
  update: (id, userData) => api.patch(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

export const inventoryAPI = {
  getAll: (params) => api.get("/inventory", { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (itemData) => api.post("/inventory", itemData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, itemData) => api.patch(`/inventory/${id}`, itemData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/inventory/${id}`),
  getStats: (params) => api.get("/inventory/stats", { params }),
  exportInventory: (format, filters) => api.get(`/inventory/export/${format}`, { params: filters, responseType: 'blob' }),
  
  getDistinctUnits: () => api.get("/inventory/units"), 
  createUnit: (data) => api.post("/inventory/units", data),
  getCategories: () => api.get("/inventory/categories"),
  createCategory: (data) => api.post("/inventory/categories", data),
  getLocations: () => api.get("/inventory/locations"),
  createLocation: (data) => api.post("/inventory/locations", data),
};

export const metadataAPI = {
  getCategories: () => inventoryAPI.getCategories(),
  createCategory: (data) => inventoryAPI.createCategory(data),
  getLocations: () => inventoryAPI.getLocations(),
  createLocation: (data) => inventoryAPI.createLocation(data),
  getUnits: () => inventoryAPI.getUnits(),
  createUnit: (data) => inventoryAPI.createUnit(data),
};


export const supplierAPI = {
  getAll: (params) => api.get("/suppliers", { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (supplierData) => api.post("/suppliers", supplierData),
  update: (id, supplierData) => api.patch(`/suppliers/${id}`, supplierData),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const poAPI = {
  getAll: (params) => api.get("/purchase-orders", { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (poData) => api.post("/purchase-orders", poData),
  update: (id, poData) => api.put(`/purchase-orders/${id}`, poData),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  updateStatus: (id, status, receivedItems = null) => {
    const payload = { status };
    if (receivedItems) {
      payload.receivedItems = receivedItems;
    }
    return api.patch(`/purchase-orders/${id}/status`, payload);
  },
  generatePDF: (id) => api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' }),
};

export const notificationsAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const salesAPI = {
  getAll: (params) => api.get("/sales", { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (saleData) => api.post("/sales", saleData),
  processReturn: (id, returnData) => api.post(`/sales/${id}/return`, returnData),
  delete: (id) => api.delete(`/sales/${id}`),
  generatePDF: (id) => api.get(`/sales/${id}/pdf`, { responseType: 'blob' }),
  getAnalytics: (filters) => api.post("/sales/analytics", filters),
  recordPayment: (saleId, paymentData) => api.post(`/sales/${saleId}/record-payment`, paymentData),
  returnPackaging: (saleId, itemId, returnData) => api.post(`/sales/${saleId}/items/${itemId}/return-packaging`, returnData),
  getPackagingReport: (params) => api.get("/sales/packaging-report", { params }),
};

export const customerAPI = {
  getAll: () => api.get("/customers"),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post("/customers", customerData),
  recordPayment: (customerId, paymentData) => api.post(`/customers/${customerId}/payments`, paymentData),
};

export const reportsAPI = {
  getInventoryValuation: (filters) => api.post("/reports/inventory-valuation", filters),
  getSalesSummary: (filters) => api.post("/reports/sales-summary", filters),
  getComprehensiveReport: (filters) => api.post("/reports/comprehensive", filters),
  getProfitLossReport: (params) => api.get("/reports/profit-loss", { params }),
  getSustainabilityReports: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability-reports`, { params }),
};

export const expensesAPI = {
  getAll: (params) => api.get("/expenses", { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expenseData) => api.post("/expenses", expenseData),
  update: (id, expenseData) => api.patch(`/expenses/${id}`, expenseData),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const internalUseAPI = {
  getAll: (params) => api.get("/internal-use", { params }),
  getById: (id) => api.get(`/internal-use/${id}`),
  create: (useData) => api.post("/internal-use", useData),
  delete: (id) => api.delete(`/internal-use/${id}`),
  getTotalValue: (params) => api.get("/internal-use/total-value", { params }),
};

export const stockAdjustmentAPI = {
  getAll: (params) => api.get("/stock-adjustments", { params }),
  getById: (id) => api.get(`/stock-adjustments/${id}`),
  create: (adjustmentData) => api.post("/stock-adjustments", adjustmentData),
  delete: (id) => api.delete(`/stock-adjustments/${id}`),
  getTotalImpact: (params) => api.get("/stock-adjustments/total-impact", { params }), 
};

export const snapshotAPI = {
    getDailyStockSnapshots: (params) => api.get("/snapshots/daily-stock", { params }),
    generateSingleDailySnapshot: (data) => api.post("/snapshots/generate-one", data),
};

export const constructionAPI = {
  getSites: async (params) => await api.get('/construction/sites', { params }),
  getSiteById: async (id) => await api.get(`/construction/sites/${id}`),
  createSite: async (siteData) => await api.post('/construction/sites', siteData),
  updateSite: async (id, siteData) => await api.put(`/construction/sites/${id}`, siteData),
  deleteSite: async (id) => await api.delete(`/construction/sites/${id}`),

  getEquipment: async (params) => await api.get('/construction/equipment', { params }),
  getEquipmentById: async (id) => await api.get(`/construction/equipment/${id}`),
  createEquipment: async (equipmentData) => await api.post('/construction/equipment', equipmentData),
  updateEquipment: async (id, equipmentData) => await api.put(`/construction/equipment/${id}`, equipmentData),
  deleteEquipment: async (id) => await api.delete(`/construction/equipment/${id}`),

  getWorkers: async (params) => await api.get("/construction/workers", { params }),
  getWorkerById: async (id) => await api.get(`/construction/workers/${id}`),
  createWorker: async (workerData) => api.post("/construction/workers", workerData),
  updateWorker: async (id, workerData) => api.put(`/construction/workers/${id}`, workerData),
  deleteWorker: async (id) => api.delete(`/construction/workers/${id}`),

  getTasks: async (params) => await api.get('/construction/tasks', { params }),
  getTaskById: async (id) => await api.get(`/construction/tasks/${id}`),
  createTask: async (taskData) => api.post('/construction/tasks', taskData),
  updateTask: async (id, taskData) => api.put(`/construction/tasks/${id}`, taskData),
  deleteTask: async (id) => api.delete(`/construction/tasks/${id}`),

  getStats: async () => await api.get('/construction/stats'),

  createMilestone: async (siteId, milestoneData) => api.post(`/construction/sites/${siteId}/milestones`, milestoneData),
  updateMilestone: async (siteId, milestoneId, milestoneData) => api.put(`/construction/sites/${siteId}/milestones/${milestoneId}`, milestoneData),
  deleteMilestone: async (siteId, milestoneId) => api.delete(`/construction/sites/${siteId}/milestones/${milestoneId}`),

  createSiteMaterial: async (siteId, materialData) => api.post(`/construction/sites/${siteId}/material-inventory`, materialData),
  updateSiteMaterial: async (siteId, itemId, materialData) => api.put(`/construction/sites/${siteId}/material-inventory/${itemId}`, materialData),
  deleteSiteMaterial: async (siteId, itemId) => api.delete(`/construction/sites/${siteId}/material-inventory/${itemId}`),

  assignWorkerToSite: async (siteId, assignmentData) => api.post(`/construction/sites/${siteId}/assigned-workers`, assignmentData),
  updateSiteWorkerAssignment: async (siteId, assignmentId, assignmentData) => api.put(`/construction/sites/${siteId}/assigned-workers/${assignmentId}`, assignmentData),
  unassignWorkerFromSite: async (siteId, assignmentId) => api.delete(`/construction/sites/${siteId}/assigned-workers/${assignmentId}`),

  getChangeOrders: async (siteId, params) => api.get(`/construction/sites/${siteId}/change-orders`, { params }),
  createChangeOrder: async (siteId, changeOrderData) => api.post(`/construction/sites/${siteId}/change-orders`, changeOrderData),
  updateChangeOrder: async (siteId, changeOrderId, changeOrderData) => api.put(`/construction/sites/${siteId}/change-orders/${changeOrderId}`, changeOrderData),
  deleteChangeOrder: async (siteId, changeOrderId) => api.delete(`/construction/sites/${siteId}/change-orders/${changeOrderId}`),

  getMaterialRequests: async (siteId, params) => api.get(`/construction/sites/${siteId}/material-requests`, { params }),
  createMaterialRequest: async (siteId, requestData) => api.post(`/construction/sites/${siteId}/material-requests`, requestData),
  updateMaterialRequestStatus: async (siteId, requestId, status) => api.patch(`/construction/sites/${siteId}/material-requests/${requestId}/status`, { status }),
  deleteMaterialRequest: async (siteId, requestId) => api.delete(`/construction/sites/${siteId}/material-requests/${requestId}`),

  getPaymentRequests: async (siteId, params) => api.get(`/construction/sites/${siteId}/payment-requests`, { params }),
  createPaymentRequest: async (siteId, requestData) => api.post(`/construction/sites/${siteId}/payment-requests`, requestData),
  updatePaymentRequestStatus: async (siteId, requestId, status) => api.patch(`/construction/sites/${siteId}/payment-requests/${requestId}/status`, { status }),
  deletePaymentRequest: async (siteId, requestId) => api.delete(`/construction/sites/${siteId}/payment-requests/${requestId}`),

  uploadDocument: async (formData) => api.post('/construction/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: async (refModel, refId) => api.get(`/construction/documents/${refModel}/${refId}`),
  deleteDocument: async (documentId) => api.delete(`/construction/documents/${documentId}`),

  getCertifications: async (workerId, params) => api.get(`/construction/workers/${workerId}/certifications`, { params }),
  createCertification: async (workerId, certData) => api.post(`/construction/workers/${workerId}/certifications`, certData),
  updateCertification: async (workerId, certId, certData) => api.put(`/construction/workers/${workerId}/certifications/${certId}`, certData),
  deleteCertification: async (workerId, certId) => api.delete(`/construction/workers/${workerId}/certifications/${certId}`),

  getMaintenanceLogs: async (equipmentId, params) => api.get(`/construction/equipment/${equipmentId}/maintenance-logs`, { params }),
  createMaintenanceLog: async (equipmentId, logData) => api.post(`/construction/equipment/${equipmentId}/maintenance-logs`, logData),
  updateMaintenanceLog: async (equipmentId, logId, logData) => api.put(`/construction/equipment/${equipmentId}/maintenance-logs/${logId}`, logData),
  deleteMaintenanceLog: async (equipmentId, logId) => api.delete(`/construction/equipment/${equipmentId}/maintenance-logs/${logId}`),

  getTimesheets: async (workerId, params) => api.get(`/construction/workers/${workerId}/timesheets`, { params }),
  createTimesheet: async (workerId, timesheetData) => api.post(`/construction/workers/${workerId}/timesheets`, timesheetData),
  updateTimesheet: async (workerId, timesheetId, timesheetData) => api.put(`/construction/workers/${workerId}/timesheets/${timesheetId}`, timesheetData),
  updateTimesheetStatus: async (workerId, timesheetId, status) => api.patch(`/construction/workers/${workerId}/timesheets/${timesheetId}/status`, { status }),
  deleteTimesheet: async (workerId, timesheetId) => api.delete(`/construction/workers/${workerId}/timesheets/${timesheetId}`),

  getSafetyIncidents: async (siteId, params) => api.get(`/construction/sites/${siteId}/safety-incidents`, { params }),
  createSafetyIncident: async (siteId, incidentData) => api.post(`/construction/sites/${siteId}/safety-incidents`, incidentData),
  updateSafetyIncident: async (siteId, incidentId, incidentData) => api.put(`/construction/sites/${siteId}/safety-incidents/${incidentId}`, incidentData),
  deleteSafetyIncident: async (siteId, incidentId) => await api.delete(`/construction/sites/${siteId}/safety-incidents/${incidentId}`),

  getBudgetAnalytics: async (siteId) => api.get(`/construction/sites/${siteId}/budget-analytics`),
  generateReport: async (siteId, reportType) => await api.get(`/construction/sites/${siteId}/reports/${reportType}`, { responseType: 'blob' }),

};

export const staffAPI = {
  getStaff: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/staff`, { params }),
  getStaffMember: (restaurantId, staffId) => api.get(`/restaurant/${restaurantId}/staff/${staffId}`),
  createStaffMember: (restaurantId, staffData) => api.post(`/restaurant/${restaurantId}/staff`, staffData),
  updateStaffMember: (restaurantId, staffId, staffData) => api.put(`/restaurant/${restaurantId}/staff/${staffId}`, staffData),
  deleteStaffMember: (restaurantId, staffId) => api.delete(`/restaurant/${restaurantId}/staff/${staffId}`),
  clockIn: (restaurantId, staffId) => api.post(`/restaurant/${restaurantId}/staff/${staffId}/clock-in`),
  clockOut: (restaurantId, staffId) => api.post(`/restaurant/${restaurantId}/staff/${staffId}/clock-out`),
  getTimesheets: (restaurantId, staffId, params) => api.get(`/restaurant/${restaurantId}/staff/${staffId}/timesheets`, { params }),
  getRoles: (restaurantId) => api.get(`/restaurant/${restaurantId}/roles`),
  updateStaffRole: (restaurantId, staffId, roleId) => api.patch(`/restaurant/${restaurantId}/staff/${staffId}/role`, { roleId }),
};

export const scheduleAPI = {
  getSchedules: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/schedules`, { params }),
  getScheduleById: (restaurantId, scheduleId) => api.get(`/restaurant/${restaurantId}/schedules/${scheduleId}`),
  createSchedule: (restaurantId, scheduleData) => api.post(`/restaurant/${restaurantId}/schedules`, scheduleData),
  updateSchedule: (restaurantId, scheduleId, scheduleData) => api.put(`/restaurant/${restaurantId}/schedules/${scheduleId}`, scheduleData),
  deleteSchedule: (restaurantId, scheduleId) => api.delete(`/restaurant/${restaurantId}/schedules/${scheduleId}`),
  getDemandForecast: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/schedules/demand-forecast`, { params }),
};

export const feedbackAPI = {
  submitFeedback: (restaurantId, feedbackData) => api.post(`/restaurant/${restaurantId}/feedback`, feedbackData),
  getRestaurantFeedback: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/feedback`, { params }),
  getFeedbackById: (restaurantId, feedbackId) => api.get(`/restaurant/${restaurantId}/feedback/${feedbackId}`),
  updateFeedbackStatus: (restaurantId, feedbackId, status) => api.patch(`/restaurant/${restaurantId}/feedback/${feedbackId}/status`, { status }),
  deleteFeedback: (restaurantId, feedbackId) => api.delete(`/restaurant/${restaurantId}/feedback/${feedbackId}`),
};

// **THIS IS THE DEFINITIVE restaurantAPI**
// It's exported directly here, no const then export below
export const restaurantAPI = {
  // Public QR Code Endpoints
  getPublicMenuItems: (restaurantId, tableId) => api.get(`/restaurant/public/${restaurantId}/${tableId}/menu`),
  createQrOrder: (restaurantId, tableId, orderData) => api.post(`/restaurant/public/${restaurantId}/${tableId}/order`, orderData),
  submitPublicFeedback: (restaurantId, feedbackData) => api.post(`/restaurant/public/${restaurantId}/feedback`, feedbackData),

  // Method for a user to auto-create THEIR first default restaurant
  autoCreateMyRestaurant: () => api.post('/restaurant/auto-create-my-restaurant'),

  // Restaurant Management
  createRestaurant: (restaurantData) => api.post('/restaurant/admin/restaurants', restaurantData),
  getRestaurants: () => api.get('/restaurant/admin/restaurants'),
  getRestaurantById: (restaurantId) => api.get(`/restaurant/${restaurantId}`),
  updateRestaurant: (id, restaurantData) => api.put(`/restaurant/${id}`, restaurantData),
  deleteRestaurant: (id) => api.delete(`/restaurant/${id}`),
  
  // Menu Item Management
  createMenuItem: (restaurantId, itemData) => api.post(`/restaurant/${restaurantId}/menu-items`, itemData),
  getMenuItems: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/menu-items`, { params }),
  getMenuItemById: (restaurantId, id) => api.get(`/restaurant/${restaurantId}/menu-items/${id}`),
  updateMenuItem: (restaurantId, id, itemData) => api.put(`/restaurant/${restaurantId}/menu-items/${id}`, itemData),
  deleteMenuItem: (restaurantId, id) => api.delete(`/restaurant/${restaurantId}/menu-items/${id}`),

  // Table Management
  createTable: (restaurantId, tableData) => api.post(`/restaurant/${restaurantId}/tables`, tableData),
  getTables: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/tables`, { params }),
  getTableById: (restaurantId, id) => api.get(`/restaurant/${restaurantId}/tables/${id}`),
  updateTable: (restaurantId, id, tableData) => api.put(`/restaurant/${restaurantId}/tables/${id}`, tableData),
  deleteTable: (restaurantId, id) => api.delete(`/restaurant/${restaurantId}/tables/${id}`),
  generateQrCodeLink: (restaurantId, tableId) => api.post(`/restaurant/${restaurantId}/tables/${tableId}/qrcode`),

  // Order Management (POS & General)
  createOrder: (restaurantId, orderData) => api.post(`/restaurant/${restaurantId}/orders`, orderData),
  getOrders: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/orders`, { params }),
  getOrderById: (restaurantId, id) => api.get(`/restaurant/${restaurantId}/orders/${id}`),
  updateOrder: (restaurantId, id, orderData) => api.put(`/restaurant/${restaurantId}/orders/${id}`, orderData),
  processPayment: (restaurantId, id, paymentData) => api.post(`/restaurant/${restaurantId}/orders/${id}/payment`, paymentData),
  
  // KDS (Kitchen Display System) Management
  getKdsOrders: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/kds/orders`, { params }),
  updateKdsOrderItemStatus: (restaurantId, orderId, itemId, statusData) => api.put(`/restaurant/${restaurantId}/kds/orders/${orderId}/items/${itemId}/status`, statusData),

  // Restaurant Customer Management
  createRestaurantCustomer: (restaurantId, customerData) => api.post(`/restaurant/${restaurantId}/customers`, customerData),
  getRestaurantCustomers: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/customers`, { params }),
  getRestaurantCustomerById: (restaurantId, id) => api.get(`/restaurant/${restaurantId}/customers/${id}`),
  updateRestaurantCustomer: (restaurantId, id, customerData) => api.put(`/restaurant/${restaurantId}/customers/${id}`, customerData),
  deleteRestaurantCustomer: (restaurantId, id) => api.delete(`/restaurant/${restaurantId}/customers/${id}`),
  
  // Circular Economy & Sustainability Management
  logWaste: (restaurantId, logData) => api.post(`/restaurant/${restaurantId}/sustainability/waste-logs`, logData),
  getWasteLogs: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/waste-logs`, { params }),
  getWasteReports: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/waste-reports`, { params }),

  logResourceConsumption: (restaurantId, logData) => api.post(`/restaurant/${restaurantId}/sustainability/resource-logs`, logData),
  getResourceLogs: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/resource-logs`, { params }),
  getResourceReports: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/resource-reports`, { params }),

  logSustainableSourcing: (restaurantId, logData) => api.post(`/restaurant/${restaurantId}/sustainability/sourcing-logs`, logData),
  getSustainableSourcingLogs: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/sourcing-logs`, { params }),
  getSustainableSourcingReports: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/sourcing-reports`, { params }),

  logReusableContainer: (restaurantId, logData) => api.post(`/restaurant/${restaurantId}/sustainability/reusable-containers`, logData),
  getReusableContainerLogs: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/reusable-containers`, { params }),
  
  logUpcycling: (restaurantId, logData) => api.post(`/restaurant/${restaurantId}/sustainability/upcycling-logs`, logData),
  getUpcyclingLogs: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/upcycling-logs`, { params }),

  getSustainabilitySummary: (restaurantId, params) => api.get(`/restaurant/${restaurantId}/sustainability/summary`, { params }),

  getRestaurantSummary: (restaurantId) => api.get(`/restaurant/${restaurantId}/summary`),
};

// --- These APIs are defined as `export const` already above, so no need to list them here again. ---
// This ensures restaurantAPI is only defined and exported once.

export default api;