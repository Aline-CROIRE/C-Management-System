// client/src/components/restaurant/ReusableProgramManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaTrash, FaFilter, FaSearch, FaSync, FaUser,FaBoxes, FaCalendarAlt, FaExchangeAlt, FaDollarSign } from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

// Modals
import ReusableContainerLogModal from './modals/ReusableContainerLogModal'; // Will create this next

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

const ReusableManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const ReusableLogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const ReusableLogCard = styled(Card)`
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
        switch (props.$eventType) {
            case 'issued': return props.theme.colors?.warning;
            case 'returned': return props.theme.colors?.success;
            default: return props.theme.colors?.info;
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

const ReusableProgramManagement = ({ restaurantId }) => {
  const [reusableLogs, setReusableLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [filterEventType, setFilterEventType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchReusableLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        eventType: filterEventType,
        search: debouncedSearchQuery,
      };
      const response = await restaurantAPI.getReusableContainerLogs(restaurantId, params);
      if (response?.success) {
        setReusableLogs(response.data);
      } else {
        setError(response?.message || 'Failed to fetch reusable container logs.');
        toast.error(response?.message || 'Failed to fetch reusable container logs.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching reusable container logs.');
      toast.error(err.message || 'An error occurred fetching reusable container logs.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterEventType, debouncedSearchQuery]);

  useEffect(() => {
    fetchReusableLogs();
  }, [fetchReusableLogs]);

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
        // await restaurantAPI.updateReusableContainerLog(restaurantId, editingLog._id, logData);
        toast.error("Updating reusable container logs is not yet implemented in API."); // Placeholder
      } else {
        await restaurantAPI.logReusableContainer(restaurantId, logData);
        toast.success('Reusable container log added successfully!');
      }
      fetchReusableLogs();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save reusable container log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this reusable container log?')) {
      try {
        // await restaurantAPI.deleteReusableContainerLog(restaurantId, logId);
        toast.error("Deleting reusable container logs is not yet implemented in API."); // Placeholder
        fetchReusableLogs();
      } catch (err) {
        toast.error(err.message || 'Failed to delete reusable container log.');
      }
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <ReusableManagementContainer>
      <ActionBar>
        <h3>Reusable Container Logs</h3>
        <FilterGroup>
            <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                title="Filter by Event Type"
            >
                <option value="">All Events</option>
                <option value="issued">Issued</option>
                <option value="returned">Returned</option>
            </select>
            <Button variant="outline" onClick={fetchReusableLogs} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Log Container Event</Button>
        </FilterGroup>
      </ActionBar>

      <ReusableLogGrid>
        {reusableLogs.length > 0 ? (
          reusableLogs.map((log) => (
            <ReusableLogCard key={log._id} $eventType={log.eventType}>
              <h4>{log.containerType} ({log.eventType.charAt(0).toUpperCase() + log.eventType.slice(1)})</h4>
              <div className="log-meta">
                <span><FaCalendarAlt /> {new Date(log.date).toLocaleDateString()}</span>
                {log.customerName && <span><FaUser /> {log.customerName}</span>}
              </div>
              <div className="quantity">
                <FaBoxes /> {log.quantity} units
                {log.depositAmount && <span><FaDollarSign /> {log.depositAmount.toFixed(2)} deposit</span>}
              </div>
              {log.notes && <p className="details">Notes: {log.notes}</p>}
              <div className="actions">
                {/* <Button variant="secondary" size="sm" onClick={() => handleOpenModal(log)}><FaEdit /></Button> */}
                <Button variant="danger" size="sm" onClick={() => handleDeleteLog(log._id)}><FaTrash /></Button>
              </div>
            </ReusableLogCard>
          ))
        ) : (
          <p>No reusable container logs found. Add a new event or adjust your filters.</p>
        )}
      </ReusableLogGrid>

      {isModalOpen && (
        <ReusableContainerLogModal
          restaurantId={restaurantId}
          logToEdit={editingLog}
          onClose={handleCloseModal}
          onSave={handleSaveLog}
        />
      )}
    </ReusableManagementContainer>
  );
};

export default ReusableProgramManagement;