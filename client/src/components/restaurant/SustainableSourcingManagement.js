// client/src/components/restaurant/SustainableSourcingManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSync, FaTruckMoving, FaCertificate, FaLeaf, FaCalendarAlt } from 'react-icons/fa';
import { restaurantAPI, supplierAPI } from '../../services/api'; // Import supplierAPI for dropdown
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

// Modals
import SourcingLogModal from './modals/SourcingLogModal'; // Will create this next

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

const SourcingManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const SourcingLogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const SourcingLogCard = styled(Card)`
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
    background: ${props => props.$isSustainable ? props.theme.colors?.success : props.theme.colors?.info};
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
  .sourcing-details {
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.medium};
    color: ${(props) => props.theme.colors?.text};
    margin: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .certification-badge {
    background: ${(props) => props.theme.colors?.accentLight};
    color: ${(props) => props.theme.colors?.accentDark};
    padding: 0.2rem 0.5rem;
    border-radius: ${(props) => props.theme.borderRadius?.sm};
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: ${(props) => props.theme.spacing?.xs || "0.25rem"};
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

const SustainableSourcingManagement = ({ restaurantId }) => {
  const [sourcingLogs, setSourcingLogs] = useState([]);
  const [suppliers, setSuppliers] = useState([]); // For filter/modal dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterCertified, setFilterCertified] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchSourcingData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        supplier: filterSupplier,
        isCertified: filterCertified === 'true' ? true : (filterCertified === 'false' ? false : undefined),
        search: debouncedSearchQuery,
      };
      const [logsRes, suppliersRes] = await Promise.all([
        restaurantAPI.getSustainableSourcingLogs(restaurantId, params),
        supplierAPI.getAll() // Assuming this fetches all suppliers
      ]);

      if (logsRes?.success) {
        setSourcingLogs(logsRes.data);
      } else {
        throw new Error(logsRes?.message || 'Failed to fetch sourcing logs.');
      }

      if (suppliersRes?.success) {
        setSuppliers(suppliersRes.data);
      } else {
        // Fallback for supplier list if it fails
        console.warn("Failed to fetch supplier list for sourcing management.");
        setSuppliers([]);
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching sourcing data.');
      toast.error(err.message || 'An error occurred fetching sourcing data.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterSupplier, filterCertified, debouncedSearchQuery]);

  useEffect(() => {
    fetchSourcingData();
  }, [fetchSourcingData]);

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
        // await restaurantAPI.updateSustainableSourcingLog(restaurantId, editingLog._id, logData);
        toast.error("Updating sourcing logs is not yet implemented in API."); // Placeholder
      } else {
        await restaurantAPI.logSustainableSourcing(restaurantId, logData);
        toast.success('Sourcing log added successfully!');
      }
      fetchSourcingData();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save sourcing log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this sourcing log?')) {
      try {
        // await restaurantAPI.deleteSustainableSourcingLog(restaurantId, logId);
        toast.error("Deleting sourcing logs is not yet implemented in API."); // Placeholder
        fetchSourcingData();
      } catch (err) {
        toast.error(err.message || 'Failed to delete sourcing log.');
      }
    }
  };

  const uniqueCertifications = useMemo(() => {
    const certs = [];
    sourcingLogs.forEach(log => {
      if (log.certifications && Array.isArray(log.certifications)) {
        certs.push(...log.certifications);
      }
    });
    return [...new Set(certs)].filter(Boolean);
  }, [sourcingLogs]);


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <SourcingManagementContainer>
      <ActionBar>
        <h3>Sustainable Sourcing Logs</h3>
        <FilterGroup>
            <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                title="Filter by Supplier"
            >
                <option value="">All Suppliers</option>
                {suppliers.map(sup => <option key={sup._id} value={sup._id}>{sup.name}</option>)}
            </select>
            <select
                value={filterCertified}
                onChange={(e) => setFilterCertified(e.target.value)}
                title="Filter by Certification"
            >
                <option value="">All Certifications</option>
                <option value="true">Certified Only</option>
                <option value="false">Non-Certified</option>
            </select>
            <Button variant="outline" onClick={fetchSourcingData} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Add Sourcing Log</Button>
        </FilterGroup>
      </ActionBar>

      <SourcingLogGrid>
        {sourcingLogs.length > 0 ? (
          sourcingLogs.map((log) => (
            <SourcingLogCard key={log._id} $isSustainable={log.isCertified || log.isLocal}>
              <h4>{log.ingredientName}</h4>
              <div className="log-meta">
                <span><FaCalendarAlt /> {new Date(log.date).toLocaleDateString()}</span>
                {log.supplier && <span><FaTruckMoving /> {log.supplier.name}</span>}
              </div>
              <div className="sourcing-details">
                Quantity: {log.quantity} {log.unit}
                {log.isLocal && <span className="certification-badge">Local</span>}
                {log.isCertified && <span className="certification-badge">Certified</span>}
                {log.certifications && log.certifications.map(cert => (
                    <span key={cert} className="certification-badge">{cert}</span>
                ))}
              </div>
              {log.notes && <p className="details">Notes: {log.notes}</p>}
              <div className="actions">
                {/* <Button variant="secondary" size="sm" onClick={() => handleOpenModal(log)}><FaEdit /></Button> */}
                <Button variant="danger" size="sm" onClick={() => handleDeleteLog(log._id)}><FaTrash /></Button>
              </div>
            </SourcingLogCard>
          ))
        ) : (
          <p>No sourcing logs found. Add a new log or adjust your filters.</p>
        )}
      </SourcingLogGrid>

      {isModalOpen && (
        <SourcingLogModal
          restaurantId={restaurantId}
          logToEdit={editingLog}
          suppliers={suppliers} // Pass suppliers to the modal
          onClose={handleCloseModal}
          onSave={handleSaveLog}
        />
      )}
    </SourcingManagementContainer>
  );
};

export default SustainableSourcingManagement;