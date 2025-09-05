import axios from "axios";
import { toast } from "react-toastify"; // Ensure toast is imported for interceptors

const api = axios.create({
  // Use REACT_APP_API_URL which should be set to your deployed backend (e.g., https://your-backend.onrender.com/api)
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds timeout for requests
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for sending cookies/auth headers across domains
});

// Request Interceptor: Attach JWT token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // Forward request errors
  }
);

// Response Interceptor: Handle global errors and unauthorized responses
api.interceptors.response.use(
  (response) => {
    // If the responseType is 'blob' (e.g., for file downloads), return raw data
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    // For JSON responses, unwrap response.data directly
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
    
    // Handle 401 Unauthorized errors globally
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
        toast.error("Session expired. Please log in again.");
        localStorage.clear(); // Clear local storage on session expiry
        sessionStorage.clear(); // Clear session storage
        window.location.href = "/login"; // Redirect to login page
    } else {
        // Show other errors using react-toastify
        toast.error(errorMessage);
    }
    // Reject the promise to propagate the error down to the calling code
    return Promise.reject(new Error(errorMessage));
  }
);

// --- API Module Exports ---

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  signup: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivity: () => api.get("/dashboard/recent-activity"),
  getNotifications: () => api.get("/dashboard/notifications"), // Potentially redundant if notificationsAPI is used
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
  getStats: (params) => api.get("/inventory/stats", { params }), // Expects stats data
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
  generatePDF: (id) => api.get(`/purchase-orders/${id}/pdf`, {
    responseType: 'blob',
  }),
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
  getSites: (params) => api.get("/construction/sites", { params }),
  getSiteById: (id) => api.get(`/construction/sites/${id}`),
  createSite: (siteData) => api.post("/construction/sites", siteData),
  updateSite: (id, siteData) => api.put(`/construction/sites/${id}`, siteData),
  deleteSite: (id) => api.delete(`/construction/sites/${id}`),

  getEquipment: (params) => api.get("/construction/equipment", { params }),
  getEquipmentById: (id) => api.get(`/construction/equipment/${id}`),
  createEquipment: (equipmentData) => api.post("/construction/equipment", equipmentData),
  updateEquipment: (id, equipmentData) => api.put(`/construction/equipment/${id}`, equipmentData),
  deleteEquipment: (id) => api.delete(`/construction/equipment/${id}`),

  getStats: () => api.get("/construction/stats"),
};

export default api;