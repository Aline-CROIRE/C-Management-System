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
  FaHardHat, FaTools, FaCheckCircle, FaExclamationTriangle, FaFileInvoiceDollar, FaRegClock, FaCircle
} from 'react-icons/fa'; // FIX: Added FaExclamationTriangle, FaFileInvoiceDollar, FaRegClock, FaCircle
import toast from 'react-hot-toast';
import { constructionAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

// FIX: Import all the missing nested modals
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
  const [isAssignedWorkerModalOpen, setIsAssignedWorkerModalOpen] = useState(false);
  const [assignedWorkerToEdit, setAssignedWorkerToEdit] = useState(null);
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
