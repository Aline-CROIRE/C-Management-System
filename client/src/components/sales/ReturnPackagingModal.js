// src/components/sales/ReturnPackagingModal.js
"use client";
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { FaTimes, FaSave, FaRedo, FaMoneyBillWave, FaBoxes } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import toast from 'react-hot-toast';
import { salesAPI } from '../../services/api';

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1013; display: grid; place-items: center; padding: 1rem;
`;
const ModalContent = styled.div`
  background: white; border-radius: 1rem; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem; border-bottom: 1px solid #e2e8f0; h2 { margin: 0; font-size: 1.25rem; }
`;
const ModalBody = styled.div`
  padding: 1.5rem; flex-grow: 1; overflow-y: auto;
`;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; `;
const Label = styled.label` font-weight: 600; font-size: 0.875rem; color: #4a5568; margin-bottom: 0.5rem; display: block; `;
const ItemList = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const ItemCard = styled.div`
  background: #f7fafc; padding: 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0;
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; align-items: center;
  @media(max-width: 640px) { grid-template-columns: 1fr; }
`;
const ItemName = styled.div` font-weight: 600; display: flex; align-items: center; gap: 0.5rem; `;
const ModalFooter = styled.div`
  padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem;
`;

const ReturnPackagingModal = ({ sale, onClose, onPackagingReturnSuccess }) => {
    // Filter items to only show those with reusable packaging that haven't been fully returned
    const [returnItems, setReturnItems] = useState(() => 
        sale.items.filter(item => 
            item.packagingIncluded && 
            item.packagingDepositCharged > 0 && 
            (item.packagingQuantityReturned || 0) < item.quantity
        ).map(item => ({
            item: item.item._id,
            name: item.item.name,
            sku: item.item.sku,
            quantitySold: item.quantity,
            quantityReturnedSoFar: item.packagingQuantityReturned || 0,
            maxReturnable: item.quantity - (item.packagingQuantityReturned || 0), // Max packaging units not yet returned
            depositPerUnit: item.packagingDepositCharged,
            quantityToReturn: 0, // Initialize quantity to return for this session
        }))
    );
    const [refundMethod, setRefundMethod] = useState('Cash');
    const [loading, setLoading] = useState(false);

    const handleQuantityChange = (itemId, value) => {
        const numValue = Number(value);
        setReturnItems(prev => prev.map(item => {
            if (item.item === itemId) {
                const newQty = isNaN(numValue) ? 0 : numValue;
                return { ...item, quantityToReturn: Math.max(0, Math.min(newQty, item.maxReturnable)) };
            }
            return item;
        }));
    };

    const totalRefundAmount = useMemo(() => {
        return returnItems.reduce((sum, item) => sum + (item.quantityToReturn * item.depositPerUnit), 0);
    }, [returnItems]);

    const itemsToProcess = useMemo(() => returnItems.filter(item => item.quantityToReturn > 0), [returnItems]);

    const handleSubmit = async () => {
        if (itemsToProcess.length === 0) {
            return toast.error("Please enter a quantity for at least one item's packaging to return.");
        }
        if (totalRefundAmount <= 0) {
            return toast.error("Total refund amount must be greater than zero.");
        }
        if (!refundMethod.trim()) {
            return toast.error("Refund method is required.");
        }

        setLoading(true);
        try {
            // Loop through each item that needs packaging returned
            // We're making a separate API call for each item's packaging return.
            // This allows granular tracking on the backend per sale item.
            for (const item of itemsToProcess) {
                await salesAPI.returnPackaging(sale._id, item.item, {
                    quantityReturned: item.quantityToReturn,
                    refundMethod: refundMethod,
                });
            }
            
            toast.success(`Packaging returned successfully! Total refunded: Rwf ${totalRefundAmount.toLocaleString()}.`);
            onPackagingReturnSuccess(); // Callback to refresh sale data in parent
            onClose();
        } catch (error) {
            // Error handling is managed by the API interceptor (toast.error will show)
            console.error("Error in ReturnPackagingModal:", error);
        } finally {
            setLoading(false);
        }
    };

    const isSubmitDisabled = loading || itemsToProcess.length === 0 || totalRefundAmount <= 0 || !refundMethod.trim();

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Return Packaging for Sale #{sale.receiptNumber}</h2>
                    <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    <p>Select the quantity of reusable packaging being returned for each item. This will refund the deposit to the customer's outstanding balance.</p>
                    
                    <ItemList>
                        {returnItems.length > 0 ? (
                            returnItems.map(item => (
                                <ItemCard key={item.item}>
                                    <ItemName><FaBoxes /> {item.name} <small>({item.sku})</small></ItemName>
                                    <FormGroup>
                                        <Label htmlFor={`qty-to-return-${item.item}`}>Return Qty (Max {item.maxReturnable})</Label>
                                        <Input
                                            id={`qty-to-return-${item.item}`}
                                            type="number"
                                            value={item.quantityToReturn}
                                            onChange={(e) => handleQuantityChange(item.item, e.target.value)}
                                            min="0"
                                            max={item.maxReturnable}
                                        />
                                        <small style={{color: '#718096'}}>Deposit: Rwf {item.depositPerUnit.toLocaleString()} / unit</small>
                                        {item.quantityReturnedSoFar > 0 && 
                                            <small style={{color: '#718096'}}>Already returned: {item.quantityReturnedSoFar}</small>}
                                    </FormGroup>
                                    <div style={{textAlign: 'right'}}>
                                        <Label>Refund:</Label>
                                        <strong>Rwf {(item.quantityToReturn * item.depositPerUnit).toLocaleString()}</strong>
                                    </div>
                                </ItemCard>
                            ))
                        ) : (
                            <p style={{textAlign:'center', color: '#718096'}}>No reusable packaging outstanding for this sale.</p>
                        )}
                    </ItemList>

                    <FormGroup style={{marginTop: '1.5rem'}}>
                        <Label htmlFor="refundMethod">Refund Method *</Label>
                        <Select
                            id="refundMethod"
                            value={refundMethod}
                            onChange={(e) => setRefundMethod(e.target.value)}
                            required
                        >
                            <option value="">Select Method...</option>
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Store Credit">Store Credit</option>
                        </Select>
                    </FormGroup>
                    
                    <div style={{textAlign: 'right', marginTop: '1.5rem'}}>
                        <h3>Total Refund Amount: <strong>Rwf {totalRefundAmount.toLocaleString()}</strong></h3>
                    </div>

                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={isSubmitDisabled}>
                        <FaRedo /> Confirm Packaging Return
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
};

export default ReturnPackagingModal;