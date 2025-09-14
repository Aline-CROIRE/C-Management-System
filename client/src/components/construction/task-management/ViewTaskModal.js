// client/src/components/construction/task-management/ViewTaskModal.js
"use client";

import React, { useState } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaClipboardList, FaCalendarAlt, FaStar, FaUserPlus, FaInfoCircle, FaSitemap, FaBuilding, FaCheckCircle, FaExclamationTriangle, FaClock,
         FaUsers, FaTools, FaMoneyBillWave, FaBalanceScale, FaBoxes, FaFileUpload, FaDownload, FaTrashAlt, FaPaperclip } from "react-icons/fa";
import Button from "../../common/Button";
import moment from "moment";
import { useConstructionManagement } from "../../../hooks/useConstructionManagement";
import LoadingSpinner from "../../common/LoadingSpinner";

// --- NEW SUB-MODALS (Importing newly created placeholders) ---
import UploadDocumentModal from "../document-management/UploadDocumentModal";


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
  max-width: 800px;
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
    @media (max-width: 480px) {
        flex-direction: column;
        align-items: flex-start;
    }
  }
`;

const SectionTitle = styled.h3`
    font-size: clamp(1rem, 3vw, 1.25rem);
    font-weight: 600;
    color: ${(props) => props.theme?.colors?.heading || "#1a202c"};
    margin: 1.5rem 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    grid-column: 1 / -1; // Span full width
    border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
    padding-bottom: 0.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
  border-bottom: 1px solid ${(props) => props.theme?.colors?.borderLight || '#f0f0f0'};
  padding-bottom: 0.75rem;
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
  const { uploadDocument, deleteDocument, loading: hookLoading, error: hookError } = useConstructionManagement();

  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [documentRefContext, setDocumentRefContext] = useState({ refId: '', refModel: 'Task' });

  if (!task) return null;

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

  // Document handlers
  const handleUploadDocumentClick = (refModel, refId) => { setDocumentRefContext({ refModel, refId }); setIsUploadDocumentModalOpen(true); };
  const handleDeleteDocument = async (docId, refModel, refId) => {
      if (window.confirm("Are you sure you want to delete this document?")) {
          await deleteDocument(docId, refModel, refId);
      }
  };


  return ReactDOM.createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{task.name || "Task Details"}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <SectionTitle><FaClipboardList /> Task Information</SectionTitle>
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

          {task.description && (
             <DetailItem>
               <DetailLabel><FaInfoCircle /> Description</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{task.description}</DetailValue>
             </DetailItem>
           )}
           {task.notes && (
             <DetailItem>
               <DetailLabel><FaClipboardList /> Notes</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{task.notes}</DetailValue>
             </DetailItem>
           )}

          {task.assignedTo && task.assignedTo.length > 0 && (
            <DetailItem>
              <DetailLabel><FaUserPlus /> Assigned To (Primary)</DetailLabel>
              <ListContainer>
                {task.assignedTo.map(worker => (
                  <li key={worker._id || worker}>{worker.fullName || worker} ({worker.role})</li>
                ))}
              </ListContainer>
            </DetailItem>
          )}

          {task.dependencies && task.dependencies.length > 0 && (
            <DetailItem>
              <DetailLabel><FaSitemap /> Dependencies</DetailLabel>
              <ListContainer>
                {task.dependencies.map(dep => (
                  <li key={dep.taskId?._id || dep.taskId}>
                      {dep.taskId?.name || dep.taskId} ({dep.type}{dep.lag ? ` +${dep.lag}d` : ''})
                  </li>
                ))}
              </ListContainer>
            </DetailItem>
          )}

            <SectionTitle><FaBoxes /> Allocated Resources</SectionTitle>
            {(task.allocatedWorkers?.length > 0 || task.allocatedEquipment?.length > 0 || task.requiredMaterials?.length > 0) ? (
              <>
                {task.allocatedWorkers && task.allocatedWorkers.length > 0 && (
                    <DetailItem>
                        <DetailLabel><FaUsers /> Workers</DetailLabel>
                        <ListContainer>
                            {task.allocatedWorkers.map(alloc => (
                                <li key={alloc.worker?._id || alloc.worker}>
                                    <strong>{alloc.worker?.fullName || alloc.worker}</strong> ({alloc.worker?.role}) - Est. Hours: {alloc.estimatedHours} | Actual: {alloc.actualHours}
                                </li>
                            ))}
                        </ListContainer>
                    </DetailItem>
                )}
                {task.allocatedEquipment && task.allocatedEquipment.length > 0 && (
                    <DetailItem>
                        <DetailLabel><FaTools /> Equipment</DetailLabel>
                        <ListContainer>
                            {task.allocatedEquipment.map(alloc => (
                                <li key={alloc.equipment?._id || alloc.equipment}>
                                    <strong>{alloc.equipment?.name || alloc.equipment}</strong> ({alloc.equipment?.assetTag}) - Est. Hours: {alloc.estimatedHours} | Actual: {alloc.actualHours}
                                </li>
                            ))}
                        </ListContainer>
                    </DetailItem>
                )}
                {task.requiredMaterials && task.requiredMaterials.length > 0 && (
                    <DetailItem>
                        <DetailLabel><FaBoxes /> Materials</DetailLabel>
                        <ListContainer>
                            {task.requiredMaterials.map((mat, index) => (
                                <li key={index}>
                                    <strong>{mat.materialName}</strong>: {mat.quantity} {mat.unit} | Consumed: {mat.actualConsumption || 0}
                                </li>
                            ))}
                        </ListContainer>
                    </DetailItem>
                )}
              </>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No resources allocated to this task.</p>
            )}

            <SectionTitle><FaMoneyBillWave /> Costing</SectionTitle>
            {(task.estimatedLaborCost > 0 || task.estimatedMaterialCost > 0 || task.estimatedEquipmentCost > 0 ||
              task.actualLaborCost > 0 || task.actualMaterialCost > 0 || task.actualEquipmentCost > 0) ? (
                <DetailGrid>
                    <DetailItem><DetailLabel><FaMoneyBillWave /> Estimated Labor</DetailLabel><DetailValue>{formatCurrency(task.estimatedLaborCost)}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel><FaMoneyBillWave /> Actual Labor</DetailLabel><DetailValue>{formatCurrency(task.actualLaborCost)}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel><FaBoxes /> Estimated Material</DetailLabel><DetailValue>{formatCurrency(task.estimatedMaterialCost)}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel><FaBoxes /> Actual Material</DetailLabel><DetailValue>{formatCurrency(task.actualMaterialCost)}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel><FaTools /> Estimated Equipment</DetailLabel><DetailValue>{formatCurrency(task.estimatedEquipmentCost)}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel><FaTools /> Actual Equipment</DetailLabel><DetailValue>{formatCurrency(task.actualEquipmentCost)}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel><FaBalanceScale /> Total Estimated Cost</DetailLabel><DetailValue>{formatCurrency((task.estimatedLaborCost || 0) + (task.estimatedMaterialCost || 0) + (task.estimatedEquipmentCost || 0))}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel><FaBalanceScale /> Total Actual Cost</DetailLabel><DetailValue>{formatCurrency((task.actualLaborCost || 0) + (task.actualMaterialCost || 0) + (task.actualEquipmentCost || 0))}</DetailValue></DetailItem>
                </DetailGrid>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No cost data available for this task.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaPaperclip /> Documents</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={() => handleUploadDocumentClick('Task', task._id)}>
                        <FaFileUpload /> Upload Document
                    </Button>
                </SectionActions>
            </SectionHeader>
            {task.documents && task.documents.length > 0 ? (
                <ListContainer>
                    {task.documents.map((doc) => (
                        <li key={doc._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}><FaDownload /> {doc.fileName}</a></strong>
                                <br />
                                <small>Category: {doc.category} | Uploaded: {formatDate(doc.createdAt)}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Document" onClick={() => handleDeleteDocument(doc._id, 'Task', task._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No documents for this task.</p>
            )}


        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooter>

        {isUploadDocumentModalOpen && (
            <UploadDocumentModal
                onClose={() => setIsUploadDocumentModalOpen(false)}
                onSave={uploadDocument}
                loading={hookLoading}
                refId={documentRefContext.refId}
                refModel={documentRefContext.refModel}
            />
        )}
      </ModalContent>
    </ModalOverlay>,
    document.body
  );
};

export default ViewTaskModal;