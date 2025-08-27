"use client";
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes, FaPrint } from 'react-icons/fa';
import Button from '../common/Button';

// --- STYLED COMPONENTS (reused patterns) ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1010;
  display: flex; align-items: center; justify-content: center; animation: ${fadeIn} 0.3s;
`;
const ModalContent = styled.div`
  background: white; border-radius: 1rem; width: 90%; max-width: 600px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: ${slideUp} 0.3s;
  max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  h2 { margin: 0; font-size: 1.25rem; }
`;
const ModalBody = styled.div`
  padding: 2rem; flex-grow: 1; overflow-y: auto;
`;
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
`;
const InfoItem = styled.div`
  strong { display: block; color: #718096; font-size: 0.8rem; margin-bottom: 0.25rem; }
  span { font-size: 1rem; }
`;
const ItemsTable = styled.table`width: 100%; border-collapse: collapse; margin-top: 1rem;`;
const Th = styled.th`text-align: left; padding: 0.5rem; background: #f7fafc; border-bottom: 1px solid #e2e8f0;`;
const Td = styled.td`padding: 0.75rem 0.5rem; border-bottom: 1px solid #e2e8f0;`;
const TotalRow = styled.tr`
  td { font-weight: bold; font-size: 1.1rem; }
`;


const ViewSaleModal = ({ sale, onClose }) => {
    if (!sale) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Sale Details - #{sale.receiptNumber}</h2>
                    <div>
                        <Button variant="ghost" size="sm" style={{marginRight: '0.5rem'}}><FaPrint /> Print</Button>
                        <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                    </div>
                </ModalHeader>
                <ModalBody>
                    <InfoGrid>
                        <InfoItem>
                            <strong>CUSTOMER</strong>
                            <span>{sale.customerName || 'Walk-in Customer'}</span>
                        </InfoItem>
                        <InfoItem>
                            <strong>DATE OF SALE</strong>
                            <span>{new Date(sale.createdAt).toLocaleString()}</span>
                        </InfoItem>
                    </InfoGrid>

                    <h4>Items Sold</h4>
                    <ItemsTable>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th style={{textAlign: 'right'}}>Quantity</Th>
                                <Th style={{textAlign: 'right'}}>Unit Price</Th>
                                <Th style={{textAlign: 'right'}}>Subtotal</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, index) => (
                                <tr key={index}>
                                    <Td>{item.name}</Td>
                                    <Td style={{textAlign: 'right'}}>{item.quantity}</Td>
                                    <Td style={{textAlign: 'right'}}>${item.price.toFixed(2)}</Td>
                                    <Td style={{textAlign: 'right'}}>${(item.quantity * item.price).toFixed(2)}</Td>
                                </tr>
                            ))}
                            <TotalRow>
                                <Td colSpan="3" style={{textAlign: 'right'}}>Total Amount</Td>
                                <Td style={{textAlign: 'right'}}>${sale.totalAmount.toFixed(2)}</Td>
                            </TotalRow>
                        </tbody>
                    </ItemsTable>
                </ModalBody>
            </ModalContent>
        </ModalOverlay>
    );
};

export default ViewSaleModal;