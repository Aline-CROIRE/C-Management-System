// client/src/components/construction/material-management/AddEditMaterialRequestModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaShoppingCart, FaCalendarAlt, FaUserTie, FaInfoCircle, FaBoxes, FaSpinner } from "react-icons/fa";
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
  width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
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

const TextArea = styled.textarea`
  padding: 0.75rem; border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'}; resize: vertical; min-height: 80px;
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'}; color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  font-size: 0.9rem; font-family: inherit;
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

const AddEditMaterialRequestModal = ({ onClose, onSave, loading, siteId, workers = [], siteMaterialInventory = [] }) => {
    const [formData, setFormData] = useState({
        materialName: '',
        quantity: '1',
        unit: '',
        requestedBy: '', // Worker ID
        requiredByDate: moment().format('YYYY-MM-DD'),
        notes: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const matchedMaterial = siteMaterialInventory.find(item => item.materialName === formData.materialName);
        if (matchedMaterial && formData.unit === '') {
            setFormData(prev => ({ ...prev, unit: matchedMaterial.unit }));
        }
    }, [formData.materialName, siteMaterialInventory, formData.unit]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.materialName) newErrors.materialName = "Material name is required.";
        if (parseFloat(formData.quantity) <= 0) newErrors.quantity = "Quantity must be a positive number.";
        if (!formData.unit) newErrors.unit = "Unit is required.";
        if (!formData.requestedBy) newErrors.requestedBy = "Requested By is required.";
        if (!formData.requiredByDate) newErrors.requiredByDate = "Required By Date is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const payload = { ...formData };
        payload.quantity = Number(payload.quantity);

        try {
            await onSave(siteId, payload);
            onClose();
        } catch (err) {
            console.error("Failed to save material request:", err);
        }
    };

    const workerOptions = workers.map(worker => ({ value: worker._id, label: `${worker.fullName} (${worker.role})` }));
    const materialNameOptions = [...new Set(siteMaterialInventory.map(item => item.materialName))]; // Unique material names
    const allUnits = ['kg', 'liters', 'pcs', 'm', 'm²', 'm³', 'bags', 'rolls', 'boxes', 'other'];


    return ReactDOM.createPortal(
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>New Material Request</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label htmlFor="materialName"><FaBoxes /> Material Name *</Label>
                        <ThemedInput id="materialName" name="materialName" value={formData.materialName} onChange={handleInputChange} required error={errors.materialName} list="materialNames" />
                        <datalist id="materialNames">
                            {materialNameOptions.map(name => <option key={name} value={name} />)}
                        </datalist>
                        {errors.materialName && <ErrorText>{errors.materialName}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="quantity"><FaShoppingCart /> Quantity *</Label>
                        <ThemedInput id="quantity" name="quantity" type="number" step="0.01" value={formData.quantity} onChange={handleInputChange} min="0.01" required error={errors.quantity} />
                        {errors.quantity && <ErrorText>{errors.quantity}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="unit"><FaBoxes /> Unit *</Label>
                        <ThemedSelect id="unit" name="unit" value={formData.unit} onChange={handleInputChange} required error={errors.unit}>
                            <option value="">Select Unit</option>
                            {allUnits.map(u => <option key={u} value={u}>{u}</option>)}
                        </ThemedSelect>
                        {errors.unit && <ErrorText>{errors.unit}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="requestedBy"><FaUserTie /> Requested By *</Label>
                        <ThemedSelect id="requestedBy" name="requestedBy" value={formData.requestedBy} onChange={handleInputChange} required error={errors.requestedBy}>
                            <option value="">Select a worker</option>
                            {workerOptions.map(worker => <option key={worker.value} value={worker.value}>{worker.label}</option>)}
                        </ThemedSelect>
                        {errors.requestedBy && <ErrorText>{errors.requestedBy}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="requiredByDate"><FaCalendarAlt /> Required By Date *</Label>
                        <ThemedInput id="requiredByDate" name="requiredByDate" type="date" value={formData.requiredByDate} onChange={handleInputChange} required error={errors.requiredByDate} />
                        {errors.requiredByDate && <ErrorText>{errors.requiredByDate}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="notes"><FaInfoCircle /> Notes</Label>
                        <TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes about the request..." />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? <FaSpinner className="spinner" /> : <FaSave />} Save Request
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
};

export default AddEditMaterialRequestModal;