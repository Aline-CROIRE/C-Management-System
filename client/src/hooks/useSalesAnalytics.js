import { useState, useCallback, useEffect } from 'react';
import { salesAPI } from '../services/api';
import moment from 'moment';
import toast from 'react-hot-toast';

export const useSalesAnalytics = (initialFilters) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [filters, setFilters] = useState(() => ({
        startDate: initialFilters?.startDate ? new Date(initialFilters.startDate) : moment().subtract(30, 'days').toDate(),
        endDate: initialFilters?.endDate ? new Date(initialFilters.endDate) : moment().toDate(),
    }));

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await salesAPI.getAnalytics({
                startDate: filters.startDate.toISOString(),
                endDate: filters.endDate.toISOString(),
            });
            if (response.success) {
                setAnalytics(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch sales analytics.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to load sales analytics.");
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => {
        if (initialFilters) {
            const newStartDate = initialFilters.startDate ? new Date(initialFilters.startDate) : filters.startDate;
            const newEndDate = initialFilters.endDate ? new Date(initialFilters.endDate) : filters.endDate;

            if (newStartDate.getTime() !== filters.startDate.getTime() || newEndDate.getTime() !== filters.endDate.getTime()) {
                setFilters({
                    startDate: newStartDate,
                    endDate: newEndDate,
                });
            }
        }
    }, [initialFilters?.startDate, initialFilters?.endDate, filters.startDate, filters.endDate]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return { analytics, loading, error, filters, setFilters, refetch: fetchAnalytics };
};