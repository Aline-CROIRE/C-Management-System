import { useState, useCallback, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

export const useInventoryAnalytics = (dependency) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await analyticsAPI.getInventorySummary();
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
    }, [dependency]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return { analytics, loading, error, refetch: fetchAnalytics };
};