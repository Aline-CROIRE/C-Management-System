// client/src/components/construction/worker-management/ViewWorkerModal.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import Modal from "../../common/Modal";
import Button from "../../common/Button";
import Card from "../../common/Card";
import {
  FaTimes, FaEdit, FaTrash, FaPlus, FaCalendarAlt, FaAward, FaTools, FaRegClock, FaExclamationTriangle
} from "react-icons/fa"; // FIX: Added FaExclamationTriangle
import toast from "react-hot-toast";
import { constructionAPI } from "../../../services/api"; // Corrected relative path
import LoadingSpinner from "../../common/LoadingSpinner"; // Corrected relative path

// Missing Modals for worker certifications, timesheets, and maintenance logs
// FIX: Add these imports if you have these modal components
// import AddEditCertificationModal from './modals/AddEditCertificationModal';
// import AddEditTimesheetModal from './modals/AddEditTimesheetModal';
// import AddEditMaintenanceLogModal from './modals/AddEditMaintenanceLogModal';


const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius?.full};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  font-weight: 600;
  color: white;
  background-color: ${(props) => {
    switch (props.$type) {
      case 'completed': return props.theme.colors?.success;
      case 'pending': return props.theme.colors?.warning;
      case 'overdue': return props.theme.colors?.danger;
      default: return props.theme.colors?.info;
    }
  }};
`;

const ViewWorkerModal = ({ worker, onClose, onEdit }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workerDetails, setWorkerDetails] = useState(null);

  // States for sub-modals (uncomment and import if you have these components)
  // const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  // const [certificationToEdit, setCertificationToEdit] = useState(null);
  // const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  // const [timesheetToEdit, setTimesheetToEdit] = useState(null);
  // const [isMaintenanceLogModalOpen, setIsMaintenanceLogModalOpen] = useState(false);
  // const [maintenanceLogToEdit, setMaintenanceLogToEdit] = useState(null);


  const fetchWorkerDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await constructionAPI.getWorkerById(worker._id);
      if (response?.success) {
        setWorkerDetails(response.data);
      } else {
        setError(response?.message || 'Failed to fetch worker details.');
        toast.error(response?.message || 'Failed to fetch worker details.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching worker details.');
      toast.error(err.message || 'An error occurred fetching worker details.');
    } finally {
      setLoading(false);
    }
  }, [worker._id]);

  useEffect(() => {
    fetchWorkerDetails();
  }, [fetchWorkerDetails]);

  // Handlers for certifications (uncomment and implement if you have the modals)
  /*
  const handleAddEditCertification = async (certData) => {
    try {
      if (certificationToEdit) {
        await constructionAPI.updateCertification(worker._id, certificationToEdit._id, certData);
        toast.success('Certification updated successfully!');
      } else {
        await constructionAPI.createCertification(worker._id, certData);
        toast.success('Certification added successfully!');
      }
      fetchWorkerDetails();
      setIsCertificationModalOpen(false);
      setCertificationToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save certification.');
    }
  };

  const handleDeleteCertification = async (certId) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      try {
        await constructionAPI.deleteCertification(worker._id, certId);
        toast.success('Certification deleted successfully!');
        fetchWorkerDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete certification.');
      }
    }
  };

  // Handlers for timesheets
  const handleAddEditTimesheet = async (timesheetData) => {
    try {
      if (timesheetToEdit) {
        await constructionAPI.updateTimesheet(worker._id, timesheetToEdit._id, timesheetData);
        toast.success('Timesheet updated successfully!');
      } else {
        await constructionAPI.createTimesheet(worker._id, timesheetData);
        toast.success('Timesheet added successfully!');
      }
      fetchWorkerDetails();
      setIsTimesheetModalOpen(false);
      setTimesheetToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save timesheet.');
    }
  };

  const handleDeleteTimesheet = async (timesheetId) => {
    if (window.confirm('Are you sure you want to delete this timesheet?')) {
      try {
        await constructionAPI.deleteTimesheet(worker._id, timesheetId);
        toast.success('Timesheet deleted successfully!');
        fetchWorkerDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete timesheet.');
      }
    }
  };

  const handleUpdateTimesheetStatus = async (timesheetId, newStatus) => {
    try {
      await constructionAPI.updateTimesheetStatus(worker._id, timesheetId, newStatus);
      toast.success('Timesheet status updated!');
      fetchWorkerDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update timesheet status.');
    }
  };

  // Handlers for equipment maintenance logs
  const handleAddEditMaintenanceLog = async (logData) => {
    try {
      if (maintenanceLogToEdit) {
        await constructionAPI.updateMaintenanceLog(worker._id, maintenanceLogToEdit._id, logData); // Assuming worker has equipment
        toast.success('Maintenance log updated successfully!');
      } else {
        await constructionAPI.createMaintenanceLog(worker._id, logData); // Assuming worker has equipment
        toast.success('Maintenance log added successfully!');
      }
      fetchWorkerDetails();
      setIsMaintenanceLogModalOpen(false);
      setMaintenanceLogToEdit(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save maintenance log.');
    }
  };

  const handleDeleteMaintenanceLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this maintenance log?')) {
      try {
        await constructionAPI.deleteMaintenanceLog(worker._id, logId); // Assuming worker has equipment
        toast.success('Maintenance log deleted successfully!');
        fetchWorkerDetails();
      } catch (err) {
        toast.error(err.message || 'Failed to delete maintenance log.');
      }
    }
  };
  */

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!workerDetails) {
    return <p>No worker details available.</p>;
  }

  return (
    <Modal title={`Worker Details: ${workerDetails.name}`} onClose={onClose}>
      <Button onClick={onEdit} style={{ position: 'absolute', top: '1.5rem', right: '5rem' }}><FaEdit /> Edit Worker</Button>

      <DetailGrid>
        <DetailItem><span>Name</span><p>{workerDetails.name}</p></DetailItem>
        <DetailItem><span>Role</span><p>{workerDetails.role}</p></DetailItem>
        <DetailItem><span>Phone</span><p>{workerDetails.phone}</p></DetailItem>
        <DetailItem><span>Email</span><p>{workerDetails.email}</p></DetailItem>
        <DetailItem><span>Assigned Site</span><p>{workerDetails.assignedSite?.name || 'N/A'}</p></DetailItem>
        <DetailItem><span>Status</span><p>{workerDetails.status}</p></DetailItem>
        <DetailItem><span>Hire Date</span><p>{new Date(workerDetails.hireDate).toLocaleDateString()}</p></DetailItem>
        <DetailItem><span>Emergency Contact</span><p>{workerDetails.emergencyContactName} ({workerDetails.emergencyContactPhone})</p></DetailItem>
        <DetailItem><span>Skills</span><p>{workerDetails.skills?.join(', ') || 'N/A'}</p></DetailItem>
      </DetailGrid>

      <SectionHeader><FaAward /> Certifications</SectionHeader>
      <ListContainer>
        {workerDetails.certifications?.length > 0 ? (
          workerDetails.certifications.map(cert => (
            <ListItem key={cert._id}>
              <div className="milestone-info">
                <p className="milestone-title">{cert.name}</p>
                <span className="milestone-date">Expires: {new Date(cert.expirationDate).toLocaleDateString()}</span>
              </div>
              <div className="actions">
                {/* Uncomment and enable if modals are available */}
                {/* <Button size="sm" variant="secondary" onClick={() => { setCertificationToEdit(cert); setIsCertificationModalOpen(true); }}><FaEdit /></Button> */}
                {/* <Button size="sm" variant="danger" onClick={() => handleDeleteCertification(cert._id)}><FaTrash /></Button> */}
              </div>
            </ListItem>
          ))
        ) : (
          <p>No certifications added yet.</p>
          // <Button size="sm" onClick={() => setIsCertificationModalOpen(true)}><FaPlus /> Add Certification</Button>
        )}
      </ListContainer>

      <SectionHeader><FaRegClock /> Timesheets</SectionHeader>
      <ListContainer>
        {workerDetails.timesheets?.length > 0 ? (
          workerDetails.timesheets.map(timesheet => (
            <ListItem key={timesheet._id}>
              <div className="milestone-info">
                <p className="milestone-title">Week of {new Date(timesheet.weekStartDate).toLocaleDateString()}</p>
                <span className="milestone-date">Hours: {timesheet.totalHours} | Status: <Badge $type={timesheet.status === 'approved' ? 'completed' : 'pending'}>{timesheet.status}</Badge></span>
              </div>
              <div className="actions">
                {/* <Button size="sm" variant="secondary" onClick={() => { setTimesheetToEdit(timesheet); setIsTimesheetModalOpen(true); }}><FaEdit /></Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteTimesheet(timesheet._id)}><FaTrash /></Button>
                {timesheet.status !== 'approved' && <Button size="sm" variant="success" onClick={() => handleUpdateTimesheetStatus(timesheet._id, 'approved')}><FaCheckCircle /> Approve</Button>} */}
              </div>
            </ListItem>
          ))
        ) : (
          <p>No timesheets added yet.</p>
          // <Button size="sm" onClick={() => setIsTimesheetModalOpen(true)}><FaPlus /> Add Timesheet</Button>
        )}
      </ListContainer>

      <SectionHeader><FaExclamationTriangle /> Safety Incidents</SectionHeader>
      <ListContainer>
        {workerDetails.safetyIncidentsList?.length > 0 ? (
          workerDetails.safetyIncidentsList.map(incident => (
            <ListItem key={incident._id}>
              <div className="milestone-info">
                <p className="milestone-title">{incident.type}</p>
                <span className="milestone-date">Date: {new Date(incident.date).toLocaleDateString()} | Severity: {incident.severity}</span>
              </div>
              <div className="actions">
                 {/* <Button size="sm" variant="info" onClick={() => handleViewSafetyIncident(incident)}><FaEye /></Button>
                <Button size="sm" variant="secondary" onClick={() => { /* setSafetyIncidentToEdit(incident); setIsSafetyIncidentModalOpen(true); * / }}><FaEdit /></Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteSafetyIncident(incident._id)}><FaTrash /></Button> */}
              </div>
            </ListItem>
          ))
        ) : (
          <p>No safety incidents reported for this worker.</p>
          // <Button size="sm" onClick={() => setIsSafetyIncidentModalOpen(true)}><FaPlus /> Report Incident</Button>
        )}
      </ListContainer>

      {/* Uncomment and implement modal rendering if you have the modals */}
      {/*
      {isCertificationModalOpen && (
        <AddEditCertificationModal
          workerId={worker._id}
          certificationToEdit={certificationToEdit}
          onClose={() => { setIsCertificationModalOpen(false); setCertificationToEdit(null); }}
          onSave={handleAddEditCertification}
        />
      )}
      {isTimesheetModalOpen && (
        <AddEditTimesheetModal
          workerId={worker._id}
          timesheetToEdit={timesheetToEdit}
          onClose={() => { setIsTimesheetModalOpen(false); setTimesheetToEdit(null); }}
          onSave={handleAddEditTimesheet}
        />
      )}
      {isMaintenanceLogModalOpen && (
        <AddEditMaintenanceLogModal
          equipmentId={workerDetails.assignedEquipment?._id} // Assuming worker is assigned to equipment
          logToEdit={maintenanceLogToEdit}
          onClose={() => { setIsMaintenanceLogModalOpen(false); setMaintenanceLogToEdit(null); }}
          onSave={handleAddEditMaintenanceLog}
        />
      )}
      */}
    </Modal>
  );
};

export default ViewWorkerModal;
