import { useState, useCallback, useEffect } from 'react';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useSales = (filters) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await salesAPI.getAll(filters);
            if (response.success) {
                setSales(response.data || []);
            } else {
                throw new Error(response.message || 'Failed to fetch sales.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const createSale = useCallback(async (saleData) => {
        const response = await salesAPI.create(saleData);
        await fetchSales();
        return response;
    }, [fetchSales]);

    const processReturn = useCallback(async (saleId, returnedItems) => {
        const response = await salesAPI.processReturn(saleId, { returnedItems });
        await fetchSales();
        return response;
    }, [fetchSales]);
    
    const deleteSale = useCallback(async (saleId) => {
        const response = await salesAPI.delete(saleId);
        await fetchSales();
        return response;
    }, [fetchSales]);

    return { sales, loading, error, createSale, deleteSale, processReturn, refetch: fetchSales };
};