// client/src/components/construction/ViewEquipmentModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaTools, FaTag, FaInfoCircle, FaWrench, FaCalendarAlt, FaDollarSign, FaBuilding, FaClipboardList, FaCheckCircle, FaExclamationTriangle, FaClock,
         FaIndustry, FaMoneyBillWave, FaWarehouse, FaCar, FaHome, FaFileAlt, FaFileUpload, FaDownload, FaPlus, FaEdit, FaTrashAlt, FaChartPie
       } from "react-icons/fa";
import Button from "../common/Button";
import moment from "moment";
import LoadingSpinner from "../common/LoadingSpinner";
import { useConstructionManagement } from "../../hooks/useConstructionManagement";

// NEW SUB-MODALS (STILL COMMENTED OUT UNTIL CREATED - NO CHANGE HERE)
// import AddEditMaintenanceLogModal from "./maintenance-management/AddEditMaintenanceLogModal";
// import UploadDocumentModal from "./document-management/UploadDocumentModal";


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
  max-width: 800px; /* Increased max-width */
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
      case "Operational": return `background: ${theme.colors?.success || "#4CAF50"}20; color: ${theme.colors?.success || "#4CAF50"};`;
      case "In Maintenance": return `background: ${theme.colors?.warning || "#FFC107"}20; color: ${theme.colors?.warning || "#FFC107"};`;
      case "Idle": return `background: ${theme.colors?.info || "#2196F3"}20; color: ${theme.colors?.info || "#2196F3"};`;
      case "Broken": return `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`;
      case "In Transit": return `background: ${theme.colors?.primary || "#1b4332"}20; color: ${theme.colors?.primary || "#1b4332"};`;
      case "Out of Service": return `background: ${theme.colors?.textSecondary || "#9E9E9E"}20; color: ${theme.colors?.textSecondary || "#9E9E9E"};`;
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
    background: ${(props) => props.theme.colors.surfaceLight};
    border-radius: ${(props) => props.theme.borderRadius.md};
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: ${(props) => props.theme.colors.text};
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

const ViewEquipmentModal = ({ equipment, onClose }) => {
  const {
    currentEquipment, fetchEquipmentData, loading: hookLoading, error: hookError,
    equipmentMaintenanceLogs, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog,
    equipmentDocuments, uploadDocument, deleteDocument,
  } = useConstructionManagement();

  const [isAddMaintenanceLogModalOpen, setIsAddMaintenanceLogModalOpen] = useState(false);
  const [isEditMaintenanceLogModalOpen, setIsEditMaintenanceLogModalOpen] = useState(false);
  const [selectedMaintenanceLog, setSelectedMaintenanceLog] = useState(null);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [documentRefContext, setDocumentRefContext] = useState({ refId: '', refModel: 'Equipment' });


  useEffect(() => {
    if (equipment?._id) {
      fetchEquipmentData(equipment._id);
    }
  }, [equipment?._id, fetchEquipmentData]);

  const displayEquipment = currentEquipment || equipment;
  const isLoading = hookLoading && !currentEquipment;

  if (isLoading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', padding: '2rem'}}>
          <LoadingSpinner />
          <p>Loading equipment details...</p>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (hookError) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', padding: '2rem', background: '#ffebee', color: '#d32f2f'}}>
          <FaExclamationTriangle size={32} style={{ marginBottom: '1rem' }} />
          <h3>Error Loading Equipment Data</h3>
          <p>{hookError.message || "An unexpected error occurred while fetching data."}</p>
          <Button variant="secondary" onClick={onClose} style={{ marginTop: '1rem' }}>Close</Button>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (!displayEquipment) return null;

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatDate = (dateString) => dateString ? moment(dateString).format('MMM Do, YYYY') : 'N/A';
  const formatPercentage = (value) => `${Number(value || 0).toFixed(0)}%`;

  const getStatusIcon = (status) => {
    switch (status) {
      case "Operational": return <FaCheckCircle />;
      case "In Maintenance": case "Broken": return <FaExclamationTriangle />;
      case "Idle": case "In Transit": case "Out of Service": return <FaClock />;
      default: return <FaInfoCircle />;
    }
  };

  // Maintenance Log Handlers
  const handleAddMaintenanceLog = () => { setSelectedMaintenanceLog(null); setIsAddMaintenanceLogModalOpen(true); };
  const handleEditMaintenanceLog = (log) => { setSelectedMaintenanceLog(log); setIsEditMaintenanceLogModalOpen(true); };
  const handleDeleteMaintenanceLog = async (logId) => {
    if (window.confirm("Are you sure you want to delete this maintenance log?")) {
      await deleteMaintenanceLog(displayEquipment._id, logId);
    }
  };
  const handleSaveMaintenanceLog = async (logData) => {
    if (selectedMaintenanceLog) { await updateMaintenanceLog(displayEquipment._id, selectedMaintenanceLog._id, logData); }
    else { await createMaintenanceLog(displayEquipment._id, logData); }
    setIsAddMaintenanceLogModalOpen(false); setIsEditMaintenanceLogModalOpen(false); setSelectedMaintenanceLog(null);
  };

  // Document handlers
  const handleUploadDocument = (refModel, refId) => { setDocumentRefContext({ refModel, refId }); setIsUploadDocumentModalOpen(true); };
  const handleDeleteDocument = async (docId, refModel, refId) => {
      if (window.confirm("Are you sure you want to delete this document?")) {
          await deleteDocument(docId, refModel, refId);
      }
  };


  return ReactDOM.createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{displayEquipment.name || "Equipment Details"}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <SectionTitle><FaTools /> Equipment Identification</SectionTitle>
          <DetailGrid>
            <DetailItem><DetailLabel><FaTag /> Asset Tag</DetailLabel><DetailValue>{displayEquipment.assetTag || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Type</DetailLabel><DetailValue>{displayEquipment.type || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaIndustry /> Manufacturer</DetailLabel><DetailValue>{displayEquipment.manufacturer || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCar /> Model</DetailLabel><DetailValue>{displayEquipment.model || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Serial Number</DetailLabel><DetailValue>{displayEquipment.serialNumber || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaBuilding /> Assigned Site</DetailLabel><DetailValue>{displayEquipment.currentSite?.name || 'None'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaWrench /> Status</DetailLabel><DetailValue><StatusBadge status={displayEquipment.status}>{getStatusIcon(displayEquipment.status)} {displayEquipment.status}</StatusBadge></DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCheckCircle /> Condition</DetailLabel><DetailValue>{displayEquipment.condition || 'N/A'}</DetailValue></DetailItem>
          </DetailGrid>

          <SectionTitle><FaDollarSign /> Financial & Operational</SectionTitle>
          <DetailGrid>
            <DetailItem><DetailLabel><FaCalendarAlt /> Purchase Date</DetailLabel><DetailValue>{formatDate(displayEquipment.purchaseDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaDollarSign /> Purchase Cost</DetailLabel><DetailValue>{formatCurrency(displayEquipment.purchaseCost)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaDollarSign /> Current Value</DetailLabel><DetailValue>{formatCurrency(displayEquipment.currentValue)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaMoneyBillWave /> Hourly Rate</DetailLabel><DetailValue>{formatCurrency(displayEquipment.hourlyRate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaChartPie /> Utilization</DetailLabel><DetailValue>{formatPercentage(displayEquipment.utilization)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaWarehouse /> Fuel Type</DetailLabel><DetailValue>{displayEquipment.fuelType || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Warranty Expiry</DetailLabel><DetailValue>{formatDate(displayEquipment.warrantyExpiry)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Last Maintenance</DetailLabel><DetailValue>{formatDate(displayEquipment.lastMaintenance)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Next Maintenance</DetailLabel><DetailValue>{formatDate(displayEquipment.nextMaintenance)}</DetailValue></DetailItem>
          </DetailGrid>

          {displayEquipment.rentalInfo?.isRented && (
            <>
              <SectionTitle><FaHome /> Rental Information</SectionTitle>
              <DetailGrid>
                <DetailItem><DetailLabel>Rental Company</DetailLabel><DetailValue>{displayEquipment.rentalInfo.rentalCompany || 'N/A'}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>Rental Cost</DetailLabel><DetailValue>{formatCurrency(displayEquipment.rentalInfo.rentalCost)}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>Return Date</DetailLabel><DetailValue>{formatDate(displayEquipment.rentalInfo.returnDate)}</DetailValue></DetailItem>
              </DetailGrid>
            </>
          )}

           {displayEquipment.notes && (
             <DetailItem>
               <DetailLabel><FaClipboardList /> Notes</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{displayEquipment.notes}</DetailValue>
             </DetailItem>
           )}

            {/* NEW SECTION: Maintenance Logs */}
            <SectionHeader>
                <SectionTitle><FaWrench /> Maintenance Logs</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={handleAddMaintenanceLog}>
                        <FaPlus /> Add Log
                    </Button>
                </SectionActions>
            </SectionHeader>
            {equipmentMaintenanceLogs && equipmentMaintenanceLogs.length > 0 ? (
                <ListContainer>
                    {equipmentMaintenanceLogs.map((log) => (
                        <li key={log._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong>{formatDate(log.date)}</strong>: {log.description} (Cost: {formatCurrency(log.cost)})
                                <br />
                                <small>Performed by: {log.performedBy}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="Edit Log" onClick={() => handleEditMaintenanceLog(log)}><FaEdit /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Log" onClick={() => handleDeleteMaintenanceLog(log._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No maintenance logs for this equipment.</p>
            )}

            {/* NEW SECTION: Documents */}
            <SectionHeader>
                <SectionTitle><FaFileAlt /> Documents</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={() => handleUploadDocument('Equipment', displayEquipment._id)}>
                        <FaFileUpload /> Upload Document
                    </Button>
                </SectionActions>
            </SectionHeader>
            {equipmentDocuments && equipmentDocuments.length > 0 ? (
                <ListContainer>
                    {equipmentDocuments.map((doc) => (
                        <li key={doc._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                            <div>
                                <strong><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}><FaDownload /> {doc.fileName}</a></strong>
                                <br />
                                <small>Category: {doc.category} | Uploaded: {formatDate(doc.createdAt)}</small>
                            </div>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Document" onClick={() => handleDeleteDocument(doc._id, 'Equipment', displayEquipment._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No documents for this equipment.</p>
            )}

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooter>

        {/* --- MODAL RENDERING (COMMENTED OUT UNTIL FILES ARE CREATED) --- */}
        {/*
        {isAddMaintenanceLogModalOpen && (
            <AddEditMaintenanceLogModal
                onClose={() => setIsAddMaintenanceLogModalOpen(false)}
                onSave={handleSaveMaintenanceLog}
                loading={hookLoading}
                equipmentId={displayEquipment._id}
                // Pass workers/users if 'performedBy' is a dropdown
            />
        )}
        {isEditMaintenanceLogModalOpen && selectedMaintenanceLog && (
            <AddEditMaintenanceLogModal
                onClose={() => setIsEditMaintenanceLogModalOpen(false)}
                onSave={handleSaveMaintenanceLog}
                loading={hookLoading}
                equipmentId={displayEquipment._id}
                maintenanceLogToEdit={selectedMaintenanceLog}
                // Pass workers/users
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
        */}
      </ModalContent>
    </ModalOverlay>,
    document.body
  );
};

export default ViewEquipmentModal;