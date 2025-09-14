// client/src/components/construction/financial-management/ViewPaymentRequestModal.js
"use client";

import React from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaMoneyBillWave, FaInfoCircle, FaUserTie, FaClipboardList, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaRegCheckCircle, FaRegTimesCircle } from "react-icons/fa";
import Button from "../../common/Button";
import moment from "moment";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useAuth } from "../../../contexts/AuthContext"; // To check user role for status update permission

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
      case "Approved": case "Paid": return `background: ${theme.colors?.success || "#4CAF50"}20; color: ${theme.colors?.success || "#4CAF50"};`;
      case "Rejected": return `background: ${theme.colors?.error || "#F44336"}20; color: ${theme.colors?.error || "#F44336"};`;
      default: return `background: ${theme.colors?.textSecondary || "#9E9E9E"}20; color: ${theme.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const SectionTitle = styled.h3`
    font-size: clamp(1rem, 3vw, 1.25rem); font-weight: 600; color: ${(props) => props.theme?.colors?.heading || "#1a202c"};
    margin: 1.5rem 0 1rem; display: flex; align-items: center; gap: 0.75rem;
    grid-column: 1 / -1; border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"}; padding-bottom: 0.5rem;
`;

const SectionActions = styled.div`
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    margin-top: 1rem;

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
  padding: 1rem 1.5rem; border-top: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  display: flex; justify-content: flex-end; gap: 1rem; flex-shrink: 0;
  @media (max-width: 480px) { padding: 0.75rem 1rem; gap: 0.75rem; button { flex-grow: 1; } }
`;

const ViewPaymentRequestModal = ({ paymentRequest, onClose, onUpdateStatus }) => {
  const { user } = useAuth();
  const canApprove = user && (user.role === 'admin' || user.role === 'project_manager');

  if (!paymentRequest) return null;

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatDate = (dateString) => dateString ? moment(dateString).format('MMM Do, YYYY') : 'N/A';

  const handleStatusChange = (newStatus) => {
    if (window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
        onUpdateStatus(paymentRequest.site, paymentRequest._id, newStatus); // Pass siteId and requestId
    }
  };

  return ReactDOM.createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Payment Request: {paymentRequest.purpose || 'N/A'}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <SectionTitle><FaMoneyBillWave /> Request Information</SectionTitle>
          <DetailGrid>
            <DetailItem><DetailLabel>Amount</DetailLabel><DetailValue>{formatCurrency(paymentRequest.amount)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Purpose</DetailLabel><DetailValue>{paymentRequest.purpose || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Requested By</DetailLabel><DetailValue>{paymentRequest.requestedBy?.fullName || paymentRequest.requestedBy || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Request Date</DetailLabel><DetailValue>{formatDate(paymentRequest.requestDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Invoice Ref</DetailLabel><DetailValue>{paymentRequest.invoiceRef || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Status</DetailLabel><DetailValue><StatusBadge status={paymentRequest.status}>{paymentRequest.status}</StatusBadge></DetailValue></DetailItem>
            {paymentRequest.approvedBy && (
                <DetailItem><DetailLabel><FaUserTie /> Approved By</DetailLabel><DetailValue>{paymentRequest.approvedBy?.fullName || paymentRequest.approvedBy || 'N/A'}</DetailValue></DetailItem>
            )}
            {paymentRequest.approvedAt && (
                <DetailItem><DetailLabel><FaCalendarAlt /> Approved At</DetailLabel><DetailValue>{formatDate(paymentRequest.approvedAt)}</DetailValue></DetailItem>
            )}
          </DetailGrid>
          {paymentRequest.notes && (
            <DetailItem>
              <DetailLabel><FaClipboardList /> Notes</DetailLabel>
              <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{paymentRequest.notes}</DetailValue>
            </DetailItem>
          )}

          {canApprove && (paymentRequest.status === 'Pending' || paymentRequest.status === 'Approved') && (
              <SectionActions>
                  {paymentRequest.status === 'Pending' && (
                      <>
                          <Button variant="success" size="sm" onClick={() => handleStatusChange('Approved')}>
                              <FaRegCheckCircle /> Approve
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleStatusChange('Rejected')}>
                              <FaRegTimesCircle /> Reject
                          </Button>
                      </>
                  )}
                  {paymentRequest.status === 'Approved' && (
                       <Button variant="primary" size="sm" onClick={() => handleStatusChange('Paid')}>
                          <FaMoneyBillWave /> Mark as Paid
                      </Button>
                  )}
              </SectionActions>
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

export default ViewPaymentRequestModal;