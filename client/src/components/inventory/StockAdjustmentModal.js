// src/components/inventory/StockAdjustmentModal.js
"use client";
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaSave, FaExclamationTriangle, FaArchive, FaMinusCircle, FaQuestionCircle } from 'react-icons/fa'; // Added FaQuestionCircle
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import toast from 'react-hot-toast';
import { useStockAdjustments } from '../../hooks/useStockAdjustments';
import { useInventory } from '../../hooks/useInventory'; // To select item if not preSelectedItem

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1020; display: grid; place-items: center; padding: 1rem;
`;
const ModalContent = styled.form`
  background: white; border-radius: 1rem; width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; h2 { margin: 0; font-size: 1.25rem; }
`;
const ModalBody = styled.div`
  padding: 1.5rem; flex-grow: 1; overflow-y: auto;
`;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; `;
const Label = styled.label` font-weight: 600; font-size: 0.875rem; color: #4a5568; margin-bottom: 0.5rem; display: block; `;
const ModalFooter = styled.div`
  padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem;
`;

const StockAdjustmentModal = ({ item: preSelectedItem, inventoryItems, onClose, onSave }) => {
    const { createAdjustment, loading: adjustmentLoading } = useStockAdjustments();
    const [formData, setFormData] = useState({
        item: preSelectedItem?._id || '',
        quantity: '',
        type: 'damaged',
        reason: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const [selectedItemDetails, setSelectedItemDetails] = useState(preSelectedItem || null);

    useEffect(() => {
        if (preSelectedItem && preSelectedItem._id !== formData.item) {
            setFormData(prev => ({
                ...prev,
                item: preSelectedItem._id,
                quantity: '',
                reason: '',
                notes: '',
                type: preSelectedItem.expiryDate && (new Date(preSelectedItem.expiryDate) < new Date()) ? 'expired' : 'damaged'
            }));
            setSelectedItemDetails(preSelectedItem);
        } else if (!preSelectedItem) {
             setFormData({
                item: '',
                quantity: '',
                type: 'damaged',
                reason: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
            });
            setSelectedItemDetails(null);
        }
    }, [preSelectedItem]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemSelect = (e) => {
        const itemId = e.target.value;
        const selected = inventoryItems.find(invItem => invItem._id === itemId);
        setFormData(prev => ({ ...prev, item: itemId, quantity: '' })); // Reset quantity
        setSelectedItemDetails(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const quantityToAdjust = Number(formData.quantity);

        if (!formData.item) {
            toast.error("Please select an item.");
            return;
        }
        if (isNaN(quantityToAdjust) || quantityToAdjust <= 0) {
            toast.error("Quantity must be a positive number.");
            return;
        }
        if (selectedItemDetails && quantityToAdjust > selectedItemDetails.quantity) {
            toast.error(`Cannot adjust more than available stock (${selectedItemDetails.quantity}).`);
            return;
        }
        if (!formData.reason.trim()) {
            toast.error("Reason for adjustment is required.");
            return;
        }

        const payload = {
            item: formData.item,
            quantity: quantityToAdjust,
            type: formData.type,
            reason: formData.reason.trim(),
            date: formData.date,
            notes: formData.notes.trim(),
        };

        const success = await createAdjustment(payload);
        if (success) {
            onSave(); // Trigger inventory refresh in parent (IMS)
            onClose();
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'damaged': return <FaExclamationTriangle />;
            case 'expired': return <FaArchive />;
            case 'lost': return <FaMinusCircle />;
            case 'shrinkage': return <FaMinusCircle />;
            case 'other': return <FaQuestionCircle />;
            default: return <FaExclamationTriangle />;
        }
    };

    const isSubmitDisabled = adjustmentLoading || 
                             !formData.item || 
                             isNaN(Number(formData.quantity)) || 
                             Number(formData.quantity) <= 0 || 
                             !selectedItemDetails ||
                             Number(formData.quantity) > selectedItemDetails.quantity || 
                             !formData.reason.trim();

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Record Stock Adjustment</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    {!preSelectedItem && ( // Show item selection only if not pre-selected
                        <FormGroup>
                            <Label htmlFor="item">Item *</Label>
                            <Select id="item" name="item" value={formData.item} onChange={handleItemSelect} required disabled={adjustmentLoading}>
                                <option value="">Select Item...</option>
                                {inventoryItems && inventoryItems.length > 0 ? (
                                    inventoryItems.map(invItem => (
                                        <option key={invItem._id} value={invItem._id}>
                                            {invItem.name} ({invItem.sku}) - Stock: {invItem.quantity} {invItem.unit}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No items available</option>
                                )}
                            </Select>
                        </FormGroup>
                    )}
                    {selectedItemDetails && (
                         <p style={{fontSize: '0.8rem', color: '#718096', marginBottom: '1rem'}}>
                            Currently available: <strong>{selectedItemDetails.quantity} {selectedItemDetails.unit}</strong>
                         </p>
                    )}

                    <FormGroup>
                        <Label htmlFor="type">Adjustment Type *</Label>
                        <Select id="type" name="type" value={formData.type} onChange={handleInputChange} required disabled={adjustmentLoading}>
                            <option value="damaged">Damaged {getIconForType('damaged')}</option>
                            <option value="expired">Expired {getIconForType('expired')}</option>
                            <option value="lost">Lost {getIconForType('lost')}</option>
                            <option value="shrinkage">Shrinkage {getIconForType('shrinkage')}</option>
                            <option value="other">Other {getIconForType('other')}</option>
                        </Select>
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="quantity">Quantity to Adjust *</Label>
                        <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            min="1"
                            max={selectedItemDetails?.quantity || 0}
                            required
                            disabled={!formData.item || adjustmentLoading || !selectedItemDetails}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="reason">Reason for Adjustment *</Label>
                        <Input
                            as="textarea"
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Explain why this adjustment is needed (e.g., 'Broken during transit', 'Passed expiry date', 'Inventory count discrepancy')"
                            required
                            disabled={adjustmentLoading}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Input
                            as="textarea"
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="2"
                            placeholder="Any extra details (optional)"
                            disabled={adjustmentLoading}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="date">Date of Adjustment *</Label>
                        <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required disabled={adjustmentLoading} />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose} disabled={adjustmentLoading}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={adjustmentLoading} disabled={isSubmitDisabled}><FaSave style={{marginRight: '0.5rem'}}/> Confirm Adjustment</Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
};

export default StockAdjustmentModal;