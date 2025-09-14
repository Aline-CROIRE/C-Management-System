// client/src/components/construction/task-management/AddEditTaskModal.js
"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaSave, FaClipboardList, FaCalendarAlt, FaStar, FaUserPlus, FaInfoCircle, FaSitemap, FaBuilding, FaSpinner, FaPlusCircle } from "react-icons/fa";
import Button from "../../common/Button";
import Input from "../../common/Input";
import Select from "../../common/Select";
import LoadingSpinner from "../../common/LoadingSpinner";
import moment from "moment";
import { useConstructionManagement } from "../../../hooks/useConstructionManagement";
import toast from 'react-hot-toast';

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
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || '1rem'};
  box-shadow: ${(props) => props.theme?.shadows?.xl || '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'};
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  border-bottom: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
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
  color: ${(props) => props.theme?.colors?.heading || '#1a202c'};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
  transition: all 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'};
    color: ${(props) => props.theme?.colors?.text || '#2d3748'};
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
  color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  font-size: clamp(0.8rem, 2vw, 0.875rem);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ThemedInput = styled(Input)`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};
  font-size: 0.9rem;

  @media (max-width: 480px) {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
`;

const ThemedSelect = styled(Select)`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
  font-size: 0.9rem;
  min-height: ${(props) => (props.multiple ? '100px' : 'auto')};
  appearance: none;
  background-image: ${(props) => (props.multiple ? 'none' : 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232d3748%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13%205.7L146.2%20268.4%2018.6%2075.1c-6-6-15.7-6-21.7%200-6%206-6%2015.7%200%2021.7l130%20130c6%206%2015.7%206%2021.7%200l130-130c6-6%206-15.7%200-21.7a17.5%2017.5%200%200%200-13-5.7z%22%2F%3E%3C%2Fsvg%3E")')};
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 10px;
  padding-right: ${(props) => (props.multiple ? '0.75rem' : '2.5rem')};
  background-color: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};

  @media (max-width: 480px) {
    padding: 0.6rem;
    font-size: 0.85rem;
    min-height: ${(props) => (props.multiple ? '80px' : 'auto')};
    padding-right: ${(props) => (props.multiple ? '0.6rem' : '2.2rem')};
  }
`;

const ErrorText = styled.p`
  color: ${(props) => props.theme?.colors?.error || '#e53e3e'};
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;


const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.375rem'};
  resize: vertical;
  min-height: 80px;
  background: ${(props) => props.theme?.colors?.surface || '#ffffff'};
  color: ${(props) => props.theme?.colors?.text || '#2d3748'};
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
  border-top: 1px solid ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 1rem 1.25rem;
    gap: 0.75rem;
    button {
      flex-grow: 1;
    }
  }
`;

const NewWorkerForm = styled.div`
  background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'};
  padding: 1.5rem;
  border-radius: ${(props) => props.theme?.borderRadius?.lg || '0.5rem'};
  margin-top: 1.5rem;
  border: 1px dashed ${(props) => props.theme?.colors?.border || '#e2e8f0'};
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${(props) => props.theme?.colors?.heading || '#1a202c'};
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .new-worker-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
`;

const AddEditTaskModal = ({ onClose, onSave, loading, taskToEdit = null, sites = [], allTasks = [], workers = [] }) => {
    const isEditMode = Boolean(taskToEdit);
    const { createWorker, loading: workerCreatingLoading } = useConstructionManagement();

    const [formData, setFormData] = useState({
        site: '',
        name: '',
        description: '',
        status: 'To Do',
        priority: 'Medium',
        startDate: moment().format('YYYY-MM-DD'),
        dueDate: moment().add(7, 'days').format('YYYY-MM-DD'),
        actualCompletionDate: '',
        assignedTo: [],
        progress: '0',
        parentTask: '',
        dependencies: [],
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [showNewWorkerForm, setShowNewWorkerForm] = useState(false);
    const [newWorkerData, setNewWorkerData] = useState({
        fullName: '',
        role: 'General Labor',
        contactNumber: '',
        email: '',
    });
    const [newWorkerErrors, setNewWorkerErrors] = useState({});


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
                actualCompletionDate: taskToEdit.actualCompletionDate ? moment(taskToEdit.actualCompletionDate).format('YYYY-MM-DD') : '',
                assignedTo: taskToEdit.assignedTo?.map(worker => worker._id || worker) || [],
                progress: taskToEdit.progress?.toString() ?? '0',
                parentTask: taskToEdit.parentTask?._id || '',
                dependencies: taskToEdit.dependencies?.map(dep => dep.taskId?._id || dep.taskId || dep) || [], // Ensure correct extraction for dependencies
                notes: taskToEdit.notes || '',
            });
        } else {
            setFormData(prev => ({
                ...prev,
                site: sites.length > 0 ? sites[0]._id : '',
                assignedTo: [],
            }));
        }
    }, [taskToEdit, isEditMode, sites]);

    const handleInputChange = (e) => {
        const { name, value, selectedOptions } = e.target;
        
        setFormData((prev) => {
            let newFormData = { ...prev };
            let newValue = value;

            if (name === "dependencies" || name === "assignedTo") {
                newValue = Array.from(selectedOptions).map((option) => option.value);
            } else if (name === "status") {
                if (value === "Completed") {
                    newFormData.progress = '100';
                    newFormData.actualCompletionDate = moment().format('YYYY-MM-DD');
                } else if (value !== "Completed" && prev.actualCompletionDate) {
                    newFormData.actualCompletionDate = '';
                }
                newFormData[name] = newValue;
                return newFormData;
            }
            
            newFormData[name] = newValue;
            return newFormData;
        });
    };

    const handleNewWorkerChange = (e) => {
        const { name, value } = e.target;
        setNewWorkerData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Task name is required.";
        if (!formData.site) newErrors.site = "Site is required.";
        if (!formData.startDate) newErrors.startDate = "Start date is required.";
        if (!formData.dueDate) newErrors.dueDate = "Due date is required.";
        
        if (formData.startDate && formData.dueDate && moment(formData.startDate).isAfter(moment(formData.dueDate))) {
            newErrors.dueDate = "Due date cannot be before start date.";
        }

        if (formData.dependencies.includes(taskToEdit?._id)) {
            newErrors.dependencies = "A task cannot depend on itself.";
        }
        if (formData.parentTask && formData.dependencies.includes(formData.parentTask)) {
            newErrors.dependencies = "A task cannot be a dependency of its parent task.";
        }
        if (formData.parentTask === taskToEdit?._id) {
             newErrors.parentTask = "A task cannot be its own parent.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateNewWorkerForm = () => {
        const errors = {};
        if (!newWorkerData.fullName) errors.fullName = "Worker name is required.";
        if (newWorkerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newWorkerData.email)) {
            errors.email = "Invalid email format.";
        }
        setNewWorkerErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateNewWorker = async () => {
        if (!validateNewWorkerForm()) return;
        try {
            const createdWorkerData = await createWorker(newWorkerData);
            if (createdWorkerData && createdWorkerData._id) {
                setFormData(prev => ({
                    ...prev,
                    assignedTo: [...prev.assignedTo, createdWorkerData._id]
                }));
                setNewWorkerData({ fullName: '', role: 'General Labor', contactNumber: '', email: '' });
                setShowNewWorkerForm(false);
                toast.success("New worker added and assigned!");
            } else {
                 console.error("Failed to create worker: No data._id returned by performCrudAction, or unexpected response.", createdWorkerData);
                 toast.error("Failed to create worker due to unexpected internal handling.");
            }
        } catch (error) {
            console.error("Error creating new worker:", error);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const payload = { ...formData };
        payload.progress = Number(payload.progress);

        if (payload.parentTask === '') {
            payload.parentTask = null;
        }
        // Ensure assignedTo and dependencies are arrays of IDs (not populated objects)
        payload.assignedTo = payload.assignedTo.filter(Boolean); // Filter out any null/undefined
        payload.dependencies = payload.dependencies.filter(Boolean).map(depId => ({ taskId: depId, type: 'FS', lag: 0 })); // Default to FS, 0 lag for new deps

        try {
            if (isEditMode) {
                await onSave(taskToEdit._id, payload);
            } else {
                await onSave(payload);
            }
            onClose();
        } catch (err) {
            console.error("Failed to save task:", err);
        }
    };

    const taskStatuses = ['To Do', 'In Progress', 'Blocked', 'Completed', 'Cancelled'];
    const taskPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const workerRoles = ['General Labor', 'Skilled Labor', 'Supervisor', 'Electrician', 'Plumber', 'Heavy Equipment Operator', 'Other'];


    const availableTasksForSite = allTasks.filter(task =>
        task._id !== taskToEdit?._id &&
        task.site?._id === formData.site
    );

    const workerOptions = workers.map(worker => ({ value: worker._id, label: `${worker.fullName} (${worker.role})` }));

    return ReactDOM.createPortal(
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
                            <ThemedSelect id="site" name="site" value={formData.site} onChange={handleInputChange} required error={errors.site}>
                                <option value="">Select a site</option>
                                {sites.map(site => <option key={site._id} value={site._id}>{site.name} ({site.projectCode})</option>)}
                            </ThemedSelect>
                            {errors.site && <ErrorText>{errors.site}</ErrorText>}
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="name"><FaClipboardList /> Task Name *</Label>
                            <ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required error={errors.name} />
                            {errors.name && <ErrorText>{errors.name}</ErrorText>}
                        </FormGroup>
                        
                        <FormGroup>
                            <Label htmlFor="status"><FaInfoCircle /> Status</Label>
                            <ThemedSelect id="status" name="status" value={formData.status} onChange={handleInputChange} disabled={loading}>
                                {taskStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </ThemedSelect>
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="priority"><FaStar /> Priority</Label>
                            <ThemedSelect id="priority" name="priority" value={formData.priority} onChange={handleInputChange} disabled={loading}>
                                {taskPriorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}
                            </ThemedSelect>
                        </FormGroup>
                        
                        <FormGroup>
                            <Label htmlFor="startDate"><FaCalendarAlt /> Start Date *</Label>
                            <ThemedInput id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required error={errors.startDate} />
                            {errors.startDate && <ErrorText>{errors.startDate}</ErrorText>}
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="dueDate"><FaCalendarAlt /> Due Date *</Label>
                            <ThemedInput id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} required error={errors.dueDate} />
                            {errors.dueDate && <ErrorText>{errors.dueDate}</ErrorText>}
                        </FormGroup>

                        <FormGroup>
                            <Label htmlFor="assignedTo"><FaUserPlus /> Assigned To (Ctrl+Click)</Label>
                            <ThemedSelect id="assignedTo" name="assignedTo" multiple value={formData.assignedTo} onChange={handleInputChange} disabled={loading} error={errors.assignedTo}>
                                <option value="">Select existing workers</option>
                                {workerOptions.map(worker => <option key={worker.value} value={worker.value}>{worker.label}</option>)}
                            </ThemedSelect>
                            {errors.assignedTo && <ErrorText>{errors.assignedTo}</ErrorText>}
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowNewWorkerForm(!showNewWorkerForm)} style={{ marginTop: '0.5rem' }} disabled={loading}>
                                {showNewWorkerForm ? "Hide New Worker Form" : "Create New Worker"} <FaPlusCircle />
                            </Button>
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="progress"><FaSitemap /> Progress (%)</Label>
                            <ThemedInput id="progress" name="progress" type="number" value={formData.progress} onChange={handleInputChange} min="0" max="100" error={errors.progress} disabled={loading} />
                            {errors.progress && <ErrorText>{errors.progress}</ErrorText>}
                        </FormGroup>
                        
                        {formData.status === 'Completed' && (
                             <FormGroup>
                                 <Label htmlFor="actualCompletionDate"><FaCalendarAlt /> Actual Completion Date</Label>
                                 <ThemedInput id="actualCompletionDate" name="actualCompletionDate" type="date" value={formData.actualCompletionDate} onChange={handleInputChange} disabled={loading} />
                             </FormGroup>
                        )}

                        <FormGroup>
                            <Label htmlFor="parentTask"><FaSitemap /> Parent Task</Label>
                            <ThemedSelect id="parentTask" name="parentTask" value={formData.parentTask} onChange={handleInputChange} disabled={loading} error={errors.parentTask}>
                                <option value="">None</option>
                                {availableTasksForSite
                                    .filter(task => !formData.dependencies.includes(task._id))
                                    .map(task => (
                                    <option key={task._id} value={task._id}>{task.name}</option>
                                ))}
                            </ThemedSelect>
                            {errors.parentTask && <ErrorText>{errors.parentTask}</ErrorText>}
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="dependencies"><FaSitemap /> Dependencies (Ctrl+Click to select multiple)</Label>
                            <ThemedSelect id="dependencies" name="dependencies" multiple value={formData.dependencies} onChange={handleInputChange} disabled={loading} error={errors.dependencies}>
                                {availableTasksForSite
                                    .filter(task => task._id !== formData.parentTask)
                                    .map(task => (
                                    <option key={task._id} value={task._id}>{task.name}</option>
                                ))}
                            </ThemedSelect>
                            {errors.dependencies && <ErrorText>{errors.dependencies}</ErrorText>}
                        </FormGroup>
                    </FormGrid>

                    {showNewWorkerForm && (
                        <NewWorkerForm>
                            <h4><FaUserPlus /> New Worker Details</h4>
                            <FormGrid>
                                <FormGroup>
                                    <Label htmlFor="newWorkerFullName">Full Name *</Label>
                                    <ThemedInput id="newWorkerFullName" name="fullName" value={newWorkerData.fullName} onChange={handleNewWorkerChange} placeholder="John Doe" error={newWorkerErrors.fullName} />
                                    {newWorkerErrors.fullName && <ErrorText>{newWorkerErrors.fullName}</ErrorText>}
                                </FormGroup>
                                <FormGroup>
                                    <Label htmlFor="newWorkerRole">Role</Label>
                                    <ThemedSelect id="newWorkerRole" name="role" value={newWorkerData.role} onChange={handleNewWorkerChange}>
                                        {workerRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </ThemedSelect>
                                </FormGroup>
                                <FormGroup>
                                    <Label htmlFor="newWorkerContact">Contact Number</Label>
                                    <ThemedInput id="newWorkerContact" name="contactNumber" value={newWorkerData.contactNumber} onChange={handleNewWorkerChange} placeholder="+250 788 123 456" />
                                </FormGroup>
                                <FormGroup>
                                    <Label htmlFor="newWorkerEmail">Email</Label>
                                    <ThemedInput id="newWorkerEmail" name="email" type="email" value={newWorkerData.email} onChange={handleNewWorkerChange} placeholder="john.doe@example.com" error={newWorkerErrors.email} />
                                    {newWorkerErrors.email && <ErrorText>{newWorkerErrors.email}</ErrorText>}
                                </FormGroup>
                            </FormGrid>
                            <div className="new-worker-actions">
                                <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewWorkerForm(false)} disabled={workerCreatingLoading || loading}>Cancel</Button>
                                <Button type="button" variant="success" size="sm" onClick={handleCreateNewWorker} disabled={workerCreatingLoading || loading}>
                                    {workerCreatingLoading ? <LoadingSpinner size="sm" /> : <FaPlusCircle />} Add & Assign Worker
                                </Button>
                            </div>
                        </NewWorkerForm>
                    )}


                    <FormGroup style={{ gridColumn: '1 / -1' }}>
                        <Label htmlFor="description"><FaInfoCircle /> Description</Label>
                        <TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed description of the task..." disabled={loading} />
                    </FormGroup>
                    <FormGroup style={{ gridColumn: '1 / -1' }}>
                        <Label htmlFor="notes"><FaClipboardList /> Notes</Label>
                        <TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." disabled={loading} />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading || workerCreatingLoading}>
                        {loading || workerCreatingLoading ? <FaSpinner className="spinner" /> : <FaSave />} {loading || workerCreatingLoading ? "Saving..." : (isEditMode ? "Update Task" : "Save Task")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
};

export default AddEditTaskModal;