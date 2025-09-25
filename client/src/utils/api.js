import axios from "axios";
import { toast } from "react-toastify";

// ====================================================================
// 1. AXIOS INSTANCE CREATION & CONFIGURATION
// ====================================================================
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api/expenses/api",
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests if needed
});

// ====================================================================
// 2. REQUEST INTERCEPTOR
// ====================================================================
api.interceptors.request.use(
  (config) => {
    // Attach Bearer token if available
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add metadata for timing
    config.metadata = { startTime: new Date() };

    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || "");
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// ====================================================================
// 3. RESPONSE INTERCEPTOR
// ====================================================================
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, response.data);
    }

    // Return only data for convenience
    return response.data;
  },
  (error) => {
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;

    if (process.env.NODE_ENV === "development") {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, error.response?.data || error.message);
    }

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          if (window.location.pathname !== "/login") {
            toast.error("Session expired. Please log in again.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            window.location.href = "/login";
          }
          break;

        case 403:
          toast.error(data?.message || "Access Denied: You don't have permission.");
          break;

        case 404:
          toast.error(data?.message || "The requested resource was not found.");
          break;

        case 422:
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err) => toast.error(err.message));
          } else {
            toast.error(data?.message || "Validation Error");
          }
          break;

        case 500:
          toast.error(data?.message || "An unexpected server error occurred.");
          break;

        default:
          toast.error(data?.message || `An error occurred: ${status}`);
      }
    } else if (error.request) {
      // Request made but no response received
      toast.error("Network Error: Could not connect to the server.");
    } else {
      // Something else happened
      toast.error(error.message || "An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);

// ====================================================================
// 4. STRUCTURED API SERVICES
// ====================================================================

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
};

export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post("/users", userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  updateProfile: (userData) => api.put("/users/profile", userData),
  changePassword: (passwordData) => api.put("/users/change-password", passwordData),
};

export const inventoryAPI = {
  getAll: (params) => api.get("/inventory", { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (itemData) => api.post("/inventory", itemData),
  update: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  delete: (id) => api.delete(`/inventory/${id}`),

  getStats: () => api.get("/inventory/stats"),
  getLowStockItems: () => api.get("/inventory/alerts/low-stock"),

  getCategories: () => api.get("/inventory/categories"),
  getLocations: () => api.get("/inventory/locations"),
  getUnits: () => api.get("/inventory/units"),

  bulkUpdate: (updates) => api.put("/inventory/bulk-update", updates),
  bulkDelete: (ids) => api.post("/inventory/bulk-delete", { ids }),

  addStock: (id, quantity, reason, reference) =>
    api.post(`/inventory/${id}/add-stock`, { quantity, reason, reference }),
  removeStock: (id, quantity, reason, reference) =>
    api.post(`/inventory/${id}/remove-stock`, { quantity, reason, reference }),

  search: (query, filters) => api.get("/inventory/search", { params: { query, ...filters } }),
  export: (format, filters) => api.post("/inventory/export", { format, filters }),

  findByBarcode: (barcode) => api.get(`/inventory/barcode/${barcode}`),

  getMovementHistory: (itemId, params) => api.get(`/inventory/${itemId}/history`, { params }),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivity: () => api.get("/dashboard/recent-activity"),
  getNotifications: () => api.get("/dashboard/notifications"),
};

export const notificationsAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const analyticsAPI = {
  getDashboard: (params) => api.get("/analytics/dashboard", { params }),
  getModuleAnalytics: (moduleName, params) => api.get(`/analytics/module/${moduleName}`, { params }),
  generateReport: (reportData) => api.post("/analytics/reports/generate", reportData),
};

export default api;
