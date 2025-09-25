// src/components/inventory/InternalUseModal.js
"use client";
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaSave, FaClipboardList } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import toast from 'react-hot-toast';
import { useInternalUse } from '../../hooks/useInternalUse';

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

const InternalUseModal = ({ item: preSelectedItem, inventoryItems, onClose, onSave }) => {
    const { createInternalUse, loading: internalUseLoading } = useInternalUse();
    const [formData, setFormData] = useState({
        item: preSelectedItem?._id || '',
        quantity: '',
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
            }));
            setSelectedItemDetails(preSelectedItem);
        } else if (!preSelectedItem) {
            setFormData({
                item: '',
                quantity: '',
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
        setFormData(prev => ({ ...prev, item: itemId, quantity: '' }));
        setSelectedItemDetails(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const quantityToUse = Number(formData.quantity);

        // Client-side validation to provide immediate feedback
        if (!formData.item) {
            toast.error("Please select an item.");
            return;
        }
        if (isNaN(quantityToUse) || quantityToUse <= 0) {
            toast.error("Quantity must be a positive number.");
            return;
        }
        if (selectedItemDetails && quantityToUse > selectedItemDetails.quantity) {
            toast.error(`Cannot use more than available stock (${selectedItemDetails.quantity}).`);
            return;
        }
        if (!formData.reason.trim()) {
            toast.error("Reason for internal use is required.");
            return;
        }

        const payload = {
            item: formData.item,
            quantity: quantityToUse,
            reason: formData.reason.trim(),
            date: formData.date,
            notes: formData.notes.trim(),
        };

        const success = await createInternalUse(payload);
        if (success) {
            onSave();
            onClose();
        }
    };

    // Refined disabled logic for the submit button
    const isSubmitDisabled = internalUseLoading || 
                             !formData.item || 
                             isNaN(Number(formData.quantity)) || 
                             Number(formData.quantity) <= 0 || 
                             !selectedItemDetails || // Ensure an item is selected and details are loaded
                             Number(formData.quantity) > selectedItemDetails.quantity || // Prevent using more than available
                             !formData.reason.trim();

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Record Internal Item Use</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label htmlFor="item">Item *</Label>
                        <Select id="item" name="item" value={formData.item} onChange={handleItemSelect} required disabled={!!preSelectedItem || internalUseLoading}>
                            <option value="">Select Item...</option>
                            {inventoryItems.length > 0 ? (
                                inventoryItems.map(invItem => (
                                    <option key={invItem._id} value={invItem._id}>
                                        {invItem.name} ({invItem.sku}) - Stock: {invItem.quantity} {invItem.unit}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>No items available</option>
                            )}
                        </Select>
                        {selectedItemDetails && (
                            <p style={{fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem'}}>
                                Available: {selectedItemDetails.quantity} {selectedItemDetails.unit}
                            </p>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="quantity">Quantity Used *</Label>
                        <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            min="1"
                            max={selectedItemDetails?.quantity || 0}
                            required
                            disabled={!formData.item || internalUseLoading || !selectedItemDetails}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="reason">Reason for Use *</Label>
                        <Input
                            as="textarea"
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Explain why this item is being used internally (e.g., 'Office supplies', 'Sample for testing', 'Damage during demonstration')"
                            required
                            disabled={internalUseLoading}
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
                            disabled={internalUseLoading}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="date">Date of Use *</Label>
                        <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required disabled={internalUseLoading} />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose} disabled={internalUseLoading}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={internalUseLoading} disabled={isSubmitDisabled}><FaSave style={{marginRight: '0.5rem'}}/> Record Use</Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
};

export default InternalUseModal;