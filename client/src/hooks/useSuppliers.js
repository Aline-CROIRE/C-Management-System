import { useState, useCallback, useEffect } from 'react';
import { supplierAPI } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useNotifications();

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await supplierAPI.getAll();
            if (response.success) setSuppliers(response.data || []);
        } catch (err) {
            console.error("Failed to fetch suppliers", err);
            // The API interceptor will already show a toast on failure
        }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    const createSupplier = useCallback(async (supplierData) => {
        try {
            const response = await supplierAPI.create(supplierData);
            showToast("Supplier created successfully!", "success");
            await fetchSuppliers();
            return response.data; // Return the new supplier object
        } catch (err) {
            // Error is handled by interceptor, but we throw to stop the calling function
            throw err; 
        }
    }, [fetchSuppliers, showToast]);

    const updateSupplier = useCallback(async (id, supplierData) => {
        try {
            await supplierAPI.update(id, supplierData);
            showToast("Supplier updated successfully!", "success");
            await fetchSuppliers();
            return true;
        } catch(err) {
            throw err;
        }
    }, [fetchSuppliers, showToast]);

    const deleteSupplier = useCallback(async (id) => {
        try {
            await supplierAPI.delete(id);
            showToast("Supplier deleted successfully.", "success");
            await fetchSuppliers();
            return true;
        } catch(err) {
            throw err;
        }
    }, [fetchSuppliers, showToast]);

    return { 
        suppliers, 
        loading, 
        createSupplier, 
        updateSupplier, 
        deleteSupplier,
        refreshSuppliers: fetchSuppliers 
    };
};