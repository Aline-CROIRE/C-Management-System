// client/src/hooks/useConstructionManagement.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { constructionAPI } from "../services/api";
import toast from "react-hot-toast";

export const useConstructionManagement = (initialFilters = {}) => {
  const [sites, setSites] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    delayedSites: 0,
    completedSites: 0,
    totalEquipment: 0,
    operationalEquipment: 0,
    maintenanceDueEquipment: 0,
    totalWorkers: 0,
    totalBudget: 0,
    totalExpenditure: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationSites, setPaginationSites] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [paginationEquipment, setPaginationEquipment] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filtersSites, setFiltersSites] = useState(initialFilters.sites || {});
  const [filtersEquipment, setFiltersEquipment] = useState(initialFilters.equipment || {});

  // --- Fetching Functions ---

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await constructionAPI.getSites({ ...filtersSites, page: paginationSites.page, limit: paginationSites.limit });
      if (response.success) {
        setSites(response.data);
        setPaginationSites(response.pagination);
      } else {
        throw new Error(response.message || "Failed to fetch construction sites.");
      }
    } catch (err) {
      console.error("Error fetching sites:", err);
      setError(err.message || "Failed to load construction sites.");
      toast.error(err.message || "Failed to load construction sites.");
    } finally {
      setLoading(false);
    }
  }, [filtersSites, paginationSites.page, paginationSites.limit]);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await constructionAPI.getEquipment({ ...filtersEquipment, page: paginationEquipment.page, limit: paginationEquipment.limit });
      if (response.success) {
        setEquipment(response.data);
        setPaginationEquipment(response.pagination);
      } else {
        throw new Error(response.message || "Failed to fetch construction equipment.");
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
      setError(err.message || "Failed to load construction equipment.");
      toast.error(err.message || "Failed to load construction equipment.");
    } finally {
      setLoading(false);
    }
  }, [filtersEquipment, paginationEquipment.page, paginationEquipment.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await constructionAPI.getStats();
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch construction stats.");
      }
    } catch (err) {
      console.error("Error fetching construction stats:", err);
      // Stats failing shouldn't block the entire dashboard, just log it.
      toast.error(err.message || "Failed to load construction stats overview.");
    }
  }, []);

  // --- Combined Refresh & Effects ---

  const refreshAllData = useCallback(() => {
    fetchStats();
    fetchSites();
    fetchEquipment();
  }, [fetchStats, fetchSites, fetchEquipment]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // --- CRUD Operations ---

  const performCrudAction = useCallback(async (apiCall, successMessage) => {
    setLoading(true);
    try {
      const response = await apiCall();
      if (response.success) {
        toast.success(successMessage);
        refreshAllData(); // Refresh all data after a successful CRUD operation
        return response.data; // Return data for modals if needed
      } else {
        toast.error(response.message || "Operation failed.");
        return null;
      }
    } catch (err) {
      console.error("CRUD operation error:", err);
      toast.error(err.message || "An error occurred during the operation.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshAllData]);

  const createSite = useCallback((siteData) => performCrudAction(() => constructionAPI.createSite(siteData), "Site added successfully!"), [performCrudAction]);
  const updateSite = useCallback((id, siteData) => performCrudAction(() => constructionAPI.updateSite(id, siteData), "Site updated successfully!"), [performCrudAction]);
  const deleteSite = useCallback((id) => performCrudAction(() => constructionAPI.deleteSite(id), "Site deleted successfully!"), [performCrudAction]);

  const createEquipment = useCallback((equipmentData) => performCrudAction(() => constructionAPI.createEquipment(equipmentData), "Equipment added successfully!"), [performCrudAction]);
  const updateEquipment = useCallback((id, equipmentData) => performCrudAction(() => constructionAPI.updateEquipment(id, equipmentData), "Equipment updated successfully!"), [performCrudAction]);
  const deleteEquipment = useCallback((id) => performCrudAction(() => constructionAPI.deleteEquipment(id), "Equipment deleted successfully!"), [performCrudAction]);

  // --- Pagination & Filter Updates ---
  const changePageSites = useCallback((page) => {
    if (page > 0 && page <= paginationSites.totalPages) {
      setPaginationSites(prev => ({ ...prev, page }));
    }
  }, [paginationSites.totalPages]);

  const updateFiltersSites = useCallback((newFilters) => {
    setPaginationSites(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
    setFiltersSites(newFilters);
  }, []);

  const changePageEquipment = useCallback((page) => {
    if (page > 0 && page <= paginationEquipment.totalPages) {
      setPaginationEquipment(prev => ({ ...prev, page }));
    }
  }, [paginationEquipment.totalPages]);

  const updateFiltersEquipment = useCallback((newFilters) => {
    setPaginationEquipment(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
    setFiltersEquipment(newFilters);
  }, []);


  return {
    sites,
    equipment,
    stats,
    loading,
    error,
    paginationSites,
    paginationEquipment,
    filtersSites,
    filtersEquipment,
    setFiltersSites,
    setFiltersEquipment,
    changePageSites,
    changePageEquipment,
    refreshAllData,
    createSite,
    updateSite,
    deleteSite,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
};