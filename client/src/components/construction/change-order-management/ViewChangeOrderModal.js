// client/src/components/construction/change-order-management/ViewChangeOrderModal.js
"use client";

import React from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaShoppingCart, FaDollarSign, FaCalendarAlt, FaUserTie, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaClipboardList, FaDownload, FaPaperclip } from "react-icons/fa";
import Button from "../../common/Button";
import moment from "moment";
import LoadingSpinner from "../../common/LoadingSpinner";

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center;
  z-index: 1050; padding: 1rem; backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'}; color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || '1rem'}; box-shadow: ${(props) => props.theme?.shadows?.xl || '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'};
  width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @media (max-width: 768px) { max-width: 95%; }
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem; border-bottom: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
  @media (max-width: 480px) { padding: 1rem 1.25rem; }
`;

const ModalTitle = styled.h2`
  font-size: clamp(1.25rem, 4vw, 1.5rem); font-weight: 700; color: ${(props) => props.theme?.colors?.heading || '#1a202c'}; margin: 0;
`;

const CloseButton = styled.button`
  background: none; border: none; font-size: clamp(1.2rem, 3vw, 1.5rem); color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  cursor: pointer; padding: 0.5rem; line-height: 1; border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
  transition: all 0.2s ease-in-out;
  &:hover { background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'}; color: ${(props) => props.theme?.colors?.text || '#2d3748'}; }
`;

const ModalBody = styled.div`
  padding: 2rem; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 1.5rem;
  @media (max-width: 480px) { padding: 1.25rem; }
`;

const DetailGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem 1.5rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; gap: 0.75rem; }
`;

const DetailItem = styled.div`
  display: flex; flex-direction: column;
`;

const DetailLabel = styled.span`
  font-size: clamp(0.75rem, 2vw, 0.8rem); font-weight: 600; color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  text-transform: uppercase; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;
`;

const DetailValue = styled.span`
  font-size: clamp(0.9rem, 2.5vw, 1rem); font-weight: 500; word-break: break-word; color: ${(props) => props.theme?.colors?.text || '#2d3748'};
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: clamp(0.7rem, 2vw, 0.75rem); font-weight: 600;
  text-transform: capitalize; display: inline-flex; align-items: center; gap: 0.25rem;

  ${({ status, theme }) => {
    switch (status) {
      case "Pending": return `background: ${theme.colors?.warning || "#FFC107"}20; color: ${theme.colors?.warning || "#FFC107"};`;
      case "Approved": return `background: ${theme.colors?.success || "#4CAF50"}20; color: ${theme.colors?.success || "#4CAF50"};`;
      case "Rejected": return `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`;
      case "Implemented": return `background: ${theme.colors?.primary || "#1b4332"}20; color: ${theme.colors?.primary || "#1b4332"};`;
      default: return `background: ${theme.colors?.textSecondary || "#9E9E9E"}20; color: ${theme.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const SectionTitle = styled.h3`
    font-size: clamp(1rem, 3vw, 1.25rem); font-weight: 600; color: ${(props) => props.theme?.colors?.heading || "#1a202c"};
    margin: 1.5rem 0 1rem; display: flex; align-items: center; gap: 0.75rem;
    grid-column: 1 / -1; border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"}; padding-bottom: 0.5rem;
`;

const ListContainer = styled.ul`
  list-style: none; padding: 0; margin: 0;
  & > li {
    background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'}; border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
    padding: 0.75rem 1rem; margin-bottom: 0.5rem; font-size: 0.9rem; color: ${(props) => props.theme?.colors?.text || '#2d3748'};
    display: flex; align-items: center; gap: 0.5rem;
    &:last-child { margin-bottom: 0; }
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem; border-top: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  display: flex; justify-content: flex-end; gap: 1rem; flex-shrink: 0;
  @media (max-width: 480px) { padding: 0.75rem 1rem; gap: 0.75rem; button { flex-grow: 1; } }
`;

const ViewChangeOrderModal = ({ changeOrder, onClose }) => {
  if (!changeOrder) return null;

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatDate = (dateString) => dateString ? moment(dateString).format('MMM Do, YYYY') : 'N/A';

  return ReactDOM.createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{changeOrder.title || "Change Order Details"}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <SectionTitle><FaShoppingCart /> Change Order Information</SectionTitle>
          <DetailGrid>
            <DetailItem><DetailLabel>Requested By</DetailLabel><DetailValue>{changeOrder.requestedBy?.fullName || changeOrder.requestedBy || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaDollarSign /> Cost Impact</DetailLabel><DetailValue>{formatCurrency(changeOrder.costImpact)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Timeline Impact</DetailLabel><DetailValue>{changeOrder.timelineImpactDays} days</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Status</DetailLabel><DetailValue><StatusBadge status={changeOrder.status}>{changeOrder.status}</StatusBadge></DetailValue></DetailItem>
            {changeOrder.approvalDate && (
                <DetailItem><DetailLabel><FaCalendarAlt /> Approval Date</DetailLabel><DetailValue>{formatDate(changeOrder.approvalDate)}</DetailValue></DetailItem>
            )}
            {changeOrder.approvedBy && (
                <DetailItem><DetailLabel><FaUserTie /> Approved By</DetailLabel><DetailValue>{changeOrder.approvedBy?.fullName || changeOrder.approvedBy || 'N/A'}</DetailValue></DetailItem>
            )}
          </DetailGrid>
          {changeOrder.description && (
            <DetailItem>
              <DetailLabel><FaInfoCircle /> Description</DetailLabel>
              <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{changeOrder.description}</DetailValue>
            </DetailItem>
          )}
          {changeOrder.reason && (
            <DetailItem>
              <DetailLabel><FaClipboardList /> Reason</DetailLabel>
              <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{changeOrder.reason}</DetailValue>
            </DetailItem>
          )}

          {/* Add documents section if changeOrder has documents */}
          {changeOrder.documents && changeOrder.documents.length > 0 && (
            <>
              <SectionTitle><FaPaperclip /> Documents</SectionTitle>
              <ListContainer>
                {changeOrder.documents.map((doc) => (
                  <li key={doc._id}>
                    <strong><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}><FaDownload /> {doc.fileName}</a></strong>
                    <br />
                    <small>Category: {doc.category} | Uploaded: {formatDate(doc.createdAt)}</small>
                  </li>
                ))}
              </ListContainer>
            </>
          )}

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>,
    document.body
  );
};

export default ViewChangeOrderModal;