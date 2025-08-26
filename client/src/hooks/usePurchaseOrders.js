"use client";

import { useState, useEffect, useCallback } from 'react';
import { poAPI } from '../services/api'; // Ensure this path is correct
import { useNotifications } from '../contexts/NotificationContext'; // Ensure this path is correct

export const usePurchaseOrders = () => {
    // 1. Initialize state correctly. `purchaseOrders` is always an array.
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showToast } = useNotifications();

    // 2. Define a memoized function to fetch all purchase orders.
    const fetchPOs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Your api.js interceptor automatically unwraps `response.data`.
            const response = await poAPI.getAll(); 
            // Defensively ensure the data is always an array to prevent render errors.
            setPurchaseOrders(response.data || []);
        } catch (err) {
            // The API interceptor already shows a toast on error.
            // We just set the local error state for the UI to optionally use.
            const message = err.response?.data?.message || "Could not fetch purchase orders.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []); // This function has no dependencies as it's self-contained.

    // 3. Fetch the data when the hook is first mounted.
    useEffect(() => {
        fetchPOs();
    }, [fetchPOs]); // The dependency array ensures this runs only once on mount.

    // 4. Define a function to create a new purchase order.
    const createPO = useCallback(async (poData) => {
        setLoading(true);
        try {
            // Call the API service to create the document.
            await poAPI.create(poData);
            // On success, refetch the entire list to include the new PO.
            await fetchPOs(); 
            // showToast is handled by the interceptor on success if you configure it,
            // but an explicit call here is also fine for specific messages.
            // showToast("Purchase Order created successfully!", "success");
            return true; // Return true to indicate success to the calling component.
        } catch (err) {
            // Error toast is already handled by the API interceptor.
            setLoading(false); // Stop the loading spinner on failure.
            return false; // Return false to indicate failure.
        }
    }, [fetchPOs]); // Depends on fetchPOs to refresh the list.

    // 5. Define a function to update the status of a PO.
    const updatePOStatus = useCallback(async (id, newStatus) => {
        setLoading(true);
        try {
            await poAPI.updateStatus(id, newStatus);
            // On success, refetch the list to show the updated status.
            await fetchPOs();
            return true;
        } catch (err) {
            setLoading(false);
            return false;
        }
    }, [fetchPOs]);

    // 6. Return all the state and functions needed by the UI components.
    return {
        purchaseOrders,
        loading,
        error,
        createPO,
        updatePOStatus,
        refreshPOs: fetchPOs, // Expose the fetch function for manual refresh buttons.
    };
};