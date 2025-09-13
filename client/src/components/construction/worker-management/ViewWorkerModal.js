// client/src/components/construction/worker-management/ViewWorkerModal.js
"use client";

import React, { useEffect, useState } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaUserCog, FaBriefcase, FaPhone, FaEnvelope, FaTools, FaInfoCircle, FaCheckCircle, FaTimesCircle,
         FaMoneyBillWave, FaCalendarAlt, FaBuilding, FaAddressBook, FaCertificate, FaClock, FaFileAlt, FaExclamationTriangle } from "react-icons/fa";
import Button from "../../common/Button";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useConstructionManagement } from "../../../hooks/useConstructionManagement";
import moment from "moment";

// NEW SUB-MODALS (Importing newly created placeholders, if needed. For ViewWorker, likely only UploadDocumentModal)
// import UploadDocumentModal from '../document-management/UploadDocumentModal'; // Assuming a common UploadDocumentModal


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
  max-width: 700px;
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

  ${({ isActive, theme }) => isActive ? 
    `background: ${theme.colors?.success || "#4CAF50"}20; color: ${theme.colors?.success || "#4CAF50"};` :
    `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`
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

const ViewWorkerModal = ({ worker, onClose }) => {
  const { currentWorker, fetchWorkerData, loading: hookLoading, error: hookError,
          workerCertifications, workerTimesheets, workerDocuments,
          // paginationCertifications, paginationTimesheets, // Removed pagination here as list is short
          // changePageWorkerCertifications, changePageWorkerTimesheets // Removed pagination handlers
          uploadDocument, deleteDocument,
        } = useConstructionManagement();

  // State for UploadDocumentModal
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [documentRefContext, setDocumentRefContext] = useState({ refId: '', refModel: 'Worker' });

  useEffect(() => {
    if (worker?._id) {
      fetchWorkerData(worker._id);
      // Manually trigger fetches for related paginated data if needed, or if not embedded
      // For this example, assuming certifications, timesheets, documents are fetched by fetchWorkerData
    }
  }, [worker?._id, fetchWorkerData]);

  const displayWorker = currentWorker || worker;
  const isLoading = hookLoading && !displayWorker;

  if (isLoading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', padding: '2rem'}}>
          <LoadingSpinner />
          <p>Loading worker details...</p>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (hookError) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', padding: '2rem', background: '#ffebee', color: '#d32f2f'}}>
          <FaExclamationTriangle size={32} style={{ marginBottom: '1rem' }} />
          <h3>Error Loading Worker Data</h3>
          <p>{hookError.message || "An unexpected error occurred while fetching data."}</p>
          <Button variant="secondary" onClick={onClose} style={{ marginTop: '1rem' }}>Close</Button>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (!displayWorker) return null;

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatDate = (dateString) => dateString ? moment(dateString).format('MMM Do, YYYY') : 'N/A';

  // Document handlers
  const handleUploadDocumentClick = (refModel, refId) => { setDocumentRefContext({ refModel, refId }); setIsUploadDocumentModalOpen(true); };
  const handleDeleteDocument = async (docId, refModel, refId) => {
      if (window.confirm("Are you sure you want to delete this document?")) {
          await deleteDocument(docId, refModel, refId);
      }
  };

  return (
    <ModalOverlay onClick={onClose}>
      {ReactDOM.createPortal(
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>{displayWorker.fullName || "Worker Details"}</ModalTitle>
            <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
          </ModalHeader>
          <ModalBody>
            <SectionTitle><FaUserCog /> Basic Information</SectionTitle>
            <DetailGrid>
              <DetailItem><DetailLabel><FaBriefcase /> Role</DetailLabel><DetailValue>{displayWorker.role || 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaPhone /> Contact</DetailLabel><DetailValue>{displayWorker.contactNumber || 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaEnvelope /> Email</DetailLabel><DetailValue>{displayWorker.email || 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaMoneyBillWave /> Hourly Rate</DetailLabel><DetailValue>{displayWorker.hourlyRate ? formatCurrency(displayWorker.hourlyRate) : 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaBriefcase /> Employment Type</DetailLabel><DetailValue>{displayWorker.employmentType || 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaCalendarAlt /> Hire Date</DetailLabel><DetailValue>{formatDate(displayWorker.hireDate)}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaBuilding /> Primary Site</DetailLabel><DetailValue>{displayWorker.currentSite?.name || 'Unassigned'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaCheckCircle /> Status</DetailLabel>
                <DetailValue>
                  <StatusBadge isActive={displayWorker.isActive}>
                    {displayWorker.isActive ? <FaCheckCircle /> : <FaTimesCircle />} {displayWorker.isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </DetailValue>
              </DetailItem>
            </DetailGrid>

            {displayWorker.emergencyContact?.name && (
              <>
                <SectionTitle><FaAddressBook /> Emergency Contact</SectionTitle>
                <DetailGrid>
                    <DetailItem><DetailLabel>Name</DetailLabel><DetailValue>{displayWorker.emergencyContact.name}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel>Phone</DetailLabel><DetailValue>{displayWorker.emergencyContact.phone}</DetailValue></DetailItem>
                    <DetailItem><DetailLabel>Relationship</DetailLabel><DetailValue>{displayWorker.emergencyContact.relationship}</DetailValue></DetailItem>
                </DetailGrid>
              </>
            )}

            {displayWorker.skills && displayWorker.skills.length > 0 && (
              <DetailItem>
                <DetailLabel><FaTools /> Skills</DetailLabel>
                <ListContainer>
                  {displayWorker.skills.map(skill => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ListContainer>
              </DetailItem>
            )}
            
            {displayWorker.notes && (
              <DetailItem>
                <DetailLabel><FaInfoCircle /> Notes</DetailLabel>
                <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{displayWorker.notes}</DetailValue>
              </DetailItem>
            )}

            <SectionHeader>
                <SectionTitle><FaCertificate /> Certifications</SectionTitle>
                <SectionActions>
                    {/* Add button to add new certification */}
                </SectionActions>
            </SectionHeader>
            {workerCertifications && workerCertifications.length > 0 ? (
                <ListContainer>
                    {workerCertifications.map(cert => (
                        <li key={cert._id}>
                            <strong>{cert.name}</strong> from {cert.issuingBody} (Issued: {formatDate(cert.issueDate)}
                            {cert.expiryDate && `, Expires: ${formatDate(cert.expiryDate)}`})
                            {moment(cert.expiryDate).isBefore(moment()) && <FaTimesCircle style={{ color: 'red', marginLeft: '0.5rem' }} title="Expired" />}
                            {/* Add button to view/download document if available */}
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No certifications recorded.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaClock /> Recent Timesheets</SectionTitle>
                <SectionActions>
                    {/* Add button to add new timesheet */}
                </SectionActions>
            </SectionHeader>
            {workerTimesheets && workerTimesheets.length > 0 ? (
                <ListContainer>
                    {workerTimesheets.slice(0, 5).map(ts => (
                        <li key={ts._id}>
                            {formatDate(ts.date)}: {ts.hoursWorked} hrs (OT: {ts.overtimeHours} hrs) - Site: {ts.site?.name}
                            <StatusBadge isActive={ts.status === 'Approved'} style={{marginLeft: 'auto'}}>{ts.status}</StatusBadge>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No timesheets submitted recently.</p>
            )}

            <SectionHeader>
                <SectionTitle><FaFileAlt /> Documents</SectionTitle>
                <SectionActions>
                    <Button variant="primary" size="sm" onClick={() => handleUploadDocumentClick('Worker', displayWorker._id)}>
                        <FaFileUpload /> Upload Document
                    </Button>
                </SectionActions>
            </SectionHeader>
            {workerDocuments && workerDocuments.length > 0 ? (
                <ListContainer>
                    {workerDocuments.map(doc => (
                        <li key={doc._id}>
                            <strong><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}><FaDownload /> {doc.fileName}</a></strong>
                            <br />
                            <small>Category: {doc.category} | Uploaded: {formatDate(doc.createdAt)}</small>
                            <div style={{marginLeft: 'auto', display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="Delete Document" onClick={() => handleDeleteDocument(doc._id, 'Worker', displayWorker._id)}><FaTrashAlt style={{color: '#c53030'}}/></Button>
                            </div>
                        </li>
                    ))}
                </ListContainer>
            ) : (
                <p style={{fontStyle: 'italic', color: '#718096'}}>No documents uploaded.</p>
            )}

          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>,
        document.body
      )}
    </ModalOverlay>
  );
};

export default ViewWorkerModal;