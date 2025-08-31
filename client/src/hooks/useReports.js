import { useState, useCallback, useEffect } from 'react';
import { reportsAPI } from '../services/api';

export const useReports = (filters) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await reportsAPI.getReportData(filters);
            if (response.success) {
                setReportData(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch report data.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    return { reportData, loading, error, refetch: fetchReportData };
};