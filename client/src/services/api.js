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

// ====================================================================
// 2. REQUEST INTERCEPTOR
// ====================================================================
api.interceptors.request.use(
  (config) => {
    // Add auth token to every request if it exists
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: new Date() };
    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
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
    const duration = new Date() - response.config.metadata.startTime;
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, response.data);
    }
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
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login";
          }
          break;
        case 403:
          toast.error(data?.message || "Access Denied: You don't have permission.");
          break;
        case 404:
          toast.error(data?.message || "The requested resource was not found.");
          break;
        case 400: // For express-validator errors
        case 422: // For other validation libraries
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err) => toast.error(err.msg || err.message));
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
      toast.error("Network Error: Could not connect to the server.");
    } else {
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

  // --- Metadata / Dropdown Options ---
  // FIX: The paths now correctly include the '/inventory' prefix to match your backend router.
  getCategories: () => api.get("/inventory/categories"),
  getLocations: () => api.get("/inventory/locations"),
  getUnits: () => api.get("/inventory/units"),

  // FIX: These methods also need the '/inventory' prefix.
  // This assumes you will add POST routes to `/inventory/categories` and `/inventory/locations`
  // on your backend to handle the creation.
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