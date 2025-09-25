// src/hooks/useExpenses.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { expensesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useExpenses = (initialFilters = {}) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState(initialFilters);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await expensesAPI.getAll(filters);
            if (response.success) {
                setExpenses(response.data);
                setPagination(response.pagination);
            } else {
                throw new Error(response.message || 'Failed to fetch expenses.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error fetching expenses.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const createExpense = useCallback(async (expenseData) => {
        setLoading(true);
        try {
            const response = await expensesAPI.create(expenseData);
            if (response.success) {
                toast.success('Expense recorded successfully!');
                fetchExpenses(); // Refresh the list
                return true;
            } else {
                throw new Error(response.message || 'Failed to record expense.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error recording expense.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchExpenses]);

    const updateExpense = useCallback(async (id, expenseData) => {
        setLoading(true);
        try {
            const response = await expensesAPI.update(id, expenseData);
            if (response.success) {
                toast.success('Expense updated successfully!');
                fetchExpenses(); // Refresh the list
                return true;
            } else {
                throw new Error(response.message || 'Failed to update expense.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error updating expense.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchExpenses]);

    const deleteExpense = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await expensesAPI.delete(id);
            if (response.success) {
                toast.success('Expense deleted successfully!');
                fetchExpenses(); // Refresh the list
                return true;
            } else {
                throw new Error(response.message || 'Failed to delete expense.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error deleting expense.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchExpenses]);

    return {
        expenses,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        createExpense,
        updateExpense,
        deleteExpense,
        refetch: fetchExpenses, // Expose refetch for manual triggering
    };
};