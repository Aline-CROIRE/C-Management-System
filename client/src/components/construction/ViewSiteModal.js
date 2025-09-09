"use client";

import React, { useState, useEffect } from "react"; // Added useEffect and useState
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaUserTie, FaCode, FaChartPie, FaUsers, FaTools, FaCheckCircle, FaExclamationTriangle, FaClipboardList, FaInfoCircle, FaTasks, FaPlus } from "react-icons/fa"; // Added FaTasks, FaPlus
import Button from "../common/Button";
import moment from "moment";

// Import new task components and hook
import TaskTable from "./task-management/TaskTable";
import AddEditTaskModal from "./task-management/AddEditTaskModal";
import ViewTaskModal from "./task-management/ViewTaskModal"; // We'll create this next
import { useConstructionManagement } from "../../hooks/useConstructionManagement"; // To access task CRUD and state

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
  max-width: 900px; /* Increased max-width for more content */
  max-height: 90vh;
  box-shadow: ${(props) => props.theme.shadows.xl};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 768px) {
    max-width: 95%;
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
      default: return `background: ${theme.colors?.textSecondary || "#9E9E9E"}20; color: ${theme.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
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
  // Use the hook to get tasks and CRUD operations
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, loading: tasksLoading, sites: allSites } = useConstructionManagement();
  
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Filter tasks to only show those belonging to the current site
  const siteTasks = tasks.filter(task => task.site?._id === site._id);

  useEffect(() => {
    if (site?._id) {
      fetchTasks(site._id); // Fetch tasks specifically for this site
    }
  }, [site?._id, fetchTasks]);

  if (!site) return null;

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
  const handleDeleteTask = async (id) => { if (window.confirm("Are you sure you want to delete this task?")) await deleteTask(id); };

  const handleCreateTask = async (taskData) => {
      // Ensure the task is linked to the current site when creating from this modal
      await createTask({ ...taskData, site: site._id });
      fetchTasks(site._id); // Re-fetch tasks for the specific site
  }

  const handleUpdateTask = async (id, taskData) => {
      await updateTask(id, taskData);
      fetchTasks(site._id); // Re-fetch tasks for the specific site
  }


  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{site.name || "Site Details"}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <DetailGrid>
            <DetailItem><DetailLabel><FaCode /> Project Code</DetailLabel><DetailValue>{site.projectCode || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaBuilding /> Type</DetailLabel><DetailValue>{site.type || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaMapMarkerAlt /> Location</DetailLabel><DetailValue>{site.location || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaUserTie /> Manager</DetailLabel><DetailValue>{site.manager || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaDollarSign /> Budget</DetailLabel><DetailValue>{formatCurrency(site.budget)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaDollarSign /> Expenditure</DetailLabel><DetailValue>{formatCurrency(site.expenditure)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Start Date</DetailLabel><DetailValue>{formatDate(site.startDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Expected End</DetailLabel><DetailValue>{formatDate(site.endDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Actual End</DetailLabel><DetailValue>{formatDate(site.actualEndDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaChartPie /> Progress</DetailLabel><DetailValue>{site.progress}%</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaTools /> Equipment Count</DetailLabel><DetailValue>{site.equipmentCount?.toLocaleString() || '0'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaUsers /> Workers</DetailLabel><DetailValue>{site.workers?.toLocaleString() || '0'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Status</DetailLabel><DetailValue><StatusBadge status={site.status}>{getStatusIcon(site.status)} {site.status}</StatusBadge></DetailValue></DetailItem>
          </DetailGrid>
          {site.description && (
             <DetailItem>
               <DetailLabel><FaInfoCircle /> Description</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{site.description}</DetailValue>
             </DetailItem>
           )}
           {site.notes && (
             <DetailItem>
               <DetailLabel><FaClipboardList /> Notes</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{site.notes}</DetailValue>
             </DetailItem>
           )}

            {/* NEW: Task Management Section */}
            <SectionHeader style={{ marginTop: '2rem' }}>
                <SectionTitle><FaTasks /> Tasks for This Site</SectionTitle>
                <Button variant="primary" size="sm" onClick={() => setIsAddTaskModalOpen(true)}>
                    <FaPlus /> Add Task
                </Button>
            </SectionHeader>
            <TaskTable
                tasks={siteTasks}
                loading={tasksLoading}
                pagination={{ page: 1, total: siteTasks.length, limit: siteTasks.length, totalPages: 1 }} // Simple pagination for modal context
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onView={handleViewTask}
                onPageChange={() => {}} // No actual pagination in this context for now
                hideSiteColumn={true} // Hide site column as it's already implicitly for this site
            />
            {/* END NEW */}

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooter>

        {/* Task Modals */}
        {isAddTaskModalOpen && (
            <AddEditTaskModal 
                onClose={() => setIsAddTaskModalOpen(false)} 
                onSave={handleCreateTask} 
                loading={tasksLoading} 
                sites={allSites} // Pass all sites for dropdown
                allTasks={tasks} // Pass all tasks for parent/dependency selection
            />
        )}
        {isEditTaskModalOpen && selectedTask && (
            <AddEditTaskModal 
                onClose={() => setIsEditTaskModalOpen(false)} 
                onSave={handleUpdateTask} 
                loading={tasksLoading} 
                taskToEdit={selectedTask} 
                sites={allSites}
                allTasks={tasks}
            />
        )}
        {isViewTaskModalOpen && selectedTask && (
            <ViewTaskModal 
                onClose={() => setIsViewTaskModalOpen(false)} 
                task={selectedTask} 
            />
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ViewSiteModal;