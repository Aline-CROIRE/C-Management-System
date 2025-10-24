// client/src/components/restaurant/ResourceConsumptionManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaTrash, FaFilter, FaSearch, FaSync,FaRecycle, FaBolt, FaWater, FaCalendarAlt } from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

// Modals
import ResourceLogModal from './modals/ResourceLogModal'; // Will create this next

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

const ResourceManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const ResourceLogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const ResourceLogCard = styled(Card)`
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
        switch (props.$resourceType) {
            case 'electricity': return props.theme.colors?.info;
            case 'water': return props.theme.colors?.tertiary;
            case 'gas': return props.theme.colors?.danger;
            default: return props.theme.colors?.primary;
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

const ResourceConsumptionManagement = ({ restaurantId }) => {
  const [resourceLogs, setResourceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchResourceLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: filterType,
        search: debouncedSearchQuery,
      };
      const response = await restaurantAPI.getResourceLogs(restaurantId, params);
      if (response?.success) {
        setResourceLogs(response.data);
      } else {
        setError(response?.message || 'Failed to fetch resource logs.');
        toast.error(response?.message || 'Failed to fetch resource logs.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching resource logs.');
      toast.error(err.message || 'An error occurred fetching resource logs.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterType, debouncedSearchQuery]);

  useEffect(() => {
    fetchResourceLogs();
  }, [fetchResourceLogs]);

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
        // await restaurantAPI.updateResourceLog(restaurantId, editingLog._id, logData);
        toast.error("Updating resource logs is not yet implemented in API."); // Placeholder
      } else {
        await restaurantAPI.logResourceConsumption(restaurantId, logData);
        toast.success('Resource log added successfully!');
      }
      fetchResourceLogs();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save resource log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this resource log? This action cannot be undone.')) {
      try {
        // Assuming a delete endpoint exists
        // await restaurantAPI.deleteResourceLog(restaurantId, logId);
        toast.error("Deleting resource logs is not yet implemented in API."); // Placeholder
        fetchResourceLogs();
      } catch (err) {
        toast.error(err.message || 'Failed to delete resource log.');
      }
    }
  };

  const uniqueResourceTypes = useMemo(() => {
    const types = resourceLogs.map(log => log.type);
    return [...new Set(types)].filter(Boolean);
  }, [resourceLogs]);


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <ResourceManagementContainer>
      <ActionBar>
        <h3>Resource Consumption Logs</h3>
        <FilterGroup>
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                title="Filter by Resource Type"
            >
                <option value="">All Types</option>
                {uniqueResourceTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
            </select>
            <Button variant="outline" onClick={fetchResourceLogs} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Add Resource Log</Button>
        </FilterGroup>
      </ActionBar>

      <ResourceLogGrid>
        {resourceLogs.length > 0 ? (
          resourceLogs.map((log) => (
            <ResourceLogCard key={log._id} $resourceType={log.type}>
              <h4>{log.type.replace(/_/g, ' ')} Consumption</h4>
              <div className="log-meta">
                <span><FaCalendarAlt /> {new Date(log.date).toLocaleDateString()}</span>
                {log.source && <span>Source: {log.source}</span>}
              </div>
              <div className="quantity">
                {log.type === 'electricity' && <FaBolt />}
                {log.type === 'water' && <FaWater />}
                {log.type === 'gas' && <FaRecycle />} {/* Using recycle as a placeholder for gas icon, adjust if you have a better one */}
                {log.quantity} {log.unit}
              </div>
              {log.notes && <p className="details">Notes: {log.notes}</p>}
              <div className="actions">
                {/* <Button variant="secondary" size="sm" onClick={() => handleOpenModal(log)}><FaEdit /></Button> */}
                <Button variant="danger" size="sm" onClick={() => handleDeleteLog(log._id)}><FaTrash /></Button>
              </div>
            </ResourceLogCard>
          ))
        ) : (
          <p>No resource logs found. Add a new log or adjust your filters.</p>
        )}
      </ResourceLogGrid>

      {isModalOpen && (
        <ResourceLogModal
          restaurantId={restaurantId}
          logToEdit={editingLog}
          onClose={handleCloseModal}
          onSave={handleSaveLog}
        />
      )}
    </ResourceManagementContainer>
  );
};

export default ResourceConsumptionManagement;