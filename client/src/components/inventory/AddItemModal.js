// src/components/inventory/AddItemModal.js
"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaBarcode } from "react-icons/fa"; 
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import toast from 'react-hot-toast';

// Styled components (assuming they are defined elsewhere or simplified here for brevity)
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(4px); `;
const ModalContent = styled.form` background: ${(props) => props.theme.colors.surface}; color: ${(props) => props.theme.colors.text}; border-radius: ${(props) => props.theme.borderRadius.xl}; width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: ${(props) => props.theme.shadows.xl}; overflow: hidden; `;
const ModalHeader = styled.div` padding: 1.5rem 2rem; border-bottom: 1px solid ${(props) => props.theme.colors.border}; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; `;
const ModalTitle = styled.h2` font-size: 1.5rem; font-weight: 700; color: ${(props) => props.theme.colors.heading}; margin: 0; `;
const CloseButton = styled.button` background: none; border: none; font-size: 1.5rem; color: ${(props) => props.theme.colors.textSecondary}; cursor: pointer; padding: 0.5rem; line-height: 1; border-radius: ${(props) => props.theme.borderRadius.md}; transition: all 0.2s ease-in-out; &:hover { background: ${(props) => props.theme.colors.surfaceLight}; color: ${(props) => props.theme.colors.text}; } `;
const ModalBody = styled.div` padding: 2rem; overflow-y: auto; flex-grow: 1; `;
const FormGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; `;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; `;
const Label = styled.label` font-weight: 600; color: ${(props) => props.theme.colors.textSecondary}; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px; `;
const ThemedInput = styled(Input)` padding: 0.75rem; border: 1px solid ${(props) => props.theme.colors.border}; border-radius: ${(props) => props.theme.borderRadius.md}; background: ${(props) => props.theme.colors.surface}; color: ${(props) => props.theme.colors.text}; font-size: 0.9rem; `;
const ThemedSelect = styled(Select)` padding: 0.75rem; border: 1px solid ${(props) => props.theme.colors.border}; border-radius: ${(props) => props.theme.borderRadius.md}; `;
const TextArea = styled.textarea` padding: 0.75rem; border: 1px solid ${(props) => props.theme.colors.border}; border-radius: ${(props) => props.theme.borderRadius.md}; resize: vertical; min-height: 100px; background: ${(props) => props.theme.colors.surface}; color: ${(props) => props.theme.colors.text}; font-size: 0.9rem; font-family: inherit; `;
const ImageUploadContainer = styled.div` border: 2px dashed ${(props) => props.theme.colors.border}; border-radius: ${(props) => props.theme.borderRadius.lg}; padding: 2rem; text-align: center; cursor: pointer; position: relative; transition: all 0.2s ease-in-out; &:hover { border-color: ${(props) => props.theme.colors.primary}; } `;
const HiddenInput = styled.input` position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; `;
const ModalFooter = styled.div` padding: 1.5rem 2rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid ${(props) => props.theme.colors.border}; `;


const AddItemModal = ({
    onClose,
    onSave,
    loading,
    itemToEdit = null,
    categories = [],
    locations = [],
    units = [],
    suppliers = [],
    // We also need the full list of inventory items to select a linked reusable packaging item
    inventoryItems = [], // Assuming this is passed from IMS
    createCategory,
    createLocation,
    createSupplier,
    createUnit,
}) => {
    const isEditMode = Boolean(itemToEdit);

    const [newCategoryName, setNewCategoryName] = useState("");
    const [newLocationName, setNewLocationName] = useState("");
    const [newUnitName, setNewUnitName] = useState("");
    const [newSupplierName, setNewSupplierName] = useState("");

    const [formData, setFormData] = useState({
        name: '', sku: '', category: '', location: '', unit: '', quantity: '',
        price: '', costPrice: '', minStockLevel: '', supplier: '', description: '', expiryDate: '', 
        packagingType: 'None', 
        packagingDeposit: '0',
        isReusablePackaging: false, // NEW: default
        linkedReusablePackagingItem: '', // NEW: default
    });

    useEffect(() => {
        if (isEditMode && itemToEdit) {
            setFormData({
                name: itemToEdit.name || '',
                sku: itemToEdit.sku || '',
                category: itemToEdit.category?._id || '',
                location: itemToEdit.location?._id || '',
                unit: itemToEdit.unit || '',
                quantity: itemToEdit.quantity?.toString() ?? '0',
                price: itemToEdit.price?.toString() ?? '0',
                costPrice: itemToEdit.costPrice?.toString() ?? '0',
                minStockLevel: itemToEdit.minStockLevel?.toString() ?? '0',
                supplier: itemToEdit.supplier?._id || '',
                description: itemToEdit.description || '',
                expiryDate: itemToEdit.expiryDate ? new Date(itemToEdit.expiryDate).toISOString().split('T')[0] : '',
                packagingType: itemToEdit.packagingType || 'None',
                packagingDeposit: itemToEdit.packagingDeposit?.toString() ?? '0',
                isReusablePackaging: itemToEdit.isReusablePackaging || false, // NEW
                linkedReusablePackagingItem: itemToEdit.linkedReusablePackagingItem?._id || '', // NEW
            });
         
        } else {
            setFormData({
                name: '', sku: '', category: '', location: '', unit: '', quantity: '',
                price: '', costPrice: '', minStockLevel: '', supplier: '', description: '', expiryDate: '',
                packagingType: 'None',
                packagingDeposit: '0',
                isReusablePackaging: false,
                linkedReusablePackagingItem: '',
            });
         
        }
    }, [itemToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    // Filter to show only items that ARE reusable packaging for linking
    const reusablePackagingItems = useMemo(() => {
        return inventoryItems.filter(item => 
            item.isReusablePackaging === true && item._id !== itemToEdit?._id // Cannot link to itself
        );
    }, [inventoryItems, itemToEdit]);


    const generateSKU = () => setFormData((prev) => ({ ...prev, sku: `${(prev.name.substring(0, 3) || "NEW").toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        let finalData = { ...formData };

        try {
            if (formData.category === "_add_new_") {
                const trimmedName = newCategoryName.trim();
                if (!trimmedName) {
                    toast.error("Please enter a name for the new category.");
                    return;
                }
                const newCat = await createCategory(trimmedName); 
                if (!newCat || !newCat._id) {
                    toast.error("Failed to create new category. It might already exist or there was a server error.");
                    return;
                }
                finalData.category = newCat._id;
            }

            if (formData.location === "_add_new_") {
                const trimmedName = newLocationName.trim();
                if (!trimmedName) {
                    toast.error("Please enter a name for the new location.");
                    return;
                }
                const newLoc = await createLocation(trimmedName); 
                if (!newLoc || !newLoc._id) {
                    toast.error("Failed to create new location. It might already exist or there was a server error.");
                    return;
                }
                finalData.location = newLoc._id;
            }

            if (formData.unit === "_add_new_") {
                const trimmedName = newUnitName.trim();
                if (!trimmedName) {
                    toast.error("Please enter a name for the new unit.");
                    return;
                }
                const newUnitResult = await createUnit(trimmedName); 
                if (!newUnitResult || !newUnitResult.name) {
                    toast.error("Failed to add new unit. It might already exist or there was a server error.");
                    return;
                }
                finalData.unit = newUnitResult.name; 
            }

            if (formData.supplier === "_add_new_") {
                const trimmedName = newSupplierName.trim();
                if (!trimmedName) {
                    toast.error("Please enter a name for the new supplier.");
                    return;
                }
                const newSupplier = await createSupplier({ name: trimmedName }); 
                if (!newSupplier || !newSupplier._id) {
                    toast.error("Failed to create new supplier. It might already exist or there was a server error.");
                    return;
                }
                finalData.supplier = newSupplier._id;
            }

            // Client-side validation for new fields
            if (finalData.packagingType === 'Reusable' && !finalData.isReusablePackaging && !finalData.linkedReusablePackagingItem) {
                toast.error("For 'Reusable' packaging, you must either mark this item AS reusable packaging or link it to an existing reusable packaging item.");
                return;
            }
            if (finalData.isReusablePackaging && finalData.linkedReusablePackagingItem) {
                toast.error("An item cannot BE a reusable packaging item and ALSO be linked to another reusable packaging item simultaneously.");
                return;
            }
            if (finalData.isReusablePackaging && finalData.packagingType !== 'Reusable') {
                toast.error("If this item IS reusable packaging, its 'Packaging Type' must be set to 'Reusable'.");
                return;
            }
            if (finalData.packagingType !== 'Reusable' && finalData.linkedReusablePackagingItem) {
                toast.error("If an item is linked to reusable packaging, its 'Packaging Type' must be 'Reusable'.");
                return;
            }
            if (finalData.packagingType !== 'Reusable') {
                // If not reusable, clear reusable-specific fields
                finalData.isReusablePackaging = false;
                finalData.linkedReusablePackagingItem = ''; // Ensure this is null in DB
                finalData.packagingDeposit = 0; // Clear deposit if not reusable
            }
            // If the item is *not* reusable packaging, and not linked, ensure deposit is 0
            if (!finalData.isReusablePackaging && !finalData.linkedReusablePackagingItem) {
                 finalData.packagingDeposit = 0;
            }


            finalData.quantity = Number(finalData.quantity);
            finalData.price = Number(finalData.price);
            finalData.costPrice = Number(finalData.costPrice);
            finalData.minStockLevel = Number(finalData.minStockLevel);
            finalData.packagingDeposit = Number(finalData.packagingDeposit);

            const itemPayload = new FormData();
            Object.keys(finalData).forEach(key => {
                // For linkedReusablePackagingItem, append its ID or empty string for null
                if (key === 'linkedReusablePackagingItem' && !finalData[key]) {
                    itemPayload.append(key, ''); 
                } else if (finalData[key] !== null && finalData[key] !== undefined) {
                    itemPayload.append(key, finalData[key]);
                }
            });
            
            onSave(itemPayload);

        } catch (error) {
            console.error("Failed to save item:", error);
            toast.error(error.message || "An unexpected error occurred while saving the item.");
        }
    };

    const modalJsx = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Inventory Item" : "Add New Inventory Item"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGrid>
                        <FormGroup><Label htmlFor="name">Product Name *</Label><ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="sku">SKU *</Label><div style={{ display: "flex", gap: "0.5rem" }}><ThemedInput id="sku" name="sku" value={formData.sku} onChange={handleInputChange} required /><Button type="button" variant="outline" onClick={generateSKU} iconOnly aria-label="Generate SKU"><FaBarcode /></Button></div></FormGroup>
                        <FormGroup>
                          <Label htmlFor="category">Category *</Label>
                          <ThemedSelect id="category" name="category" value={formData.category} onChange={handleInputChange} required>
                            <option value="">Select...</option>
                            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                            <option value="_add_new_">-- Add New Category --</option>
                          </ThemedSelect>
                          {formData.category === "_add_new_" && (<ThemedInput type="text" placeholder="Enter new category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup><Label htmlFor="quantity">Quantity *</Label><ThemedInput id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} min="0" required /></FormGroup>
                        <FormGroup><Label htmlFor="price">Unit Price *</Label><ThemedInput id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} min="0" required /></FormGroup>
                        <FormGroup><Label htmlFor="costPrice">Cost Price *</Label><ThemedInput id="costPrice" name="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={handleInputChange} min="0" required /></FormGroup>
                        <FormGroup>
                          <Label htmlFor="unit">Unit *</Label>
                          <ThemedSelect id="unit" name="unit" value={formData.unit} onChange={handleInputChange} required>
                            <option value="">Select...</option>
                            {units.map((u) => <option key={u} value={u}>{u}</option>)}
                            <option value="_add_new_">-- Add New Unit --</option>
                          </ThemedSelect>
                          {formData.unit === "_add_new_" && (<ThemedInput type="text" placeholder="e.g., kg, box, liter" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup><Label htmlFor="minStockLevel">Minimum Stock Level</Label><ThemedInput id="minStockLevel" name="minStockLevel" type="number" value={formData.minStockLevel} onChange={handleInputChange} min="0" /></FormGroup>
                        <FormGroup>
                          <Label htmlFor="location">Location *</Label>
                          <ThemedSelect id="location" name="location" value={formData.location} onChange={handleInputChange} required>
                            <option value="">Select...</option>
                            {locations.map((loc) => <option key={loc._id} value={loc._id}>{loc.name}</option>)}
                            <option value="_add_new_">-- Add New Location --</option>
                          </ThemedSelect>
                          {formData.location === "_add_new_" && (<ThemedInput type="text" placeholder="Enter new location name" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup>
                          <Label htmlFor="supplier">Supplier</Label>
                          <ThemedSelect id="supplier" name="supplier" value={formData.supplier} onChange={handleInputChange}>
                            <option value="">Select...</option>
                            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                            <option value="_add_new_">-- Add New Supplier --</option>
                          </ThemedSelect>
                          {formData.supplier === "_add_new_" && (<ThemedInput type="text" placeholder="Enter new supplier name" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup><Label htmlFor="expiryDate">Expiry Date</Label><ThemedInput id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} /></FormGroup>

                        {/* NEW: Reusable Packaging fields */}
                        <FormGroup>
                            <Label htmlFor="isReusablePackaging">Is This Item Reusable Packaging?</Label>
                            <Input 
                                id="isReusablePackaging" 
                                name="isReusablePackaging" 
                                type="checkbox" 
                                checked={formData.isReusablePackaging} 
                                onChange={handleInputChange} 
                                style={{width: 'auto', alignSelf: 'flex-start'}}
                            />
                            <small style={{color: '#718096', fontSize: '0.75rem'}}>Check if this inventory item itself *is* a reusable container (e.g., a "Glass Bottle").</small>
                        </FormGroup>

                        {/* Only show packaging type & linked item if this item is *not* the reusable packaging itself */}
                        {!formData.isReusablePackaging && (
                            <FormGroup>
                                <Label htmlFor="packagingType">Product Packaging Type</Label>
                                <ThemedSelect id="packagingType" name="packagingType" value={formData.packagingType} onChange={handleInputChange}>
                                    <option value="None">None</option>
                                    <option value="Reusable">Reusable (Deposit)</option>
                                    <option value="Recyclable">Recyclable</option>
                                    <option value="Compostable">Compostable</option>
                                    <option value="Other">Other</option>
                                </ThemedSelect>
                                <small style={{color: '#718096', fontSize: '0.75rem'}}>What type of packaging does *this product* come in?</small>
                            </FormGroup>
                        )}

                        {/* Link to reusable packaging if packagingType is Reusable AND this is not the packaging itself */}
                        {formData.packagingType === 'Reusable' && !formData.isReusablePackaging && (
                            <>
                                <FormGroup>
                                    <Label htmlFor="linkedReusablePackagingItem">Linked Reusable Packaging Item</Label>
                                    <ThemedSelect 
                                        id="linkedReusablePackagingItem" 
                                        name="linkedReusablePackagingItem" 
                                        value={formData.linkedReusablePackagingItem} 
                                        onChange={handleInputChange}
                                        required={formData.packagingType === 'Reusable' && !formData.isReusablePackaging} // Make required
                                    >
                                        <option value="">Select Reusable Packaging...</option>
                                        {reusablePackagingItems.map((item) => (
                                            <option key={item._id} value={item._id}>
                                                {item.name} (Stock: {item.quantity} {item.unit})
                                            </option>
                                        ))}
                                    </ThemedSelect>
                                    <small style={{color: '#718096', fontSize: '0.75rem'}}>
                                        Select the inventory item that represents the empty reusable container.
                                    </small>
                                </FormGroup>
                                <FormGroup>
                                    <Label htmlFor="packagingDeposit">Packaging Deposit (RWF)</Label>
                                    <ThemedInput 
                                        id="packagingDeposit" 
                                        name="packagingDeposit" 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.packagingDeposit} 
                                        onChange={handleInputChange} 
                                        min="0" 
                                        required={formData.packagingType === 'Reusable' && !formData.isReusablePackaging} // Make required
                                    />
                                     <small style={{color: '#718096', fontSize: '0.75rem'}}>
                                        The deposit charged for *this product's* reusable packaging.
                                    </small>
                                </FormGroup>
                            </>
                        )}
                        {/* If this item *is* reusable packaging, show its deposit input */}
                        {formData.isReusablePackaging && (
                             <FormGroup>
                                <Label htmlFor="packagingDeposit">Deposit Value for This Packaging (RWF)</Label>
                                <ThemedInput 
                                    id="packagingDeposit" 
                                    name="packagingDeposit" 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.packagingDeposit} 
                                    onChange={handleInputChange} 
                                    min="0" 
                                    required={formData.isReusablePackaging} // Required for reusable packaging items themselves
                                />
                                <small style={{color: '#718096', fontSize: '0.75rem'}}>
                                    This is the deposit charged when *this specific reusable packaging item* is issued.
                                </small>
                            </FormGroup>
                        )}

                    </FormGrid>
                    <FormGroup style={{ marginBottom: "1.5rem" }}><Label htmlFor="description">Notes / Description</Label><TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Add any relevant details..." /></FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading} loading={loading}><FaSave style={{ marginRight: '0.5rem' }}/> {loading ? "Saving..." : (isEditMode ? "Update Item" : "Save Item")}</Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );

    return ReactDOM.createPortal(modalJsx, document.body);
};

export default AddItemModal;