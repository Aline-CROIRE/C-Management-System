import { useState, useCallback, useEffect } from 'react';
import { supplierAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await supplierAPI.getAll();
            if (response.success) {
                setSuppliers(response.data || []);
            } else {
                throw new Error(response.message || 'Failed to fetch suppliers.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'An error occurred while fetching suppliers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const createSupplier = useCallback(async (supplierData) => {
        setLoading(true);
        try {
            const response = await supplierAPI.create(supplierData);
            if (response.success) {
                setSuppliers(prev => [...prev, response.data]);
                toast.success('Supplier created successfully!');
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to create supplier.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'An error occurred while creating the supplier.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSupplier = useCallback(async (id, supplierData) => {
        setLoading(true);
        try {
            const response = await supplierAPI.update(id, supplierData);
            if (response.success) {
                setSuppliers(prev => prev.map(s => s._id === id ? response.data : s));
                toast.success('Supplier updated successfully!');
                return true;
            } else {
                throw new Error(response.message || 'Failed to update supplier.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'An error occurred while updating the supplier.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteSupplier = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await supplierAPI.delete(id);
            if (response.success) {
                setSuppliers(prev => prev.filter(s => s._id !== id));
                toast.success('Supplier deleted successfully.');
                return true;
            } else {
                throw new Error(response.message || 'Failed to delete supplier.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'An error occurred while deleting the supplier.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        suppliers,
        loading,
        error,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        refreshSuppliers: fetchSuppliers
    };
};