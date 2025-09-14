// client/src/components/construction/milestone-management/AddEditMilestoneModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaCalendarAlt, FaInfoCircle, FaClipboardList, FaSpinner, FaGavel } from "react-icons/fa";
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
  @media (max-width: 480px) { padding: 0.6rem; font-size: 0.85rem; }
`;

const ThemedSelect = styled(Select)`
  padding: 0.75rem; border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'}; font-size: 0.9rem;
  background-color: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  @media (max-width: 480px) { padding: 0.6rem; font-size: 0.85rem; }
`;

const TextArea = styled.textarea`
  padding: 0.75rem; border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'}; resize: vertical; min-height: 80px;
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'}; color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  font-size: 0.9rem; font-family: inherit;
  @media (max-width: 480px) { padding: 0.6rem; font-size: 0.85rem; min-height: 60px; }
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

const AddEditMilestoneModal = ({ onClose, onSave, loading, siteId, milestoneToEdit = null }) => {
    const isEditMode = Boolean(milestoneToEdit);
    const [formData, setFormData] = useState({
        name: '',
        targetDate: '',
        actualCompletionDate: '',
        status: 'Planned',
        description: '',
        criticalPath: false,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode && milestoneToEdit) {
            setFormData({
                name: milestoneToEdit.name || '',
                targetDate: milestoneToEdit.targetDate ? moment(milestoneToEdit.targetDate).format('YYYY-MM-DD') : '',
                actualCompletionDate: milestoneToEdit.actualCompletionDate ? moment(milestoneToEdit.actualCompletionDate).format('YYYY-MM-DD') : '',
                status: milestoneToEdit.status || 'Planned',
                description: milestoneToEdit.description || '',
                criticalPath: milestoneToEdit.criticalPath ?? false,
            });
        } else {
            // Reset form for add mode
            setFormData({
                name: '',
                targetDate: '',
                actualCompletionDate: '',
                status: 'Planned',
                description: '',
                criticalPath: false,
            });
        }
    }, [milestoneToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Milestone name is required.";
        if (!formData.targetDate) newErrors.targetDate = "Target date is required.";
        if (formData.actualCompletionDate && moment(formData.actualCompletionDate).isAfter(moment())) {
            newErrors.actualCompletionDate = "Actual completion date cannot be in the future.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const payload = { ...formData };
        if (payload.actualCompletionDate === '') {
            payload.actualCompletionDate = null; // Ensure empty string is sent as null
        }

        try {
            if (isEditMode) {
                await onSave(siteId, milestoneToEdit._id, payload);
            } else {
                await onSave(siteId, payload);
            }
            onClose();
        } catch (err) {
            console.error("Failed to save milestone:", err);
            // Error handling is already in useConstructionManagement and api.js interceptor
        }
    };

    const milestoneStatuses = ['Planned', 'In Progress', 'Completed', 'Delayed'];

    return ReactDOM.createPortal(
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Milestone" : "Add New Milestone"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label htmlFor="name"><FaGavel /> Milestone Name *</Label>
                        <ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required error={errors.name} />
                        {errors.name && <ErrorText>{errors.name}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="targetDate"><FaCalendarAlt /> Target Date *</Label>
                        <ThemedInput id="targetDate" name="targetDate" type="date" value={formData.targetDate} onChange={handleInputChange} required error={errors.targetDate} />
                        {errors.targetDate && <ErrorText>{errors.targetDate}</ErrorText>}
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="status"><FaInfoCircle /> Status</Label>
                        <ThemedSelect id="status" name="status" value={formData.status} onChange={handleInputChange}>
                            {milestoneStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </ThemedSelect>
                    </FormGroup>
                    {formData.status === 'Completed' && ( // Only show if status is completed
                        <FormGroup>
                            <Label htmlFor="actualCompletionDate"><FaCalendarAlt /> Actual Completion Date</Label>
                            <ThemedInput id="actualCompletionDate" name="actualCompletionDate" type="date" value={formData.actualCompletionDate} onChange={handleInputChange} error={errors.actualCompletionDate} />
                            {errors.actualCompletionDate && <ErrorText>{errors.actualCompletionDate}</ErrorText>}
                        </FormGroup>
                    )}
                    <FormGroup>
                        <Label htmlFor="description"><FaClipboardList /> Description</Label>
                        <TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the milestone..." />
                    </FormGroup>
                    {/* Add checkbox for critical path if desired */}
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? <FaSpinner className="spinner" /> : <FaSave />} {loading ? "Saving..." : (isEditMode ? "Update Milestone" : "Save Milestone")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
};

export default AddEditMilestoneModal;