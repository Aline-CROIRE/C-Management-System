// client/src/components/construction/document-management/UploadDocumentModal.js
"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { FaTimes, FaUpload, FaSpinner, FaFileAlt, FaFolderOpen, FaInfoCircle } from "react-icons/fa";
import Button from "../../common/Button";
import Input from "../../common/Input";
import Select from "../../common/Select";
import LoadingSpinner from "../../common/LoadingSpinner";
import toast from 'react-hot-toast';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060; /* Higher than other modals if it opens on top */
  padding: 1rem;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.form`
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  box-shadow: ${(props) => props.theme.shadows.xl};
  width: 100%;
  max-width: 550px;
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 480px) {
    padding: 1.25rem;
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

const FileInputLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px dashed ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  background: ${(props) => props.theme.colors.surfaceLight};
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.primary};
  }

  input[type="file"] {
    display: none;
  }
`;

const FileNameDisplay = styled.span`
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: ${(props) => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const UploadDocumentModal = ({ onClose, onSave, loading, refId, refModel }) => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [formData, setFormData] = useState({
        category: 'Other',
        description: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!refId || !refModel) {
            toast.error("Document upload context (refId, refModel) is missing.");
            onClose();
        }
    }, [refId, refModel, onClose]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setErrors(prev => ({ ...prev, file: '' }));
        } else {
            setSelectedFile(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!selectedFile) newErrors.file = "No file selected.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('refId', refId);
        uploadFormData.append('refModel', refModel);
        uploadFormData.append('category', formData.category);
        uploadFormData.append('description', formData.description);

        try {
            await onSave(uploadFormData, refModel, refId); // Pass refModel, refId for refresh scope
            onClose();
        } catch (err) {
            // Error handled by hook, just log here if needed
            console.error("Error during document upload:", err);
        }
    };

    const documentCategories = ['Permit', 'Drawing', 'Contract', 'Photo', 'Report', 'Certificate', 'Other'];

    return ReactDOM.createPortal(
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle><FaUpload /> Upload Document</ModalTitle>
                    <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label htmlFor="fileInput"><FaFolderOpen /> Select File *</Label>
                        <FileInputLabel htmlFor="fileInput">
                            <FaFileAlt />
                            {selectedFile ? selectedFile.name : "Choose a file"}
                            <input
                                id="fileInput"
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            />
                        </FileInputLabel>
                        {errors.file && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.file}</p>}
                        {selectedFile && (
                            <FileNameDisplay>
                                <FaFileAlt /> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </FileNameDisplay>
                        )}
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="category"><FaInfoCircle /> Category</Label>
                        <ThemedSelect id="category" name="category" value={formData.category} onChange={handleInputChange}>
                            {documentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </ThemedSelect>
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="description"><FaInfoCircle /> Description</Label>
                        <TextArea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the document content..." />
                    </FormGroup>
                    
                    <p style={{ fontSize: '0.8rem', color: '#718096' }}>
                        Document will be linked to: <strong>{refModel} (ID: {refId.substring(0, 8)}...)</strong>
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading || !selectedFile}>
                        {loading ? <FaSpinner className="spinner" /> : <FaUpload />} {loading ? "Uploading..." : "Upload Document"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
};

export default UploadDocumentModal;