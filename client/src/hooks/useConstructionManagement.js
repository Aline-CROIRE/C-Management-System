// client/src/hooks/useConstructionManagement.js
import { useState, useEffect, useCallback } from 'react';
import { constructionAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import moment from 'moment'; // Ensure moment is installed (npm install moment)

export const useConstructionManagement = () => {
    // Core Entity States (for main dashboard lists)
    const [sites, setSites] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [stats, setStats] = useState({});

    // Site-Specific Details States (for ViewSiteModal and drill-down)
    const [currentSite, setCurrentSite] = useState(null); // Detailed data for a single viewed site
    const [siteMilestones, setSiteMilestones] = useState([]);
    const [siteChangeOrders, setSiteChangeOrders] = useState([]);
    const [siteMaterialInventory, setSiteMaterialInventory] = useState([]);
    const [siteMaterialRequests, setSiteMaterialRequests] = useState([]);
    const [sitePaymentRequests, setSitePaymentRequests] = useState([]);
    const [siteDocuments, setSiteDocuments] = useState([]);
    const [siteAssignedWorkers, setSiteAssignedWorkers] = useState([]);
    const [siteSafetyIncidents, setSiteSafetyIncidents] = useState([]);
    const [siteBudgetAnalytics, setSiteBudgetAnalytics] = useState(null);

    // Equipment-Specific Details States
    const [currentEquipment, setCurrentEquipment] = useState(null);
    const [equipmentMaintenanceLogs, setEquipmentMaintenanceLogs] = useState([]);
    const [equipmentDocuments, setEquipmentDocuments] = useState([]);

    // Worker-Specific Details States
    const [currentWorker, setCurrentWorker] = useState(null);
    const [workerCertifications, setWorkerCertifications] = useState([]);
    const [workerTimesheets, setWorkerTimesheets] = useState([]);
    const [workerDocuments, setWorkerDocuments] = useState([]);

    // Global Loading and Error States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Pagination States
    const [paginationSites, setPaginationSites] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationEquipment, setPaginationEquipment] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationTasks, setPaginationTasks] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationWorkers, setPaginationWorkers] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationChangeOrders, setPaginationChangeOrders] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationMaterialRequests, setPaginationMaterialRequests] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationPaymentRequests, setPaginationPaymentRequests] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationMaintenanceLogs, setPaginationMaintenanceLogs] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationTimesheets, setPaginationTimesheets] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationSafetyIncidents, setPaginationSafetyIncidents] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [paginationCertifications, setPaginationCertifications] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });


    // --- Generic CRUD Action Wrapper ---
    const performCrudAction = useCallback(async (actionFn, successMsg, entityId = null, payload = null, refreshScope = 'all') => {
        setLoading(true);
        setError(null);
        try {
            const response = await (entityId ? actionFn(entityId, payload) : actionFn(payload));
            toast.success(successMsg);

            // Conditional refresh based on scope
            if (refreshScope === 'all') {
                refreshAllData();
            } else if (refreshScope === 'sites') {
                fetchSites();
            } else if (refreshScope === 'equipment') {
                fetchEquipment();
            } else if (refreshScope === 'tasks') {
                fetchTasks();
            } else if (refreshScope === 'workers') {
                fetchWorkers();
            } else if (refreshScope.startsWith('site_details:')) { // For site-specific refreshes
                const siteId = refreshScope.split(':')[1];
                fetchSiteData(siteId);
            } else if (refreshScope.startsWith('equipment_details:')) { // For equipment-specific refreshes
                const equipmentId = refreshScope.split(':')[1];
                fetchEquipmentData(equipmentId);
            } else if (refreshScope.startsWith('worker_details:')) { // For worker-specific refreshes
                const workerId = refreshScope.split(':')[1];
                fetchWorkerData(workerId);
            }
            return response?.data;
        } catch (err) {
            const msg = err.message || "An unexpected error occurred.";
            setError(new Error(msg)); // Wrap original error for consistent type
            toast.error(msg); // Error is already toasted by api.js interceptor, but keeping this for explicit hook error state
            throw err;
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    // --- Core Entity Fetch Functions ---
    const fetchSites = useCallback(async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getSites({ page, limit, ...filters });
            setSites(Array.isArray(response?.data) ? response.data : []);
            setPaginationSites(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEquipment = useCallback(async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getEquipment({ page, limit, ...filters });
            setEquipment(Array.isArray(response?.data) ? response.data : []);
            setPaginationEquipment(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTasks = useCallback(async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getTasks({ page, limit, ...filters });
            setTasks(Array.isArray(response?.data) ? response.data : []);
            setPaginationTasks(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWorkers = useCallback(async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getWorkers({ page, limit, ...filters });
            setWorkers(Array.isArray(response?.data) ? response.data : []);
            setPaginationWorkers(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
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
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Site-Specific Fetch Functions ---
    const fetchSiteDetails = useCallback(async (siteId) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getSiteById(siteId);
            setCurrentSite(response?.data || null);
            // Assuming embedded milestones, assignedWorkers etc are in the site response itself
            // Or fetched separately if they become too large/complex for embed.
            setSiteMilestones(response?.data?.milestones || []);
            setSiteAssignedWorkers(response?.data?.assignedWorkers || []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSiteChangeOrders = useCallback(async (siteId, page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getChangeOrders(siteId, { page, limit, ...filters });
            setSiteChangeOrders(Array.isArray(response?.data) ? response.data : []);
            setPaginationChangeOrders(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSiteMaterialInventory = useCallback(async (siteId) => {
        setLoading(true);
        try {
            const siteResponse = await constructionAPI.getSiteById(siteId); // Site materials are embedded in site
            setSiteMaterialInventory(siteResponse?.data?.siteMaterialInventory || []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSiteMaterialRequests = useCallback(async (siteId, page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getMaterialRequests(siteId, { page, limit, ...filters });
            setSiteMaterialRequests(Array.isArray(response?.data) ? response.data : []);
            setPaginationMaterialRequests(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSitePaymentRequests = useCallback(async (siteId, page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getPaymentRequests(siteId, { page, limit, ...filters });
            setSitePaymentRequests(Array.isArray(response?.data) ? response.data : []);
            setPaginationPaymentRequests(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSiteDocuments = useCallback(async (siteId) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getDocuments('ConstructionSite', siteId);
            setSiteDocuments(Array.isArray(response?.data) ? response.data : []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSiteSafetyIncidents = useCallback(async (siteId, page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getSafetyIncidents(siteId, { page, limit, ...filters });
            setSiteSafetyIncidents(Array.isArray(response?.data) ? response.data : []);
            setPaginationSafetyIncidents(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSiteBudgetAnalytics = useCallback(async (siteId) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getBudgetAnalytics(siteId);
            setSiteBudgetAnalytics(response?.data || null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);


    // --- Equipment-Specific Fetch Functions ---
    const fetchEquipmentDetails = useCallback(async (equipmentId) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getEquipmentById(equipmentId);
            setCurrentEquipment(response?.data || null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEquipmentMaintenanceLogs = useCallback(async (equipmentId, page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getMaintenanceLogs(equipmentId, { page, limit, ...filters });
            setEquipmentMaintenanceLogs(Array.isArray(response?.data) ? response.data : []);
            setPaginationMaintenanceLogs(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEquipmentDocuments = useCallback(async (equipmentId) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getDocuments('Equipment', equipmentId);
            setEquipmentDocuments(Array.isArray(response?.data) ? response.data : []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);


    // --- Worker-Specific Fetch Functions ---
    const fetchWorkerDetails = useCallback(async (workerId) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getWorkerById(workerId);
            setCurrentWorker(response?.data || null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWorkerCertifications = useCallback(async (workerId, page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getCertifications(workerId, { page, limit, ...filters });
            setWorkerCertifications(Array.isArray(response?.data) ? response.data : []);
            setPaginationCertifications(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWorkerTimesheets = useCallback(async (workerId, page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getTimesheets(workerId, { page, limit, ...filters });
            setWorkerTimesheets(Array.isArray(response?.data) ? response.data : []);
            setPaginationTimesheets(response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWorkerDocuments = useCallback(async (workerId) => {
        setLoading(true);
        try {
            const response = await constructionAPI.getDocuments('Worker', workerId);
            setWorkerDocuments(Array.isArray(response?.data) ? response.data : []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);


    // --- Main Data Refresh Orchestrator ---
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


    // --- CRUD Operations for Core Entities (using performCrudAction) ---
    const createSite = (siteData) => performCrudAction(constructionAPI.createSite, 'Site created successfully!', null, siteData, 'all');
    const updateSite = (id, siteData) => performCrudAction(constructionAPI.updateSite, 'Site updated successfully!', id, siteData, 'all');
    const deleteSite = (id) => performCrudAction(constructionAPI.deleteSite, 'Site deleted successfully!', id, null, 'all');

    const createEquipment = (equipmentData) => performCrudAction(constructionAPI.createEquipment, 'Equipment added successfully!', null, equipmentData, 'all');
    const updateEquipment = (id, equipmentData) => performCrudAction(constructionAPI.updateEquipment, 'Equipment updated successfully!', id, equipmentData, 'all');
    const deleteEquipment = (id) => performCrudAction(constructionAPI.deleteEquipment, 'Equipment deleted successfully!', id, null, 'all');

    const createTask = (taskData) => performCrudAction(constructionAPI.createTask, 'Task created successfully!', null, taskData, 'all');
    const updateTask = (id, taskData) => performCrudAction(constructionAPI.updateTask, 'Task updated successfully!', id, taskData, 'all');
    const deleteTask = (id) => performCrudAction(constructionAPI.deleteTask, 'Task deleted successfully!', id, null, 'all');

    const createWorker = (workerData) => performCrudAction(constructionAPI.createWorker, 'Worker added successfully!', null, workerData, 'all');
    const updateWorker = (id, workerData) => performCrudAction(constructionAPI.updateWorker, 'Worker updated successfully!', id, workerData, 'all');
    const deleteWorker = (id) => performCrudAction(constructionAPI.deleteWorker, 'Worker deleted successfully!', id, null, 'all');


    // --- CRUD Operations for Site-Specific Entities ---
    const createMilestone = (siteId, milestoneData) => performCrudAction((payload) => constructionAPI.createMilestone(siteId, payload), 'Milestone created successfully!', null, milestoneData, `site_details:${siteId}`);
    const updateMilestone = (siteId, milestoneId, milestoneData) => performCrudAction((payload) => constructionAPI.updateMilestone(siteId, milestoneId, payload), 'Milestone updated successfully!', null, milestoneData, `site_details:${siteId}`);
    const deleteMilestone = (siteId, milestoneId) => performCrudAction((mId) => constructionAPI.deleteMilestone(siteId, mId), 'Milestone deleted successfully!', milestoneId, null, `site_details:${siteId}`);

    const createSiteMaterial = (siteId, materialData) => performCrudAction((payload) => constructionAPI.createSiteMaterial(siteId, payload), 'Site material added successfully!', null, materialData, `site_details:${siteId}`);
    const updateSiteMaterial = (siteId, itemId, materialData) => performCrudAction((payload) => constructionAPI.updateSiteMaterial(siteId, itemId, payload), 'Site material updated successfully!', null, materialData, `site_details:${siteId}`);
    const deleteSiteMaterial = (siteId, itemId) => performCrudAction((mId) => constructionAPI.deleteSiteMaterial(siteId, mId), 'Site material deleted successfully!', itemId, null, `site_details:${siteId}`);

    const assignWorkerToSite = (siteId, assignmentData) => performCrudAction((payload) => constructionAPI.assignWorkerToSite(siteId, payload), 'Worker assigned to site successfully!', null, assignmentData, `site_details:${siteId}`);
    const updateSiteWorkerAssignment = (siteId, assignmentId, assignmentData) => performCrudAction((payload) => constructionAPI.updateSiteWorkerAssignment(siteId, assignmentId, payload), 'Worker assignment updated successfully!', null, assignmentData, `site_details:${siteId}`);
    const unassignWorkerFromSite = (siteId, assignmentId) => performCrudAction((aId) => constructionAPI.unassignWorkerFromSite(siteId, aId), 'Worker unassigned from site successfully!', assignmentId, null, `site_details:${siteId}`);

    const createChangeOrder = (siteId, changeOrderData) => performCrudAction((payload) => constructionAPI.createChangeOrder(siteId, payload), 'Change order created successfully!', null, changeOrderData, `site_details:${siteId}`);
    const updateChangeOrder = (siteId, changeOrderId, changeOrderData) => performCrudAction((payload) => constructionAPI.updateChangeOrder(siteId, changeOrderId, payload), 'Change order updated successfully!', null, changeOrderData, `site_details:${siteId}`);
    const deleteChangeOrder = (siteId, changeOrderId) => performCrudAction((coId) => constructionAPI.deleteChangeOrder(siteId, coId), 'Change order deleted successfully!', changeOrderId, null, `site_details:${siteId}`);

    const createMaterialRequest = (siteId, requestData) => performCrudAction((payload) => constructionAPI.createMaterialRequest(siteId, payload), 'Material request created successfully!', null, requestData, `site_details:${siteId}`);
    const updateMaterialRequestStatus = (siteId, requestId, status) => performCrudAction((payload) => constructionAPI.updateMaterialRequestStatus(siteId, requestId, status), 'Material request status updated!', null, status, `site_details:${siteId}`);
    const deleteMaterialRequest = (siteId, requestId) => performCrudAction((reqId) => constructionAPI.deleteMaterialRequest(siteId, reqId), 'Material request deleted successfully!', requestId, null, `site_details:${siteId}`);

    const createPaymentRequest = (siteId, requestData) => performCrudAction((payload) => constructionAPI.createPaymentRequest(siteId, payload), 'Payment request created successfully!', null, requestData, `site_details:${siteId}`);
    const updatePaymentRequestStatus = (siteId, requestId, status) => performCrudAction((payload) => constructionAPI.updatePaymentRequestStatus(siteId, requestId, status), 'Payment request status updated!', null, status, `site_details:${siteId}`);
    const deletePaymentRequest = (siteId, requestId) => performCrudAction((reqId) => constructionAPI.deletePaymentRequest(siteId, reqId), 'Payment request deleted successfully!', requestId, null, `site_details:${siteId}`);

    const createSafetyIncident = (siteId, incidentData) => performCrudAction((payload) => constructionAPI.createSafetyIncident(siteId, payload), 'Safety incident reported successfully!', null, incidentData, `site_details:${siteId}`);
    const updateSafetyIncident = (siteId, incidentId, incidentData) => performCrudAction((payload) => constructionAPI.updateSafetyIncident(siteId, incidentId, payload), 'Safety incident updated successfully!', null, incidentData, `site_details:${siteId}`);
    const deleteSafetyIncident = (siteId, incidentId) => performCrudAction((incId) => constructionAPI.deleteSafetyIncident(siteId, incId), 'Safety incident deleted successfully!', incidentId, null, `site_details:${siteId}`);


    // --- CRUD Operations for Equipment-Specific Entities ---
    const createMaintenanceLog = (equipmentId, logData) => performCrudAction((payload) => constructionAPI.createMaintenanceLog(equipmentId, payload), 'Maintenance log created successfully!', null, logData, `equipment_details:${equipmentId}`);
    const updateMaintenanceLog = (equipmentId, logId, logData) => performCrudAction((payload) => constructionAPI.updateMaintenanceLog(equipmentId, logId, payload), 'Maintenance log updated successfully!', null, logData, `equipment_details:${equipmentId}`);
    const deleteMaintenanceLog = (equipmentId, logId) => performCrudAction((mId) => constructionAPI.deleteMaintenanceLog(equipmentId, mId), 'Maintenance log deleted successfully!', logId, null, `equipment_details:${equipmentId}`);


    // --- CRUD Operations for Worker-Specific Entities ---
    const createCertification = (workerId, certData) => performCrudAction((payload) => constructionAPI.createCertification(workerId, payload), 'Certification created successfully!', null, certData, `worker_details:${workerId}`);
    const updateCertification = (workerId, certId, certData) => performCrudAction((payload) => constructionAPI.updateCertification(workerId, certId, payload), 'Certification updated successfully!', null, certData, `worker_details:${workerId}`);
    const deleteCertification = (workerId, certId) => performCrudAction((cId) => constructionAPI.deleteCertification(workerId, cId), 'Certification deleted successfully!', certId, null, `worker_details:${workerId}`);

    const createTimesheet = (workerId, timesheetData) => performCrudAction((payload) => constructionAPI.createTimesheet(workerId, payload), 'Timesheet submitted successfully!', null, timesheetData, `worker_details:${workerId}`);
    const updateTimesheet = (workerId, timesheetId, timesheetData) => performCrudAction((payload) => constructionAPI.updateTimesheet(workerId, timesheetId, payload), 'Timesheet updated successfully!', null, timesheetData, `worker_details:${workerId}`);
    const updateTimesheetStatus = (workerId, timesheetId, status) => performCrudAction((payload) => constructionAPI.updateTimesheetStatus(workerId, timesheetId, status), 'Timesheet status updated!', null, status, `worker_details:${workerId}`);
    const deleteTimesheet = (workerId, timesheetId) => performCrudAction((tsId) => constructionAPI.deleteTimesheet(workerId, tsId), 'Timesheet deleted successfully!', timesheetId, null, `worker_details:${workerId}`);


    // --- Document Upload/Delete ---
    const uploadDocument = (formData, refModel, refId) => performCrudAction(
        (payload) => constructionAPI.uploadDocument(payload),
        'Document uploaded successfully!',
        null,
        formData,
        refModel === 'ConstructionSite' ? `site_details:${refId}` :
        refModel === 'Equipment' ? `equipment_details:${refId}` :
        refModel === 'Worker' ? `worker_details:${refId}` : 'none' // Refresh only relevant detail view
    );
    const deleteDocument = (documentId, refModel, refId) => performCrudAction(
        (docId) => constructionAPI.deleteDocument(docId),
        'Document deleted successfully!',
        documentId,
        null,
        refModel === 'ConstructionSite' ? `site_details:${refId}` :
        refModel === 'Equipment' ? `equipment_details:${refId}` :
        refModel === 'Worker' ? `worker_details:${refId}` : 'none'
    );


    // --- Combined Fetcher for ViewSiteModal ---
    const fetchSiteData = useCallback(async (siteId) => {
        if (!siteId) {
            setCurrentSite(null);
            setSiteMilestones([]);
            setSiteChangeOrders([]);
            setSiteMaterialInventory([]);
            setSiteMaterialRequests([]);
            setSitePaymentRequests([]);
            setSiteDocuments([]);
            setSiteAssignedWorkers([]);
            setSiteSafetyIncidents([]);
            setSiteBudgetAnalytics(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [
                siteResponse,
                changeOrdersResponse,
                materialRequestsResponse,
                paymentRequestsResponse,
                documentsResponse,
                safetyIncidentsResponse,
                budgetAnalyticsResponse,
            ] = await Promise.all([
                constructionAPI.getSiteById(siteId),
                constructionAPI.getChangeOrders(siteId),
                constructionAPI.getMaterialRequests(siteId),
                constructionAPI.getPaymentRequests(siteId),
                constructionAPI.getDocuments('ConstructionSite', siteId),
                constructionAPI.getSafetyIncidents(siteId),
                constructionAPI.getBudgetAnalytics(siteId),
                // Add any other top-level site-related fetches here
            ]);

            setCurrentSite(siteResponse?.data || null);
            setSiteMilestones(siteResponse?.data?.milestones || []); // Embedded
            setSiteAssignedWorkers(siteResponse?.data?.assignedWorkers || []); // Embedded

            setSiteChangeOrders(Array.isArray(changeOrdersResponse?.data) ? changeOrdersResponse.data : []);
            setPaginationChangeOrders(changeOrdersResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });

            setSiteMaterialInventory(siteResponse?.data?.siteMaterialInventory || []); // Embedded

            setSiteMaterialRequests(Array.isArray(materialRequestsResponse?.data) ? materialRequestsResponse.data : []);
            setPaginationMaterialRequests(materialRequestsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });

            setSitePaymentRequests(Array.isArray(paymentRequestsResponse?.data) ? paymentRequestsResponse.data : []);
            setPaginationPaymentRequests(paymentRequestsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });

            setSiteDocuments(Array.isArray(documentsResponse?.data) ? documentsResponse.data : []);

            setSiteSafetyIncidents(Array.isArray(safetyIncidentsResponse?.data) ? safetyIncidentsResponse.data : []);
            setPaginationSafetyIncidents(safetyIncidentsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });

            setSiteBudgetAnalytics(budgetAnalyticsResponse?.data || null);

        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);


    // --- Combined Fetcher for ViewEquipmentModal ---
    const fetchEquipmentData = useCallback(async (equipmentId) => {
        if (!equipmentId) {
            setCurrentEquipment(null);
            setEquipmentMaintenanceLogs([]);
            setEquipmentDocuments([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [
                equipmentResponse,
                maintenanceLogsResponse,
                documentsResponse,
            ] = await Promise.all([
                constructionAPI.getEquipmentById(equipmentId),
                constructionAPI.getMaintenanceLogs(equipmentId),
                constructionAPI.getDocuments('Equipment', equipmentId),
            ]);

            setCurrentEquipment(equipmentResponse?.data || null);
            setEquipmentMaintenanceLogs(Array.isArray(maintenanceLogsResponse?.data) ? maintenanceLogsResponse.data : []);
            setPaginationMaintenanceLogs(maintenanceLogsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            setEquipmentDocuments(Array.isArray(documentsResponse?.data) ? documentsResponse.data : []);

        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);


    // --- Combined Fetcher for ViewWorkerModal ---
    const fetchWorkerData = useCallback(async (workerId) => {
        if (!workerId) {
            setCurrentWorker(null);
            setWorkerCertifications([]);
            setWorkerTimesheets([]);
            setWorkerDocuments([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [
                workerResponse,
                certificationsResponse,
                timesheetsResponse,
                documentsResponse,
            ] = await Promise.all([
                constructionAPI.getWorkerById(workerId),
                constructionAPI.getCertifications(workerId),
                constructionAPI.getTimesheets(workerId),
                constructionAPI.getDocuments('Worker', workerId),
            ]);

            setCurrentWorker(workerResponse?.data || null);
            setWorkerCertifications(Array.isArray(certificationsResponse?.data) ? certificationsResponse.data : []);
            setPaginationCertifications(certificationsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            setWorkerTimesheets(Array.isArray(timesheetsResponse?.data) ? timesheetsResponse.data : []);
            setPaginationTimesheets(timesheetsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            setWorkerDocuments(Array.isArray(documentsResponse?.data) ? documentsResponse.data : []);

        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);


    // --- Pagination Handlers (for main lists) ---
    const changePageSites = (newPage) => fetchSites(newPage, paginationSites.limit);
    const changePageEquipment = (newPage) => fetchEquipment(newPage, paginationEquipment.limit);
    const changePageTasks = (newPage) => fetchTasks(newPage, paginationTasks.limit);
    const changePageWorkers = (newPage) => fetchWorkers(newPage, paginationWorkers.limit);

    // --- Pagination Handlers for Site Details (example for change orders) ---
    const changePageSiteChangeOrders = (siteId, newPage) => fetchSiteChangeOrders(siteId, newPage, paginationChangeOrders.limit);
    const changePageSiteMaterialRequests = (siteId, newPage) => fetchSiteMaterialRequests(siteId, newPage, paginationMaterialRequests.limit);
    const changePageSitePaymentRequests = (siteId, newPage) => fetchSitePaymentRequests(siteId, newPage, paginationPaymentRequests.limit);
    const changePageSiteSafetyIncidents = (siteId, newPage) => fetchSiteSafetyIncidents(siteId, newPage, paginationSafetyIncidents.limit);
    
    // --- Pagination Handlers for Equipment Details ---
    const changePageEquipmentMaintenanceLogs = (equipmentId, newPage) => fetchEquipmentMaintenanceLogs(equipmentId, newPage, paginationMaintenanceLogs.limit);

    // --- Pagination Handlers for Worker Details ---
    const changePageWorkerCertifications = (workerId, newPage) => fetchWorkerCertifications(workerId, newPage, paginationCertifications.limit);
    const changePageWorkerTimesheets = (workerId, newPage) => fetchWorkerTimesheets(workerId, newPage, paginationTimesheets.limit);


    // --- Return all states and functions ---
    return {
        // Core Dashboard Lists & Stats
        sites, equipment, tasks, workers, stats,
        loading, error, refreshAllData,

        // Core CRUD operations
        createSite, updateSite, deleteSite,
        createEquipment, updateEquipment, deleteEquipment,
        createTask, updateTask, deleteTask,
        createWorker, updateWorker, deleteWorker,

        // Core Pagination
        paginationSites, changePageSites,
        paginationEquipment, changePageEquipment,
        paginationTasks, changePageTasks,
        paginationWorkers, changePageWorkers,

        // --- Site-Specific States & Operations ---
        currentSite, fetchSiteData, // Main detail fetcher for a single site
        siteMilestones, createMilestone, updateMilestone, deleteMilestone,
        siteChangeOrders, fetchSiteChangeOrders, createChangeOrder, updateChangeOrder, deleteChangeOrder, paginationChangeOrders, changePageSiteChangeOrders,
        siteMaterialInventory, fetchSiteMaterialInventory, createSiteMaterial, updateSiteMaterial, deleteSiteMaterial,
        siteMaterialRequests, fetchSiteMaterialRequests, createMaterialRequest, updateMaterialRequestStatus, deleteMaterialRequest, paginationMaterialRequests, changePageSiteMaterialRequests,
        sitePaymentRequests, fetchSitePaymentRequests, createPaymentRequest, updatePaymentRequestStatus, deletePaymentRequest, paginationPaymentRequests, changePageSitePaymentRequests,
        siteDocuments, fetchSiteDocuments, // Documents are fetched via uploadDocument/deleteDocument
        siteAssignedWorkers, assignWorkerToSite, updateSiteWorkerAssignment, unassignWorkerFromSite,
        siteSafetyIncidents, fetchSiteSafetyIncidents, createSafetyIncident, updateSafetyIncident, deleteSafetyIncident, paginationSafetyIncidents, changePageSiteSafetyIncidents,
        siteBudgetAnalytics, fetchSiteBudgetAnalytics,

        // --- Equipment-Specific States & Operations ---
        currentEquipment, fetchEquipmentData,
        equipmentMaintenanceLogs, fetchEquipmentMaintenanceLogs, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog, paginationMaintenanceLogs, changePageEquipmentMaintenanceLogs,
        equipmentDocuments, fetchEquipmentDocuments,

        // --- Worker-Specific States & Operations ---
        currentWorker, fetchWorkerData,
        workerCertifications, fetchWorkerCertifications, createCertification, updateCertification, deleteCertification, paginationCertifications, changePageWorkerCertifications,
        workerTimesheets, fetchWorkerTimesheets, createTimesheet, updateTimesheet, updateTimesheetStatus, deleteTimesheet, paginationTimesheets, changePageWorkerTimesheets,
        workerDocuments, fetchWorkerDocuments,

        // --- Document Operations (Generic) ---
        uploadDocument, deleteDocument,

        // --- Reports & Analytics ---
        generateReport: (siteId, reportType) => constructionAPI.generateReport(siteId, reportType), // Report generation directly uses API

    };
};