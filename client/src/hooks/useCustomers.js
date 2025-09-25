// src/hooks/useCustomers.js
"use client";
import { useState, useCallback, useEffect } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await customerAPI.getAll();
            if (response.success) {
                setCustomers(response.data || []);
            } else {
                throw new Error(response.message || 'Failed to fetch customers.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'An error occurred while fetching customers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const createCustomer = useCallback(async (customerData) => {
        setLoading(true);
        try {
            const response = await customerAPI.create(customerData);
            if (response.success) {
                setCustomers(prev => [...prev, response.data]);
                toast.success('Customer created successfully!');
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to create customer.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'An error occurred while creating the customer.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const recordCustomerPayment = useCallback(async (customerId, paymentData) => {
        setLoading(true);
        try {
            const response = await customerAPI.recordPayment(customerId, paymentData);
            if (response.success) {
                toast.success('Customer payment recorded!');
                fetchCustomers(); // Refresh customer data to update balances
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to record customer payment.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Error recording customer payment.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCustomers]);


    return {
        customers,
        loading,
        error,
        createCustomer,
        recordCustomerPayment,
        refetchCustomers: fetchCustomers
    };
};