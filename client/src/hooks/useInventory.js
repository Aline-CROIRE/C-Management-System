"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
// Import both the inventory and metadata API services
import { inventoryAPI, metadataAPI } from "../services/api"; 
import { useNotifications } from "../contexts/NotificationContext";

export const useInventory = (initialParams = {}) => {
  // State for the visible, paginated list of inventory items
  const [inventory, setInventory] = useState([]);
  
  // State for the overall dashboard statistics (total items, total value, etc.)
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0, onOrderCount: 0 });
  
  // General state for loading, errors, and UI controls
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(initialParams);
  
  // State for dropdown options
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  
  const { showToast } = useNotifications();

  // --- Core Data Fetching ---

  // Fetches only the filtered, paginated list of items for the table
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
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Fetches the high-level statistics for the dashboard cards
  const fetchDashboardStats = useCallback(async () => {
    try {
        const response = await inventoryAPI.getStats();
        if(response.success) setStats(response.data);
    } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
    }
  }, []);

  // A combined refresh function to update everything at once
  const refreshData = useCallback(() => {
    fetchInventory();
    fetchDashboardStats();
  }, [fetchInventory, fetchDashboardStats]);

  // This useEffect triggers a data refetch whenever filters or page change
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]); // fetchInventory is memoized and contains filters/pagination as dependencies

  // Fetches all metadata needed for form dropdowns
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
    fetchDashboardStats();
  }, [fetchMetadata, fetchDashboardStats]);

  // --- UI State Management Functions ---

  const updateFilters = useCallback((newFilters) => {
    setPagination(p => ({ ...p, page: 1 }));
    setFilters(newFilters);
  }, []);

  const changePage = useCallback((page) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination(p => ({ ...p, page }));
    }
  }, [pagination.totalPages]);
  
  // --- CRUD Functions ---

  const crudAction = useCallback(async (action, successMessage) => {
    setLoading(true);
    try {
      await action();
      showToast(successMessage, "success");
      await refreshData(); // Refresh both inventory list and stats
      await fetchMetadata(); // Refresh dropdowns in case of new category/location/unit
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
      return false; // The API interceptor will show the error toast
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshData, fetchMetadata]);

  const addItem = (payload) => crudAction(() => inventoryAPI.create(payload.itemData), "Item added successfully!");
  const updateItem = (id, payload) => crudAction(() => inventoryAPI.update(id, payload.itemData), "Item updated successfully!");
  const deleteItem = (id) => crudAction(() => inventoryAPI.delete(id), "Item deleted successfully!");
  
  const createCategory = (name) => crudAction(() => metadataAPI.createCategory(name), `Category "${name.name}" created!`);
  const createLocation = (name) => crudAction(() => metadataAPI.createLocation(name), `Location "${name.name}" created!`);
  const createUnit = (name) => crudAction(() => {
    // This assumes you have a POST /api/metadata/units route
    // If not, it will be caught by the catch block.
    return metadataAPI.createUnit(name);
  }, `Unit "${name.name}" created!`);
  
  // --- Return Values ---
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