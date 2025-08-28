"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { FaCheck, FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';

const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1002; display: grid; place-items: center; padding: 1rem; `;
const ModalContent = styled.div` background: white; border-radius: 1rem; width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; `;
const ModalHeader = styled.div` padding: 1.5rem; border-bottom: 1px solid #e2e8f0; h2 { margin: 0; font-size: 1.25rem; }`;
const ModalBody = styled.div` padding: 1.5rem; overflow-y: auto; `;
const ItemList = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const ItemCard = styled.div` background: #f7fafc; padding: 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 100px 150px; gap: 1rem; align-items: center; @media(max-width: 640px) { grid-template-columns: 1fr; } `;
const ItemName = styled.div` font-weight: 600; `;
const ModalFooter = styled.div` padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; `;
const FormLabel = styled.label` font-size: 0.8rem; font-weight: 500; color: #718096; display: block; margin-bottom: 0.25rem;`;

const ReceivePOModal = ({ order, onClose, onConfirm, loading }) => {
  const [receivedItems, setReceivedItems] = useState(
    order.items.map(item => ({
      item: item.item._id,
      quantityReceived: item.quantity,
      sellingPrice: item.item.price || 0,
    }))
  );

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...receivedItems];
    updatedItems[index][field] = Number(value);
    setReceivedItems(updatedItems);
  };

  const handleSubmit = () => {
    onConfirm(receivedItems);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Receive Items for PO #{order.orderNumber}</h2>
        </ModalHeader>
        <ModalBody>
          <p>Confirm the quantity received and set the new **selling price** for each item. This will update your main inventory.</p>
          <ItemList>
            {order.items.map((item, index) => (
              <ItemCard key={item.item._id}>
                <ItemName>{item.item.name} <small>({item.item.sku})</small></ItemName>
                <div>
                  <FormLabel>Qty Received</FormLabel>
                  <Input
                    type="number"
                    value={receivedItems[index].quantityReceived}
                    onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                  />
                </div>
                 <div>
                  <FormLabel>Selling Price (RWF)</FormLabel>
                  <Input
                    type="number"
                    value={receivedItems[index].sellingPrice}
                    onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                  />
                </div>
              </ItemCard>
            ))}
          </ItemList>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}><FaTimes/> Cancel</Button>
          <Button variant="success" onClick={handleSubmit} loading={loading}><FaCheck/> Confirm & Update Inventory</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ReceivePOModal;