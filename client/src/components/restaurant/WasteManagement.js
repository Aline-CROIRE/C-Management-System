// client/src/components/restaurant/WasteManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaTrash, FaFilter, FaSearch, FaSync, FaChartPie, FaWeight, FaRecycle, FaTimes, FaCalendarAlt } from 'react-icons/fa'; // Added FaCalendarAlt
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

import WasteLogModal from './modals/WasteLogModal'; // Correct import path

const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};

  @media (max-width: 768px) {
    margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
    flex-direction: column;
    align-items: stretch;
    gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  flex-wrap: wrap;
  align-items: center;

  select {
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors?.border};
    background: white;
  }
`;

const WasteManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const WasteLogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const WasteLogCard = styled(Card)`
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
        switch (props.$wasteType) {
            case 'food_pre_consumer': return props.theme.colors?.warning;
            case 'food_post_consumer': return props.theme.colors?.danger;
            case 'packaging_plastic': return props.theme.colors?.info;
            case 'packaging_paper': return props.theme.colors?.primary;
            case 'packaging_glass': return props.theme.colors?.success;
            default: return props.theme.colors?.border;
        }
    }};
  }

  h4 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: 0 0 ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    color: ${(props) => props.theme.colors?.heading};
  }
  .log-meta {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#666"};
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    span {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }
  }
  .quantity {
    font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${(props) => props.theme.colors?.primaryDark};
    margin: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .details {
      font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
      color: ${(props) => props.theme.colors?.text};
      flex-grow: 1;
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
    justify-content: flex-end;
    width: 100%;
  }
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;

const WasteManagement = ({ restaurantId }) => {
  const [wasteLogs, setWasteLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterDisposalMethod, setFilterDisposalMethod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchWasteLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: filterType,
        disposalMethod: filterDisposalMethod,
        search: debouncedSearchQuery,
      };
      const response = await restaurantAPI.getWasteLogs(restaurantId, params);
      if (response?.success) {
        setWasteLogs(response.data);
      } else {
        setError(response?.message || 'Failed to fetch waste logs.');
        toast.error(response?.message || 'Failed to fetch waste logs.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching waste logs.');
      toast.error(err.message || 'An error occurred fetching waste logs.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterType, filterDisposalMethod, debouncedSearchQuery]);

  useEffect(() => {
    fetchWasteLogs();
  }, [fetchWasteLogs]);

  const handleOpenModal = (log = null) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingLog(null);
    setIsModalOpen(false);
  };

  const handleSaveLog = async (logData) => {
    try {
      if (editingLog) {
        // Assuming an update endpoint exists
        // await restaurantAPI.updateWasteLog(restaurantId, editingLog._id, logData);
        toast.error("Updating waste logs is not yet implemented in API."); // Placeholder
      } else {
        await restaurantAPI.logWaste(restaurantId, logData);
        toast.success('Waste log added successfully!');
      }
      fetchWasteLogs();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save waste log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this waste log?')) {
      try {
        // Assuming a delete endpoint exists
        // await restaurantAPI.deleteWasteLog(restaurantId, logId);
        toast.error("Deleting waste logs is not yet implemented in API."); // Placeholder
        fetchWasteLogs();
      } catch (err) {
        toast.error(err.message || 'Failed to delete waste log.');
      }
    }
  };

  const uniqueWasteTypes = useMemo(() => {
    const types = wasteLogs.map(log => log.type);
    return [...new Set(types)].filter(Boolean);
  }, [wasteLogs]);

  const uniqueDisposalMethods = useMemo(() => {
    const methods = wasteLogs.map(log => log.disposalMethod);
    return [...new Set(methods)].filter(Boolean);
  }, [wasteLogs]);


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <WasteManagementContainer>
      <ActionBar>
        <h3>Waste Management Logs</h3>
        <FilterGroup>
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                title="Filter by Waste Type"
            >
                <option value="">All Types</option>
                {uniqueWasteTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
            </select>
            <select
                value={filterDisposalMethod}
                onChange={(e) => setFilterDisposalMethod(e.target.value)}
                title="Filter by Disposal Method"
            >
                <option value="">All Methods</option>
                {uniqueDisposalMethods.map(method => <option key={method} value={method}>{method.replace(/_/g, ' ')}</option>)}
            </select>
            <Button variant="outline" onClick={fetchWasteLogs} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Add Waste Log</Button>
        </FilterGroup>
      </ActionBar>

      <WasteLogGrid>
        {wasteLogs.length > 0 ? (
          wasteLogs.map((log) => (
            <WasteLogCard key={log._id} $wasteType={log.type}>
              <h4>{log.type.replace(/_/g, ' ')}</h4>
              <div className="log-meta">
                <span><FaCalendarAlt /> {new Date(log.date).toLocaleDateString()}</span>
                <span><FaRecycle /> {log.disposalMethod.replace(/_/g, ' ')}</span>
                {log.source && <span>Source: {log.source}</span>}
              </div>
              <div className="quantity">
                <FaWeight /> {log.quantity} {log.unit}
              </div>
              {log.notes && <p className="details">Notes: {log.notes}</p>}
              <div className="actions">
                {/* <Button variant="secondary" size="sm" onClick={() => handleOpenModal(log)}><FaEdit /></Button> */}
                <Button variant="danger" size="sm" onClick={() => handleDeleteLog(log._id)}><FaTrash /></Button>
              </div>
            </WasteLogCard>
          ))
        ) : (
          <p>No waste logs found. Add a new log or adjust your filters.</p>
        )}
      </WasteLogGrid>

      {isModalOpen && (
        <WasteLogModal
          restaurantId={restaurantId}
          logToEdit={editingLog}
          onClose={handleCloseModal}
          onSave={handleSaveLog}
        />
      )}
    </WasteManagementContainer>
  );
};

export default WasteManagement;