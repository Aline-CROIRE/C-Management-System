// src/hooks/useSales.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useSales = (initialFilters = {}) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState(initialFilters);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await salesAPI.getAll(filters);
            if (response.success) {
                setSales(response.data);
                setPagination(response.pagination);
            } else {
                throw new Error(response.message || 'Failed to fetch sales.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error fetching sales.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        // Ensure initial filters are applied only once or when they deeply change
        if (JSON.stringify(filters) !== JSON.stringify(initialFilters)) {
            setFilters(initialFilters);
        }
        fetchSales();
    }, [fetchSales, initialFilters]);


    const createSale = useCallback(async (saleData) => {
        setLoading(true);
        try {
            const response = await salesAPI.create(saleData);
            if (response.success) {
                toast.success('Sale recorded successfully!');
                fetchSales(); // Refresh sales list
                return true;
            } else {
                throw new Error(response.message || 'Failed to record sale.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error recording sale.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchSales]);

    const processReturn = useCallback(async (saleId, returnData) => {
        setLoading(true);
        try {
            const response = await salesAPI.processReturn(saleId, returnData);
            if (response.success) {
                toast.success('Items returned successfully and inventory updated!');
                fetchSales(); // Refresh sales list
                return true;
            } else {
                throw new Error(response.message || 'Failed to process return.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error processing return.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchSales]);

    const recordPayment = useCallback(async (saleId, paymentData) => { // NEW: recordPayment function
        setLoading(true);
        try {
            const response = await salesAPI.recordPayment(saleId, paymentData);
            if (response.success) {
                toast.success('Payment recorded successfully!');
                fetchSales(); // Refresh sales list
                return true;
            } else {
                throw new Error(response.message || 'Failed to record payment.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error recording payment.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchSales]);

    return {
        sales,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        createSale,
        processReturn,
        recordPayment, // Expose the new payment function
        refetch: fetchSales,
    };
};