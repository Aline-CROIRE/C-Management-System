import { useState, useCallback, useEffect } from 'react';
import { poAPI } from '../services/api';
import toast from 'react-hot-toast';

export const usePurchaseOrders = (filters) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await poAPI.getAll(filters);
      if (response.success) {
        setPurchaseOrders(response.data || []);
        setPagination(response.pagination || null);
      } else {
        throw new Error(response.message || 'Failed to fetch purchase orders.');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const createPO = useCallback(async (poData) => {
    try {
      const response = await poAPI.create(poData);
      if (response.success) {
        await fetchPOs();
        return true;
      }
      return false;
    } catch (err) {
      throw err;
    }
  }, [fetchPOs]);

  const updatePOStatus = useCallback(async (poId, status, receivedItemsData = null) => {
    try {
      const response = await poAPI.updateStatus(poId, status, receivedItemsData);
      if (response.success) {
        await fetchPOs();
        return true;
      }
      return false;
    } catch (err) {
      throw err;
    }
  }, [fetchPOs]);

  return { purchaseOrders, pagination, loading, error, createPO, updatePOStatus, refetch: fetchPOs };
};