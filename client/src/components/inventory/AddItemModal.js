"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaBarcode, FaImage } from "react-icons/fa";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";

// Dynamically get the API base URL for images (if displaying a preview of existing image)
const getImageUrlBase = () => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api$/, ''); 
};
const API_BASE_URL_FOR_IMAGES = getImageUrlBase();


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

const ImagePreview = styled.div`
  width: 100px;
  height: 100px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  overflow: hidden;
  margin: 0 auto 1rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;


const AddItemModal = ({
    onClose,
    onSave,
    loading,
    itemToEdit = null,
    categories = [],
    locations = [],
    units = [],
    suppliers = [],
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
        price: '', costPrice: '', minStockLevel: '', supplier: '', description: '', expiryDate: '', image: null,
    });

    const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // State for image preview

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
                costPrice: itemToEdit.costPrice?.toString() ?? '0', // Ensure costPrice is loaded
                minStockLevel: itemToEdit.minStockLevel?.toString() ?? '0',
                supplier: itemToEdit.supplier?._id || '',
                description: itemToEdit.description || '',
                expiryDate: itemToEdit.expiryDate ? new Date(itemToEdit.expiryDate).toISOString().split('T')[0] : '',
                image: null, // Image input is cleared on edit for security/simplicity
            });
            // Set initial image preview if existing image URL is present
            if (itemToEdit.imageUrl) {
                setImagePreviewUrl(`${API_BASE_URL_FOR_IMAGES}/${itemToEdit.imageUrl.replace(/\\/g, '/')}`);
            } else {
                setImagePreviewUrl(null);
            }
        } else {
            // Reset form for add mode
            setFormData({
                name: '', sku: '', category: '', location: '', unit: '', quantity: '',
                price: '', costPrice: '', minStockLevel: '', supplier: '', description: '', expiryDate: '', image: null,
            });
            setImagePreviewUrl(null);
        }
    }, [itemToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));
            setImagePreviewUrl(URL.createObjectURL(file)); // Create URL for preview
        } else {
            setFormData((prev) => ({ ...prev, image: null }));
            setImagePreviewUrl(isEditMode && itemToEdit?.imageUrl ? `${API_BASE_URL_FOR_IMAGES}/${itemToEdit.imageUrl.replace(/\\/g, '/')}` : null);
        }
    };

    const generateSKU = () => setFormData((prev) => ({ ...prev, sku: `${(prev.name.substring(0, 3) || "NEW").toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        let finalData = { ...formData }; // Clone formData for processing

        // Handle new category creation
        if (formData.category === "_add_new_") {
            if (!newCategoryName.trim()) return alert("Please enter a name for the new category.");
            const newCat = await createCategory(newCategoryName.trim()); // Pass string directly
            if (!newCat) return; // If creation failed, stop submission
            finalData.category = newCat.data._id;
        }

        // Handle new location creation
        if (formData.location === "_add_new_") {
            if (!newLocationName.trim()) return alert("Please enter a name for the new location.");
            const newLoc = await createLocation(newLocationName.trim()); // Pass string directly
            if (!newLoc) return;
            finalData.location = newLoc.data._id;
        }

        // Handle new unit creation
        if (formData.unit === "_add_new_") {
            if (!newUnitName.trim()) return alert("Please enter a name for the new unit.");
            await createUnit(newUnitName.trim()); // Pass string directly
            finalData.unit = newUnitName.trim();
        }

        // Handle new supplier creation
        if (formData.supplier === "_add_new_") {
            if (!newSupplierName.trim()) return alert("Please enter a name for the new supplier.");
            const newSupplier = await createSupplier({ name: newSupplierName.trim() }); // Pass object
            if (!newSupplier) return;
            finalData.supplier = newSupplier.data._id;
        }

        const itemPayload = new FormData();
        Object.keys(finalData).forEach(key => {
            if (key === 'image' && finalData.image) {
                itemPayload.append('itemImage', finalData.image);
            } else if (finalData[key] !== null && finalData[key] !== undefined) {
                itemPayload.append(key, finalData[key]);
            }
        });
        
        onSave(itemPayload); // Pass FormData directly to onSave

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
                          <ThemedSelect id="category" name="category" value={formData.category} onChange={handleInputChange} required><option value="">Select...</option>{categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}<option value="_add_new_">-- Add New Category --</option></ThemedSelect>
                          {formData.category === "_add_new_" && (<ThemedInput type="text" placeholder="Enter new category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup><Label htmlFor="quantity">Quantity *</Label><ThemedInput id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} min="0" required /></FormGroup>
                        <FormGroup><Label htmlFor="price">Unit Price *</Label><ThemedInput id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} min="0" required /></FormGroup>
                        <FormGroup><Label htmlFor="costPrice">Cost Price *</Label><ThemedInput id="costPrice" name="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={handleInputChange} min="0" required /></FormGroup> {/* Added costPrice input */}
                        <FormGroup>
                          <Label htmlFor="unit">Unit *</Label>
                          <ThemedSelect id="unit" name="unit" value={formData.unit} onChange={handleInputChange} required><option value="">Select...</option>{units.map((u) => <option key={u} value={u}>{u}</option>)}<option value="_add_new_">-- Add New Unit --</option></ThemedSelect>
                          {formData.unit === "_add_new_" && (<ThemedInput type="text" placeholder="e.g., kg, box, liter" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup><Label htmlFor="minStockLevel">Minimum Stock Level</Label><ThemedInput id="minStockLevel" name="minStockLevel" type="number" value={formData.minStockLevel} onChange={handleInputChange} min="0" /></FormGroup>
                        <FormGroup>
                          <Label htmlFor="location">Location *</Label>
                          <ThemedSelect id="location" name="location" value={formData.location} onChange={handleInputChange} required><option value="">Select...</option>{locations.map((loc) => <option key={loc._id} value={loc._id}>{loc.name}</option>)}<option value="_add_new_">-- Add New Location --</option></ThemedSelect>
                          {formData.location === "_add_new_" && (<ThemedInput type="text" placeholder="Enter new location name" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup>
                          <Label htmlFor="supplier">Supplier</Label>
                          <ThemedSelect id="supplier" name="supplier" value={formData.supplier} onChange={handleInputChange}><option value="">Select...</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}<option value="_add_new_">-- Add New Supplier --</option></ThemedSelect>
                          {formData.supplier === "_add_new_" && (<ThemedInput type="text" placeholder="Enter new supplier name" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} style={{ marginTop: '0.5rem' }} autoFocus />)}
                        </FormGroup>
                        <FormGroup><Label htmlFor="expiryDate">Expiry Date</Label><ThemedInput id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} /></FormGroup>
                    </FormGrid>
                    <FormGroup style={{ marginBottom: "1.5rem" }}><Label htmlFor="description">Notes / Description</Label><TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Add any relevant details..." /></FormGroup>
                    <FormGroup>
                      <Label>Product Image</Label>
                      {imagePreviewUrl && (
                          <ImagePreview>
                              <img src={imagePreviewUrl} alt="Image Preview" />
                          </ImagePreview>
                      )}
                      <ImageUploadContainer>
                          <HiddenInput type="file" accept="image/*" onChange={handleImageUpload} id="image-upload" />
                          <label htmlFor="image-upload" style={{ display: 'block', cursor: 'pointer' }}>
                              <FaImage size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                              <div>{formData.image ? formData.image.name : (isEditMode && itemToEdit?.imageUrl && !imagePreviewUrl ? "No new image selected" : "Click or drag to upload")}</div>
                              <div style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.7 }}>Supports JPG, PNG, GIF</div>
                          </label>
                      </ImageUploadContainer>
                    </FormGroup>
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
