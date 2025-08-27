import axios from "axios";
import { toast } from "react-toastify";

// ====================================================================
// 1. AXIOS INSTANCE CREATION & CONFIGURATION
// ====================================================================
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for sessions/cookies
});

// Request interceptor (no changes)
api.interceptors.request.use(
  (config) => {
    // Add auth token to every request if it exists
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (no changes)
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || "An unexpected error occurred.";
      switch (status) {
        case 401:
          if (window.location.pathname !== "/login") {
            toast.error("Session expired. Please log in again.");
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login";
          }
          break;
        case 403:
        case 404:
        case 500:
          toast.error(errorMessage);
          break;
        case 400: // For express-validator errors
        case 422: // For other validation libraries
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err) => toast.error(err.msg || err.message));
          } else {
            toast.error(errorMessage);
          }
          break;
        default:
          toast.error(errorMessage);
      }
    } else if (error.request) {
      toast.error("Network Error: Could not connect to the server.");
    } else {
      toast.error(error.message || "An unexpected error occurred.");
    }
    return Promise.reject(error);
  }
);

// --- API Service Definitions ---

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
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
  // --- Core Inventory CRUD ---
  getAll: (params) => api.get("/inventory", { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (itemData) => {
    return api.post("/inventory", itemData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, itemData) => {
    return api.put(`/inventory/${id}`, itemData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/inventory/${id}`),

  // --- Stats, Alerts, & History ---
  getStats: (params) => api.get("/inventory/stats", { params }),
  getMovementHistory: (itemId, params) => api.get(`/inventory/${itemId}/history`, { params }),
  
  // --- FIX: ADDED MISSING FUNCTION TO FIX THE TypeError ---
  // The useInventory hook was calling this, but it was not defined.
  getDistinctUnits: () => api.get("/inventory/units"),
};

export const metadataAPI = {
  getCategories: () => api.get("/inventory/categories"),
  getLocations: () => api.get("/inventory/locations"),
  // The getUnits call seems to have moved to inventoryAPI.getDistinctUnits
  createCategory: (data) => api.post("/inventory/categories", data),
  createLocation: (data) => api.post("/inventory/locations", data),
};

export const notificationsAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ... other API objects ...

export default api;