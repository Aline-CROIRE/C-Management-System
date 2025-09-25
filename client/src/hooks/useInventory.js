import { useState, useEffect, useCallback, useMemo } from "react";
import { inventoryAPI, metadataAPI, supplierAPI } from "../services/api"; 
import { useNotifications } from "../contexts/NotificationContext";

export const useInventory = (initialParams = {}) => {
  const [inventory, setInventory] = useState([]);
  
  const [stats, setStats] = useState({ 
      totalItems: 0, 
      totalValue: 0,
      totalCostValue: 0,
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
  const [suppliers, setSuppliers] = useState([]);
  
  const { showToast } = useNotifications();

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
      showToast(err.response?.data?.message || "Could not fetch inventory data.", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, showToast]);

  const fetchDashboardStats = useCallback(async () => {
    try {
        const response = await inventoryAPI.getStats();
        if(response.success) {
            setStats({
                totalItems: response.data.totalItems || 0,
                totalValue: response.data.totalValue || 0,
                totalCostValue: response.data.totalCostValue || 0,
                lowStockCount: response.data.lowStockCount || 0,
                outOfStockCount: response.data.outOfStockCount || 0,
                onOrderCount: response.data.onOrderCount || 0,
            });
        } else {
             console.error("Failed to fetch dashboard stats", response.message);
        }
    } catch (err) {
        console.error("Error fetching dashboard stats", err);
        showToast("Failed to fetch dashboard stats.", "error");
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
      const [categoriesRes, locationsRes, unitsRes, suppliersRes] = await Promise.all([
        inventoryAPI.getCategories(),
        inventoryAPI.getLocations(),
        inventoryAPI.getDistinctUnits(),
        supplierAPI.getAll(),
      ]);
      setCategories(categoriesRes.data || []);
      setLocations(locationsRes.data || []);
      setUnits(unitsRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
      showToast("Could not load form options (categories, locations, units, suppliers).", "error");
    }
  }, [showToast]);

  useEffect(() => {
    fetchMetadata();
    fetchDashboardStats();
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
    setLoading(true);
    try {
      const response = await action();
      if(response.success) {
        showToast(successMessage, "success");
        await refreshData();
        await fetchMetadata();
        return response.data || true;
      } else {
        showToast(response.message || "Action failed.", "error");
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
      showToast(err.response?.data?.message || "Action failed.", "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshData, fetchMetadata]);

  const addItem = (payload) => crudAction(() => inventoryAPI.create(payload), "Item added successfully!");
  const updateItem = (id, payload) => crudAction(() => inventoryAPI.update(id, payload), "Item updated successfully!");
  const deleteItem = (id) => crudAction(() => inventoryAPI.delete(id), "Item deleted successfully!");
  
  const createCategory = (name) => crudAction(() => inventoryAPI.createCategory({ name }), `Category "${name}" created!`);
  const createLocation = (name) => crudAction(() => inventoryAPI.createLocation({ name }), `Location "${name}" created!`);
  const createUnit = (name) => crudAction(() => inventoryAPI.createUnit({ name }), `Unit "${name}" added to selectable list!`);
  const createSupplier = (supplierData) => crudAction(() => supplierAPI.create(supplierData), `Supplier "${supplierData.name}" created!`);

  return {
    inventory,
    stats,
    pagination,
    categories,
    locations,
    units,
    suppliers,
    loading,
    error,
    filters,
    addItem,
    updateItem,
    deleteItem,
    createCategory,
    createLocation,
    createUnit,
    createSupplier, 
    changePage,
    updateFilters,
    refreshData,
  };
};