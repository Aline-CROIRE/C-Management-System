// client/src/components/restaurant/UpcyclingLogManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSync, FaHandSparkles, FaUser,FaCalendarAlt, FaTag, FaStickyNote } from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

// Modals
import UpcyclingLogModal from './modals/UpcyclingLogModal'; // Will create this next

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

const UpcyclingManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const UpcyclingLogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const UpcyclingLogCard = styled(Card)`
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
    background: ${(props) => props.theme.colors?.accent};
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
  .item-used {
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.medium};
    color: ${(props) => props.theme.colors?.text};
    margin: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .description {
      font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
      color: ${(props) => props.theme.colors?.text};
      flex-grow: 1;
      margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
      max-height: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
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

const UpcyclingLogManagement = ({ restaurantId }) => {
  const [upcyclingLogs, setUpcyclingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [filterTag, setFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchUpcyclingLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tag: filterTag,
        search: debouncedSearchQuery,
      };
      const response = await restaurantAPI.getUpcyclingLogs(restaurantId, params);
      if (response?.success) {
        setUpcyclingLogs(response.data);
      } else {
        setError(response?.message || 'Failed to fetch upcycling logs.');
        toast.error(response?.message || 'Failed to fetch upcycling logs.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching upcycling logs.');
      toast.error(err.message || 'An error occurred fetching upcycling logs.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterTag, debouncedSearchQuery]);

  useEffect(() => {
    fetchUpcyclingLogs();
  }, [fetchUpcyclingLogs]);

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
        // await restaurantAPI.updateUpcyclingLog(restaurantId, editingLog._id, logData);
        toast.error("Updating upcycling logs is not yet implemented in API."); // Placeholder
      } else {
        await restaurantAPI.logUpcycling(restaurantId, logData);
        toast.success('Upcycling log added successfully!');
      }
      fetchUpcyclingLogs();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save upcycling log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this upcycling log?')) {
      try {
        // await restaurantAPI.deleteUpcyclingLog(restaurantId, logId);
        toast.error("Deleting upcycling logs is not yet implemented in API."); // Placeholder
        fetchUpcyclingLogs();
      } catch (err) {
        toast.error(err.message || 'Failed to delete upcycling log.');
      }
    }
  };

  const uniqueTags = useMemo(() => {
    const tags = [];
    upcyclingLogs.forEach(log => {
      if (log.tags && Array.isArray(log.tags)) {
        tags.push(...log.tags);
      }
    });
    return [...new Set(tags)].filter(Boolean);
  }, [upcyclingLogs]);


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <UpcyclingManagementContainer>
      <ActionBar>
        <h3>Upcycling & Creative Reuse Logs</h3>
        <FilterGroup>
            <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                title="Filter by Tag"
            >
                <option value="">All Tags</option>
                {uniqueTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <Button variant="outline" onClick={fetchUpcyclingLogs} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Log Upcycling</Button>
        </FilterGroup>
      </ActionBar>

      <UpcyclingLogGrid>
        {upcyclingLogs.length > 0 ? (
          upcyclingLogs.map((log) => (
            <UpcyclingLogCard key={log._id}>
              <h4>{log.projectName}</h4>
              <div className="log-meta">
                <span><FaCalendarAlt /> {new Date(log.date).toLocaleDateString()}</span>
                {log.responsibleStaff && <span><FaUser /> {log.responsibleStaff}</span>}
              </div>
              <div className="item-used">
                <FaTag /> Used: {log.itemUsed}
              </div>
              {log.description && <p className="description">Description: {log.description}</p>}
              {log.tags && log.tags.length > 0 && (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem'}}>
                      {log.tags.map(tag => <span key={tag} style={{background: '#eee', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem'}}>{tag}</span>)}
                  </div>
              )}
              <div className="actions">
                {/* <Button variant="secondary" size="sm" onClick={() => handleOpenModal(log)}><FaEdit /></Button> */}
                <Button variant="danger" size="sm" onClick={() => handleDeleteLog(log._id)}><FaTrash /></Button>
              </div>
            </UpcyclingLogCard>
          ))
        ) : (
          <p>No upcycling logs found. Add a new log or adjust your filters.</p>
        )}
      </UpcyclingLogGrid>

      {isModalOpen && (
        <UpcyclingLogModal
          restaurantId={restaurantId}
          logToEdit={editingLog}
          onClose={handleCloseModal}
          onSave={handleSaveLog}
        />
      )}
    </UpcyclingManagementContainer>
  );
};

export default UpcyclingLogManagement;