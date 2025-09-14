// client/src/components/construction/material-management/AddEditSiteMaterialModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaTools, FaPlusCircle, FaSpinner } from "react-icons/fa";
import Button from "../../common/Button";
import Input from "../../common/Input";
import Select from "../../common/Select";
import LoadingSpinner from "../../common/LoadingSpinner";
import moment from "moment";

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center;
  z-index: 1050; padding: 1rem; backdrop-filter: blur(4px);
`;

const ModalContent = styled.form`
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'}; color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || '1rem'}; box-shadow: ${(props) => props.theme?.shadows?.xl || '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'};
  width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @media (max-width: 768px) { max-width: 95%; }
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem; border-bottom: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
  @media (max-width: 480px) { padding: 1rem 1.25rem; }
`;

const ModalTitle = styled.h2`
  font-size: clamp(1.25rem, 4vw, 1.5rem); font-weight: 700; color: ${(props) => props.theme?.colors?.heading || '#1a202c'}; margin: 0;
`;

const CloseButton = styled.button`
  background: none; border: none; font-size: clamp(1.2rem, 3vw, 1.5rem); color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  cursor: pointer; padding: 0.5rem; line-height: 1; border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
  transition: all 0.2s ease-in-out;
  &:hover { background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'}; color: ${(props) => props.theme?.colors?.text || '#2d3748'}; }
`;

const ModalBody = styled.div`
  padding: 2rem; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 1.5rem;
  @media (max-width: 480px) { padding: 1.25rem; }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600; color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  font-size: clamp(0.8rem, 2vw, 0.875rem); text-transform: uppercase; letter-spacing: 0.5px;
  display: flex; align-items: center; gap: 0.5rem;
`;

const ThemedInput = styled(Input)`
  padding: 0.75rem; border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'}; background: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'}; font-size: 0.9rem;
`;

const ThemedSelect = styled(Select)`
  padding: 0.75rem; border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'}; font-size: 0.9rem;
  background-color: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};
`;

const ErrorText = styled.p`
  color: ${(props) => props.theme?.colors?.error || '#e53e3e'};
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const ModalFooter = styled.div`
  padding: 1.5rem 2rem; display: flex; justify-content: flex-end; gap: 1rem;
  border-top: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'}; flex-shrink: 0;
  @media (max-width: 480px) { padding: 1rem 1.25rem; gap: 0.75rem; button { flex-grow: 1; } }
`;

const AddEditSiteMaterialModal = ({ onClose, onSave, loading, siteId, siteMaterialToEdit = null }) => {
    const isEditMode = Boolean(siteMaterialToEdit);
    const [formData, setFormData] = useState({
        materialName: '',
        quantityOnHand: '0',
        unit: '',
        minStockLevel: '0',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode && siteMaterialToEdit) {
            setFormData({
                materialName: siteMaterialToEdit.materialName || '',
                quantityOnHand: siteMaterialToEdit.quantityOnHand?.toString() ?? '0',
                unit: siteMaterialToEdit.unit || '',
                minStockLevel: siteMaterialToEdit.minStockLevel?.toString() ?? '0',
            });
        } else {
            setFormData({
                materialName: '', quantityOnHand: '0', unit: '', minStockLevel: '0',
            });
        }
    }, [siteMaterialToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.materialName) newErrors.materialName = "Material name is required.";
        if (parseFloat(formData.quantityOnHand) < 0) newErrors.quantityOnHand = "Quantity on hand must be non-negative.";
        if (!formData.unit) newErrors.unit = "Unit is required.";
        if (parseFloat(formData.minStockLevel) < 0) newErrors.minStockLevel = "Minimum stock level must be non-negative.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const payload = { ...formData };
        payload.quantityOnHand = Number(payload.quantityOnHand);
        payload.minStockLevel = Number(payload.minStockLevel);

        try {
            if (isEditMode) {
                await onSave(siteId, siteMaterialToEdit._id, payload);
            } else {
                await onSave(siteId, null, payload); // Pass null for itemId on creation
            }
            onClose();
        } catch (err) {
            console.error("Failed to save site material:", err);
        }
    };

    const units = ['kg', 'liters', 'pcs', 'm', 'm²', 'm³', 'bags', 'rolls', 'boxes', 'other'];

    return ReactDOM.createPortal(
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Site Material" : "Add New Site Material"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label htmlFor="materialName"><FaTools /> Material Name *</Label>
                        <ThemedInput id="materialName" name="materialName" value={formData.materialName} onChange={handleInputChange} required error={errors.materialName} />
                        {errors.materialName && <ErrorText>{errors.materialName}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="quantityOnHand"><FaPlusCircle /> Quantity On Hand *</Label>
                        <ThemedInput id="quantityOnHand" name="quantityOnHand" type="number" step="0.01" value={formData.quantityOnHand} onChange={handleInputChange} min="0" required error={errors.quantityOnHand} />
                        {errors.quantityOnHand && <ErrorText>{errors.quantityOnHand}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="unit"><FaTools /> Unit *</Label>
                        <ThemedSelect id="unit" name="unit" value={formData.unit} onChange={handleInputChange} required error={errors.unit}>
                            <option value="">Select Unit</option>
                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </ThemedSelect>
                        {errors.unit && <ErrorText>{errors.unit}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="minStockLevel"><FaTools /> Min Stock Level</Label>
                        <ThemedInput id="minStockLevel" name="minStockLevel" type="number" step="0.01" value={formData.minStockLevel} onChange={handleInputChange} min="0" error={errors.minStockLevel} />
                        {errors.minStockLevel && <ErrorText>{errors.minStockLevel}</ErrorText>}
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? <FaSpinner className="spinner" /> : <FaSave />} {loading ? "Saving..." : (isEditMode ? "Update Material" : "Add Material")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
};

export default AddEditSiteMaterialModal;