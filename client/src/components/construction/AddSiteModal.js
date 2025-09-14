// client/src/components/construction/AddSiteModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaUserTie, FaCode, FaChartPie, FaInfoCircle, FaClipboardList,
         FaUsers, FaHardHat, FaLightbulb, FaPlusCircle, FaTrashAlt, FaFileInvoiceDollar, FaExclamationTriangle } from "react-icons/fa";
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

const SectionTitle = styled.h3`
    font-size: clamp(1rem, 3vw, 1.25rem);
    font-weight: 600;
    color: ${(props) => props.theme?.colors?.heading || "#1a202c"};
    margin: 1.5rem 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    grid-column: 1 / -1;
    border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
    padding-bottom: 0.5rem;
`;

const BudgetDetailsContainer = styled.div`
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
`;

const BudgetLineItem = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 1rem;
    background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'};
    padding: 1rem;
    border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
    align-items: flex-end;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        button {
            width: 100%;
            margin-top: 0.5rem;
        }
        & > ${FormGroup} {
            width: 100%;
        }
    }
`;

const ErrorText = styled.p`
  color: ${(props) => props.theme?.colors?.error || '#e53e3e'};
  font-size: 0.75rem;
  margin-top: 0.25rem;
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
        clientName: '', contractValue: '', phase: 'Planning', riskLevel: 'Low', budgetDetails: [],
    });
    const [errors, setErrors] = useState({});

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
                expenditure: siteToEdit.expenditure?.toString() ?? '0',
                manager: siteToEdit.manager || '',
                description: siteToEdit.description || '',
                notes: siteToEdit.notes || '',
                progress: siteToEdit.progress?.toString() ?? '0',
                status: siteToEdit.status || 'Planning',
                clientName: siteToEdit.clientName || '',
                contractValue: siteToEdit.contractValue?.toString() ?? '0',
                phase: siteToEdit.phase || 'Planning',
                riskLevel: siteToEdit.riskLevel || 'Low',
                budgetDetails: siteToEdit.budgetDetails || [],
            });
        } else {
            setFormData({
                name: '', projectCode: '', type: 'Commercial', location: '', startDate: '', endDate: '',
                budget: '', manager: '', description: '', notes: '', progress: '0', status: 'Planning', expenditure: '0',
                clientName: '', contractValue: '', phase: 'Planning', riskLevel: 'Low', budgetDetails: [],
            });
        }
    }, [siteToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleBudgetDetailChange = (index, field, value) => {
        const updatedDetails = [...formData.budgetDetails];
        updatedDetails[index] = { ...updatedDetails[index], [field]: value };
        setFormData((prev) => ({ ...prev, budgetDetails: updatedDetails }));
    };

    const addBudgetLineItem = () => {
        setFormData((prev) => ({
            ...prev,
            budgetDetails: [
                ...prev.budgetDetails,
                { category: 'Labor', description: '', plannedAmount: 0, actualAmount: 0 },
            ],
        }));
    };

    const removeBudgetLineItem = (index) => {
        setFormData((prev) => ({
            ...prev,
            budgetDetails: prev.budgetDetails.filter((_, i) => i !== index),
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Site name is required.";
        if (!formData.projectCode) newErrors.projectCode = "Project code is required.";
        if (!formData.location) newErrors.location = "Location is required.";
        if (!formData.startDate) newErrors.startDate = "Start date is required.";
        if (!formData.endDate) newErrors.endDate = "End date is required.";
        if (!formData.manager) newErrors.manager = "Manager name is required.";
        if (parseFloat(formData.budget) < 0) newErrors.budget = "Valid budget is required.";
        if (formData.startDate && formData.endDate && moment(formData.endDate).isBefore(moment(formData.startDate))) {
            newErrors.endDate = "End date cannot be before start date.";
        }
        
        formData.budgetDetails.forEach((item, index) => {
            if (!item.category) newErrors[`budgetDetails[${index}].category`] = `Category for line item ${index + 1} is required.`;
            if (parseFloat(item.plannedAmount) < 0 || isNaN(parseFloat(item.plannedAmount))) newErrors[`budgetDetails[${index}].plannedAmount`] = `Planned amount for line item ${index + 1} must be a non-negative number.`;
            if (parseFloat(item.actualAmount) < 0 || isNaN(parseFloat(item.actualAmount))) newErrors[`budgetDetails[${index}].actualAmount`] = `Actual amount for line item ${index + 1} must be a non-negative number.`;
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const payload = { ...formData };
        payload.budget = Number(payload.budget);
        payload.expenditure = Number(payload.expenditure);
        payload.progress = Number(payload.progress);
        payload.contractValue = Number(payload.contractValue);

        payload.budgetDetails = payload.budgetDetails.map(item => ({
            ...item,
            plannedAmount: Number(item.plannedAmount),
            actualAmount: Number(item.actualAmount || 0),
        }));

        try {
            if (isEditMode) {
                await onSave(siteToEdit._id, payload);
            } else {
                await onSave(payload);
            }
            onClose();
        } catch (err) {
            console.error("Failed to save site:", err);
        }
    };

    const siteTypes = ['Commercial', 'Residential', 'Industrial', 'Infrastructure', 'Other'];
    const siteStatuses = ['Planning', 'Active', 'On-Hold', 'Delayed', 'Completed', 'Cancelled'];
    const phases = ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closing'];
    const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
    const budgetCategories = ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Permits', 'Overhead', 'Other'];


    const modalJsx = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Construction Site" : "Add New Construction Site"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <SectionTitle><FaBuilding /> Basic Site Details</SectionTitle>
                    <FormGrid>
                        <FormGroup><Label htmlFor="name"><FaBuilding /> Site Name *</Label><ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required error={errors.name} /><ErrorText>{errors.name}</ErrorText></FormGroup>
                        <FormGroup><Label htmlFor="projectCode"><FaCode /> Project Code *</Label><ThemedInput id="projectCode" name="projectCode" value={formData.projectCode} onChange={handleInputChange} required error={errors.projectCode} /><ErrorText>{errors.projectCode}</ErrorText></FormGroup>
                        <FormGroup><Label htmlFor="clientName"><FaUsers /> Client Name</Label><ThemedInput id="clientName" name="clientName" value={formData.clientName} onChange={handleInputChange} /></FormGroup>
                        <FormGroup><Label htmlFor="contractValue"><FaDollarSign /> Contract Value</Label><ThemedInput id="contractValue" name="contractValue" type="number" step="0.01" value={formData.contractValue} onChange={handleInputChange} min="0" /></FormGroup>
                        <FormGroup><Label htmlFor="type"><FaInfoCircle /> Project Type</Label><ThemedSelect id="type" name="type" value={formData.type} onChange={handleInputChange}>{siteTypes.map(type => <option key={type} value={type}>{type}</option>)}</ThemedSelect></FormGroup>
                        <FormGroup><Label htmlFor="location"><FaMapMarkerAlt /> Location *</Label><ThemedInput id="location" name="location" value={formData.location} onChange={handleInputChange} required error={errors.location} /><ErrorText>{errors.location}</ErrorText></FormGroup>
                        <FormGroup><Label htmlFor="manager"><FaUserTie /> Manager *</Label><ThemedInput id="manager" name="manager" value={formData.manager} onChange={handleInputChange} required error={errors.manager} /><ErrorText>{errors.manager}</ErrorText></FormGroup>
                        <FormGroup><Label htmlFor="riskLevel"><FaExclamationTriangle /> Risk Level</Label><ThemedSelect id="riskLevel" name="riskLevel" value={formData.riskLevel} onChange={handleInputChange}>{riskLevels.map(level => <option key={level} value={level}>{level}</option>)}</ThemedSelect></FormGroup>
                    </FormGrid>
                    
                    <SectionTitle><FaCalendarAlt /> Timeline & Progress</SectionTitle>
                    <FormGrid>
                        <FormGroup><Label htmlFor="startDate"><FaCalendarAlt /> Start Date *</Label><ThemedInput id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required error={errors.startDate} /><ErrorText>{errors.startDate}</ErrorText></FormGroup>
                        <FormGroup><Label htmlFor="endDate"><FaCalendarAlt /> Expected End Date *</Label><ThemedInput id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} required error={errors.endDate} /><ErrorText>{errors.endDate}</ErrorText></FormGroup>
                        
                        <FormGroup><Label htmlFor="phase"><FaChartPie /> Project Phase</Label><ThemedSelect id="phase" name="phase" value={formData.phase} onChange={handleInputChange}>{phases.map(p => <option key={p} value={p}>{p}</option>)}</ThemedSelect></FormGroup>

                        {isEditMode && (
                          <>
                            <FormGroup><Label htmlFor="progress"><FaChartPie /> Progress (%)</Label><ThemedInput id="progress" name="progress" type="number" value={formData.progress} onChange={handleInputChange} min="0" max="100" /></FormGroup>
                            <FormGroup><Label htmlFor="status"><FaInfoCircle /> Status</Label><ThemedSelect id="status" name="status" value={formData.status} onChange={handleInputChange}>{siteStatuses.map(status => <option key={status} value={status}>{status}</option>)}</ThemedSelect></FormGroup>
                            <FormGroup><Label htmlFor="expenditure"><FaDollarSign /> Current Expenditure</Label><ThemedInput id="expenditure" name="expenditure" type="number" step="0.01" value={formData.expenditure} onChange={handleInputChange} min="0" /></FormGroup>
                          </>
                        )}
                        <FormGroup><Label htmlFor="budget"><FaDollarSign /> Total Allocated Budget *</Label><ThemedInput id="budget" name="budget" type="number" step="0.01" value={formData.budget} onChange={handleInputChange} min="0" required error={errors.budget} /><ErrorText>{errors.budget}</ErrorText></FormGroup>
                    </FormGrid>

                    <SectionTitle><FaFileInvoiceDollar /> Budget Details</SectionTitle>
                    <BudgetDetailsContainer>
                        {formData.budgetDetails.map((item, index) => (
                            <BudgetLineItem key={index}>
                                <FormGroup>
                                    <Label htmlFor={`budgetCategory-${index}`}>Category</Label>
                                    <ThemedSelect id={`budgetCategory-${index}`} name={`budgetDetails[${index}].category`} value={item.category} onChange={(e) => handleBudgetDetailChange(index, 'category', e.target.value)}>
                                        {budgetCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </ThemedSelect>
                                    <ErrorText>{errors[`budgetDetails[${index}].category`]}</ErrorText>
                                </FormGroup>
                                <FormGroup>
                                    <Label htmlFor={`budgetDesc-${index}`}>Description</Label>
                                    <ThemedInput id={`budgetDesc-${index}`} name={`budgetDetails[${index}].description`} value={item.description} onChange={(e) => handleBudgetDetailChange(index, 'description', e.target.value)} placeholder="e.g., Concrete supply" />
                                </FormGroup>
                                <FormGroup>
                                    <Label htmlFor={`plannedAmount-${index}`}>Planned Amount</Label>
                                    <ThemedInput id={`plannedAmount-${index}`} name={`budgetDetails[${index}].plannedAmount`} type="number" step="0.01" value={item.plannedAmount} onChange={(e) => handleBudgetDetailChange(index, 'plannedAmount', e.target.value)} min="0" required />
                                    <ErrorText>{errors[`budgetDetails[${index}].plannedAmount`]}</ErrorText>
                                </FormGroup>
                                <FormGroup>
                                    <Label htmlFor={`actualAmount-${index}`}>Actual Amount</Label>
                                    <ThemedInput id={`actualAmount-${index}`} name={`budgetDetails[${index}].actualAmount`} type="number" step="0.01" value={item.actualAmount} onChange={(e) => handleBudgetDetailChange(index, 'actualAmount', e.target.value)} min="0" />
                                    <ErrorText>{errors[`budgetDetails[${index}].actualAmount`]}</ErrorText>
                                </FormGroup>
                                <Button type="button" variant="danger" size="sm" iconOnly onClick={() => removeBudgetLineItem(index)} style={{alignSelf: 'flex-end'}}>
                                    <FaTrashAlt />
                                </Button>
                            </BudgetLineItem>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addBudgetLineItem} style={{ width: 'fit-content', alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                            <FaPlusCircle /> Add Budget Line Item
                        </Button>
                    </BudgetDetailsContainer>


                    <SectionTitle><FaClipboardList /> Additional Information</SectionTitle>
                    <FormGroup style={{ gridColumn: '1 / -1', marginBottom: "1.5rem" }}><Label htmlFor="description"><FaInfoCircle /> Description</Label><TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the project..." /></FormGroup>
                    <FormGroup style={{ gridColumn: '1 / -1' }}><Label htmlFor="notes"><FaClipboardList /> Notes</Label><TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." /></FormGroup>
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