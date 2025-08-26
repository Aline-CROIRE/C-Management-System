"use client";
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext'; // Adjust path if needed

// --- MOCK API ---
// In a real application, this would be in a separate `services/api.js` file
// and would make actual HTTP requests to your backend.

const initialSalesData = [
    { _id: 'sale_1', receiptNumber: 'S-2024-001', customerName: 'Alice Johnson', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), items: [ { itemId: 'item_1', name: 'Laptop Pro', quantity: 1, price: 1350.00 } ], totalAmount: 1350.00 },
    { _id: 'sale_2', receiptNumber: 'S-2024-002', customerName: 'Bob Williams', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), items: [ { itemId: 'item_2', name: 'Wireless Mouse', quantity: 2, price: 35.00 }, { itemId: 'item_3', name: 'USB-C Hub', quantity: 1, price: 49.99 } ], totalAmount: 119.99 },
];

// This simulates a persistent database for the mock API
let mockSalesDatabase = [...initialSalesData];

const mockSalesAPI = {
    getAll: async () => {
        console.log("MOCK API: Fetching all sales...");
        await new Promise(res => setTimeout(res, 800)); // Simulate network latency
        return { success: true, data: mockSalesDatabase };
    },
    create: async (saleData) => {
        console.log("MOCK API: Creating new sale...", saleData);
        await new Promise(res => setTimeout(res, 1000));
        
        // Basic validation
        if (!saleData || !saleData.items || saleData.items.length === 0) {
            return { success: false, message: "Sale must contain at least one item." };
        }

        const newSale = {
            ...saleData,
            _id: `sale_${Date.now()}`,
            receiptNumber: `S-2024-00${mockSalesDatabase.length + 1}`,
            createdAt: new Date(),
        };
        
        mockSalesDatabase = [newSale, ...mockSalesDatabase]; // Add to the top of the list
        
        // This is where you would also call the backend to decrement inventory stock
        console.log("MOCK API: Inventory would be decremented now.");

        return { success: true, data: newSale };
    },
};
// --- END MOCK API ---


/**
 * Custom hook for managing sales data.
 * - Fetches all sales records.
 * - Provides a function to create a new sale.
 * - Handles loading and error states automatically.
 * - Provides a manual refresh function.
 */
export const useSales = () => {
    const { addNotification } = useNotifications();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await mockSalesAPI.getAll();
            if (response.success) {
                setSales(response.data);
            } else {
                throw new Error(response.message || "Failed to fetch sales data.");
            }
        } catch (err) {
            setError(err);
            addNotification({ type: 'error', title: 'Error Fetching Sales', message: err.message });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const createSale = useCallback(async (saleData) => {
        setLoading(true);
        try {
            const response = await mockSalesAPI.create(saleData);
            if (response.success) {
                addNotification({ type: 'success', title: 'Sale Recorded!', message: `Receipt #${response.data.receiptNumber} created.` });
                // Refresh the sales list to include the new one
                await fetchSales();
                return { success: true, data: response.data };
            } else {
                throw new Error(response.message || "An unknown error occurred while saving the sale.");
            }
        } catch (err) {
            setError(err);
            addNotification({ type: 'error', title: 'Sale Creation Failed', message: err.message });
            setLoading(false); // Stop loading on failure
            return { success: false, message: err.message };
        }
        // Loading is set to false by the fetchSales() call on success
    }, [addNotification, fetchSales]);

    return {
        sales,
        loading,
        error,
        createSale,
        refreshSales: fetchSales, // Expose a manual refresh function
    };
};