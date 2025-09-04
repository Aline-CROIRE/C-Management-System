"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaBoxes } from "react-icons/fa";
import Button from "../common/Button";

// Dynamically get the API base URL for images
const getImageUrlBase = () => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api$/, ''); 
};

const API_BASE_URL_FOR_IMAGES = getImageUrlBase();


const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  width: 100%;
  max-width: 600px;
  box-shadow: ${(props) => props.theme.shadows.xl};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: ${(props) => props.theme.colors.heading};
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
`;

const ItemImage = styled.div`
  width: 150px;
  height: 150px;
  align-self: center;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  border: 2px solid ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.surfaceLight};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  svg {
    font-size: 3rem;
    color: ${(props) => props.theme.colors.textSecondary};
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem 1.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textSecondary};
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  font-weight: 500;
  word-break: break-word;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: flex-end;
`;

const ViewItemModal = ({ item, onClose }) => {
  if (!item) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{item.name || "Item Details"}</ModalTitle>
          <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
        </ModalHeader>
        <ModalBody>
          <ItemImage>
            {item.imageUrl ? (
              // CORRECTED IMAGE URL
              <img src={`${API_BASE_URL_FOR_IMAGES}/${item.imageUrl.replace(/\\/g, '/')}`} alt={item.name} />
            ) : (
              <FaBoxes />
            )}
          </ItemImage>
          <DetailGrid>
            <DetailItem><DetailLabel>SKU</DetailLabel><DetailValue>{item.sku || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Category</DetailLabel><DetailValue>{item.category?.name || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Location</DetailLabel><DetailValue>{item.location?.name || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Quantity</DetailLabel><DetailValue>{`${item.quantity?.toLocaleString() || '0'} ${item.unit || ''}`}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Unit Price</DetailLabel><DetailValue>Rwf {item.price?.toFixed(2) || '0.00'}</DetailValue></DetailItem> {/* Corrected currency */}
            <DetailItem><DetailLabel>Total Value</DetailLabel><DetailValue>Rwf {item.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</DetailValue></DetailItem> {/* Corrected currency */}
            <DetailItem><DetailLabel>Min Stock Level</DetailLabel><DetailValue>{item.minStockLevel?.toLocaleString() || 'Not set'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Supplier</DetailLabel><DetailValue>{item.supplier?.name || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Expiry Date</DetailLabel><DetailValue>{formatDate(item.expiryDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Last Updated</DetailLabel><DetailValue>{formatDate(item.updatedAt)}</DetailValue></DetailItem>
          </DetailGrid>
           {item.description && (
             <DetailItem>
               <DetailLabel>Description / Notes</DetailLabel>
               <DetailValue style={{ whiteSpace: 'pre-wrap' }}>{item.description}</DetailValue>
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

export default ViewItemModal;
