"use client";

import { useState, useEffect, useCallback } from "react";
import { constructionAPI } from "../services/api";
import toast from "react-hot-toast";

export const useConstructionManagement = (initialFilters = {}) => {
  const [sites, setSites] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    sites: {
      total: 0,
      active: 0,
      delayed: 0,
      completed: 0,
      planning: 0,
      onHold: 0,
      totalBudget: 0,
      totalExpenditure: 0,
      remainingBudget: 0,
    },
    equipment: {
      total: 0,
      operational: 0,
      inMaintenance: 0,
      outOfService: 0,
      totalPurchaseCost: 0,
      totalCurrentValue: 0,
      depreciation: 0,
    },
    tasks: {
      total: 0,
      pending: 0,
      completed: 0,
      delayed: 0,
    },
    totalWorkers: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationSites, setPaginationSites] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [paginationEquipment, setPaginationEquipment] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [paginationTasks, setPaginationTasks] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filtersSites, setFiltersSites] = useState(initialFilters.sites || {});
  const [filtersEquipment, setFiltersEquipment] = useState(initialFilters.equipment || {});
  const [filtersTasks, setFiltersTasks] = useState(initialFilters.tasks || {});

  const fetchSites = useCallback(async () => {
    try {
      const response = await constructionAPI.getSites({ ...filtersSites, page: paginationSites.page, limit: paginationSites.limit });
      if (response.success) {
        setSites(response.data);
        setPaginationSites(response.pagination);
      } else {
        const errorMessage = response.message || "Failed to fetch construction sites.";
        console.error("Error fetching sites:", { response });
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching sites:", err);
      setError(err);
    }
  }, [filtersSites, paginationSites.page, paginationSites.limit]);

  const fetchEquipment = useCallback(async () => {
    try {
      const response = await constructionAPI.getEquipment({ ...filtersEquipment, page: paginationEquipment.page, limit: paginationEquipment.limit });
      if (response.success) {
        setEquipment(response.data);
        setPaginationEquipment(response.pagination);
      } else {
        const errorMessage = response.message || "Failed to fetch construction equipment.";
        console.error("Error fetching equipment:", { response });
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
      setError(err);
    }
  }, [filtersEquipment, paginationEquipment.page, paginationEquipment.limit]);

  const fetchTasks = useCallback(async (siteId = null) => {
    try {
      const params = { ...filtersTasks, page: paginationTasks.page, limit: paginationTasks.limit };
      if (siteId) {
        params.siteId = siteId;
      }
      const response = await constructionAPI.getTasks(params);
      if (response.success) {
        setTasks(response.data);
        setPaginationTasks(response.pagination);
      } else {
        const errorMessage = response.message || "Failed to fetch tasks.";
        console.error("Error fetching tasks:", { response });
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err);
    }
  }, [filtersTasks, paginationTasks.page, paginationTasks.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await constructionAPI.getStats();
      if (response.success) {
        setStats(prevStats => ({
          ...prevStats,
          sites: { ...prevStats.sites, ...response.data.sites },
          equipment: { ...prevStats.equipment, ...response.data.equipment },
          tasks: { ...prevStats.tasks, ...response.data.tasks },
        }));
      } else {
        const errorMessage = response.message || "Failed to fetch construction stats.";
        console.error("Error fetching construction stats:", { response });
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching construction stats:", err);
      setError(err);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear any previous errors at the start of a full refresh
    try {
      await Promise.all([
        fetchStats(),
        fetchSites(),
        fetchEquipment(),
        fetchTasks(),
      ]);
    } catch (e) {
      // Individual fetch functions (and axios interceptor) already handle specific errors.
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchSites, fetchEquipment, fetchTasks]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const performCrudAction = useCallback(async (apiCall, successMessage) => {
    setLoading(true);
    try {
      const response = await apiCall();
      if (response.success) {
        toast.success(successMessage);
        await refreshAllData(); // Ensure UI is updated after successful CRUD
        return response.data;
      } else {
        const errorMessage = response.message || "Operation failed.";
        toast.error(errorMessage);
        return null;
      }
    } catch (err) {
      console.error("CRUD operation error:", err);
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

  const createTask = useCallback((taskData) => performCrudAction(() => constructionAPI.createTask(taskData), "Task added successfully!"), [performCrudAction]);
  const updateTask = useCallback((id, taskData) => performCrudAction(() => constructionAPI.updateTask(id, taskData), "Task updated successfully!"), [performCrudAction]);
  const deleteTask = useCallback((id) => performCrudAction(() => constructionAPI.deleteTask(id), "Task deleted successfully!"), [performCrudAction]);

  const changePageSites = useCallback((page) => {
    if (page > 0 && page <= paginationSites.totalPages) {
      setPaginationSites(prev => ({ ...prev, page }));
    }
  }, [paginationSites.totalPages]);

  const changePageEquipment = useCallback((page) => {
    if (page > 0 && page <= paginationEquipment.totalPages) {
      setPaginationEquipment(prev => ({ ...prev, page }));
    }
  }, [paginationEquipment.totalPages]);

  const changePageTasks = useCallback((page) => {
    if (page > 0 && page <= paginationTasks.totalPages) {
      setPaginationTasks(prev => ({ ...prev, page }));
    }
  }, [paginationTasks.totalPages]);

  return {
    sites,
    equipment,
    tasks,
    stats,
    loading,
    error,
    paginationSites,
    paginationEquipment,
    paginationTasks,
    setFiltersSites,
    setFiltersEquipment,
    setFiltersTasks,
    changePageSites,
    changePageEquipment,
    changePageTasks,
    refreshAllData,
    createSite,
    updateSite,
    deleteSite,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    createTask,
    updateTask,
    deleteTask,
    fetchTasks,
  };
};
