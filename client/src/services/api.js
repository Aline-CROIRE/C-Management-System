import axios from "axios";
import { toast } from "react-toastify"; // Note: your useConstructionManagement uses 'react-hot-toast' but api.js uses 'react-toastify'. Ensure consistency if needed.

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
    // This interceptor already unwraps the axios response,
    // so 'response.data' here is the actual JSON object from your backend.
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      toast.error("Session expired. Please log in again.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    } else {
      toast.error(errorMessage);
    }
    // Crucially, reject with a new Error containing the message,
    // so the catch blocks in useConstructionManagement can access err.message
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
  getSites: async (params) => {
    const fullResponse = await api.get('/construction/sites', { params });
    console.log("Sites Full API Response:", fullResponse); // Log the full object for debugging
    return fullResponse; // RETURN THE FULL OBJECT
  },
  getSiteById: async (id) => {
    const fullResponse = await api.get(`/construction/sites/${id}`);
    console.log("Site Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  createSite: async (siteData) => {
    const fullResponse = await api.post('/construction/sites', siteData);
    console.log("Create Site Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  updateSite: async (id, siteData) => {
    const fullResponse = await api.put(`/construction/sites/${id}`, siteData);
    console.log("Update Site Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  deleteSite: async (id) => {
    const fullResponse = await api.delete(`/construction/sites/${id}`);
    console.log("Delete Site Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },

  getEquipment: async (params) => {
    const fullResponse = await api.get('/construction/equipment', { params });
    console.log("Equipment Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  getEquipmentById: async (id) => {
    const fullResponse = await api.get(`/construction/equipment/${id}`);
    console.log("Equipment by ID Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  createEquipment: async (equipmentData) => {
    const fullResponse = await api.post('/construction/equipment', equipmentData);
    console.log("Create Equipment Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  updateEquipment: async (id, equipmentData) => {
    const fullResponse = await api.put(`/construction/equipment/${id}`, equipmentData);
    console.log("Update Equipment Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  deleteEquipment: async (id) => {
    const fullResponse = await api.delete(`/construction/equipment/${id}`);
    console.log("Delete Equipment Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },

  getStats: async () => {
    const fullResponse = await api.get('/construction/stats');
    console.log("Stats Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },

  getTasks: async (params) => {
    const fullResponse = await api.get('/construction/tasks', { params });
    console.log("Tasks Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  getTaskById: async (id) => {
    const fullResponse = await api.get(`/construction/tasks/${id}`);
    console.log("Task by ID Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  createTask: async (taskData) => {
    const fullResponse = await api.post('/construction/tasks', taskData);
    console.log("Create Task Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  updateTask: async (id, taskData) => {
    const fullResponse = await api.put(`/construction/tasks/${id}`, taskData);
    console.log("Update Task Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
  deleteTask: async (id) => {
    const fullResponse = await api.delete(`/construction/tasks/${id}`);
    console.log("Delete Task Full API Response:", fullResponse);
    return fullResponse; // RETURN THE FULL OBJECT
  },
};

export default api;