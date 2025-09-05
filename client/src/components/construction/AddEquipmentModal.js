"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
// ADDED FaChartPie to the import list
import { FaTimes, FaSave, FaTools, FaTag, FaInfoCircle, FaWrench, FaCalendarAlt, FaDollarSign, FaBuilding, FaClipboardList, FaCheckCircle, FaTruck, FaChartPie } from "react-icons/fa";
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

const AddEquipmentModal = ({ onClose, onSave, loading, equipmentToEdit = null, sites = [] }) => {
    const isEditMode = Boolean(equipmentToEdit);

    const [formData, setFormData] = useState({
        name: '', assetTag: '', type: 'Heavy Machinery', currentSite: '', status: 'Operational',
        condition: 'Good', lastMaintenance: '', nextMaintenance: '', purchaseDate: '',
        purchaseCost: '', currentValue: '', utilization: '0', notes: '',
    });

    useEffect(() => {
        if (isEditMode && equipmentToEdit) {
            setFormData({
                name: equipmentToEdit.name || '',
                assetTag: equipmentToEdit.assetTag || '',
                type: equipmentToEdit.type || 'Heavy Machinery',
                currentSite: equipmentToEdit.currentSite?._id || '',
                status: equipmentToEdit.status || 'Operational',
                condition: equipmentToEdit.condition || 'Good',
                lastMaintenance: equipmentToEdit.lastMaintenance ? moment(equipmentToEdit.lastMaintenance).format('YYYY-MM-DD') : '',
                nextMaintenance: equipmentToEdit.nextMaintenance ? moment(equipmentToEdit.nextMaintenance).format('YYYY-MM-DD') : '',
                purchaseDate: equipmentToEdit.purchaseDate ? moment(equipmentToEdit.purchaseDate).format('YYYY-MM-DD') : '',
                purchaseCost: equipmentToEdit.purchaseCost?.toString() ?? '0',
                currentValue: equipmentToEdit.currentValue?.toString() ?? '0',
                utilization: equipmentToEdit.utilization?.toString() ?? '0',
                notes: equipmentToEdit.notes || '',
            });
        } else {
            setFormData({
                name: '', assetTag: '', type: 'Heavy Machinery', currentSite: '', status: 'Operational',
                condition: 'Good', lastMaintenance: '', nextMaintenance: '', purchaseDate: '',
                purchaseCost: '', currentValue: '', utilization: '0', notes: '',
            });
        }
    }, [equipmentToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = { ...formData };
        payload.purchaseCost = Number(payload.purchaseCost);
        payload.currentValue = Number(payload.currentValue);
        payload.utilization = Number(payload.utilization);

        if (isEditMode) {
            payload._prevCurrentSite = equipmentToEdit.currentSite?._id || null;
            await onSave(equipmentToEdit._id, payload);
        } else {
            await onSave(payload);
        }
        onClose();
    };

    const equipmentTypes = ['Heavy Machinery', 'Hand Tool', 'Vehicle', 'Safety Gear', 'Lifting Equipment', 'Other'];
    const equipmentStatuses = ['Operational', 'In Maintenance', 'Idle', 'Broken', 'In Transit', 'Out of Service'];
    const equipmentConditions = ['Excellent', 'Good', 'Fair', 'Poor'];

    const modalJsx = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Equipment" : "Add New Equipment"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGrid>
                        <FormGroup><Label htmlFor="name"><FaTools /> Equipment Name *</Label><ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="assetTag"><FaTag /> Asset Tag *</Label><ThemedInput id="assetTag" name="assetTag" value={formData.assetTag} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="type"><FaInfoCircle /> Equipment Type</Label><ThemedSelect id="type" name="type" value={formData.type} onChange={handleInputChange}>{equipmentTypes.map(type => <option key={type} value={type}>{type}</option>)}</ThemedSelect></FormGroup>
                        <FormGroup><Label htmlFor="status"><FaWrench /> Status</Label><ThemedSelect id="status" name="status" value={formData.status} onChange={handleInputChange}>{equipmentStatuses.map(status => <option key={status} value={status}>{status}</option>)}</ThemedSelect></FormGroup>
                        <FormGroup><Label htmlFor="condition"><FaCheckCircle /> Condition</Label><ThemedSelect id="condition" name="condition" value={formData.condition} onChange={handleInputChange}>{equipmentConditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}</ThemedSelect></FormGroup>
                        
                        <FormGroup><Label htmlFor="purchaseDate"><FaCalendarAlt /> Purchase Date *</Label><ThemedInput id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="purchaseCost"><FaDollarSign /> Purchase Cost *</Label><ThemedInput id="purchaseCost" name="purchaseCost" type="number" step="0.01" value={formData.purchaseCost} onChange={handleInputChange} min="0" required /></FormGroup>
                        <FormGroup><Label htmlFor="currentValue"><FaDollarSign /> Current Value</Label><ThemedInput id="currentValue" name="currentValue" type="number" step="0.01" value={formData.currentValue} onChange={handleInputChange} min="0" /></FormGroup>
                        
                        <FormGroup><Label htmlFor="lastMaintenance"><FaCalendarAlt /> Last Maintenance</Label><ThemedInput id="lastMaintenance" name="lastMaintenance" type="date" value={formData.lastMaintenance} onChange={handleInputChange} /></FormGroup>
                        <FormGroup><Label htmlFor="nextMaintenance"><FaCalendarAlt /> Next Maintenance</Label><ThemedInput id="nextMaintenance" name="nextMaintenance" type="date" value={formData.nextMaintenance} onChange={handleInputChange} /></FormGroup>
                        <FormGroup><Label htmlFor="utilization"><FaChartPie /> Utilization (%)</Label><ThemedInput id="utilization" name="utilization" type="number" value={formData.utilization} onChange={handleInputChange} min="0" max="100" /></FormGroup>
                        
                        <FormGroup>
                            <Label htmlFor="currentSite"><FaBuilding /> Assigned Site</Label>
                            <ThemedSelect id="currentSite" name="currentSite" value={formData.currentSite} onChange={handleInputChange}>
                                <option value="">None (Storage)</option>
                                {sites.map(site => <option key={site._id} value={site._id}>{site.name} ({site.projectCode})</option>)}
                            </ThemedSelect>
                        </FormGroup>
                    </FormGrid>
                    <FormGroup style={{ marginBottom: "1.5rem" }}><Label htmlFor="notes"><FaClipboardList /> Notes</Label><TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." /></FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading} loading={loading}><FaSave style={{ marginRight: '0.5rem' }}/> {loading ? "Saving..." : (isEditMode ? "Update Equipment" : "Save Equipment")}</Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );

    return ReactDOM.createPortal(modalJsx, document.body);
};

export default AddEquipmentModal;