// components/inventory/ViewItemModal.jsx

"use client";

import styled from "styled-components";
import { FaTimes, FaBoxes } from "react-icons/fa";
import Button from "../common/Button";

// Get this from an environment variable for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001; // Higher than Add/Edit modal if needed
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

  // Helper to format dates consistently
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
              <img src={`${API_BASE_URL}/${item.imageUrl.replace(/\\/g, '/')}`} alt={item.name} />
            ) : (
              <FaBoxes />
            )}
          </ItemImage>
          <DetailGrid>
            <DetailItem><DetailLabel>SKU</DetailLabel><DetailValue>{item.sku || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Category</DetailLabel><DetailValue>{item.category || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Location</DetailLabel><DetailValue>{item.location || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Quantity</DetailLabel><DetailValue>{`${item.quantity?.toLocaleString() || '0'} ${item.unit || ''}`}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Unit Price</DetailLabel><DetailValue>${item.price?.toFixed(2) || '0.00'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Total Value</DetailLabel><DetailValue>${item.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Min Stock Level</DetailLabel><DetailValue>{item.minStockLevel?.toLocaleString() || 'Not set'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Supplier</DetailLabel><DetailValue>{item.supplier || 'N/A'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Expiry Date</DetailLabel><DetailValue>{formatDate(item.expiryDate)}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Last Updated</DetailLabel><DetailValue>{formatDate(item.updatedAt)}</DetailValue></DetailItem>
          </DetailGrid>
           {item.description && (
             <DetailItem>
               <DetailLabel>Description / Notes</DetailLabel>
               <DetailValue>{item.description}</DetailValue>
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