"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { inventoryAPI, metadataAPI } from "../services/api"; 
import { useNotifications } from "../contexts/NotificationContext"; // Assuming useNotifications provides a showToast

export const useInventory = (initialParams = {}) => {
  const [inventory, setInventory] = useState([]);
  
  const [stats, setStats] = useState({ 
      totalItems: 0, 
      totalValue: 0, // Total Retail Value
      totalCostValue: 0, // NEW: Total Cost Value
      lowStockCount: 0, 
      outOfStockCount: 0, 
      onOrderCount: 0 
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(initialParams);
  
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  
  const { showToast } = useNotifications(); // Destructure showToast

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = { ...filters, page: pagination.page, limit: pagination.limit };
      const response = await inventoryAPI.getAll(queryParams);
      setInventory(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Could not fetch inventory data.");
      showToast(err.response?.data?.message || "Could not fetch inventory data.", "error"); // Show toast
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, showToast]);

  const fetchDashboardStats = useCallback(async () => {
    try {
        const response = await inventoryAPI.getStats(); // No params needed for general stats
        if(response.success) {
            setStats({
                totalItems: response.data.totalItems || 0,
                totalValue: response.data.totalValue || 0, // Retail value
                totalCostValue: response.data.totalCostValue || 0, // Cost value
                lowStockCount: response.data.lowStockCount || 0,
                outOfStockCount: response.data.outOfStockCount || 0,
                onOrderCount: response.data.onOrderCount || 0,
            });
        } else {
             console.error("Failed to fetch dashboard stats", response.message);
        }
    } catch (err) {
        console.error("Error fetching dashboard stats", err);
        showToast("Failed to fetch dashboard stats.", "error"); // Show toast
    }
  }, [showToast]);

  const refreshData = useCallback(() => {
    fetchInventory();
    fetchDashboardStats();
  }, [fetchInventory, fetchDashboardStats]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [categoriesRes, locationsRes, unitsRes] = await Promise.all([
        metadataAPI.getCategories(),
        metadataAPI.getLocations(),
        inventoryAPI.getDistinctUnits(),
      ]);
      setCategories(categoriesRes.data || []);
      setLocations(locationsRes.data || []);
      setUnits(unitsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
      showToast("Could not load form options.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    fetchMetadata();
    fetchDashboardStats(); // Ensure stats are fetched on initial load too
  }, [fetchMetadata, fetchDashboardStats]);

  const updateFilters = useCallback((newFilters) => {
    setPagination(p => ({ ...p, page: 1 }));
    setFilters(newFilters);
  }, []);

  const changePage = useCallback((page) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination(p => ({ ...p, page }));
    }
  }, [pagination.totalPages]);
  
  const crudAction = useCallback(async (action, successMessage) => {
    setLoading(true); // Set loading for CRUD actions
    try {
      const response = await action();
      if(response.success) { // Assuming all API calls return { success: true, ... }
        showToast(successMessage, "success");
        await refreshData();
        await fetchMetadata();
        return true;
      } else {
        showToast(response.message || "Action failed.", "error");
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
      showToast(err.response?.data?.message || "Action failed.", "error"); // The interceptor handles toast, but this catches if response.success is false or other issues.
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshData, fetchMetadata]);

  // Pass payload directly as required by inventoryAPI
  const addItem = (payload) => crudAction(() => inventoryAPI.create(payload), "Item added successfully!");
  const updateItem = (id, payload) => crudAction(() => inventoryAPI.update(id, payload), "Item updated successfully!");
  const deleteItem = (id) => crudAction(() => inventoryAPI.delete(id), "Item deleted successfully!");
  
  // For metadata creation, ensure `name` is properly formatted (e.g., { name: "New Category" })
  const createCategory = (name) => crudAction(() => metadataAPI.createCategory({ name }), `Category "${name}" created!`);
  const createLocation = (name) => crudAction(() => metadataAPI.createLocation({ name }), `Location "${name}" created!`);
  const createUnit = (name) => crudAction(() => metadataAPI.createUnit({ name }), `Unit "${name}" created!`); // Assuming metadataAPI.createUnit accepts { name: "..." }
  
  return {
    inventory,
    stats,
    pagination,
    categories,
    locations,
    units,
    loading,
    error,
    filters,
    addItem,
    updateItem,
    deleteItem,
    createCategory,
    createLocation,
    createUnit,
    changePage,
    updateFilters,
    refreshData,
  };
};