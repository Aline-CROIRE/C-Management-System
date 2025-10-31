// client/src/components/construction/ViewSiteModal.js
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components'; // Import css
import Modal from '../common/Modal';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import {
  FaTimes, FaEdit, FaTrash, FaPlus, FaCloudUploadAlt, FaFileAlt, FaDownload,
  FaCalendarAlt, FaDollarSign, FaChartLine, FaClipboardList, FaUsers, FaTasks,
  FaHardHat, FaTools, FaCheckCircle, FaExclamationTriangle, FaFileInvoiceDollar, FaRegClock, FaCircle, FaInfoCircle
} from 'react-icons/fa'; // FIX: All necessary icons imported
import toast from 'react-hot-toast';
import { constructionAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

// FIX: ALL MISSING MODAL IMPORTS ADDED. You MUST create these stub files.
import AddEditMilestoneModal from './modals/AddEditMilestoneModal';
import AddEditChangeOrderModal from './modals/AddEditChangeOrderModal';
import ViewChangeOrderModal from './modals/ViewChangeOrderModal';
import AddEditSiteMaterialModal from './modals/AddEditSiteMaterialModal';
import AddEditMaterialRequestModal from './modals/AddEditMaterialRequestModal';
import ViewMaterialRequestModal from './modals/ViewMaterialRequestModal';
import AddEditPaymentRequestModal from './modals/AddEditPaymentRequestModal';
import ViewPaymentRequestModal from './modals/ViewPaymentRequestModal';
import UploadDocumentModal from './modals/UploadDocumentModal';
import AddEditAssignedWorkerToSiteModal from './modals/AddEditAssignedWorkerToSiteModal';
import AddEditSafetyIncidentModal from './modals/AddEditSafetyIncidentModal';
import ViewSafetyIncidentModal from './modals/ViewSafetyIncidentModal';


const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${css`${spinAnimation}`} 1s linear infinite;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`;

const DetailItem = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f0f4f8"};
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  span {
    display: block;
    font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
    color: ${(props) => props.theme.colors?.textSecondary};
    font-weight: 600;
  }
  p {
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    color: ${(props) => props.theme.colors?.text};
    font-weight: 500;
    margin: 0.25rem 0 0 0;
  }
`;

const SectionHeader = styled.h4`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  color: ${(props) => props.theme.colors?.text};
  margin-top: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  padding-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`;

const ListContainer = styled(Card)`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`;

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
  border-bottom: 1px solid ${(props) => props.theme.colors?.borderLight};
  &:last-child {
    border-bottom: none;
  }
  p {
    margin: 0;
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    color: ${(props) => props.theme.colors?.text};
  }
  span {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary};
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  justify-content: flex-end;
  margin-top: ${(props) => props.theme.spacing?.xl || "2rem"};
`;

const ProgressMeter = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors?.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius?.full};
  height: 10px;
  margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${(props) => props.$progress}%;
  background-color: ${(props) => {
    if (props.$progress < 30) return props.theme.colors?.danger;
    if (props.$progress < 70) return props.theme.colors?.warning;
    return props.theme.colors?.success;
  }};
  border-radius: ${(props) => props.theme.borderRadius?.full};
  transition: width 0.5s ease-in-out;
`;

const RiskLevel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius?.full};
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  background-color: ${(props) => {
    switch (props.$level) {
      case 'low': return props.theme.colors?.success;
      case 'moderate': return props.theme.colors?.warning;
      case 'high': return props.theme.colors?.danger;
      case 'critical': return props.theme.colors?.error;
      default: return props.theme.colors?.textSecondary;
    }
  }};
`;

const DocumentPreview = styled.div`
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  .doc-icon {
    font-size: 2rem;
    color: ${(props) => props.theme.colors?.primary};
  }
`;

const TabContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const Tab = styled.button`
  flex: 1 1 auto;
  min-width: 130px;
  max-width: 180px;
  padding: 0.85rem 1.2rem;
  border: none;
  background: ${(props) => (props.$active ? props.theme.colors.primary : "transparent")};
  color: ${(props) => (props.$active ? "white" : props.theme.colors.textSecondary)};
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  white-space: nowrap;

  &:hover:not(:disabled):not(.$active) {
    background: ${(props) => props.theme.colors.surfaceLight};
    color: ${(props) => props.theme.colors.text};
  }
`;

const SiteOverview = styled.div`
  display: flex;
  flex-direction: column;
`;

const OverviewStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`;

const StatItem = styled.div`
  background: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  border: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .label {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary};
  }
  .value {
    font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${(props) => props.theme.colors?.primary};
    margin-top: 0.25rem;
  }
`;

const ProgressBarWrapper = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.full};
  height: 12px;
  margin-top: 0.5rem;
  overflow: hidden;
`;

const StyledProgressBar = styled.div`
  height: 100%;
  width: ${(props) => props.$progress}%;
  background-color: ${(props) => {
    if (props.$progress < 30) return props.theme.colors.danger;
    if (props.$progress < 70) return props.theme.colors.warning;
    return props.theme.colors.success;
  }};
  border-radius: ${(props) => props.theme.borderRadius.full};
  transition: width 0.5s ease-in-out;
`;

const BudgetProgress = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  color: ${(props) => props.theme.colors.textSecondary};
`;

const MilestoneItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.borderLight};
  &:last-child {
    border-bottom: none;
  }
  .milestone-info {
    display: flex;
    flex-direction: column;
  }
  .milestone-title {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold};
    color: ${(props) => props.theme.colors.text};
  }
  .milestone-date {
    font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
    color: ${(props) => props.theme.colors?.textSecondary};
  }
  .milestone-status {
    padding: 0.25rem 0.75rem;
    border-radius: ${(props) => props.theme.borderRadius?.full};
    font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
    font-weight: 600;
    color: white;
    background-color: ${(props) => (props.$completed ? props.theme.colors.success : props.theme.colors.warning)};
  }
`;

const DocumentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.borderLight};
  &:last-child {
    border-bottom: none;
  }
  .doc-info {
    display: flex;
    flex-direction: column;
  }
  .doc-name {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold};
    color: ${(props) => props.theme.colors.text};
  }
  .doc-date {
    font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
    color: ${(props) => props.theme.colors?.textSecondary};
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  }
`;

const RequestItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.borderLight};
  &:last-child {
    border-bottom: none;
  }
  .req-info {
    display: flex;
    flex-direction: column;
  }
  .req-type {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold};
    color: ${(props) => props.theme.colors.text};
  }
  .req-status {
    padding: 0.25rem 0.75rem;
    border-radius: ${(props) => props.theme.borderRadius?.full};
    font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
    font-weight: 600;
    color: white;
    background-color: ${(props) => {
      switch (props.$status) {
        case 'pending': return props.theme.colors.warning;
        case 'approved': return props.theme.colors.success;
        case 'rejected': return props.theme.colors.danger;
        default: return props.theme.colors.textSecondary;
      }
    }};
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  }
`;

const WorkerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.borderLight};
  &:last-child {
    border-bottom: none;
  }
  .worker-info {
    display: flex;
    flex-direction: column;
  }
  .worker-name {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold};
    color: ${(props) => props.theme.colors.text};
  }
  .worker-role {
    font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
    color: ${(props) => props.theme.colors?.textSecondary};
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  }
`;


const ViewSiteModal = ({ site, onClose, onEdit }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteDetails, setSiteDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // States for sub-modals
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState(null);
  const [isChangeOrderModalOpen, setIsChangeOrderModalOpen] = useState(false);
  const [changeOrderToEdit, setChangeOrderToEdit] = useState(null);
  const [isViewChangeOrderModalOpen, setIsViewChangeOrderModalOpen] = useState(false);
  const [viewingChangeOrder, setViewingChangeOrder] = useState(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState(null);
  const [isMaterialRequestModalOpen, setIsMaterialRequestModalOpen] = useState(false);
  const [materialRequestToEdit, setMaterialRequestToEdit] = useState(null);
  const [isViewMaterialRequestModalOpen, setIsViewMaterialRequestModalOpen] = useState(false);
  const [viewingMaterialRequest, setViewingMaterialRequest] = useState(null);
  const [isPaymentRequestModalOpen, setIsPaymentRequestModalOpen] = useState(false);
  const [paymentRequestToEdit, setPaymentRequestToEdit] = useState(null);
  const [isViewPaymentRequestModalOpen, setIsViewPaymentRequestModalOpen] = useState(false);
  const [viewingPaymentRequest, setViewingPaymentRequest] = useState(null);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [assignedWorkerToEdit, setAssignedWorkerToEdit] = useState(null);
  const [isAssignedWorkerModalOpen, setIsAssignedWorkerModalOpen] = useState(false);
  const [isSafetyIncidentModalOpen, setIsSafetyIncidentModalOpen] = useState(false);
  const [safetyIncidentToEdit, setSafetyIncidentToEdit] = useState(null);
  const [isViewSafetyIncidentModalOpen, setIsViewSafetyIncidentModalOpen] = useState(false);
  const [viewingSafetyIncident, setViewingSafetyIncident] = useState(null);


  const fetchSiteDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await constructionAPI.getSiteById(site._id);
      if (response?.success) {
        setSiteDetails(response.data);
      } else {
        setError(response?.message || 'Failed to fetch site details.');
        toast.error(response?.message || 'Failed to fetch site details.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching site details.');
      toast.error(err.message || 'An error occurred fetching site details.');
    } finally {
      setLoading(false);
    }
  }, [site._id]);

  useEffect(() => {
    fetchSiteDetails();
  }, [fetchSiteDetails]);

  // Handlers for milestones
  const handleAddEditMilestone = async (milestoneData) => {
    try {
      if (milestoneToEdit) {
        await constructionAPI.updateMilestone(site._id, milestoneToEdit._id, milestoneData);
        toast.success('Milestone updated successfully!');
      } else {
        await constructionAPI.createMilestone(site._id, milestoneData);
        toast.success('Milestone added successfully!');
      }
      fetchSiteDetails();
      setIsMilestoneModalOpen(false);
      setMilestoneToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save milestone.');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        await constructionAPI.deleteMilestone(site._id, milestoneId);
        toast.success('Milestone deleted successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete milestone.');
      }
    }
  };

  // Handlers for change orders
  const handleAddEditChangeOrder = async (changeOrderData) => {
    try {
      if (changeOrderToEdit) {
        await constructionAPI.updateChangeOrder(site._id, changeOrderToEdit._id, changeOrderData);
        toast.success('Change order updated successfully!');
      } else {
        await constructionAPI.createChangeOrder(site._id, changeOrderData);
        toast.success('Change order added successfully!');
      }
      fetchSiteDetails();
      setIsChangeOrderModalOpen(false);
      setChangeOrderToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save change order.');
    }
  };

  const handleDeleteChangeOrder = async (changeOrderId) => {
    if (window.confirm('Are you sure you want to delete this change order?')) {
      try {
        await constructionAPI.deleteChangeOrder(site._id, changeOrderId);
        toast.success('Change order deleted successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete change order.');
      }
    }
  };

  const handleViewChangeOrder = (changeOrder) => {
    setViewingChangeOrder(changeOrder);
    setIsViewChangeOrderModalOpen(true);
  };

  // Handlers for site materials
  const handleAddEditSiteMaterial = async (materialData) => {
    try {
      if (materialToEdit) {
        await constructionAPI.updateSiteMaterial(site._id, materialToEdit._id, materialData);
        toast.success('Material updated successfully!');
      } else {
        await constructionAPI.createSiteMaterial(site._id, materialData);
        toast.success('Material added successfully!');
      }
      fetchSiteDetails();
      setIsMaterialModalOpen(false);
      setMaterialToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save material.');
    }
  };

  const handleDeleteSiteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await constructionAPI.deleteSiteMaterial(site._id, materialId);
        toast.success('Material deleted successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete material.');
      }
    }
  };

  // Handlers for material requests
  const handleAddEditMaterialRequest = async (requestData) => {
    try {
      if (materialRequestToEdit) {
        await constructionAPI.updateMaterialRequestStatus(site._id, materialRequestToEdit._id, requestData.status);
        toast.success('Material request updated successfully!');
      } else {
        await constructionAPI.createMaterialRequest(site._id, requestData);
        toast.success('Material request added successfully!');
      }
      fetchSiteDetails();
      setIsMaterialRequestModalOpen(false);
      setMaterialRequestToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save material request.');
    }
  };

  const handleDeleteMaterialRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this material request?')) {
      try {
        await constructionAPI.deleteMaterialRequest(site._id, requestId);
        toast.success('Material request deleted successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete material request.');
      }
    }
  };

  const handleViewMaterialRequest = (request) => {
    setViewingMaterialRequest(request);
    setIsViewMaterialRequestModalOpen(true);
  };

  // Handlers for payment requests
  const handleAddEditPaymentRequest = async (requestData) => {
    try {
      if (paymentRequestToEdit) {
        await constructionAPI.updatePaymentRequestStatus(site._id, paymentRequestToEdit._id, requestData.status);
        toast.success('Payment request updated successfully!');
      } else {
        await constructionAPI.createPaymentRequest(site._id, requestData);
        toast.success('Payment request added successfully!');
      }
      fetchSiteDetails();
      setIsPaymentRequestModalOpen(false);
      setPaymentRequestToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save payment request.');
    }
  };

  const handleDeletePaymentRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this payment request?')) {
      try {
        await constructionAPI.deletePaymentRequest(site._id, requestId);
        toast.success('Payment request deleted successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete payment request.');
      }
    }
  };

  const handleViewPaymentRequest = (request) => {
    setViewingPaymentRequest(request);
    setIsViewPaymentRequestModalOpen(true);
  };

  // Handlers for documents
  const handleUploadDocument = async (formData) => {
    try {
      await constructionAPI.uploadDocument(formData);
      toast.success('Document uploaded successfully!');
      fetchSiteDetails();
      setIsUploadDocumentModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to upload document.');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await constructionAPI.deleteDocument(documentId);
        toast.success('Document deleted successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete document.');
      }
    }
  };

  const handleAddEditAssignedWorker = async (assignmentData) => {
    try {
      if (assignedWorkerToEdit) {
        await constructionAPI.updateSiteWorkerAssignment(site._id, assignedWorkerToEdit._id, assignmentData);
        toast.success('Worker assignment updated successfully!');
      } else {
        await constructionAPI.assignWorkerToSite(site._id, assignmentData);
        toast.success('Worker assigned successfully!');
      }
      fetchSiteDetails();
      setIsAssignedWorkerModalOpen(false);
      setAssignedWorkerToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save worker assignment.');
    }
  };

  const handleUnassignWorker = async (assignmentId) => {
    if (window.confirm('Are you sure you want to unassign this worker?')) {
      try {
        await constructionAPI.unassignWorkerFromSite(site._id, assignmentId);
        toast.success('Worker unassigned successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to unassign worker.');
      }
    }
  };

  const handleAddEditSafetyIncident = async (incidentData) => {
    try {
      if (safetyIncidentToEdit) {
        await constructionAPI.updateSafetyIncident(site._id, safetyIncidentToEdit._id, incidentData);
        toast.success('Safety incident updated successfully!');
      } else {
        await constructionAPI.createSafetyIncident(site._id, incidentData);
        toast.success('Safety incident added successfully!');
      }
      fetchSiteDetails();
      setIsSafetyIncidentModalOpen(false);
      setSafetyIncidentToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save safety incident.');
    }
  };

  const handleViewSafetyIncident = (incident) => {
    setViewingSafetyIncident(incident);
    setIsViewSafetyIncidentModalOpen(true);
  };

  const handleDeleteSafetyIncident = async (incidentId) => {
    if (window.confirm('Are you sure you want to delete this safety incident?')) {
      try {
        await constructionAPI.deleteSafetyIncident(site._id, incidentId);
        toast.success('Safety incident deleted successfully!');
        fetchSiteDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete safety incident.');
      }
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!siteDetails) {
    return <p>No site details available.</p>;
  }

  // Calculate days remaining
  const daysRemaining = siteDetails.endDate ? Math.ceil((new Date(siteDetails.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A';
  const budgetUsed = (siteDetails.budget - siteDetails.currentBudget) || 0; // Assuming currentBudget is remaining budget
  const budgetUtilization = siteDetails.budget > 0 ? ((budgetUsed / siteDetails.budget) * 100).toFixed(2) : 0;

  return (
    <Modal title={`Site Details: ${siteDetails.name}`} onClose={onClose}>
      <Button onClick={onEdit} style={{ position: 'absolute', top: '1.5rem', right: '5rem' }}><FaEdit /> Edit Site</Button>
      <TabContainer>
        <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</Tab>
        <Tab $active={activeTab === 'milestones'} onClick={() => setActiveTab('milestones')}>Milestones</Tab>
        <Tab $active={activeTab === 'changeOrders'} onClick={() => setActiveTab('changeOrders')}>Change Orders</Tab>
        <Tab $active={activeTab === 'materials'} onClick={() => setActiveTab('materials')}>Materials</Tab>
        <Tab $active={activeTab === 'materialRequests'} onClick={() => setActiveTab('materialRequests')}>Material Requests</Tab>
        <Tab $active={activeTab === 'paymentRequests'} onClick={() => setActiveTab('paymentRequests')}>Payment Requests</Tab>
        <Tab $active={activeTab === 'documents'} onClick={() => setActiveTab('documents')}>Documents</Tab>
        <Tab $active={activeTab === 'workers'} onClick={() => setActiveTab('workers')}>Assigned Workers</Tab>
        <Tab $active={activeTab === 'safety'} onClick={() => setActiveTab('safety')}>Safety Incidents</Tab>
        {/* Add more tabs for other related data like equipment, tasks, etc. */}
      </TabContainer>

      {activeTab === 'overview' && (
        <SiteOverview>
          <DetailGrid>
            <DetailItem><span>Location</span><p>{siteDetails.location}</p></DetailItem>
            <DetailItem><span>Start Date</span><p>{new Date(siteDetails.startDate).toLocaleDateString()}</p></DetailItem>
            <DetailItem><span>End Date</span><p>{new Date(siteDetails.endDate).toLocaleDateString()}</p></DetailItem>
            <DetailItem><span>Days Remaining</span><p>{daysRemaining}</p></DetailItem>
            <DetailItem><span>Total Budget</span><p>${siteDetails.budget.toLocaleString()}</p></DetailItem>
            <DetailItem><span>Budget Spent</span><p>${budgetUsed.toLocaleString()}</p></DetailItem>
            <DetailItem><span>Budget Utilization</span><p>{budgetUtilization}%</p></DetailItem>
            <DetailItem><span>Status</span><p>{siteDetails.status}</p></DetailItem>
            <DetailItem><span>Progress</span>
                <ProgressMeter><ProgressBar $progress={siteDetails.progress} /></ProgressMeter>
                <span style={{marginTop: '0.25rem'}}>{siteDetails.progress}%</span>
            </DetailItem>
            <DetailItem><span>Risk Level</span><RiskLevel $level={siteDetails.currentRiskLevel}>{siteDetails.currentRiskLevel}</RiskLevel></DetailItem>
            <DetailItem><span>Safety Incidents</span><p>{siteDetails.safetyIncidents}</p></DetailItem>
            <DetailItem><span>Waste Generated</span><p>{siteDetails.wasteGenerated} kg</p></DetailItem>
          </DetailGrid>
          <SectionHeader><FaInfoCircle /> Description</SectionHeader>
          <p>{siteDetails.description}</p>
          <SectionHeader><FaExclamationTriangle /> Risk Description</SectionHeader>
          <p>{siteDetails.riskDescription}</p>
        </SiteOverview>
      )}

      {activeTab === 'milestones' && (
        <ListContainer>
          <SectionHeader><FaTasks /> Milestones <Button size="sm" onClick={() => setIsMilestoneModalOpen(true)}><FaPlus /> Add</Button></SectionHeader>
          {siteDetails.milestones?.length > 0 ? (
            siteDetails.milestones.map(milestone => (
              <MilestoneItem key={milestone._id}>
                <div className="milestone-info">
                  <p className="milestone-title">{milestone.name}</p>
                  <span className="milestone-date">Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span className="milestone-status" $completed={milestone.isCompleted}>{milestone.isCompleted ? 'Completed' : 'Pending'}</span>
                  <div className="actions">
                    <Button size="sm" variant="secondary" onClick={() => { setMilestoneToEdit(milestone); setIsMilestoneModalOpen(true); }}><FaEdit /></Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteMilestone(milestone._id)}><FaTrash /></Button>
                  </div>
                </div>
              </MilestoneItem>
            ))
          ) : (
            <p>No milestones added yet.</p>
          )}
        </ListContainer>
      )}

      {activeTab === 'changeOrders' && (
        <ListContainer>
          <SectionHeader><FaClipboardList /> Change Orders <Button size="sm" onClick={() => setIsChangeOrderModalOpen(true)}><FaPlus /> Add</Button></SectionHeader>
          {siteDetails.changeOrders?.length > 0 ? (
            siteDetails.changeOrders.map(order => (
              <ListItem key={order._id}>
                <div className="milestone-info">
                  <p className="milestone-title">{order.title}</p>
                  <span className="milestone-date">Status: {order.status} | Cost: ${order.costImpact.toLocaleString()}</span>
                </div>
                <div className="actions">
                  <Button size="sm" variant="info" onClick={() => handleViewChangeOrder(order)}><FaEye /></Button>
                  <Button size="sm" variant="secondary" onClick={() => { setChangeOrderToEdit(order); setIsChangeOrderModalOpen(true); }}><FaEdit /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteChangeOrder(order._id)}><FaTrash /></Button>
                </div>
              </ListItem>
            ))
          ) : (
            <p>No change orders added yet.</p>
          )}
        </ListContainer>
      )}
      
      {activeTab === 'materials' && (
        <ListContainer>
          <SectionHeader><FaHardHat /> Site Material Inventory <Button size="sm" onClick={() => setIsMaterialModalOpen(true)}><FaPlus /> Add</Button></SectionHeader>
          {siteDetails.materialInventory?.length > 0 ? (
            siteDetails.materialInventory.map(material => (
              <ListItem key={material._id}>
                <div className="milestone-info">
                  <p className="milestone-title">{material.name}</p>
                  <span className="milestone-date">Quantity: {material.quantity} {material.unit} | Cost: ${material.cost.toLocaleString()}</span>
                </div>
                <div className="actions">
                  <Button size="sm" variant="secondary" onClick={() => { setMaterialToEdit(material); setIsMaterialModalOpen(true); }}><FaEdit /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteSiteMaterial(material._id)}><FaTrash /></Button>
                </div>
              </ListItem>
            ))
          ) : (
            <p>No materials added to site inventory yet.</p>
          )}
        </ListContainer>
      )}

      {activeTab === 'materialRequests' && (
        <ListContainer>
          <SectionHeader><FaTools /> Material Requests <Button size="sm" onClick={() => setIsMaterialRequestModalOpen(true)}><FaPlus /> Create Request</Button></SectionHeader>
          {siteDetails.materialRequests?.length > 0 ? (
            siteDetails.materialRequests.map(request => (
              <RequestItem key={request._id} $status={request.status}>
                <div className="req-info">
                  <p className="req-type">{request.materialName}</p>
                  <span className="milestone-date">Quantity: {request.quantity} {request.unit} | Status: {request.status}</span>
                </div>
                <div className="actions">
                  <Button size="sm" variant="info" onClick={() => handleViewMaterialRequest(request)}><FaEye /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteMaterialRequest(request._id)}><FaTrash /></Button>
                </div>
              </RequestItem>
            ))
          ) : (
            <p>No material requests made yet.</p>
          )}
        </ListContainer>
      )}

      {activeTab === 'paymentRequests' && (
        <ListContainer>
          <SectionHeader><FaFileInvoiceDollar /> Payment Requests <Button size="sm" onClick={() => setIsPaymentRequestModalOpen(true)}><FaPlus /> Create Request</Button></SectionHeader>
          {siteDetails.paymentRequests?.length > 0 ? (
            siteDetails.paymentRequests.map(request => (
              <RequestItem key={request._id} $status={request.status}>
                <div className="req-info">
                  <p className="req-type">{request.reason}</p>
                  <span className="milestone-date">Amount: ${request.amount.toLocaleString()} | Status: {request.status}</span>
                </div>
                <div className="actions">
                  <Button size="sm" variant="info" onClick={() => handleViewPaymentRequest(request)}><FaEye /></Button>
                  <Button size="sm" variant="secondary" onClick={() => { setPaymentRequestToEdit(request); setIsPaymentRequestModalOpen(true); }}><FaEdit /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeletePaymentRequest(request._id)}><FaTrash /></Button>
                </div>
              </RequestItem>
            ))
          ) : (
            <p>No payment requests made yet.</p>
          )}
        </ListContainer>
      )}

      {activeTab === 'documents' && (
        <ListContainer>
          <SectionHeader><FaFileAlt /> Site Documents <Button size="sm" onClick={() => setIsUploadDocumentModalOpen(true)}><FaCloudUploadAlt /> Upload</Button></SectionHeader>
          {siteDetails.documents?.length > 0 ? (
            siteDetails.documents.map(doc => (
              <DocumentItem key={doc._id}>
                <div className="doc-info">
                  <p className="doc-name">{doc.fileName}</p>
                  <span className="doc-date">Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                </div>
                <div className="actions">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="info"><FaDownload /> View</Button>
                  </a>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteDocument(doc._id)}><FaTrash /></Button>
                </div>
              </DocumentItem>
            ))
          ) : (
            <p>No documents uploaded yet.</p>
          )}
        </ListContainer>
      )}

      {activeTab === 'workers' && (
        <ListContainer>
          <SectionHeader><FaUsers /> Assigned Workers <Button size="sm" onClick={() => setIsAssignedWorkerModalOpen(true)}><FaPlus /> Assign Worker</Button></SectionHeader>
          {siteDetails.assignedWorkers?.length > 0 ? (
            siteDetails.assignedWorkers.map(assignment => (
              <WorkerItem key={assignment._id}>
                <div className="worker-info">
                  <p className="worker-name">{assignment.worker?.name || 'Unknown Worker'}</p> {/* Assuming worker object has a 'name' */}
                  <span className="worker-role">Role: {assignment.role}</span>
                </div>
                <div className="actions">
                  <Button size="sm" variant="secondary" onClick={() => { setAssignedWorkerToEdit(assignment); setIsAssignedWorkerModalOpen(true); }}><FaEdit /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleUnassignWorker(assignment._id)}><FaTrash /> Unassign</Button>
                </div>
              </WorkerItem>
            ))
          ) : (
            <p>No workers assigned to this site yet.</p>
          )}
        </ListContainer>
      )}
      
      {activeTab === 'safety' && (
        <ListContainer>
          <SectionHeader><FaExclamationTriangle /> Safety Incidents <Button size="sm" onClick={() => setIsSafetyIncidentModalOpen(true)}><FaPlus /> Report Incident</Button></SectionHeader>
          {siteDetails.safetyIncidentsList?.length > 0 ? (
            siteDetails.safetyIncidentsList.map(incident => (
              <ListItem key={incident._id}>
                <div className="milestone-info">
                  <p className="milestone-title">{incident.type}</p>
                  <span className="milestone-date">Date: {new Date(incident.date).toLocaleDateString()} | Severity: {incident.severity}</span>
                </div>
                <div className="actions">
                  <Button size="sm" variant="info" onClick={() => handleViewSafetyIncident(incident)}><FaEye /></Button>
                  <Button size="sm" variant="secondary" onClick={() => { setSafetyIncidentToEdit(incident); setIsSafetyIncidentModalOpen(true); }}><FaEdit /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteSafetyIncident(incident._id)}><FaTrash /></Button>
                </div>
              </ListItem>
            ))
          ) : (
            <p>No safety incidents reported yet.</p>
          )}
        </ListContainer>
      )}


      {/* Modals for different entities */}
      {isMilestoneModalOpen && (
        <AddEditMilestoneModal
          siteId={site._id}
          milestoneToEdit={milestoneToEdit}
          onClose={() => { setIsMilestoneModalOpen(false); setMilestoneToEdit(null); }}
          onSave={handleAddEditMilestone}
        />
      )}
      {isChangeOrderModalOpen && (
        <AddEditChangeOrderModal
          siteId={site._id}
          changeOrderToEdit={changeOrderToEdit}
          onClose={() => { setIsChangeOrderModalOpen(false); setChangeOrderToEdit(null); }}
          onSave={handleAddEditChangeOrder}
        />
      )}
      {isViewChangeOrderModalOpen && (
        <ViewChangeOrderModal
          changeOrder={viewingChangeOrder}
          onClose={() => { setIsViewChangeOrderModalOpen(false); setViewingChangeOrder(null); }}
        />
      )}
      {isMaterialModalOpen && (
        <AddEditSiteMaterialModal
          siteId={site._id}
          materialToEdit={materialToEdit}
          onClose={() => { setIsMaterialModalOpen(false); setMaterialToEdit(null); }}
          onSave={handleAddEditSiteMaterial}
        />
      )}
      {isMaterialRequestModalOpen && (
        <AddEditMaterialRequestModal
          siteId={site._id}
          requestToEdit={materialRequestToEdit}
          onClose={() => { setIsMaterialRequestModalOpen(false); setMaterialRequestToEdit(null); }}
          onSave={handleAddEditMaterialRequest}
        />
      )}
      {isViewMaterialRequestModalOpen && (
        <ViewMaterialRequestModal
          request={viewingMaterialRequest}
          onClose={() => { setIsViewMaterialRequestModalOpen(false); setViewingMaterialRequest(null); }}
        />
      )}
      {isPaymentRequestModalOpen && (
        <AddEditPaymentRequestModal
          siteId={site._id}
          requestToEdit={paymentRequestToEdit}
          onClose={() => { setIsPaymentRequestModalOpen(false); setPaymentRequestToEdit(null); }}
          onSave={handleAddEditPaymentRequest}
        />
      )}
      {isViewPaymentRequestModalOpen && (
        <ViewPaymentRequestModal
          request={viewingPaymentRequest}
          onClose={() => { setIsViewPaymentRequestModalOpen(false); setViewingPaymentRequest(null); }}
        />
      )}
      {isUploadDocumentModalOpen && (
        <UploadDocumentModal
          siteId={site._id}
          onClose={() => setIsUploadDocumentModalOpen(false)}
          onUpload={handleUploadDocument}
          refModel="ConstructionSite"
          refId={site._id}
        />
      )}
      {isAssignedWorkerModalOpen && (
        <AddEditAssignedWorkerToSiteModal
          siteId={site._id}
          assignmentToEdit={assignedWorkerToEdit}
          onClose={() => { setIsAssignedWorkerModalOpen(false); setAssignedWorkerToEdit(null); }}
          onSave={handleAddEditAssignedWorker}
        />
      )}
      {isSafetyIncidentModalOpen && (
        <AddEditSafetyIncidentModal
          siteId={site._id}
          incidentToEdit={safetyIncidentToEdit}
          onClose={() => { setIsSafetyIncidentModalOpen(false); setSafetyIncidentToEdit(null); }}
          onSave={handleAddEditSafetyIncident}
        />
      )}
      {isViewSafetyIncidentModalOpen && (
        <ViewSafetyIncidentModal
          incident={viewingSafetyIncident}
          onClose={() => { setIsViewSafetyIncidentModalOpen(false); setViewingSafetyIncident(null); }}
        />
      )}

    </Modal>
  );
};

export default ViewSiteModal;
