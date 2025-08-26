import axios from "axios";
import { toast } from "react-toastify";

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
        case 400:
        case 422:
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


export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  signup: (userData) => api.post("/auth/register", userData),
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
  getAll: (params) => api.get("/inventory", { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (itemData) => api.post("/inventory", itemData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, itemData) => api.put(`/inventory/${id}`, itemData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/inventory/${id}`),
  getStats: (params) => api.get("/inventory/stats", { params }),
  getMovementHistory: (itemId, params) => api.get(`/inventory/${itemId}/history`, { params }),

  getDistinctUnits: () => api.get("/inventory/units"),
};

export const metadataAPI = {
  getCategories: () => api.get("/inventory/categories"),
  getLocations: () => api.get("/inventory/locations"),

  getCategories: () => api.get("/inventory/categories"),
  getLocations: () => api.get("/inventory/locations"),
  getUnits: () => api.get("/inventory/units"),

  createCategory: (data) => api.post("/inventory/categories", data),
  createLocation: (data) => api.post("/inventory/locations", data),
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
};

export const notificationsAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;