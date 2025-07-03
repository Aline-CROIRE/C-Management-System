// hooks/useInventory.js

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { inventoryAPI } from "../services/api"
import { useNotifications } from "../contexts/NotificationContext"

export const useInventory = (initialParams = {}) => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState(initialParams)
  
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const { showToast } = useNotifications()

  // This is the core data fetching function. It's now smarter.
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // It now ALWAYS includes the current filters and pagination state in every call.
      const queryParams = { ...filters, page: pagination.page, limit: pagination.limit };
      const response = await inventoryAPI.getAll(queryParams);
      setInventory(response.data || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError(err.message);
      // Toasts are handled by the API interceptor
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]); // Depends on filters and page

  // This useEffect triggers a refetch whenever the filters or the page number change.
  // This is what makes search, filtering, and pagination actually work.
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]); // The dependency array is key here.

  const fetchMetadata = useCallback(async () => {
    try {
      const [categoriesRes, locationsRes] = await Promise.all([
        inventoryAPI.getCategories(),
        inventoryAPI.getLocations(),
      ]);
      setCategories(categoriesRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // This function is called from the IMS component to update the filter state.
  const updateFilters = useCallback((newFilters) => {
    // When filters change, always go back to page 1.
    setPagination(p => ({ ...p, page: 1 }));
    setFilters(f => ({ ...f, ...newFilters }));
  }, []);

  const changePage = useCallback((page) => {
    if (page > 0) {
      setPagination(p => ({ ...p, page }));
    }
  }, []);

  // --- CRUD Functions ---
  const addItem = useCallback(async (itemData) => {
    await inventoryAPI.create(itemData);
    showToast("Item added successfully!", "success");
    // No need to manually refetch; the state change from the API will do it if needed,
    // but a direct refresh is more reliable.
    await fetchInventory();
  }, [fetchInventory, showToast]);

  const updateItem = useCallback(async (id, updates) => {
    await inventoryAPI.update(id, updates);
    showToast("Item updated successfully!", "success");
    await fetchInventory();
  }, [fetchInventory, showToast]);

  const deleteItem = useCallback(async (id) => {
    await inventoryAPI.delete(id);
    showToast("Item deleted successfully!", "success");
    await fetchInventory();
  }, [fetchInventory, showToast]);
  
  const createCategory = useCallback(async (name) => {
    await inventoryAPI.createCategory({ name });
    showToast(`Category "${name}" created!`, "success");
    await fetchMetadata(); // Refresh dropdown options
  }, [fetchMetadata, showToast]);

  const createLocation = useCallback(async (name) => {
    await inventoryAPI.createLocation({ name });
    showToast(`Location "${name}" created!`, "success");
    await fetchMetadata();
  }, [fetchMetadata, showToast]);

  // Memoized stats for performance
  const derivedStats = useMemo(() => ({
    totalValue: inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0),
    lowStockItems: inventory.filter(item => item.status === 'low-stock'),
    totalLocations: locations.length,
  }), [inventory, locations]);

  return {
    inventory,
    stats: derivedStats,
    pagination,
    categories,
    locations,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    createCategory,
    createLocation,
    changePage,
    updateFilters,
    refreshData: fetchInventory,
  };
};