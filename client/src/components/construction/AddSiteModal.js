"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaUserTie, FaCode, FaChartPie, FaInfoCircle, FaClipboardList } from "react-icons/fa";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import LoadingSpinner from "../common/LoadingSpinner";
import moment from "moment";

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
  max-width: 800px;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
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

  @media (max-width: 480px) {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
`;

const ThemedSelect = styled(Select)`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-size: 0.9rem;

  @media (max-width: 480px) {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
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

  @media (max-width: 480px) {
    padding: 0.6rem;
    font-size: 0.85rem;
    min-height: 60px;
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

const AddSiteModal = ({ onClose, onSave, loading, siteToEdit = null }) => {
    const isEditMode = Boolean(siteToEdit);

    const [formData, setFormData] = useState({
        name: '', projectCode: '', type: 'Commercial', location: '', startDate: '', endDate: '',
        budget: '', manager: '', description: '', notes: '', progress: '0', status: 'Planning', expenditure: '0',
    });

    useEffect(() => {
        if (isEditMode && siteToEdit) {
            setFormData({
                name: siteToEdit.name || '',
                projectCode: siteToEdit.projectCode || '',
                type: siteToEdit.type || 'Commercial',
                location: siteToEdit.location || '',
                startDate: siteToEdit.startDate ? moment(siteToEdit.startDate).format('YYYY-MM-DD') : '',
                endDate: siteToEdit.endDate ? moment(siteToEdit.endDate).format('YYYY-MM-DD') : '',
                budget: siteToEdit.budget?.toString() ?? '0',
                manager: siteToEdit.manager || '',
                description: siteToEdit.description || '',
                notes: siteToEdit.notes || '',
                progress: siteToEdit.progress?.toString() ?? '0',
                status: siteToEdit.status || 'Planning',
                expenditure: siteToEdit.expenditure?.toString() ?? '0',
            });
        } else {
            setFormData({
                name: '', projectCode: '', type: 'Commercial', location: '', startDate: '', endDate: '',
                budget: '', manager: '', description: '', notes: '', progress: '0', status: 'Planning', expenditure: '0',
            });
        }
    }, [siteToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = { ...formData };
        payload.budget = Number(payload.budget);
        payload.progress = Number(payload.progress);
        payload.expenditure = Number(payload.expenditure);

        if (isEditMode) {
            await onSave(siteToEdit._id, payload);
        } else {
            await onSave(payload);
        }
        onClose();
    };

    const siteTypes = ['Commercial', 'Residential', 'Industrial', 'Infrastructure', 'Other'];
    const siteStatuses = ['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled'];

    const modalJsx = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Construction Site" : "Add New Construction Site"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGrid>
                        <FormGroup><Label htmlFor="name"><FaBuilding /> Site Name *</Label><ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="projectCode"><FaCode /> Project Code *</Label><ThemedInput id="projectCode" name="projectCode" value={formData.projectCode} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="type"><FaInfoCircle /> Project Type</Label><ThemedSelect id="type" name="type" value={formData.type} onChange={handleInputChange}>{siteTypes.map(type => <option key={type} value={type}>{type}</option>)}</ThemedSelect></FormGroup>
                        <FormGroup><Label htmlFor="location"><FaMapMarkerAlt /> Location *</Label><ThemedInput id="location" name="location" value={formData.location} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="manager"><FaUserTie /> Manager *</Label><ThemedInput id="manager" name="manager" value={formData.manager} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="budget"><FaDollarSign /> Budget *</Label><ThemedInput id="budget" name="budget" type="number" step="0.01" value={formData.budget} onChange={handleInputChange} min="0" required /></FormGroup>
                        
                        <FormGroup><Label htmlFor="startDate"><FaCalendarAlt /> Start Date *</Label><ThemedInput id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="endDate"><FaCalendarAlt /> Expected End Date *</Label><ThemedInput id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} required /></FormGroup>
                        
                        {isEditMode && (
                          <>
                            <FormGroup><Label htmlFor="progress"><FaChartPie /> Progress (%)</Label><ThemedInput id="progress" name="progress" type="number" value={formData.progress} onChange={handleInputChange} min="0" max="100" /></FormGroup>
                            <FormGroup><Label htmlFor="expenditure"><FaDollarSign /> Expenditure</Label><ThemedInput id="expenditure" name="expenditure" type="number" step="0.01" value={formData.expenditure} onChange={handleInputChange} min="0" /></FormGroup>
                            <FormGroup><Label htmlFor="status"><FaInfoCircle /> Status</Label><ThemedSelect id="status" name="status" value={formData.status} onChange={handleInputChange}>{siteStatuses.map(status => <option key={status} value={status}>{status}</option>)}</ThemedSelect></FormGroup>
                          </>
                        )}
                    </FormGrid>
                    <FormGroup style={{ marginBottom: "1.5rem" }}><Label htmlFor="description"><FaInfoCircle /> Description</Label><TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the project..." /></FormGroup>
                    <FormGroup><Label htmlFor="notes"><FaClipboardList /> Notes</Label><TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." /></FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading} loading={loading}><FaSave style={{ marginRight: '0.5rem' }}/> {loading ? "Saving..." : (isEditMode ? "Update Site" : "Save Site")}</Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );

    return ReactDOM.createPortal(modalJsx, document.body);
};

export default AddSiteModal;