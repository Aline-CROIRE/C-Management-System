// client/src/components/construction/worker-management/ViewWorkerModal.js
"use client";

import React from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaUserCog, FaBriefcase, FaPhone, FaEnvelope, FaTools, FaInfoCircle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Button from "../../common/Button"; // CORRECTED PATH

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
  max-width: 600px;
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


const ViewWorkerModal = ({ worker, onClose }) => {
  if (!worker) return null;

  return (
    <ModalOverlay onClick={onClose}>
      {ReactDOM.createPortal(
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>{worker.fullName || "Worker Details"}</ModalTitle>
            <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
          </ModalHeader>
          <ModalBody>
            <DetailGrid>
              <DetailItem><DetailLabel><FaBriefcase /> Role</DetailLabel><DetailValue>{worker.role || 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaPhone /> Contact</DetailLabel><DetailValue>{worker.contactNumber || 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaEnvelope /> Email</DetailLabel><DetailValue>{worker.email || 'N/A'}</DetailValue></DetailItem>
              <DetailItem><DetailLabel><FaCheckCircle /> Status</DetailLabel>
                <DetailValue>
                  <StatusBadge isActive={worker.isActive}>
                    {worker.isActive ? <FaCheckCircle /> : <FaTimesCircle />} {worker.isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </DetailValue>
              </DetailItem>
            </DetailGrid>

            {worker.skills && worker.skills.length > 0 && (
              <DetailItem>
                <DetailLabel><FaTools /> Skills</DetailLabel>
                <ListContainer>
                  {worker.skills.map(skill => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ListContainer>
              </DetailItem>
            )}
            
            {worker.notes && (
              <DetailItem>
                <DetailLabel><FaInfoCircle /> Notes</DetailLabel>
                <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{worker.notes}</DetailValue>
              </DetailItem>
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