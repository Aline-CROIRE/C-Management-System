// src/hooks/useStockAdjustments.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { stockAdjustmentAPI } from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';

export const useStockAdjustments = (initialFilters = {}) => {
    const [adjustments, setAdjustments] = useState([]);
    const [totalImpactStats, setTotalImpactStats] = useState({ totalCostImpact: 0, totalQuantityAdjusted: 0, recordCount: 0 }); // NEW State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState(initialFilters);

    const fetchAdjustments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await stockAdjustmentAPI.getAll(filters);
            if (response.success) {
                setAdjustments(response.data);
                setPagination(response.pagination);
            } else {
                throw new Error(response.message || 'Failed to fetch stock adjustments.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error fetching stock adjustments.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // NEW: Function to fetch total stock adjustment impact
    const fetchTotalStockAdjustmentImpact = useCallback(async (periodFilters = {}) => {
        try {
            const params = {
                startDate: periodFilters.startDate ? moment(periodFilters.startDate).toISOString() : undefined,
                endDate: periodFilters.endDate ? moment(periodFilters.endDate).toISOString() : undefined,
                type: periodFilters.type || undefined,
            };
            const response = await stockAdjustmentAPI.getTotalImpact(params);
            if (response.success) {
                setTotalImpactStats(response.data);
            } else {
                console.error("Failed to fetch total stock adjustment impact:", response.message);
                setTotalImpactStats({ totalCostImpact: 0, totalQuantityAdjusted: 0, recordCount: 0 });
            }
        } catch (err) {
            console.error("Error fetching total stock adjustment impact:", err);
            setTotalImpactStats({ totalCostImpact: 0, totalQuantityAdjusted: 0, recordCount: 0 });
        }
    }, []);

    useEffect(() => {
        fetchAdjustments();
        fetchTotalStockAdjustmentImpact(filters); // Fetch total impact with current filters
    }, [fetchAdjustments, fetchTotalStockAdjustmentImpact, filters]);

    const createAdjustment = useCallback(async (adjustmentData) => {
        setLoading(true);
        try {
            const response = await stockAdjustmentAPI.create(adjustmentData);
            if (response.success) {
                toast.success('Stock adjustment recorded successfully!');
                fetchAdjustments(); // Refresh the list
                fetchTotalStockAdjustmentImpact(filters); // Refresh total impact
                return true;
            } else {
                throw new Error(response.message || 'Failed to record stock adjustment.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error recording stock adjustment.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchAdjustments, fetchTotalStockAdjustmentImpact, filters]);

    const deleteAdjustment = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await stockAdjustmentAPI.delete(id);
            if (response.success) {
                toast.success('Stock adjustment record deleted successfully!');
                fetchAdjustments(); // Refresh the list
                fetchTotalStockAdjustmentImpact(filters); // Refresh total impact
                return true;
            } else {
                throw new Error(response.message || 'Failed to delete stock adjustment record.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error deleting stock adjustment record.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchAdjustments, fetchTotalStockAdjustmentImpact, filters]);

    return {
        adjustments,
        totalImpactStats, // NEW: Expose total impact stats
        loading,
        error,
        pagination,
        filters,
        setFilters,
        createAdjustment,
        deleteAdjustment,
        refetch: fetchAdjustments,
        refetchTotalImpact: fetchTotalStockAdjustmentImpact, 
    };
};