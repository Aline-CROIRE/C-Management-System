"use client";

import React, { useState, useEffect } from 'react'; // Import useEffect
import styled from 'styled-components';
import { FaBoxes, FaCheck, FaTimes, FaExclamationCircle } from 'react-icons/fa'; // Added FaExclamationCircle
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast'; // Import toast for user feedback

const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1002; display: grid; place-items: center; padding: 1rem; `;
const ModalContent = styled.div` background: white; border-radius: 1rem; width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; `;
const ModalHeader = styled.div` padding: 1.5rem; border-bottom: 1px solid #e2e8f0; h2 { margin: 0; font-size: 1.25rem; }`;
const ModalBody = styled.div` padding: 1.5rem; overflow-y: auto; `;
const ItemList = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const ItemCard = styled.div` 
  background: #f7fafc; 
  padding: 1rem; 
  border-radius: 0.75rem; 
  border: 1px solid #e2e8f0; 
  display: grid; 
  grid-template-columns: 1fr 100px 150px; 
  gap: 1rem; 
  align-items: center; 
  @media(max-width: 640px) { grid-template-columns: 1fr; } 
`;
const ItemName = styled.div` font-weight: 600; `;
const ModalFooter = styled.div` padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; `;
const FormLabel = styled.label` font-size: 0.8rem; font-weight: 500; color: #718096; display: block; margin-bottom: 0.25rem;`;
const ValidationError = styled.p`
  color: #c53030;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const ReceivePOModal = ({ order, onClose, onConfirm, loading }) => {
  const [receivedItems, setReceivedItems] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Initialize receivedItems from order.items when component mounts or order changes
    setReceivedItems(
      order.items.map(item => ({
        item: item.item._id,
        quantityReceived: item.quantity,
        sellingPrice: item.item.price || item.unitPrice || 0, // Default to current selling price or PO unit price
        costPrice: item.unitPrice, // Store costPrice from the PO item for validation
      }))
    );
    setValidationErrors({}); // Clear errors on order change
  }, [order]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...receivedItems];
    updatedItems[index][field] = Number(value);
    setReceivedItems(updatedItems);

    // Clear specific validation error as user types
    setValidationErrors(prev => ({
      ...prev,
      [`sellingPrice-${index}`]: undefined
    }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    let hasError = false;

    receivedItems.forEach((item, index) => {
      if (item.quantityReceived <= 0) {
        newErrors[`quantityReceived-${index}`] = "Quantity received must be greater than 0.";
        hasError = true;
      }
      // Client-side validation: sellingPrice cannot be below costPrice
      if (Number(item.sellingPrice) < Number(item.costPrice)) {
        newErrors[`sellingPrice-${index}`] = `Selling price (Rwf ${item.sellingPrice.toLocaleString()}) cannot be below cost price (Rwf ${item.costPrice.toLocaleString()}).`;
        hasError = true;
        toast.error(newErrors[`sellingPrice-${index}`]); // Show toast for immediate feedback
      }
    });

    setValidationErrors(newErrors);

    if (!hasError) {
      // Filter out only the necessary data for the backend
      const dataToSend = receivedItems.map(({ item, quantityReceived, sellingPrice }) => ({
        item,
        quantityReceived,
        sellingPrice,
      }));
      onConfirm(dataToSend);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Receive Items for PO #{order.orderNumber}</h2>
        </ModalHeader>
        <ModalBody>
          <p>Confirm the quantity received and set the new **selling price** for each item. This will update your main inventory. The selling price cannot go below the cost price.</p>
          <ItemList>
            {receivedItems.map((receivedItem, index) => {
              // Find the original PO item to get its name and SKU
              const originalPOItem = order.items.find(poItem => poItem.item._id === receivedItem.item);
              const itemName = originalPOItem?.item?.name || 'Unknown Item';
              const itemSku = originalPOItem?.item?.sku || 'N/A';

              return (
                <ItemCard key={receivedItem.item}>
                  <ItemName>{itemName} <small>({itemSku})</small></ItemName>
                  <div>
                    <FormLabel>Qty Received</FormLabel>
                    <Input
                      type="number"
                      value={receivedItem.quantityReceived}
                      onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                      min="0"
                    />
                    {validationErrors[`quantityReceived-${index}`] && (
                        <ValidationError><FaExclamationCircle/> {validationErrors[`quantityReceived-${index}`]}</ValidationError>
                    )}
                  </div>
                  <div>
                    <FormLabel>Selling Price (RWF)</FormLabel>
                    <Input
                      type="number"
                      value={receivedItem.sellingPrice}
                      onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                      min="0"
                    />
                    {validationErrors[`sellingPrice-${index}`] && (
                        <ValidationError><FaExclamationCircle/> {validationErrors[`sellingPrice-${index}`]}</ValidationError>
                    )}
                    <small style={{display: 'block', color: '#718096', marginTop: '0.25rem'}}>Cost Price: Rwf {Number(receivedItem.costPrice).toLocaleString()}</small>
                  </div>
                </ItemCard>
              );
            })}
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