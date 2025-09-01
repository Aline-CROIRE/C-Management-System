"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { FaUndo, FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1011; display: grid; place-items: center; padding: 1rem; `;
const ModalContent = styled.div` background: white; border-radius: 1rem; width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; `;
const ModalHeader = styled.div` padding: 1.5rem; border-bottom: 1px solid #e2e8f0; h2 { margin: 0; font-size: 1.25rem; }`;
const ModalBody = styled.div` padding: 1.5rem; overflow-y: auto; `;
const ItemList = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const ItemCard = styled.div` background: #f7fafc; padding: 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 120px; gap: 1rem; align-items: center; `;
const ItemName = styled.div` font-weight: 600; `;
const ModalFooter = styled.div` padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; `;
const FormLabel = styled.label` font-size: 0.8rem; font-weight: 500; color: #718096; display: block; margin-bottom: 0.25rem;`;

const ReturnSaleModal = ({ sale, onClose, onConfirm, loading }) => {
  const [returnedItems, setReturnedItems] = useState(
    sale.items.map(item => ({
      item: item.item._id,
      quantity: 0,
      maxQuantity: item.quantity,
    }))
  );

  const handleQuantityChange = (index, value) => {
    const newQty = Math.max(0, Math.min(Number(value), returnedItems[index].maxQuantity));
    const updatedItems = [...returnedItems];
    updatedItems[index].quantity = newQty;
    setReturnedItems(updatedItems);
  };

  const handleSubmit = () => {
    const itemsToProcess = returnedItems.filter(item => item.quantity > 0);
    if (itemsToProcess.length === 0) {
        return toast.error("Please enter a return quantity for at least one item.");
    }
    onConfirm(sale._id, itemsToProcess);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Process Return for Receipt #{sale.receiptNumber}</h2>
        </ModalHeader>
        <ModalBody>
          <p>Enter the quantity of each item being returned. This will restock your inventory.</p>
          <ItemList>
            {sale.items.map((item, index) => (
              <ItemCard key={item.item._id}>
                <ItemName>{item.item.name} <small>({item.item.sku})</small><br/><small>Sold: {item.quantity}</small></ItemName>
                <div>
                  <FormLabel>Return Quantity</FormLabel>
                  <Input
                    type="number"
                    value={returnedItems[index].quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    max={item.quantity}
                    min={0}
                  />
                </div>
              </ItemCard>
            ))}
          </ItemList>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}><FaTimes/> Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={loading}><FaUndo/> Confirm Return</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ReturnSaleModal;