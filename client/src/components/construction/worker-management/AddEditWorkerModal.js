// client/src/components/construction/worker-management/AddEditWorkerModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaUserCog, FaBriefcase, FaPhone, FaEnvelope, FaTools, FaInfoCircle, FaCheckCircle, FaSpinner } from "react-icons/fa";
import Button from "../../common/Button"; // CORRECTED PATH
import Input from "../../common/Input";   // CORRECTED PATH
import Select from "../../common/Select"; // CORRECTED PATH
import LoadingSpinner from "../../common/LoadingSpinner"; // CORRECTED PATH
import Checkbox from "../../common/Checkbox"; // CORRECTED PATH

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.form`
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: ${(props) => props.theme.shadows.xl};
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 768px) {
    max-width: 95%;
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 1rem 1.25rem;
  }
`;

const ModalTitle = styled.h2`
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    color: ${(props) => props.theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  flex-grow: 1;

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: clamp(0.8rem, 2vw, 0.875rem);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ThemedInput = styled(Input)`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  font-size: 0.9rem;
`;

const ThemedSelect = styled(Select)`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-size: 0.9rem;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  resize: vertical;
  min-height: 80px;
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  font-size: 0.9rem;
  font-family: inherit;
`;

const SkillsInputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: 0.5rem;
  background: ${(props) => props.theme.colors.surface};

  .skill-input {
    flex-grow: 1;
    border: none;
    outline: none;
    background: transparent;
    color: ${(props) => props.theme.colors.text};
    padding: 0.25rem 0;
  }
`;

const SkillTag = styled.span`
  background: ${(props) => props.theme.colors.primaryLight};
  color: ${(props) => props.theme.colors.primary};
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;

  button {
    background: none;
    border: none;
    color: ${(props) => props.theme.colors.primary};
    font-size: 0.7rem;
    cursor: pointer;
    line-height: 1;
  }
`;


const ModalFooter = styled.div`
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 1rem 1.25rem;
    gap: 0.75rem;
    button {
      flex-grow: 1;
    }
  }
`;


const AddEditWorkerModal = ({ onClose, onSave, loading, workerToEdit = null }) => {
    const isEditMode = Boolean(workerToEdit);

    const [formData, setFormData] = useState({
        fullName: '',
        role: 'General Labor',
        contactNumber: '',
        email: '',
        skills: [],
        isActive: true,
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        if (isEditMode && workerToEdit) {
            setFormData({
                fullName: workerToEdit.fullName || '',
                role: workerToEdit.role || 'General Labor',
                contactNumber: workerToEdit.contactNumber || '',
                email: workerToEdit.email || '',
                skills: workerToEdit.skills || [],
                isActive: workerToEdit.isActive ?? true,
                notes: workerToEdit.notes || '',
            });
        } else {
            setFormData({
                fullName: '',
                role: 'General Labor',
                contactNumber: '',
                email: '',
                skills: [],
                isActive: true,
                notes: '',
            });
        }
    }, [workerToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && newSkill.trim() !== '') {
            e.preventDefault();
            if (!formData.skills.includes(newSkill.trim())) {
                setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            }
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName) newErrors.fullName = "Full name is required.";
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        try {
            if (isEditMode) {
                await onSave(workerToEdit._id, formData);
            } else {
                await onSave(formData);
            }
            onClose();
        } catch (err) {
            console.error("Failed to save worker:", err);
            // Error handling is already in useConstructionManagement and api.js interceptor
        }
    };

    const workerRoles = ['General Labor', 'Skilled Labor', 'Supervisor', 'Electrician', 'Plumber', 'Heavy Equipment Operator', 'Other'];

    return ReactDOM.createPortal(
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Worker" : "Add New Worker"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGrid>
                        <FormGroup>
                            <Label htmlFor="fullName"><FaUserCog /> Full Name *</Label>
                            <ThemedInput id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required error={errors.fullName} />
                            {errors.fullName && <p style={{color: 'red', fontSize: '0.8rem'}}>{errors.fullName}</p>}
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="role"><FaBriefcase /> Role</Label>
                            <ThemedSelect id="role" name="role" value={formData.role} onChange={handleInputChange}>
                                {workerRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </ThemedSelect>
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="contactNumber"><FaPhone /> Contact Number</Label>
                            <ThemedInput id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="e.g., +250788123456" />
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="email"><FaEnvelope /> Email</Label>
                            <ThemedInput id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="e.g., worker@example.com" error={errors.email} />
                            {errors.email && <p style={{color: 'red', fontSize: '0.8rem'}}>{errors.email}</p>}
                        </FormGroup>
                        <FormGroup style={{ gridColumn: '1 / -1' }}>
                            <Label htmlFor="skills"><FaTools /> Skills (Press Enter to add)</Label>
                            <SkillsInputContainer>
                                {formData.skills.map((skill) => (
                                    <SkillTag key={skill}>
                                        {skill}
                                        <button type="button" onClick={() => handleRemoveSkill(skill)}><FaTimes /></button>
                                    </SkillTag>
                                ))}
                                <input
                                    type="text"
                                    className="skill-input"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={handleAddSkill}
                                    placeholder="Add a skill"
                                />
                            </SkillsInputContainer>
                        </FormGroup>
                        <FormGroup style={{ gridColumn: '1 / -1' }}>
                            <CheckboxGroup>
                                <Checkbox id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                                <Label htmlFor="isActive"><FaCheckCircle /> Is Active</Label>
                            </CheckboxGroup>
                        </FormGroup>
                        <FormGroup style={{ gridColumn: '1 / -1' }}>
                            <Label htmlFor="notes"><FaInfoCircle /> Notes</Label>
                            <TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes about the worker..." />
                        </FormGroup>
                    </FormGrid>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? <FaSpinner className="spinner" /> : <FaSave />} {loading ? "Saving..." : (isEditMode ? "Update Worker" : "Save Worker")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
};

export default AddEditWorkerModal;