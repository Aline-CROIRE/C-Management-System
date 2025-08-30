"use client";

import React from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const zoomIn = keyframes`from { transform: scale(0.9); } to { transform: scale(1); }`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border-radius: ${(props) => props.theme.borderRadius.lg};
  animation: ${zoomIn} 0.3s ease-out;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -15px;
  right: -15px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  color: #333;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const ModalImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: ${(props) => props.theme.borderRadius.lg};
`;

const ImageViewerModal = ({ imageUrl, altText, onClose }) => {
  if (!imageUrl) return null;

  const modalJsx = (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} aria-label="Close image viewer">
          <FaTimes />
        </CloseButton>
        <ModalImage src={imageUrl} alt={altText} />
      </ModalContent>
    </ModalOverlay>
  );

  return ReactDOM.createPortal(modalJsx, document.body);
};

export default ImageViewerModal;