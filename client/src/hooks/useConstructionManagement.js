"use client";

import { useState, useEffect, useCallback } from 'react';
import { constructionAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export const useConstructionManagement = () => {
    const [sites, setSites] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [stats, setStats] = useState({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [paginationSites, setPaginationSites] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationEquipment, setPaginationEquipment] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationTasks, setPaginationTasks] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationWorkers, setPaginationWorkers] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const performCrudAction = useCallback(async (actionFn, successMsg, entityId = null, payload = null) => {
        setLoading(true);
        setError(null);
        try {
            const response = await (entityId ? actionFn(entityId, payload) : actionFn(payload));
            toast.success(successMsg);
            refreshAllData();
            return response.data;
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchSites = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getSites({ page, limit });
            setSites(Array.isArray(response?.data) ? response.data : []);
            setPaginationSites(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEquipment = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getEquipment({ page, limit });
            setEquipment(Array.isArray(response?.data) ? response.data : []);
            setPaginationEquipment(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTasks = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getTasks({ page, limit });
            setTasks(Array.isArray(response?.data) ? response.data : []);
            setPaginationTasks(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWorkers = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getWorkers({ page, limit });
            setWorkers(Array.isArray(response?.data) ? response.data : []);
            setPaginationWorkers(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const response = await constructionAPI.getStats();
            setStats(response?.data || {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createSite = (siteData) => performCrudAction(constructionAPI.createSite, 'Site created successfully!', null, siteData);
    const updateSite = (id, siteData) => performCrudAction(constructionAPI.updateSite, 'Site updated successfully!', id, siteData);
    const deleteSite = (id) => performCrudAction(constructionAPI.deleteSite, 'Site deleted successfully!', id);

    const createEquipment = (equipmentData) => performCrudAction(constructionAPI.createEquipment, 'Equipment added successfully!', null, equipmentData);
    const updateEquipment = (id, equipmentData) => performCrudAction(constructionAPI.updateEquipment, 'Equipment updated successfully!', id, equipmentData);
    const deleteEquipment = (id) => performCrudAction(constructionAPI.deleteEquipment, 'Equipment deleted successfully!', id);

    const createTask = (taskData) => performCrudAction(constructionAPI.createTask, 'Task created successfully!', null, taskData);
    const updateTask = (id, taskData) => performCrudAction(constructionAPI.updateTask, 'Task updated successfully!', id, taskData);
    const deleteTask = (id) => performCrudAction(constructionAPI.deleteTask, 'Task deleted successfully!', id);

    const createWorker = (workerData) => performCrudAction(constructionAPI.createWorker, 'Worker added successfully!', null, workerData);
    const updateWorker = (id, workerData) => performCrudAction(constructionAPI.updateWorker, 'Worker updated successfully!', id, workerData);
    const deleteWorker = (id) => performCrudAction(constructionAPI.deleteWorker, 'Worker deleted successfully!', id);

    const refreshAllData = useCallback(() => {
        fetchSites();
        fetchEquipment();
        fetchTasks();
        fetchWorkers();
        fetchStats();
    }, [fetchSites, fetchEquipment, fetchTasks, fetchWorkers, fetchStats]);

    useEffect(() => {
        refreshAllData();
    }, [refreshAllData]);

    const changePageSites = (newPage) => fetchSites(newPage, paginationSites.limit);
    const changePageEquipment = (newPage) => fetchEquipment(newPage, paginationEquipment.limit);
    const changePageTasks = (newPage) => fetchTasks(newPage, paginationTasks.limit);
    const changePageWorkers = (newPage) => fetchWorkers(newPage, paginationWorkers.limit);

    const [currentSite, setCurrentSite] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [changeOrders, setChangeOrders] = useState([]);
    const [materialInventory, setMaterialInventory] = useState([]);
    const [workerAssignments, setWorkerAssignments] = useState([]);
    const [budgetAnalytics, setBudgetAnalytics] = useState(null);

    const fetchSiteData = useCallback(async (siteId) => {
        setLoading(true);
        try {
            const [
                siteResponse,
                milestonesResponse,
                changeOrdersResponse,
                inventoryResponse,
                workersResponse,
                budgetResponse
            ] = await Promise.all([
                constructionAPI.getSiteById(siteId),
                constructionAPI.getMilestones(siteId),
                constructionAPI.getChangeOrders(siteId),
                constructionAPI.getMaterialInventory(siteId),
                constructionAPI.getWorkerAssignments(siteId),
                constructionAPI.getBudgetAnalytics(siteId)
            ]);

            setCurrentSite(siteResponse?.data || null);
            setMilestones(Array.isArray(milestonesResponse?.data) ? milestonesResponse.data : []);
            setChangeOrders(Array.isArray(changeOrdersResponse?.data) ? changeOrdersResponse.data : []);
            setMaterialInventory(Array.isArray(inventoryResponse?.data) ? inventoryResponse.data : []);
            setWorkerAssignments(Array.isArray(workersResponse?.data) ? workersResponse.data : []);
            setBudgetAnalytics(budgetResponse?.data || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createMilestone = (siteId, milestoneData) => performCrudAction((id, payload) => constructionAPI.createMilestone(id, payload), 'Milestone created successfully', siteId, milestoneData);
    const createChangeOrder = (siteId, changeOrderData) => performCrudAction((id, payload) => constructionAPI.createChangeOrder(id, payload), 'Change order created successfully', siteId, changeOrderData);
    const updateMaterialInventory = (siteId, materialId, quantity) => performCrudAction((sId, mId, qty) => constructionAPI.updateMaterialInventory(sId, mId, qty), 'Inventory updated successfully', siteId, { materialId, quantity });
    const assignWorkerToSite = (siteId, workerId, assignmentData) => performCrudAction((sId, wId, data) => constructionAPI.assignWorker(sId, wId, data), 'Worker assigned successfully', siteId, { workerId, assignmentData });

    const generateReport = async (siteId, reportType) => {
        setLoading(true);
        try {
            const response = await constructionAPI.generateFinancialReport(siteId, reportType);
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType}-report.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report generated successfully.');
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to generate report.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        sites, equipment, tasks, workers, stats,
        loading, error, refreshAllData,
        createSite, updateSite, deleteSite,
        createEquipment, updateEquipment, deleteEquipment,
        createTask, updateTask, deleteTask,
        createWorker, updateWorker, deleteWorker,
        paginationSites, changePageSites,
        paginationEquipment, changePageEquipment,
        paginationTasks, changePageTasks,
        paginationWorkers, changePageWorkers,
        currentSite, milestones, changeOrders, materialInventory, workerAssignments, budgetAnalytics,
        fetchSiteData, createMilestone, createChangeOrder, updateMaterialInventory, assignWorkerToSite, generateReport,
    };
};