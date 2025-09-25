// client/src/services/api.js
import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api/expenses/api",
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
    const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
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
  getNotifications: () => api.get("/dashboard/notifications"),
};

export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post("/users", userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

export const inventoryAPI = {
  getAll: (params) => api.get("/inventory", { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (itemData) => api.post("/inventory", itemData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, itemData) => api.put(`/inventory/${id}`, itemData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/inventory/${id}`),
  getStats: (params) => api.get("/inventory/stats", { params }),
  exportInventory: (format, filters) => api.get(`/inventory/export/${format}`, { params: filters, responseType: 'blob' }),
  getDistinctUnits: () => api.get("/inventory/units"),
};

export const metadataAPI = {
  getCategories: () => api.get("/metadata/categories"),
  getLocations: () => api.get("/metadata/locations"),
  createCategory: (data) => api.post("/metadata/categories", data),
  createLocation: (data) => api.post("/metadata/locations", data),
  createUnit: (data) => api.post("/metadata/units", data),
};

export const supplierAPI = {
  getAll: (params) => api.get("/suppliers", { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (supplierData) => api.post("/suppliers", supplierData),
  update: (id, supplierData) => api.put(`/suppliers/${id}`, supplierData),
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
};

export const customerAPI = {
  getAll: () => api.get("/customers"),
  create: (customerData) => api.post("/customers", customerData),
};

export const reportsAPI = {
  getInventoryValuation: (filters) => api.post("/reports/inventory-valuation", filters),
  getSalesSummary: (filters) => api.post("/reports/sales-summary", filters),
  getComprehensiveReport: (filters) => api.post("/reports/comprehensive", filters),
};

// --- CONSTRUCTION MODULE API (UPDATED AND EXTENDED) ---
export const constructionAPI = {
  // Sites
  getSites: async (params) => await api.get('/construction/sites', { params }),
  getSiteById: async (id) => await api.get(`/construction/sites/${id}`),
  createSite: async (siteData) => await api.post('/construction/sites', siteData),
  updateSite: async (id, siteData) => await api.put(`/construction/sites/${id}`, siteData),
  deleteSite: async (id) => await api.delete(`/construction/sites/${id}`),

  // Equipment
  getEquipment: async (params) => await api.get('/construction/equipment', { params }),
  getEquipmentById: async (id) => await api.get(`/construction/equipment/${id}`),
  createEquipment: async (equipmentData) => await api.post('/construction/equipment', equipmentData),
  updateEquipment: async (id, equipmentData) => await api.put(`/construction/equipment/${id}`, equipmentData),
  deleteEquipment: async (id) => await api.delete(`/construction/equipment/${id}`),

  // Workers
  getWorkers: async (params) => await api.get("/construction/workers", { params }),
  getWorkerById: async (id) => await api.get(`/construction/workers/${id}`),
  createWorker: async (workerData) => await api.post("/construction/workers", workerData),
  updateWorker: async (id, workerData) => await api.put(`/construction/workers/${id}`, workerData),
  deleteWorker: async (id) => await api.delete(`/construction/workers/${id}`),

  // Tasks
  getTasks: async (params) => await api.get('/construction/tasks', { params }),
  getTaskById: async (id) => await api.get(`/construction/tasks/${id}`),
  createTask: async (taskData) => await api.post('/construction/tasks', taskData),
  updateTask: async (id, taskData) => await api.put(`/construction/tasks/${id}`, taskData),
  deleteTask: async (id) => await api.delete(`/construction/tasks/${id}`),

  // General Stats
  getStats: async () => await api.get('/construction/stats'),

  // Milestones (embedded in Site)
  createMilestone: async (siteId, milestoneData) => await api.post(`/construction/sites/${siteId}/milestones`, milestoneData),
  updateMilestone: async (siteId, milestoneId, milestoneData) => await api.put(`/construction/sites/${siteId}/milestones/${milestoneId}`, milestoneData),
  deleteMilestone: async (siteId, milestoneId) => await api.delete(`/construction/sites/${siteId}/milestones/${milestoneId}`),

  // Site Material Inventory (embedded in Site)
  createSiteMaterial: async (siteId, materialData) => await api.post(`/construction/sites/${siteId}/material-inventory`, materialData),
  updateSiteMaterial: async (siteId, itemId, materialData) => await api.put(`/construction/sites/${siteId}/material-inventory/${itemId}`, materialData),
  deleteSiteMaterial: async (siteId, itemId) => await api.delete(`/construction/sites/${siteId}/material-inventory/${itemId}`),

  // Assigned Workers to Site (embedded in Site)
  assignWorkerToSite: async (siteId, assignmentData) => await api.post(`/construction/sites/${siteId}/assigned-workers`, assignmentData),
  updateSiteWorkerAssignment: async (siteId, assignmentId, assignmentData) => await api.put(`/construction/sites/${siteId}/assigned-workers/${assignmentId}`, assignmentData),
  unassignWorkerFromSite: async (siteId, assignmentId) => await api.delete(`/construction/sites/${siteId}/assigned-workers/${assignmentId}`),

  // Change Orders
  getChangeOrders: async (siteId, params) => await api.get(`/construction/sites/${siteId}/change-orders`, { params }),
  createChangeOrder: async (siteId, changeOrderData) => await api.post(`/construction/sites/${siteId}/change-orders`, changeOrderData),
  updateChangeOrder: async (siteId, changeOrderId, changeOrderData) => await api.put(`/construction/sites/${siteId}/change-orders/${changeOrderId}`, changeOrderData),
  deleteChangeOrder: async (siteId, changeOrderId) => await api.delete(`/construction/sites/${siteId}/change-orders/${changeOrderId}`),

  // Material Requests
  getMaterialRequests: async (siteId, params) => await api.get(`/construction/sites/${siteId}/material-requests`, { params }),
  createMaterialRequest: async (siteId, requestData) => await api.post(`/construction/sites/${siteId}/material-requests`, requestData),
  updateMaterialRequestStatus: async (siteId, requestId, status) => await api.patch(`/construction/sites/${siteId}/material-requests/${requestId}/status`, { status }),
  deleteMaterialRequest: async (siteId, requestId) => await api.delete(`/construction/sites/${siteId}/material-requests/${requestId}`),

  // Payment Requests
  getPaymentRequests: async (siteId, params) => await api.get(`/construction/sites/${siteId}/payment-requests`, { params }),
  createPaymentRequest: async (siteId, requestData) => await api.post(`/construction/sites/${siteId}/payment-requests`, requestData),
  updatePaymentRequestStatus: async (siteId, requestId, status) => await api.patch(`/construction/sites/${siteId}/payment-requests/${requestId}/status`, { status }),
  deletePaymentRequest: async (siteId, requestId) => await api.delete(`/construction/sites/${siteId}/payment-requests/${requestId}`),

  // Documents
  uploadDocument: async (formData) => await api.post('/construction/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: async (refModel, refId) => await api.get(`/construction/documents/${refModel}/${refId}`),
  deleteDocument: async (documentId) => await api.delete(`/construction/documents/${documentId}`),

  // Certifications
  getCertifications: async (workerId, params) => await api.get(`/construction/workers/${workerId}/certifications`, { params }),
  createCertification: async (workerId, certData) => await api.post(`/construction/workers/${workerId}/certifications`, certData),
  updateCertification: async (workerId, certId, certData) => await api.put(`/construction/workers/${workerId}/certifications/${certId}`, certData),
  deleteCertification: async (workerId, certId) => await api.delete(`/construction/workers/${workerId}/certifications/${certId}`),

  // Maintenance Logs
  getMaintenanceLogs: async (equipmentId, params) => await api.get(`/construction/equipment/${equipmentId}/maintenance-logs`, { params }),
  createMaintenanceLog: async (equipmentId, logData) => await api.post(`/construction/equipment/${equipmentId}/maintenance-logs`, logData),
  updateMaintenanceLog: async (equipmentId, logId, logData) => await api.put(`/construction/equipment/${equipmentId}/maintenance-logs/${logId}`, logData),
  deleteMaintenanceLog: async (equipmentId, logId) => await api.delete(`/construction/equipment/${equipmentId}/maintenance-logs/${logId}`),

  // Timesheets
  getTimesheets: async (workerId, params) => await api.get(`/construction/workers/${workerId}/timesheets`, { params }),
  createTimesheet: async (workerId, timesheetData) => await api.post(`/construction/workers/${workerId}/timesheets`, timesheetData),
  updateTimesheet: async (workerId, timesheetId, timesheetData) => await api.put(`/construction/workers/${workerId}/timesheets/${timesheetId}`, timesheetData),
  updateTimesheetStatus: async (workerId, timesheetId, status) => await api.patch(`/construction/workers/${workerId}/timesheets/${timesheetId}/status`, { status }),
  deleteTimesheet: async (workerId, timesheetId) => await api.delete(`/construction/workers/${workerId}/timesheets/${timesheetId}`),

  // Safety Incidents
  getSafetyIncidents: async (siteId, params) => await api.get(`/construction/sites/${siteId}/safety-incidents`, { params }),
  createSafetyIncident: async (siteId, incidentData) => await api.post(`/construction/sites/${siteId}/safety-incidents`, incidentData),
  updateSafetyIncident: async (siteId, incidentId, incidentData) => await api.put(`/construction/sites/${siteId}/safety-incidents/${incidentId}`, incidentData),
  deleteSafetyIncident: async (siteId, incidentId) => await api.delete(`/construction/sites/${siteId}/safety-incidents/${incidentId}`),

  // Reports & Analytics
  getBudgetAnalytics: async (siteId) => await api.get(`/construction/sites/${siteId}/budget-analytics`),
  generateReport: async (siteId, reportType) => await api.get(`/construction/sites/${siteId}/reports/${reportType}`, { responseType: 'blob' }),

};

export const expensesAPI = {
  getAll: (params) => api.get("/expenses", { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expenseData) => api.post("/expenses", expenseData),
  update: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  delete: (id) => api.delete(`/expenses/${id}`),
};
export default api;
