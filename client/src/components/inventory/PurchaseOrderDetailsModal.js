// components/PurchaseOrders/PurchaseOrderDetailsModal.js
"use client";

import React from 'react';
import styled from 'styled-components';
import { FaBoxes, FaCheck, FaTimes, FaTruckLoading, FaTrash, FaRedo, FaPlusCircle } from 'react-icons/fa';
import Button from '../common/Button';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 1001;
  display: grid;
  place-items: center;
  padding: 1rem;
`;
const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  h2 { margin: 0; font-size: 1.25rem; }
  p { margin: 0.5rem 0 0; font-size: 0.875rem; color: #718096; }
`;
const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
`;
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;
const DetailItem = styled.div`
  font-size: 0.9rem;
  strong { display: block; margin-bottom: 0.25rem; color: #4a5568; }
  span { color: #2d3748; }
`;
const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const ItemCard = styled.div`
  background: #f7fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
`;
const ItemName = styled.div`
  font-weight: 600;
  color: #1a202c;
  flex-basis: 100%;
  @media(min-width: 640px) {
    flex-basis: auto;
  }
`;
const ItemDetail = styled.span`
  font-size: 0.85rem;
  color: #4a5568;
`;
const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
`;

const statusColors = {
  'Pending': '#ECC94B',
  'Ordered': '#4299E1',
  'Shipped': '#9F7AEA',
  'Completed': '#48BB78',
  'Cancelled': '#F56565',
};

const StatusTag = styled.span`
  display: inline-block;
  padding: 0.3em 0.6em;
  border-radius: 0.5em;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
  background-color: ${(props) => statusColors[props.status] || '#CBD5E0'};
`;

const PurchaseOrderDetailsModal = ({ order, onClose, onReceive, onCancel, onDelete, onMarkAsOrdered, onReorder }) => {
  const formatCurrency = (amount) => `Rwf ${Number(amount).toLocaleString()}`;
  const orderDate = new Date(order.orderDate).toLocaleDateString();
  const receivedDate = order.receivedDate ? new Date(order.receivedDate).toLocaleDateString() : 'N/A';

  const isEditable = !['Completed', 'Cancelled'].includes(order.status);
  const isReceivable = order.status === 'Ordered' || order.status === 'Shipped';
  const isCancellable = isEditable;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Purchase Order #{order.orderNumber}</h2>
          <p>Ordered from: {order.supplier?.name}</p>
        </ModalHeader>
        <ModalBody>
          <DetailsGrid>
            <DetailItem>
              <strong>Status</strong>
              <StatusTag status={order.status}>{order.status}</StatusTag>
            </DetailItem>
            <DetailItem>
              <strong>Order Date</strong>
              <span>{orderDate}</span>
            </DetailItem>
            <DetailItem>
              <strong>Expected Date</strong>
              <span>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'N/A'}</span>
            </DetailItem>
            <DetailItem>
              <strong>Received Date</strong>
              <span>{receivedDate}</span>
            </DetailItem>
            <DetailItem>
              <strong>Total Amount</strong>
              <span>{formatCurrency(order.totalAmount)}</span>
            </DetailItem>
          </DetailsGrid>

          <h3>Items Ordered</h3>
          <ItemList>
            {order.items.map(item => (
              <ItemCard key={item.item._id}>
                <ItemName>{item.item.name} <small>({item.item.sku})</small></ItemName>
                <ItemDetail>Qty: {item.quantity}</ItemDetail>
                <ItemDetail>Unit Price (Cost): {formatCurrency(item.unitPrice)}</ItemDetail>
                <ItemDetail>Selling Price (Current): {formatCurrency(item.item.price || 0)}</ItemDetail>
              </ItemCard>
            ))}
          </ItemList>
        </ModalBody>
        <ModalFooter>
          {isReceivable && (
            <Button variant="success" onClick={() => {
                onReceive(order.items.map(poItem => ({
                    // Removed .toObject() here as poItem is already a plain object
                    ...poItem, // Spread the existing item properties
                    item: poItem.item._id, // Ensure item ID is just the ID
                    costPrice: poItem.unitPrice // Pass the PO's unitPrice as costPrice for validation
                })));
            }}><FaTruckLoading/> Receive Items</Button>
          )}
          {order.status === 'Pending' && (
            <Button variant="primary" onClick={() => onMarkAsOrdered(order._id)}><FaCheck/> Mark as Ordered</Button>
          )}
          {isCancellable && (
            <Button variant="danger" onClick={() => onCancel(order._id)}><FaTimes/> Cancel Order</Button>
          )}
          <Button variant="secondary" onClick={() => onReorder(order)}><FaRedo/> Reorder</Button>
          <Button variant="danger" onClick={() => onDelete(order._id)}><FaTrash/> Delete</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PurchaseOrderDetailsModal;