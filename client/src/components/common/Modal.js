// client/src/components/common/Modal.js
"use client";

import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import Card from './Card'; // Assuming common Card component

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;

  &.open {
    opacity: 1;
    visibility: visible;
  }
`;

// Crucial change: ModalContent now uses flexbox to stack header, body, and footer
// and its padding is removed, relying on internal components for spacing.
const ModalContent = styled(Card)`
  position: relative;
  background: ${props => props.theme.colors?.background || 'white'};
  border-radius: ${props => props.theme.borderRadius?.lg || '0.75rem'};
  max-width: 600px;
  width: 90%;
  max-height: 90vh; /* This max-height applies to the whole modal content wrapper */
  height: auto; /* Allow height to auto-adjust to content, up to max-height */
  display: flex; /* Make it a flex container */
  flex-direction: column; /* Stack children vertically */
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  overflow: hidden; /* Hide any overflow of header/footer as well */
  padding: 0; /* REMOVED ALL PADDING FROM MODALCONTENT ITSELF */

  .open & {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* Padding applied here instead of ModalContent */
  padding: ${props => props.theme.spacing?.xl || '2rem'} ${props => props.theme.spacing?.xl || '2rem'} ${props => props.theme.spacing?.md || '1rem'};
  border-bottom: 1px solid ${props => props.theme.colors?.borderLight};

  h3 {
    margin: 0;
    font-size: ${props => props.theme.typography?.fontSize?.xl || '1.25rem'};
    color: ${props => props.theme.colors?.heading};
  }
  button {
    background: none;
    border: none;
    font-size: ${props => props.theme.typography?.fontSize?.lg || '1.25rem'};
    color: ${props => props.theme.colors?.textSecondary};
    cursor: pointer;
    &:hover {
      color: ${props => props.theme.colors?.text};
    }
  }
`;

// This is the dedicated scrollable content area for the modal's main body
const ModalBody = styled.div`
  flex-grow: 1; /* Allows this part to take up all available vertical space */
  overflow-y: auto; /* This enables scrolling for the body content */
  /* Padding applied here for the scrollable content area */
  padding: ${(props) => props.theme.spacing?.md || '1rem'} ${(props) => props.theme.spacing?.xl || '2rem'};

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.colors?.surfaceLight};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors?.textSecondary}40;
    border-radius: 4px;
    border: 2px solid ${(props) => props.theme.colors?.surfaceLight};
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: ${(props) => props.theme.colors?.textSecondary}60;
  }
`;

// This is the fixed footer area for action buttons
const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  /* Padding applied here for the fixed footer area */
  padding: ${(props) => props.theme.spacing?.md || '1rem'} ${(props) => props.theme.spacing?.xl || '2rem'};
  border-top: 1px solid ${props => props.theme.colors?.borderLight};
  background: ${props => props.theme.colors?.background}; /* Match modal background */
`;


const Modal = ({ title, children, onClose, isOpen = true, footerActions }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay className={isOpen ? 'open' : ''} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>{title}</h3>
          <button onClick={onClose}><FaTimes /></button>
        </ModalHeader>
        <ModalBody> {/* Children content (your forms) go here and will scroll */}
          {children}
        </ModalBody>
        {footerActions && ( /* Render footer only if actions are provided */
          <ModalFooter>
            {footerActions}
          </ModalFooter>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default Modal;