// client/src/components/construction/ViewSiteModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaUserTie, FaCode, FaChartPie, FaUsers, FaTools, FaCheckCircle, FaExclamationTriangle, FaClipboardList, FaInfoCircle, FaTasks, FaPlus,
         FaFileInvoiceDollar, FaHardHat, FaLightbulb, FaGavel, FaShoppingCart, FaMoneyBillWave, FaPaperclip, FaUserPlus, FaTrashAlt, FaEdit, FaEye, FaFileUpload, FaDownload } from "react-icons/fa";
import Button from "../common/Button";
import moment from "moment";
import LoadingSpinner from "../common/LoadingSpinner";

import TaskTable from "./task-management/TaskTable";
import AddEditTaskModal from "./task-management/AddEditTaskModal";
import ViewTaskModal from "./task-management/ViewTaskModal";
import { useConstructionManagement } from "../../hooks/useConstructionManagement";

import AddEditMilestoneModal from './milestone-management/AddEditMilestoneModal';
import AddEditChangeOrderModal from './change-order-management/AddEditChangeOrderModal';
import ViewChangeOrderModal from './change-order-management/ViewChangeOrderModal';
import AddEditSiteMaterialModal from './material-management/AddEditSiteMaterialModal';
import AddEditMaterialRequestModal from './material-management/AddEditMaterialRequestModal';
import ViewMaterialRequestModal from './material-management/ViewMaterialRequestModal';
import AddEditPaymentRequestModal from './financial-management/AddEditPaymentRequestModal';
import ViewPaymentRequestModal from './financial-management/ViewPaymentRequestModal';
import AddEditSafetyIncidentModal from './safety-management/AddEditSafetyIncidentModal';
import ViewSafetyIncidentModal from './safety-management/ViewSafetyIncidentModal';
import UploadDocumentModal from './document-management/UploadDocumentModal';
import AddEditAssignedWorkerToSiteModal from './worker-management/AddEditAssignedWorkerToSiteModal';


const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  width: 100%;
  max-width: 1000px;
  max-height: 95vh;
  box-shadow: ${(props) => props.theme.shadows.xl};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 1024px) {
    max-width: 95%;
  }
  @media (max-width: 768px) {
    max-width: 98%;
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 1rem 1.25rem;
  }
`;

const ModalTitle = styled.h2`
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    color: ${(props) => props.theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem 1.5rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  font-size: clamp(0.75rem, 2vw, 0.8rem);
  font-weight: 600;
  color: ${(props) => props.theme.colors.textSecondary};
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DetailValue = styled.span`
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  font-weight: 500;
  word-break: break-word;
  color: ${(props) => props.theme.colors.text};
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: clamp(0.7rem, 2vw, 0.75rem);
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  ${({ status, theme }) => {
    switch (status) {
      case "Planning": return `background: ${theme.colors?.info || "#2196F3"}20; color: ${theme.colors?.info || "#2196F3"};`;
      case "Active": return `background: ${theme.colors?.success || "#4CAF50"}20; color: ${theme.colors?.success || "#4CAF50"};`;
      case "On-Hold": return `background: ${theme.colors?.warning || "#FFC107"}20; color: ${theme.colors?.warning || "#FFC107"};`;
      case "Delayed": return `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`;
      case "Completed": return `background: ${theme.colors?.primary || "#1b4332"}20; color: ${theme.colors?.primary || "#1b4332"};`;
      case "Cancelled": return `background: ${theme.colors?.textSecondary || "#9E9E9E"}20; color: ${theme.colors?.textSecondary || "#9E9E9E"};`;
      case "Approved": return `background: ${theme.colors?.success || "#4CAF50"}20; color: ${theme.colors?.success || "#4CAF50"};`;
      case "Pending": return `background: ${theme.colors?.warning || "#FFC107"}20; color: ${theme.colors?.warning || "#FFC107"};`;
      case "Rejected": return `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`;
      case "Implemented": return `background: ${theme.colors?.primary || "#1b4332"}20; color: ${theme.colors?.primary || "#1b4332"};`;
      case "Ordered": return `background: ${theme.colors?.info || "#2196F3"}20; color: ${theme.colors?.info || "#2196F3"};`;
      case "Received": return `background: ${theme.colors?.success || "#4CAF50"}20; color: ${theme.colors?.success || "#4CAF50"};`;
      case "Partially Received": return `background: ${theme.colors?.warning || "#FFC107"}20; color: ${theme.colors?.warning || "#FFC107"};`;
      case "Paid": return `background: ${theme.colors?.primary || "#1b4332"}20; color: ${theme.colors?.primary || "#1b4332"};`;
      case "Low": return `background: ${theme.colors?.info || "#2196F3"}20; color: ${theme.colors?.info || "#2196F3"};`;
      case "Medium": return `background: ${theme.colors?.warning || "#FFC107"}20; color: ${theme.colors?.warning || "#FFC107"};`;
      case "High": return `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`;
      case "Critical": return `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`;
      default: return `background: ${theme.colors?.textSecondary || "#9E9E9E"}20; color: ${theme.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.borderLight || '#f0f0f0'};
  padding-bottom: 0.75rem;
`;

const SectionTitle = styled.h3`
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 600;
  color: ${(props) => props.theme.colors.heading};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SectionActions = styled.div`
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;

    @media (max-width: 480px) {
        width: 100%;
        button {
            flex-grow: 1;
            padding: 0.5rem;
            font-size: 0.8rem;
        }
    }
`;

const ListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  & > li {
    background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'};
    border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: ${(props) => props.theme?.colors?.text || '#2d3748'};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    &:last-child {
      margin-bottom: 0;
    }
    @media (max-width: 480px) {
        flex-direction: column;
        align-items: flex-start;
    }
  }
`;


const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
    button {
      flex-grow: 1;
    }
  }
`;

const ViewSiteModal = ({ site, onClose }) => {
  const {
    currentSite, fetchSiteData, loading: hookLoading, error: hookError,
    tasks, createTask, updateTask, deleteTask,
    workers, sites: allSites,
    siteMilestones, createMilestone, updateMilestone, deleteMilestone,
    siteChangeOrders, createChangeOrder, updateChangeOrder, deleteChangeOrder, fetchSiteChangeOrders,
    siteMaterialInventory, createSiteMaterial, updateSiteMaterial, deleteSiteMaterial, fetchSiteMaterialInventory,
    siteMaterialRequests, createMaterialRequest, updateMaterialRequestStatus, deleteMaterialRequest, fetchSiteMaterialRequests,
    sitePaymentRequests, createPaymentRequest, updatePaymentRequestStatus, deletePaymentRequest, fetchSitePaymentRequests,
    siteDocuments, uploadDocument, deleteDocument, fetchSiteDocuments,
    siteAssignedWorkers, assignWorkerToSite, updateSiteWorkerAssignment, unassignWorkerFromSite,
    siteSafetyIncidents, createSafetyIncident, updateSafetyIncident, deleteSafetyIncident, fetchSiteSafetyIncidents,
    siteBudgetAnalytics, fetchSiteBudgetAnalytics,
  } = useConstructionManagement();

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [isEditMilestoneModalOpen, setIsEditMilestoneModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const [isAddChangeOrderModalOpen, setIsAddChangeOrderModalOpen] = useState(false);
  const [isEditChangeOrderModalOpen, setIsEditChangeOrderModalOpen] = useState(false);
  const [isViewChangeOrderModalOpen, setIsViewChangeOrderModalOpen] = useState(false);
  const [selectedChangeOrder, setSelectedChangeOrder] = useState(null);

  const [isAddSiteMaterialModalOpen, setIsAddSiteMaterialModalOpen] = useState(false);
  const [isEditSiteMaterialModalOpen, setIsEditSiteMaterialModalOpen] = useState(false);
  const [selectedSiteMaterial, setSelectedSiteMaterial] = useState(null);

  const [isAddMaterialRequestModalOpen, setIsAddMaterialRequestModalOpen] = useState(false);
  const [isViewMaterialRequestModalOpen, setIsViewMaterialRequestModalOpen] = useState(false);
  const [selectedMaterialRequest, setSelectedMaterialRequest] = useState(null);

  const [isAddPaymentRequestModalOpen, setIsAddPaymentRequestModalOpen] = useState(false);
  const [isViewPaymentRequestModalOpen, setIsViewPaymentRequestModalOpen] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null);

  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [documentRefContext, setDocumentRefContext] = useState({ refId: '', refModel: 'ConstructionSite' });

  const [isAssignWorkerToSiteModalOpen, setIsAssignWorkerToSiteModalOpen] = useState(false);
  const [isEditAssignedWorkerToSiteModalOpen, setIsEditAssignedWorkerToSiteModalOpen] = useState(false);
  const [selectedAssignedWorkerToSite, setSelectedAssignedWorkerToSite] = useState(null);

  const [isAddSafetyIncidentModalOpen, setIsAddSafetyIncidentModalOpen] = useState(false);
  const [isEditSafetyIncidentModalOpen, setIsEditSafetyIncidentModalOpen] = useState(false);
  const [isViewSafetyIncidentModalOpen, setIsViewSafetyIncidentModalOpen] = useState(false);
  const [selectedSafetyIncident, setSelectedSafetyIncident] = useState(null);


  useEffect(() => {
    if (site?._id) {
      fetchSiteData(site._id);
      fetchSiteChangeOrders(site._id);
      fetchSiteMaterialInventory(site._id);
      fetchSiteMaterialRequests(site._id);
      fetchSitePaymentRequests(site._id);
      fetchSiteSafetyIncidents(site._id);
      fetchSiteDocuments(site._id);
      fetchSiteBudgetAnalytics(site._id);
    }
  }, [site?._id, fetchSiteData, fetchSiteChangeOrders, fetchSiteMaterialInventory, fetchSiteMaterialRequests,
      fetchSitePaymentRequests, fetchSiteSafetyIncidents, fetchSiteDocuments, fetchSiteBudgetAnalytics]);


  const displaySite = currentSite || site;
  const isLoading = hookLoading && !currentSite;

  if (isLoading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', padding: '2rem'}}>
          <LoadingSpinner />
          <p>Loading site details...</p>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (hookError) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', padding: '2rem', background: '#ffebee', color: '#d32f2f'}}>
          <FaExclamationTriangle size={32} style={{ marginBottom: '1rem' }} />
          <h3>Error Loading Site Data</h3>
          <p>{hookError.message || "An unexpected error occurred while fetching data."}</p>
          <Button variant="secondary" onClick={onClose} style={{ marginTop: '1rem' }}>Close</Button>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (!displaySite) return null;

  const siteTasks = tasks.filter(task => task.site?._id === displaySite._id);

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatDate = (dateString) => dateString ? moment(dateString).format('MMM Do, YYYY') : 'N/A';
  const getStatusIcon = (status) => {
    switch (status) {
      case "Active": case "Completed": return <FaCheckCircle />;
      case "Delayed": case "On-Hold": case "Cancelled": return <FaExclamationTriangle />;
      case "Planning": return <FaCalendarAlt />;
      default: return <FaInfoCircle />;
    }
  };

  const handleEditTask = (task) => { setSelectedTask(task); setIsEditTaskModalOpen(true); };
  const handleViewTask = (task) => { setSelectedTask(task); setIsViewTaskModalOpen(true); };
  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      await deleteTask(id);
    }
  };
  const handleCreateTask = async (taskData) => { await createTask({ ...taskData, site: displaySite._id }); setIsAddTaskModalOpen(false);};
  const handleUpdateTask = async (id, taskData) => { await updateTask(id, taskData); setIsEditTaskModalOpen(false);};

  const handleAddMilestone = () => { setSelectedMilestone(null); setIsAddMilestoneModalOpen(true); };
  const handleEditMilestone = (milestone) => { setSelectedMilestone(milestone); setIsEditMilestoneModalOpen(true); };
  const handleDeleteMilestone = async (milestoneId) => {
    if (window.confirm("Are you sure you want to delete this milestone?")) {
      await deleteMilestone(displaySite._id, milestoneId);
    }
  };
  const handleSaveMilestone = async (milestoneData) => {
    if (selectedMilestone) { await updateMilestone(displaySite._id, selectedMilestone._id, milestoneData); }
    else { await createMilestone(displaySite._id, milestoneData); }
    setIsAddMilestoneModalOpen(false); setIsEditMilestoneModalOpen(false); setSelectedMilestone(null);
  };

  const handleAddChangeOrder = () => { setSelectedChangeOrder(null); setIsAddChangeOrderModalOpen(true); };
  const handleEditChangeOrder = (co) => { setSelectedChangeOrder(co); setIsEditChangeOrderModalOpen(true); };
  const handleViewChangeOrder = (co) => { setSelectedChangeOrder(co); setIsViewChangeOrderModalOpen(true); };
  const handleDeleteChangeOrder = async (coId) => {
    if (window.confirm("Are you sure you want to delete this change order?")) {
      await deleteChangeOrder(displaySite._id, coId);
    }
  };
  const handleSaveChangeOrder = async (coData) => {
    if (selectedChangeOrder) { await updateChangeOrder(displaySite._id, selectedChangeOrder._id, coData); }
    else { await createChangeOrder(displaySite._id, coData); }
    setIsAddChangeOrderModalOpen(false); setIsEditChangeOrderModalOpen(false); setSelectedChangeOrder(null);
  };

  const handleAddSiteMaterial = () => { setSelectedSiteMaterial(null); setIsAddSiteMaterialModalOpen(true); };
  const handleEditSiteMaterial = (material) => { setSelectedSiteMaterial(material); setIsEditSiteMaterialModalOpen(true); };
  const handleDeleteSiteMaterial = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this material from site inventory?")) {
      await deleteSiteMaterial(displaySite._id, itemId);
    }
  };
  const handleSaveSiteMaterial = async (materialData) => {
    if (selectedSiteMaterial) { await updateSiteMaterial(displaySite._id, selectedSiteMaterial._id, materialData); }
    else { await createSiteMaterial(displaySite._id, materialData); }
    setIsAddSiteMaterialModalOpen(false); setIsEditSiteMaterialModalOpen(false); setSelectedSiteMaterial(null);
  };

  const handleAddMaterialRequest = () => { setSelectedMaterialRequest(null); setIsAddMaterialRequestModalOpen(true); };
  const handleViewMaterialRequest = (req) => { setSelectedMaterialRequest(req); setIsViewMaterialRequestModalOpen(true); };
  const handleDeleteMaterialRequest = async (reqId) => {
    if (window.confirm("Are you sure you want to delete this material request?")) {
      await deleteMaterialRequest(displaySite._id, reqId);
    }
  };
  const handleSaveMaterialRequest = async (reqData) => {
    await createMaterialRequest(displaySite._id, reqData);
    setIsAddMaterialRequestModalOpen(false); setSelectedMaterialRequest(null);
  };
  const handleUpdateMaterialRequestStatus = async (reqId, status) => {
      await updateMaterialRequestStatus(displaySite._id, reqId, status);
  }

  const handleAddPaymentRequest = () => { setSelectedPaymentRequest(null); setIsAddPaymentRequestModalOpen(true); };
  const handleViewPaymentRequest = (req) => { setSelectedPaymentRequest(req); setIsViewPaymentRequestModalOpen(true); };
  const handleDeletePaymentRequest = async (reqId) => {
    if (window.confirm("Are you sure you want to delete this payment request?")) {
      await deletePaymentRequest(displaySite._id, reqId);
    }
  };
  const handleSavePaymentRequest = async (reqData) => {
    await createPaymentRequest(displaySite._id, reqData);
    setIsAddPaymentRequestModalOpen(false); setSelectedPaymentRequest(null);
  };
  const handleUpdatePaymentRequestStatus = async (reqId, status) => {
    await updatePaymentRequestStatus(displaySite._id, reqId, status);
  }

  const handleUploadDocumentClick = (refModel, refId) => { setDocumentRefContext({ refModel, refId }); setIsUploadDocumentModalOpen(true); };
  const handleDeleteDocument = async (docId, refModel, refId) => {
      if (window.confirm("Are you sure you want to delete this document?")) {
          await deleteDocument(docId, refModel, refId);
      }
  };

  const handleAddAssignedWorkerToSite = () => { setSelectedAssignedWorkerToSite(null); setIsAssignWorkerToSiteModalOpen(true); };
  const handleEditAssignedWorkerToSite = (assignment) => { setSelectedAssignedWorkerToSite(assignment); setIsEditAssignedWorkerToSiteModalOpen(true); };
  const handleUnassignWorkerFromSite = async (assignmentId) => {
    if (window.confirm("Are you sure you want to unassign this worker from this site? This only affects direct site assignment, not task assignments.")) {
      await unassignWorkerFromSite(displaySite._id, assignmentId);
    }
  };
  const handleSaveAssignedWorkerToSite = async (assignmentData) => {
    if (selectedAssignedWorkerToSite) { await updateSiteWorkerAssignment(displaySite._id, selectedAssignedWorkerToSite._id, assignmentData); }
    else { await assignWorkerToSite(displaySite._id, assignmentData); }
    setIsAssignWorkerToSiteModalOpen(false); setIsEditAssignedWorkerToSiteModalOpen(false); setSelectedAssignedWorkerToSite(null);
  };

  const handleAddSafetyIncident = () => { setSelectedSafetyIncident(null); setIsAddSafetyIncidentModalOpen(true); };
  const handleEditSafetyIncident = (incident) => { setSelectedSafetyIncident(incident); setIsEditSafetyIncidentModalOpen(true); };
  const handleViewSafetyIncident = (incident) => { setSelectedSafetyIncident(incident); setIsViewSafetyIncidentModalOpen(true); };
  const handleDeleteSafetyIncident = async (incidentId) => {
    if (window.confirm("Are you sure you want to delete this safety incident?")) {
      await deleteSafetyIncident(displaySite._id, incidentId);
    }
  };
  const handleSaveSafetyIncident = async (incidentData) => {
    if (selectedSafetyIncident) { await updateSafetyIncident(displaySite._id, selectedSafetyIncident._id, incidentData); }
    else { await createSafetyIncident(displaySite._id, incidentData); }
    setIsAddSafetyIncidentModalOpen(false); setIsEditSafetyIncidentModalOpen(false); setSelectedSafetyIncident(null);
  };


  return ReactDOM.createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{displaySite.name || "Site Details"}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <SectionTitle><FaBuilding /> Basic Site Information</SectionTitle>
          <DetailGrid>
            <DetailItem><DetailLabel><FaCode /> Project Code</DetailLabel><DetailValue>{displaySite.projectCode || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaBuilding /> Type</DetailLabel><DetailValue>{displaySite.type || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaMapMarkerAlt /> Location</DetailLabel><DetailValue>{displaySite.location || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaUsers /> Client Name</DetailLabel><DetailValue>{displaySite.clientName || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaUserTie /> Manager</DetailLabel><DetailValue>{displaySite.manager || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Start Date</DetailLabel><DetailValue>{formatDate(displaySite.startDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Expected End</DetailLabel><DetailValue>{formatDate(displaySite.endDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Actual End</DetailLabel><DetailValue>{formatDate(displaySite.actualEndDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaChartPie /> Progress</DetailLabel><DetailValue>{displaySite.progress}%</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Status</DetailLabel><DetailValue><StatusBadge status={displaySite.status}>{getStatusIcon(displaySite.status)} {displaySite.status}</StatusBadge></DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaHardHat /> Phase</DetailLabel><DetailValue>{displaySite.phase || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaLightbulb /> Risk Level</DetailLabel><DetailValue>{displaySite.riskLevel || 'N/A'}</DetailValue></DetailItem>
          </DetailGrid>
          {displaySite.description && (
             <DetailItem>
               <DetailLabel><FaInfoCircle /> Description</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{displaySite.description}</DetailValue>
             </DetailItem>
           )}
           {displaySite.notes && (
             <DetailItem>
               <DetailLabel><FaClipboardList /> Notes</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{displaySite.notes}</DetailValue>
             </DetailItem>
           )}

            <SectionTitle><FaDollarSign /> Financial Overview</SectionTitle>
            <DetailGrid>
                <DetailItem><DetailLabel>Contract Value</DetailLabel><DetailValue>{formatCurrency(displaySite.contractValue)}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>Total Budget</DetailLabel><DetailValue>{formatCurrency(displaySite.budget)}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>Total Expenditure</DetailLabel><DetailValue>{formatCurrency(displaySite.expenditure)}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>Remaining Budget</DetailLabel><DetailValue>{formatCurrency(displaySite.remainingBudget)}</DetailValue></DetailItem>
                {siteBudgetAnalytics && siteBudgetAnalytics.overall && (
                    <DetailItem><DetailLabel>Budget Variance</DetailLabel><DetailValue style={{color: siteBudgetAnalytics.overall.variance < 0 ? 'red' : 'green'}}>{formatCurrency(siteBudgetAnalytics.overall.variance)}</DetailValue></DetailItem>
                )}
            </DetailGrid>
            {displaySite.budgetDetails && displaySite.budgetDetails.length > 0 && (
                <>
                    <SectionTitle><FaFileInvoiceDollar /> Budget Breakdown</SectionTitle>
                    <ListContainer>
                        {displaySite.budgetDetails.map((item) => (
                            <li key={item._id || item.description} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                                <div><strong>{item.category}:</strong> {item.description}</div>
                                <div style={{marginLeft: 'auto'}}>
                                    Planned: {formatCurrency(item.plannedAmount)} | Actual: {formatCurrency(item.actualAmount)} | Variance: <span style={{color: (item.plannedAmount - item.actualAmount) < 0 ? 'red' : 'green'}}>{formatCurrency(item.plannedAmount - (item.actualAmount || 0))}</span>
                                </div>
                            </li>
                        ))}
                    </ListContainer>
                </>
            )}
            
            <SectionHeader>
                <SectionTitle><FaUserPlus /> Assigned Workers (Site)</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddAssignedWorkerToSite}>
                        <FaPlus /> Assign Worker
                    </Button>
                </SectionActions>
            </SectionHeader>
            {siteAssignedWorkers && siteAssignedWorkers.length > 0 ? (
                <ListContainer>
                    {siteAssignedWorkers.map((assignment) => (
                        <li key={assignment._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{assignment.worker?.fullName || 'N/A'}</strong> ({assignment.assignedRole || 'N/A'})
                                <br />
                                <small>Contact: {assignment.worker?.contactNumber || assignment.worker?.email || 'N/A'}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="Edit Assignment" onClick={() => handleEditAssignedWorkerToSite(assignment)}><FaEdit /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Unassign Worker" onClick={() => handleUnassignWorkerFromSite(assignment._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No workers directly assigned to this site yet.</p>
            )}


            <SectionHeader>
                <SectionTitle><FaTasks /> Tasks for This Site</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={() => setIsAddTaskModalOpen(true)}>
                        <FaPlus /> Add Task
                    </Button>
                </SectionActions>
            </SectionHeader>
            <TaskTable
                tasks={siteTasks}
                loading={hookLoading}
                pagination={{ page: 1, total: siteTasks.length, limit: siteTasks.length, totalPages: 1 }}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onView={handleViewTask}
                onPageChange={() => {}}
                hideSiteColumn={true}
            />

            <SectionHeader>
                <SectionTitle><FaGavel /> Milestones</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddMilestone}>
                        <FaPlus /> Add Milestone
                    </Button>
                </SectionActions>
            </SectionHeader>
            {siteMilestones && siteMilestones.length > 0 ? (
                <ListContainer>
                    {siteMilestones.map((milestone) => (
                        <li key={milestone._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{milestone.name}</strong> (Target: {formatDate(milestone.targetDate)})
                                {milestone.actualCompletionDate && ` | Completed: ${formatDate(milestone.actualCompletionDate)}`}
                                <br />
                                <small>{milestone.description}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <StatusBadge status={milestone.status}>{milestone.status}</StatusBadge>
                                <Button size="sm" variant="ghost" iconOnly title="Edit Milestone" onClick={() => handleEditMilestone(milestone)}><FaEdit /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Milestone" onClick={() => handleDeleteMilestone(milestone._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No milestones defined for this site.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaShoppingCart /> Change Orders</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddChangeOrder}>
                        <FaPlus /> Add Change Order
                    </Button>
                </SectionActions>
            </SectionHeader>
            {siteChangeOrders && siteChangeOrders.length > 0 ? (
                <ListContainer>
                    {siteChangeOrders.map((co) => (
                        <li key={co._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{co.title}</strong> (Requested By: {co.requestedBy?.fullName || co.requestedBy || 'N/A'})
                                <br />
                                <small>Cost: {formatCurrency(co.costImpact)} | Timeline: {co.timelineImpactDays} days</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <StatusBadge status={co.status}>{co.status}</StatusBadge>
                                <Button size="sm" variant="ghost" iconOnly title="View Change Order" onClick={() => handleViewChangeOrder(co)}><FaEye /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Edit Change Order" onClick={() => handleEditChangeOrder(co)}><FaEdit /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Change Order" onClick={() => handleDeleteChangeOrder(co._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No change orders for this site.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaTools /> Site Material Inventory</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddSiteMaterial}>
                        <FaPlus /> Add Material
                    </Button>
                </SectionActions>
            </SectionHeader>
            {siteMaterialInventory && siteMaterialInventory.length > 0 ? (
                <ListContainer>
                    {siteMaterialInventory.map((material) => (
                        <li key={material._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{material.materialName}</strong>: {material.quantityOnHand} {material.unit}
                                <br />
                                <small>Min Stock: {material.minStockLevel} | Last Updated: {formatDate(material.lastUpdated)}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="Edit Material" onClick={() => handleEditSiteMaterial(material)}><FaEdit /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Material" onClick={() => handleDeleteSiteMaterial(material._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No materials in site inventory.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaShoppingCart /> Material Requests</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddMaterialRequest}>
                        <FaPlus /> New Request
                    </Button>
                </SectionActions>
            </SectionHeader>
            {siteMaterialRequests && siteMaterialRequests.length > 0 ? (
                <ListContainer>
                    {siteMaterialRequests.map((req) => (
                        <li key={req._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{req.materialName}</strong>: {req.quantity} {req.unit} (Req. by: {req.requestedBy?.fullName || 'N/A'})
                                <br />
                                <small>Requested: {formatDate(req.requestDate)} | Required by: {formatDate(req.requiredByDate)}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <StatusBadge status={req.status}>{req.status}</StatusBadge>
                                <Button size="sm" variant="ghost" iconOnly title="View Request" onClick={() => handleViewMaterialRequest(req)}><FaEye /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Request" onClick={() => handleDeleteMaterialRequest(req._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No material requests for this site.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaMoneyBillWave /> Payment Requests</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddPaymentRequest}>
                        <FaPlus /> New Payment
                    </Button>
                </SectionActions>
            </SectionHeader>
            {sitePaymentRequests && sitePaymentRequests.length > 0 ? (
                <ListContainer>
                    {sitePaymentRequests.map((req) => (
                        <li key={req._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{formatCurrency(req.amount)}</strong> for {req.purpose} (Req. by: {req.requestedBy?.fullName || 'N/A'})
                                <br />
                                <small>Requested: {formatDate(req.requestDate)} | Invoice: {req.invoiceRef || 'N/A'}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <StatusBadge status={req.status}>{req.status}</StatusBadge>
                                <Button size="sm" variant="ghost" iconOnly title="View Payment Request" onClick={() => handleViewPaymentRequest(req)}><FaEye /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Payment Request" onClick={() => handleDeletePaymentRequest(req._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No payment requests for this site.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaHardHat /> Safety Incidents</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddSafetyIncident}>
                        <FaPlus /> Report Incident
                    </Button>
                </SectionActions>
            </SectionHeader>
            {siteSafetyIncidents && siteSafetyIncidents.length > 0 ? (
                <ListContainer>
                    {siteSafetyIncidents.map((incident) => (
                        <li key={incident._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{incident.title}</strong> on {formatDate(incident.incidentDate)} (Reported by: {incident.reportedBy?.fullName || 'N/A'})
                                <br />
                                <small>Severity: <StatusBadge status={incident.severity}>{incident.severity}</StatusBadge></small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="View Incident" onClick={() => handleViewSafetyIncident(incident)}><FaEye /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Edit Incident" onClick={() => handleEditSafetyIncident(incident)}><FaEdit /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Incident" onClick={() => handleDeleteSafetyIncident(incident._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No safety incidents reported for this site.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaPaperclip /> Documents</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={() => handleUploadDocumentClick('ConstructionSite', displaySite._id)}>
                        <FaFileUpload /> Upload Document
                    </Button>
                </SectionActions>
            </SectionHeader>
            {siteDocuments && siteDocuments.length > 0 ? (
                <ListContainer>
                    {siteDocuments.map((doc) => (
                        <li key={doc._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}><FaDownload /> {doc.fileName}</a></strong>
                                <br />
                                <small>Category: {doc.category} | Uploaded: {formatDate(doc.createdAt)}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Document" onClick={() => handleDeleteDocument(doc._id, 'ConstructionSite', displaySite._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No documents for this site.</p>
            )}

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooter>

        {isAddTaskModalOpen && (
            <AddEditTaskModal
                onClose={() => setIsAddTaskModalOpen(false)}
                onSave={handleCreateTask}
                loading={hookLoading}
                sites={allSites}
                allTasks={tasks}
                workers={workers}
            />
        )}
        {isEditTaskModalOpen && selectedTask && (
            <AddEditTaskModal
                onClose={() => setIsEditTaskModalOpen(false)}
                onSave={handleUpdateTask}
                loading={hookLoading}
                taskToEdit={selectedTask}
                sites={allSites}
                allTasks={tasks}
                workers={workers}
            />
        )}
        {isViewTaskModalOpen && selectedTask && (
            <ViewTaskModal
                onClose={() => setIsViewTaskModalOpen(false)}
                task={selectedTask}
            />
        )}

        {isAddMilestoneModalOpen && (
            <AddEditMilestoneModal
                onClose={() => setIsAddMilestoneModalOpen(false)}
                onSave={handleSaveMilestone}
                loading={hookLoading}
                siteId={displaySite._id}
            />
        )}
        {isEditMilestoneModalOpen && selectedMilestone && (
            <AddEditMilestoneModal
                onClose={() => setIsEditMilestoneModalOpen(false)}
                onSave={handleSaveMilestone}
                loading={hookLoading}
                siteId={displaySite._id}
                milestoneToEdit={selectedMilestone}
            />
        )}

        {isAddChangeOrderModalOpen && (
            <AddEditChangeOrderModal
                onClose={() => setIsAddChangeOrderModalOpen(false)}
                onSave={handleSaveChangeOrder}
                loading={hookLoading}
                siteId={displaySite._id}
                workers={workers}
            />
        )}
        {isEditChangeOrderModalOpen && selectedChangeOrder && (
            <AddEditChangeOrderModal
                onClose={() => setIsEditChangeOrderModalOpen(false)}
                onSave={handleSaveChangeOrder}
                loading={hookLoading}
                siteId={displaySite._id}
                changeOrderToEdit={selectedChangeOrder}
                workers={workers}
            />
        )}
        {isViewChangeOrderModalOpen && selectedChangeOrder && (
            <ViewChangeOrderModal
                onClose={() => setIsViewChangeOrderModalOpen(false)}
                changeOrder={selectedChangeOrder}
            />
        )}

        {isAddSiteMaterialModalOpen && (
            <AddEditSiteMaterialModal
                onClose={() => setIsAddSiteMaterialModalOpen(false)}
                onSave={handleSaveSiteMaterial}
                loading={hookLoading}
                siteId={displaySite._id}
            />
        )}
        {isEditSiteMaterialModalOpen && selectedSiteMaterial && (
            <AddEditSiteMaterialModal
                onClose={() => setIsEditSiteMaterialModalOpen(false)}
                onSave={handleSaveSiteMaterial}
                loading={hookLoading}
                siteId={displaySite._id}
                siteMaterialToEdit={selectedSiteMaterial}
            />
        )}

        {isAddMaterialRequestModalOpen && (
            <AddEditMaterialRequestModal
                onClose={() => setIsAddMaterialRequestModalOpen(false)}
                onSave={handleSaveMaterialRequest}
                loading={hookLoading}
                siteId={displaySite._id}
                workers={workers}
                siteMaterialInventory={siteMaterialInventory}
            />
        )}
        {isViewMaterialRequestModalOpen && selectedMaterialRequest && (
            <ViewMaterialRequestModal
                onClose={() => setIsViewMaterialRequestModalOpen(false)}
                materialRequest={selectedMaterialRequest}
                onUpdateStatus={handleUpdateMaterialRequestStatus}
            />
        )}

        {isAddPaymentRequestModalOpen && (
            <AddEditPaymentRequestModal
                onClose={() => setIsAddPaymentRequestModalOpen(false)}
                onSave={handleSavePaymentRequest}
                loading={hookLoading}
                siteId={displaySite._id}
                users={[{_id: 'mock-user-id', fullName: 'Current User'}]}
            />
        )}
        {isViewPaymentRequestModalOpen && selectedPaymentRequest && (
            <ViewPaymentRequestModal
                onClose={() => setIsViewPaymentRequestModalOpen(false)}
                paymentRequest={selectedPaymentRequest}
                onUpdateStatus={handleUpdatePaymentRequestStatus}
            />
        )}

        {isUploadDocumentModalOpen && (
            <UploadDocumentModal
                onClose={() => setIsUploadDocumentModalOpen(false)}
                onSave={uploadDocument}
                loading={hookLoading}
                refId={documentRefContext.refId}
                refModel={documentRefContext.refModel}
            />
        )}

        {isAssignWorkerToSiteModalOpen && (
            <AddEditAssignedWorkerToSiteModal
                onClose={() => setIsAssignWorkerToSiteModalOpen(false)}
                onSave={handleSaveAssignedWorkerToSite}
                loading={hookLoading}
                siteId={displaySite._id}
                allWorkers={workers}
            />
        )}
        {isEditAssignedWorkerToSiteModalOpen && selectedAssignedWorkerToSite && (
            <AddEditAssignedWorkerToSiteModal
                onClose={() => setIsEditAssignedWorkerToSiteModalOpen(false)}
                onSave={handleSaveAssignedWorkerToSite}
                loading={hookLoading}
                siteId={displaySite._id}
                assignmentToEdit={selectedAssignedWorkerToSite}
                allWorkers={workers}
            />
        )}

        {isAddSafetyIncidentModalOpen && (
            <AddEditSafetyIncidentModal
                onClose={() => setIsAddSafetyIncidentModalOpen(false)}
                onSave={handleSaveSafetyIncident}
                loading={hookLoading}
                siteId={displaySite._id}
                workers={workers}
            />
        )}
        {isEditSafetyIncidentModalOpen && selectedSafetyIncident && (
            <AddEditSafetyIncidentModal
                onClose={() => setIsEditSafetyIncidentModalOpen(false)}
                onSave={handleSaveSafetyIncident}
                loading={hookLoading}
                siteId={displaySite._id}
                safetyIncidentToEdit={selectedSafetyIncident}
                workers={workers}
            />
        )}
        {isViewSafetyIncidentModalOpen && selectedSafetyIncident && (
            <ViewSafetyIncidentModal
                onClose={() => setIsViewSafetyIncidentModalOpen(false)}
                safetyIncident={selectedSafetyIncident}
            />
        )}

      </ModalContent>
    </ModalOverlay>,
    document.body
  );
};

export default ViewSiteModal;