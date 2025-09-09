"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaClipboardList, FaCalendarAlt, FaStar, FaUserPlus, FaInfoCircle, FaSitemap, FaBuilding, FaSpinner } from "react-icons/fa";
import Button from "../../common/Button";
import Input from "../../common/Input";
import Select from "../../common/Select";
import LoadingSpinner from "../../common/LoadingSpinner";
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

const AddEditTaskModal = ({ onClose, onSave, loading, taskToEdit = null, sites = [], allTasks = [] }) => {
    const isEditMode = Boolean(taskToEdit);

    const [formData, setFormData] = useState({
        site: '',
        name: '',
        description: '',
        status: 'To Do',
        priority: 'Medium',
        startDate: moment().format('YYYY-MM-DD'),
        dueDate: moment().add(7, 'days').format('YYYY-MM-DD'),
        assignedTo: '',
        progress: '0',
        parentTask: '', // For sub-tasks
        dependencies: [], // Array of task IDs
        notes: '',
        actualCompletionDate: '',
    });

    useEffect(() => {
        if (isEditMode && taskToEdit) {
            setFormData({
                site: taskToEdit.site?._id || '',
                name: taskToEdit.name || '',
                description: taskToEdit.description || '',
                status: taskToEdit.status || 'To Do',
                priority: taskToEdit.priority || 'Medium',
                startDate: taskToEdit.startDate ? moment(taskToEdit.startDate).format('YYYY-MM-DD') : '',
                dueDate: taskToEdit.dueDate ? moment(taskToEdit.dueDate).format('YYYY-MM-DD') : '',
                assignedTo: taskToEdit.assignedTo || '',
                progress: taskToEdit.progress?.toString() ?? '0',
                parentTask: taskToEdit.parentTask?._id || '',
                dependencies: taskToEdit.dependencies?.map(dep => dep._id || dep) || [], // Ensure it's an array of IDs
                notes: taskToEdit.notes || '',
                actualCompletionDate: taskToEdit.actualCompletionDate ? moment(taskToEdit.actualCompletionDate).format('YYYY-MM-DD') : '',
            });
        } else {
            // Set default site if available and in create mode
            setFormData(prev => ({
                ...prev,
                site: sites.length > 0 ? sites[0]._id : '',
            }));
        }
    }, [taskToEdit, isEditMode, sites]);

    const handleInputChange = (e) => {
        const { name, value, type, selectedOptions } = e.target;
        if (name === "dependencies" && type === "select-multiple") {
            setFormData((prev) => ({
                ...prev,
                [name]: Array.from(selectedOptions).map((option) => option.value),
            }));
        } else if (name === "status" && value === "Completed") {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
                progress: '100',
                actualCompletionDate: moment().format('YYYY-MM-DD') // Automatically set completion date
            }));
        } else if (name === "status" && value !== "Completed" && formData.actualCompletionDate) {
             setFormData((prev) => ({
                ...prev,
                [name]: value,
                actualCompletionDate: '' // Clear if status is not completed
            }));
        }
        else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = { ...formData };
        payload.progress = Number(payload.progress);

        if (isEditMode) {
            await onSave(taskToEdit._id, payload);
        } else {
            await onSave(payload);
        }
        onClose();
    };

    const taskStatuses = ['To Do', 'In Progress', 'Blocked', 'Completed', 'Cancelled'];
    const taskPriorities = ['Low', 'Medium', 'High', 'Critical'];

    // Filter tasks for parentTask and dependencies dropdowns:
    // Exclude the current task itself from being its own parent or a dependency
    // Exclude tasks already selected as dependencies from the parent task dropdown and vice-versa (optional, but good practice)
    const availableTasks = allTasks.filter(task => task._id !== taskToEdit?._id && task.site?._id === formData.site); // Only show tasks for the current site

    const modalJsx = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isEditMode ? "Edit Task" : "Add New Task"}</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGrid>
                        <FormGroup>
                            <Label htmlFor="site"><FaBuilding /> Assigned Site *</Label>
                            <ThemedSelect id="site" name="site" value={formData.site} onChange={handleInputChange} required>
                                <option value="">Select a site</option>
                                {sites.map(site => <option key={site._id} value={site._id}>{site.name} ({site.projectCode})</option>)}
                            </ThemedSelect>
                        </FormGroup>
                        <FormGroup><Label htmlFor="name"><FaClipboardList /> Task Name *</Label><ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required /></FormGroup>
                        
                        <FormGroup><Label htmlFor="status"><FaInfoCircle /> Status</Label><ThemedSelect id="status" name="status" value={formData.status} onChange={handleInputChange}>{taskStatuses.map(status => <option key={status} value={status}>{status}</option>)}</ThemedSelect></FormGroup>
                        <FormGroup><Label htmlFor="priority"><FaStar /> Priority</Label><ThemedSelect id="priority" name="priority" value={formData.priority} onChange={handleInputChange}>{taskPriorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}</ThemedSelect></FormGroup>
                        
                        <FormGroup><Label htmlFor="startDate"><FaCalendarAlt /> Start Date *</Label><ThemedInput id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required /></FormGroup>
                        <FormGroup><Label htmlFor="dueDate"><FaCalendarAlt /> Due Date *</Label><ThemedInput id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} required /></FormGroup>

                        <FormGroup><Label htmlFor="assignedTo"><FaUserPlus /> Assigned To</Label><ThemedInput id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} placeholder="Worker Name or Team" /></FormGroup>
                        <FormGroup><Label htmlFor="progress"><FaSitemap /> Progress (%)</Label><ThemedInput id="progress" name="progress" type="number" value={formData.progress} onChange={handleInputChange} min="0" max="100" /></FormGroup>
                        
                        {formData.status === 'Completed' && (
                             <FormGroup>
                                 <Label htmlFor="actualCompletionDate"><FaCalendarAlt /> Actual Completion Date</Label>
                                 <ThemedInput id="actualCompletionDate" name="actualCompletionDate" type="date" value={formData.actualCompletionDate} onChange={handleInputChange} />
                             </FormGroup>
                        )}

                        <FormGroup>
                            <Label htmlFor="parentTask"><FaSitemap /> Parent Task</Label>
                            <ThemedSelect id="parentTask" name="parentTask" value={formData.parentTask} onChange={handleInputChange}>
                                <option value="">None</option>
                                {availableTasks.filter(task => !formData.dependencies.includes(task._id)).map(task => (
                                    <option key={task._id} value={task._id}>{task.name}</option>
                                ))}
                            </ThemedSelect>
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="dependencies"><FaSitemap /> Dependencies (Ctrl+Click to select multiple)</Label>
                            <ThemedSelect id="dependencies" name="dependencies" multiple value={formData.dependencies} onChange={handleInputChange} style={{ minHeight: '100px' }}>
                                {availableTasks.filter(task => task._id !== formData.parentTask).map(task => (
                                    <option key={task._id} value={task._id}>{task.name}</option>
                                ))}
                            </ThemedSelect>
                        </FormGroup>
                    </FormGrid>
                    <FormGroup style={{ marginBottom: "1.5rem" }}><Label htmlFor="description"><FaInfoCircle /> Description</Label><TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed description of the task..." /></FormGroup>
                    <FormGroup><Label htmlFor="notes"><FaClipboardList /> Notes</Label><TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." /></FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading} loading={loading}>
                        {loading ? <FaSpinner className="spinner" /> : <FaSave />} {loading ? "Saving..." : (isEditMode ? "Update Task" : "Save Task")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );

    return ReactDOM.createPortal(modalJsx, document.body);
};

export default AddEditTaskModal;