// client/src/services/api.js
import axios from "axios";
import { toast } from "react-hot-toast"; // Changed to react-hot-toast for consistency

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
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
  createWorker: async (workerData) => await api.post("/construction/workers", workerData),
  updateWorker: async (id, workerData) => await api.put(`/construction/workers/${id}`, workerData),
  deleteWorker: async (id) => await api.delete(`/construction/workers/${id}`),

  getStats: async () => await api.get('/construction/stats'),

  getTasks: async (params) => await api.get('/construction/tasks', { params }),
  getTaskById: async (id) => await api.get(`/construction/tasks/${id}`),
  createTask: async (taskData) => await api.post('/construction/tasks', taskData),
  updateTask: async (id, taskData) => await api.put(`/construction/tasks/${id}`, taskData),
  deleteTask: async (id) => await api.delete(`/construction/tasks/${id}`),

  getMilestones: async (siteId) => await api.get(`/construction/sites/${siteId}/milestones`),
  createMilestone: async (siteId, milestoneData) => await api.post(`/construction/sites/${siteId}/milestones`, milestoneData),

  getChangeOrders: async (siteId) => await api.get(`/construction/sites/${siteId}/change-orders`),
  createChangeOrder: async (siteId, changeOrderData) => await api.post(`/construction/sites/${siteId}/change-orders`, changeOrderData),

  getMaterialInventory: async (siteId) => await api.get(`/construction/sites/${siteId}/inventory`),
  updateMaterialInventory: async (siteId, materialId, quantity) => await api.patch(`/construction/sites/${siteId}/inventory/${materialId}`, { quantity }),

  getBudgetAnalytics: async (siteId) => await api.get(`/construction/sites/${siteId}/budget-analytics`),
  generateFinancialReport: async (siteId, reportType) => await api.get(`/construction/sites/${siteId}/reports/${reportType}`, { responseType: 'blob' }),

  assignWorker: async (siteId, workerId, assignmentData) => await api.post(`/construction/sites/${siteId}/workers/${workerId}`, assignmentData),
  getWorkerAssignments: async (siteId) => await api.get(`/construction/sites/${siteId}/workers`),
};

export default api;