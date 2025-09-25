// src/components/expenses/ExpenseModal.js
"use client";
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaSave } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import toast from 'react-hot-toast';

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1020; display: grid; place-items: center; padding: 1rem;
`;
const ModalContent = styled.form`
  background: white; border-radius: 1rem; width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; h2 { margin: 0; font-size: 1.25rem; }
`;
const ModalBody = styled.div`
  padding: 1.5rem; flex-grow: 1; overflow-y: auto;
`;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; `;
const Label = styled.label` font-weight: 600; font-size: 0.875rem; color: #4a5568; margin-bottom: 0.5rem; display: block; `;
const ModalFooter = styled.div`
  padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem;
`;

const ExpenseModal = ({ onClose, onSave, loading, expenseToEdit = null }) => {
    const isEditMode = Boolean(expenseToEdit);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        description: '',
        payee: '',
    });

    useEffect(() => {
        if (isEditMode && expenseToEdit) {
            setFormData({
                date: new Date(expenseToEdit.date).toISOString().split('T')[0],
                amount: expenseToEdit.amount.toString(),
                category: expenseToEdit.category || '',
                description: expenseToEdit.description || '',
                payee: expenseToEdit.payee || '',
            });
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                category: '',
                description: '',
                payee: '',
            });
        }
    }, [expenseToEdit, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            amount: Number(formData.amount),
        };
        if (!payload.amount || payload.amount <= 0) {
            toast.error("Amount must be a positive number.");
            return;
        }
        if (!payload.category.trim()) {
            toast.error("Expense category is required.");
            return;
        }
        onSave(payload);
    };

    // Example expense categories - you might fetch these from a metadata API in a real app
    const expenseCategories = [
        "Rent", "Utilities", "Salaries", "Marketing", "Office Supplies",
        "Maintenance", "Software Subscriptions", "Travel", "Transportation", "Other"
    ];

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>{isEditMode ? "Edit Expense" : "Record New Expense"}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label htmlFor="date">Date *</Label>
                        <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="amount">Amount (RWF) *</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} min="0.01" required />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="category">Category *</Label>
                        <Select id="category" name="category" value={formData.category} onChange={handleInputChange} required>
                            <option value="">Select Category...</option>
                            {expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Select>
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="description">Description</Label>
                        <Input as="textarea" id="description" name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Brief description of the expense..." />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="payee">Payee</Label>
                        <Input id="payee" name="payee" type="text" value={formData.payee} onChange={handleInputChange} placeholder="Who was paid (optional)" />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={loading} disabled={loading}><FaSave style={{marginRight: '0.5rem'}}/> {isEditMode ? "Update Expense" : "Save Expense"}</Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
};

export default ExpenseModal;