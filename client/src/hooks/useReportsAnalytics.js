// hooks/useReportsAnalytics.js
import { useState, useCallback, useEffect } from 'react';
import { reportsAPI } from '../services/api'; // Correct relative path from hooks/ to services/
import moment from 'moment';
import toast from 'react-hot-toast';

export const useReportsAnalytics = (initialFilters) => { // Keep as named export
    const [reportsData, setReportsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [filters, setFilters] = useState(() => ({
        startDate: initialFilters?.startDate ? new Date(initialFilters.startDate) : moment().subtract(30, 'days').toDate(),
        endDate: initialFilters?.endDate ? new Date(initialFilters.endDate) : moment().toDate(),
    }));

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await reportsAPI.getComprehensiveReport({
                startDate: filters.startDate.toISOString(),
                endDate: filters.endDate.toISOString(),
            });
            if (response.success) {
                setReportsData(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch comprehensive reports.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to load comprehensive reports.");
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
        fetchReports();
    }, [fetchReports]);

    return { reportsData, loading, error, filters, setFilters, refetch: fetchReports };
};