// src/hooks/useCircularEconomy.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';

export const useCircularEconomy = (initialFilters = {}) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchPackagingReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                startDate: filters.startDate ? moment(filters.startDate).toISOString() : undefined,
                endDate: filters.endDate ? moment(filters.endDate).toISOString() : undefined,
            };
            const response = await salesAPI.getPackagingReport(params);
            if (response.success) {
                setReportData(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch circular economy report.');
            }
        } catch (err) {
            setError(err.message);
            // toast.error is usually handled by the API interceptor
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchPackagingReport();
    }, [fetchPackagingReport]);

    return {
        reportData,
        loading,
        error,
        filters,
        setFilters,
        refetch: fetchPackagingReport,
    };
};