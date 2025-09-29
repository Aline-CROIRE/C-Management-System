// src/hooks/useDailyStockSnapshots.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { snapshotAPI } from '../services/api'; 
import toast from 'react-hot-toast';
import moment from 'moment';

export const useDailyStockSnapshots = (initialFilters = {}) => {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState(initialFilters);

    const fetchSnapshots = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...filters,
                startDate: filters.startDate ? moment(filters.startDate).toISOString() : undefined,
                endDate: filters.endDate ? moment(filters.endDate).toISOString() : undefined,
            };
            const response = await snapshotAPI.getDailyStockSnapshots(params);
            if (response.success) {
                setSnapshots(response.data);
                setPagination(response.pagination);
            } else {
                throw new Error(response.message || 'Failed to fetch daily stock snapshots.');
            }
        } catch (err) {
            setError(err.message);
            // toast.error is handled by the API interceptor
        } finally {
            setLoading(false);
        }
    }, [filters]); 

    useEffect(() => {
        fetchSnapshots();
    }, [fetchSnapshots]);

    const generateSingleSnapshot = useCallback(async (date, itemId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await snapshotAPI.generateSingleDailySnapshot({ date, itemId });
            if (response.success) {
                toast.success(response.message);
                fetchSnapshots(); // Refresh data after generation
            } else {
                throw new Error(response.message || 'Failed to generate snapshot.');
            }
        } catch (err) {
            setError(err.message);
            // toast.error handled by interceptor
            return false;
        } finally {
            setLoading(false);
            return true;
        }
    }, [fetchSnapshots]);

    return {
        snapshots,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        generateSingleSnapshot,
        refetch: fetchSnapshots,
    };
};