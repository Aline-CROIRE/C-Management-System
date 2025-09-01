import { useState, useCallback, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

export const useSalesAnalytics = (filters) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await analyticsAPI.getSalesSummary(filters);
            if (response.success) {
                setAnalytics(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch analytics.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return { analytics, loading, error, refetch: fetchAnalytics };
};