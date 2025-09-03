import { useState, useCallback, useEffect } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Added error state

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear error on new fetch
        try {
            const response = await customerAPI.getAll();
            if (response.success) {
                setCustomers(response.data || []);
            } else {
                throw new Error(response.message || 'Failed to fetch customers.');
            }
        } catch (err) {
            setError(err.message); // Set error state
            toast.error(err.message || "Failed to fetch customers.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const createCustomer = useCallback(async (customerData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await customerAPI.create(customerData);
            if (response.success) {
                toast.success("Customer created successfully!");
                await fetchCustomers();
                return response.data;
            } else {
                throw new Error(response.message || "Failed to create customer.");
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to create customer.");
            throw err; // Re-throw to propagate error for modal handling
        } finally {
            setLoading(false);
        }
    }, [fetchCustomers]);

    return { customers, loading, error, createCustomer, refetch: fetchCustomers }; // Return error
};