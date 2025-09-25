// src/components/inventory/RecordMultiInternalUseModal.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from 'react-dom';
import styled, { keyframes } from "styled-components";
import { FaTimes, FaSave, FaPlus, FaTrash, FaSearch, FaClipboardList } from "react-icons/fa";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import toast from 'react-hot-toast';
import { useInternalUse } from '../../hooks/useInternalUse';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1020;
  display: flex; align-items: center; justify-content: center; animation: ${fadeIn} 0.3s;
`;
const ModalContent = styled.form`
  background: white; border-radius: 1rem; width: 90%; max-width: 800px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: ${slideUp} 0.3s;
  max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  h2 { margin: 0; font-size: 1.5rem; }
`;
const ModalBody = styled.div`
  padding: 2rem; flex-grow: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1.5rem;
`;
const ModalFooter = styled.div`
  padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: flex-end; gap: 1rem;
  background: #f7fafc; border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem;
`;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; `;
const Label = styled.label` font-weight: 600; font-size: 0.875rem; color: #4a5568; margin-bottom: 0.5rem; display: block; `;
const SearchContainer = styled.div`display: flex; gap: 0.5rem;`;
const SearchWrapper = styled.div`position: relative; flex-grow: 1;`;
const SearchResults = styled.div`
  position: absolute; top: 100%; left: 0; right: 0;
  background: white; border: 1px solid #e2e8f0;
  border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  max-height: 200px; overflow-y: auto; z-index: 1020;
`;
const SearchResultItem = styled.div`
  padding: 0.75rem 1rem; cursor: pointer;
  &:hover { background: #f7fafc; }
`;
const ItemsTable = styled.table`width: 100%; border-collapse: collapse; margin-top: 1rem;`;
const Th = styled.th`text-align: left; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #718096;`;
const Td = styled.td`padding: 0.75rem 0.5rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle;`;


const RecordMultiInternalUseModal = ({ inventoryItems, onClose, onSave, loading }) => {
    const { createInternalUse, loading: internalUseLoading } = useInternalUse();

    const [internalUseItems, setInternalUseItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [globalReason, setGlobalReason] = useState('');
    const [globalNotes, setGlobalNotes] = useState('');
    const [useDate, setUseDate] = useState(new Date().toISOString().split('T')[0]);

    // Available items for selection (not already added, and in stock)
    const selectableInventoryItems = useMemo(() => {
        const addedItemIds = new Set(internalUseItems.map(i => i.item));
        return inventoryItems.filter(item => !addedItemIds.has(item._id) && item.quantity > 0);
    }, [internalUseItems, inventoryItems]);

    // Search results for adding new items
    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return selectableInventoryItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, selectableInventoryItems]);

    const handleAddItem = (item) => {
        setInternalUseItems(prev => [...prev, {
            id: item._id, // Use _id as a unique key for React rendering purposes too
            item: item._id,
            name: item.name,
            sku: item.sku,
            unit: item.unit,
            currentStock: item.quantity,
            quantity: 1, // Default to 1
        }]);
        setSearchTerm('');
    };

    const handleUpdateItemQuantity = (itemId, value) => {
        const numValue = parseInt(value, 10);
        setInternalUseItems(prev => prev.map(item => {
            if (item.item === itemId) {
                const newQty = isNaN(numValue) ? 0 : numValue;
                return { ...item, quantity: Math.max(1, Math.min(newQty, item.currentStock)) };
            }
            return item;
        }));
    };
    
    const handleRemoveItem = (itemId) => {
        setInternalUseItems(prev => prev.filter(item => item.item !== itemId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (internalUseItems.length === 0) {
            toast.error("Please add at least one item for internal use.");
            return;
        }
        if (!globalReason.trim()) {
            toast.error("A reason for internal use is required for all items.");
            return;
        }

        const payloads = internalUseItems.map(item => ({
            item: item.item,
            quantity: item.quantity,
            reason: globalReason.trim(),
            date: useDate,
            notes: globalNotes.trim(),
        }));

        let allSuccess = true;
        for (const payload of payloads) {
            // Client-side validation for each item before sending to API
            if (!payload.item) {
                toast.error("One or more items are missing an ID.");
                allSuccess = false;
                break;
            }
            if (isNaN(payload.quantity) || payload.quantity <= 0) {
                toast.error(`Quantity for item ${payload.item} must be a positive number.`);
                allSuccess = false;
                break;
            }
            if (!payload.reason.trim()) {
                toast.error(`Reason for item ${payload.item} is missing.`);
                allSuccess = false;
                break;
            }

            if (allSuccess) { // Only attempt API call if client-side validation passed for this item
                const success = await createInternalUse(payload);
                if (!success) {
                    allSuccess = false;
                    break;
                }
            }
        }

        if (allSuccess) {
            onSave();
            onClose();
            toast.success("All internal use records saved successfully!");
        } else {
            // toast.error will already be shown by the loop or API interceptor
        }
    };

    const isSubmitDisabled = internalUseLoading || loading || internalUseItems.length === 0 || !globalReason.trim();

    return ReactDOM.createPortal(
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Record Multiple Internal Uses</h2>
                    <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label htmlFor="globalReason">Reason for Use (Applies to all items) *</Label>
                        <Input
                            as="textarea"
                            id="globalReason"
                            name="globalReason"
                            value={globalReason}
                            onChange={(e) => setGlobalReason(e.target.value)}
                            rows="2"
                            placeholder="e.g., Office supplies restocking, Samples for testing, Departmental allocation"
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="globalNotes">Additional Notes (Applies to all items)</Label>
                        <Input
                            as="textarea"
                            id="globalNotes"
                            name="globalNotes"
                            value={globalNotes}
                            onChange={(e) => setGlobalNotes(e.target.value)}
                            rows="1"
                            placeholder="Optional general notes..."
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="useDate">Date of Use *</Label>
                        <Input id="useDate" name="useDate" type="date" value={useDate} onChange={(e) => setUseDate(e.target.value)} required />
                    </FormGroup>

                    <FormGroup>
                        <Label>Add Products for Internal Use</Label>
                        <SearchContainer>
                            <SearchWrapper>
                                <Input
                                    type="text"
                                    placeholder="Search by name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <SearchResults>
                                        {searchResults.map(item => (
                                            <SearchResultItem key={item._id} onClick={() => handleAddItem(item)}>
                                                {item.name} ({item.sku}) - In Stock: {item.quantity} {item.unit}
                                            </SearchResultItem>
                                        ))}
                                    </SearchResults>
                                )}
                            </SearchWrapper>
                        </SearchContainer>
                    </FormGroup>
                    
                    {internalUseItems.length > 0 ? (
                        <ItemsTable>
                            <thead>
                                <tr>
                                    <Th style={{width: '60%'}}>Product</Th>
                                    <Th>Qty</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody>
                                {internalUseItems.map(item => (
                                    <tr key={item.id}>
                                        <Td>{item.name}<br/><small style={{color: '#718096'}}>SKU: {item.sku} (Available: {item.currentStock} {item.unit})</small></Td>
                                        <Td>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateItemQuantity(item.item, e.target.value)}
                                                min="1"
                                                max={item.currentStock}
                                                style={{width: '80px'}}
                                            />
                                        </Td>
                                        <Td><Button variant="danger-ghost" size="sm" iconOnly onClick={() => handleRemoveItem(item.item)}><FaTrash /></Button></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </ItemsTable>
                    ) : (
                        <p style={{textAlign:'center', color: '#718096'}}>No items added for internal use yet.</p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading || internalUseLoading}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={internalUseLoading} disabled={isSubmitDisabled || loading}>
                        <FaSave style={{ marginRight: '0.5rem' }}/> Save Internal Uses
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
};

export default RecordMultiInternalUseModal;