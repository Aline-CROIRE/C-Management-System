"use client";

import React from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaTools, FaTag, FaInfoCircle, FaWrench, FaCalendarAlt, FaDollarSign, FaBuilding, FaClipboardList, FaCheckCircle, FaExclamationTriangle, FaClock, FaTruck } from "react-icons/fa";
import Button from "../common/Button";
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
  if (!equipment) return null;

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

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{equipment.name || "Equipment Details"}</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <DetailGrid>
            <DetailItem><DetailLabel><FaTag /> Asset Tag</DetailLabel><DetailValue>{equipment.assetTag || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaInfoCircle /> Type</DetailLabel><DetailValue>{equipment.type || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaBuilding /> Assigned Site</DetailLabel><DetailValue>{equipment.currentSite?.name || 'None'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaWrench /> Status</DetailLabel><DetailValue><StatusBadge status={equipment.status}>{getStatusIcon(equipment.status)} {equipment.status}</StatusBadge></DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCheckCircle /> Condition</DetailLabel><DetailValue>{equipment.condition || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Purchase Date</DetailLabel><DetailValue>{formatDate(equipment.purchaseDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaDollarSign /> Purchase Cost</DetailLabel><DetailValue>{formatCurrency(equipment.purchaseCost)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaDollarSign /> Current Value</DetailLabel><DetailValue>{formatCurrency(equipment.currentValue)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Last Maintenance</DetailLabel><DetailValue>{formatDate(equipment.lastMaintenance)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaCalendarAlt /> Next Maintenance</DetailLabel><DetailValue>{formatDate(equipment.nextMaintenance)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel><FaClipboardList /> Utilization</DetailLabel><DetailValue>{formatPercentage(equipment.utilization)}</DetailValue></DetailItem>
          </DetailGrid>
           {equipment.notes && (
             <DetailItem>
               <DetailLabel><FaClipboardList /> Notes</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{equipment.notes}</DetailValue>
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

export default ViewEquipmentModal;