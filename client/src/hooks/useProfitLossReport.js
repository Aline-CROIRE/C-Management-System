// src/hooks/useProfitLossReport.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';

export const useProfitLossReport = (initialFilters = {}) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchProfitLossReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                startDate: filters.startDate ? moment(filters.startDate).toISOString() : undefined,
                endDate: filters.endDate ? moment(filters.endDate).toISOString() : undefined,
            };
            const response = await reportsAPI.getProfitLossReport(params);
            if (response.success) {
                setReportData(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch Profit & Loss report.');
            }
        } catch (err) {
            setError(err.message);
            // toast.error is handled by the API interceptor
        } finally {
            setLoading(false);
        }
    }, [filters]); // Dependency on filters ensures refetch when filters change

    useEffect(() => {
        fetchProfitLossReport();
    }, [fetchProfitLossReport]); // Re-run effect when fetchProfitLossReport function itself changes (due to filters change)

    return {
        reportData,
        loading,
        error,
        filters,
        setFilters, // Allows updating filters from the component
        refetch: fetchProfitLossReport, // Expose refetch function
    };
};