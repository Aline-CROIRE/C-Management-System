// src/hooks/useInternalUse.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { internalUseAPI } from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';

export const useInternalUse = (initialFilters = {}) => {
    const [internalUses, setInternalUses] = useState([]);
    const [totalValueStats, setTotalValueStats] = useState({ totalValue: 0, totalQuantity: 0, recordCount: 0 }); // NEW State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState(initialFilters);

    const fetchInternalUses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await internalUseAPI.getAll(filters);
            if (response.success) {
                setInternalUses(response.data);
                setPagination(response.pagination);
            } else {
                throw new Error(response.message || 'Failed to fetch internal use records.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error fetching internal use records.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // NEW: Function to fetch total internal use value
    const fetchTotalInternalUseValue = useCallback(async (periodFilters = {}) => {
        try {
            const params = {
                startDate: periodFilters.startDate ? moment(periodFilters.startDate).toISOString() : undefined,
                endDate: periodFilters.endDate ? moment(periodFilters.endDate).toISOString() : undefined,
            };
            const response = await internalUseAPI.getTotalValue(params);
            if (response.success) {
                setTotalValueStats(response.data);
            } else {
                console.error("Failed to fetch total internal use value:", response.message);
                setTotalValueStats({ totalValue: 0, totalQuantity: 0, recordCount: 0 });
            }
        } catch (err) {
            console.error("Error fetching total internal use value:", err);
            setTotalValueStats({ totalValue: 0, totalQuantity: 0, recordCount: 0 });
            // toast.error("Failed to load internal use value summary."); // Optionally show a toast
        }
    }, []);


    useEffect(() => {
        fetchInternalUses();
        fetchTotalInternalUseValue(filters); // Fetch total value with current filters
    }, [fetchInternalUses, fetchTotalInternalUseValue, filters]);

    const createInternalUse = useCallback(async (useData) => {
        setLoading(true);
        try {
            const response = await internalUseAPI.create(useData);
            if (response.success) {
                toast.success('Internal use recorded successfully!');
                fetchInternalUses(); // Refresh the list
                fetchTotalInternalUseValue(filters); // Refresh total value
                return true;
            } else {
                throw new Error(response.message || 'Failed to record internal use.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error recording internal use.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchInternalUses, fetchTotalInternalUseValue, filters]);

    const deleteInternalUse = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await internalUseAPI.delete(id);
            if (response.success) {
                toast.success('Internal use record deleted successfully!');
                fetchInternalUses(); // Refresh the list
                fetchTotalInternalUseValue(filters); // Refresh total value
                return true;
            } else {
                throw new Error(response.message || 'Failed to delete internal use record.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error deleting internal use record.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchInternalUses, fetchTotalInternalUseValue, filters]);

    return {
        internalUses,
        totalValueStats, // NEW: Expose total value stats
        loading,
        error,
        pagination,
        filters,
        setFilters,
        createInternalUse,
        deleteInternalUse,
        refetch: fetchInternalUses,
        refetchTotalValue: fetchTotalInternalUseValue, // Expose for manual refresh if needed
    };
};