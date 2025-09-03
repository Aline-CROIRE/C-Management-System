// hooks/useSales.js
import { useState, useCallback, useEffect } from 'react';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useSales = (filters) => {
    const [sales, setSales] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await salesAPI.getAll(filters);
            if (response.success) {
                setSales(response.data || []);
                setPagination(response.pagination || null);
            } else {
                throw new Error(response.message || 'Failed to fetch sales.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to load sales.");
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const createSale = useCallback(async (saleData) => {
        setLoading(true);
        try {
            const response = await salesAPI.create(saleData);
            await fetchSales();
            toast.success("Sale recorded successfully!");
            return response;
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to record sale.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSales]);

    const processReturn = useCallback(async (saleId, returnedItems) => {
        setLoading(true);
        try {
            const response = await salesAPI.processReturn(saleId, { returnedItems });
            await fetchSales();
            toast.success("Items returned successfully!");
            return response;
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to process return.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSales]);
    
    const deleteSale = useCallback(async (saleId) => {
        setLoading(true);
        try {
            const response = await salesAPI.delete(saleId);
            await fetchSales();
            toast.success("Sale deleted and inventory restocked!");
            return response;
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to delete sale.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSales]);

    return { sales, pagination, loading, error, createSale, deleteSale, processReturn, refetch: fetchSales };
};