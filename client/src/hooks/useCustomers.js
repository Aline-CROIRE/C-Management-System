import { useState, useCallback, useEffect } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await customerAPI.getAll();
            if (response.success) setCustomers(response.data || []);
        } catch (err) {
            toast.error("Failed to fetch customers.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const createCustomer = useCallback(async (customerData) => {
        try {
            const response = await customerAPI.create(customerData);
            if (response.success) {
                toast.success("Customer created successfully!");
                await fetchCustomers();
                return response.data;
            }
            return null;
        } catch (err) {
            throw err;
        }
    }, [fetchCustomers]);

    return { customers, loading, createCustomer, refetch: fetchCustomers };
};