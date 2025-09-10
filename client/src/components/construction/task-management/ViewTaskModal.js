
"use client";

import React from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaClipboardList, FaCalendarAlt, FaStar, FaUserPlus, FaInfoCircle, FaSitemap, FaBuilding, FaCheckCircle, FaExclamationTriangle, FaClock } from "react-icons/fa";
import Button from "../../common/Button";
import moment from "moment";

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
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || '1rem'};
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  box-shadow: ${(props) => props.theme?.shadows?.xl || '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'};
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
  border-bottom: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
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
  color: ${(props) => props.theme?.colors?.heading || '#1a202c'};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
  transition: all 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'};
    color: ${(props) => props.theme?.colors?.text || '#2d3748'};
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
  color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
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
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};
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
      case "To Do": return `background: ${theme?.colors?.info || "#2196F3"}20; color: ${theme?.colors?.info || "#2196F3"};`;
      case "In Progress": return `background: ${theme?.colors?.primary || "#1b4332"}20; color: ${theme?.colors?.primary || "#1b4332"};`;
      case "Blocked": return `background: ${theme?.colors?.error || "#F44336"}20; color: ${theme?.colors?.error || "#F44336"};`;
      case "Completed": return `background: ${theme?.colors?.success || "#4CAF50"}20; color: ${theme?.colors?.success || "#4CAF50"};`;
      case "Cancelled": return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
      default: return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const PriorityBadge = styled(StatusBadge)`
  ${({ priority, theme }) => {
    switch (priority) {
      case "Low": return `background: ${theme?.colors?.info || "#2196F3"}20; color: ${theme?.colors?.info || "#2196F3"};`;
      case "Medium": return `background: ${theme?.colors?.primary || "#1b4332"}20; color: ${theme?.colors?.primary || "#1b4332"};`;
      case "High": return `background: ${theme?.colors?.warning || "#FFC107"}20; color: ${theme?.colors?.warning || "#FFC107"};`;
      case "Critical": return `background: ${theme?.colors?.error || "#F44336"}20; color: ${theme?.colors?.error || "#F44336"};`;
      default: return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
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
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
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

const ViewTaskModal = ({ task, onClose }) => {
  if (!task) return null;

  const formatDate = (dateString) => dateString ? moment(dateString).format('MMM Do, YYYY') : 'N/A';
  const getStatusIcon = (status) => {
    switch (status) {
      case "To Do": return <FaInfoCircle />;
      case "In Progress": return <FaClock />;
      case "Blocked": return <FaExclamationTriangle />;
      case "Completed": return <FaCheckCircle />;
      case "Cancelled": return <FaTimes />;
      default: return <FaInfoCircle />;
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{task.name || "Task Details"}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <DetailGrid>
            <DetailItem><DetailLabel><FaBuilding /> Site</DetailLabel><DetailValue>{task.site?.name || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Status</DetailLabel><DetailValue><StatusBadge status={task.status}>{getStatusIcon(task.status)} {task.status}</StatusBadge></DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaStar /> Priority</DetailLabel><DetailValue><PriorityBadge priority={task.priority}><FaStar /> {task.priority}</PriorityBadge></DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Start Date</DetailLabel><DetailValue>{formatDate(task.startDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Due Date</DetailLabel><DetailValue>{formatDate(task.dueDate)}</DetailValue></DetailItem>
            {task.actualCompletionDate && (
                <DetailItem><DetailLabel><FaCalendarAlt /> Actual Completion</DetailLabel><DetailValue>{formatDate(task.actualCompletionDate)}</DetailValue></DetailItem>
            )}
            <DetailItem><DetailLabel><FaSitemap /> Progress</DetailLabel><DetailValue>{task.progress}%</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaSitemap /> Parent Task</DetailLabel><DetailValue>{task.parentTask?.name || 'None'}</DetailValue></DetailItem>
          </DetailGrid>

          {task.assignedTo && task.assignedTo.length > 0 && (
            <DetailItem>
              <DetailLabel><FaUserPlus /> Assigned To</DetailLabel>
              <ListContainer>
                {task.assignedTo.map(worker => (
                  <li key={worker._id || worker}>{worker.fullName || worker}</li>
                ))}
              </ListContainer>
            </DetailItem>
          )}

          {task.dependencies && task.dependencies.length > 0 && (
            <DetailItem>
              <DetailLabel><FaSitemap /> Dependencies</DetailLabel>
              <ListContainer>
                {task.dependencies.map(dep => (
                  <li key={dep._id || dep}>{dep.name || dep}</li>
                ))}
              </ListContainer>
            </DetailItem>
          )}

          {task.description && (
             <DetailItem>
               <DetailLabel><FaClipboardList /> Description</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{task.description}</DetailValue>
             </DetailItem>
           )}
           {task.notes && (
             <DetailItem>
               <DetailLabel><FaClipboardList /> Notes</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{task.notes}</DetailValue>
             </DetailItem>
           )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ViewTaskModal;