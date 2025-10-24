
// client/src/components/restaurant/TableManagement.js
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaQrcode, FaTable, FaDownload, FaSync, FaSearch } from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

import TableModal from './modals/TableModal';

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
  }
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 450px;

  @media (max-width: 480px) {
    min-width: unset;
    max-width: unset;
    width: 100%;
  }
`;
const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors.textSecondary};
  z-index: 2;
  pointer-events: none;
`;
const SearchInput = styled(Input)`
  padding-left: 3rem;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  border: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: 480px) {
    padding: 0.85rem 1rem;
    padding-left: 2.85rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  flex-wrap: wrap;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch;
    button {
      flex-grow: 1;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  }
`;

const TableManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const TableGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const TableCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  text-align: center;
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
        switch (props.$status) {
            case 'occupied': return props.theme.colors?.danger;
            case 'reserved': return props.theme.colors?.warning;
            case 'ordering': return props.theme.colors?.info;
            case 'cleaning': return props.theme.colors?.primaryDark;
            default: return props.theme.colors?.success; // vacant
        }
    }};
  }

  .table-icon {
    font-size: 2.5rem;
    color: ${(props) => props.theme.colors?.primary};
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
  h4 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    color: ${(props) => props.theme.colors?.heading};
  }
  .capacity {
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#666"};
  }
  .status {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${props => props.$status === 'occupied' ? props.theme.colors?.danger : (props.$status === 'reserved' ? props.theme.colors?.warning : (props.$status === 'ordering' ? props.theme.colors?.info : props.theme.colors?.success))};
    margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    text-transform: capitalize;
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const QrCodeDisplay = styled.div`
  margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
  display: flex;
  flex-direction: column;
  align-items: center;
  img {
    max-width: 150px;
    height: auto;
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.borderRadius.sm};
  }
  button {
    margin-top: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  }
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;

const TableManagement = ({ restaurantId }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: filterStatus, search: debouncedSearchQuery };
      const response = await restaurantAPI.getTables(restaurantId, params);
      if (response?.success) {
        setTables(response.data);
      } else {
        setError(response?.message || 'Failed to fetch tables.');
        toast.error(response?.message || 'Failed to fetch tables.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching tables.');
      toast.error(err.message || 'An error occurred fetching tables.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterStatus, debouncedSearchQuery]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleOpenModal = (table = null) => {
    setEditingTable(table);
    setIsModalOpen(true);
    setQrCodeDataUrl(null);
  };

  const handleCloseModal = () => {
    setEditingTable(null);
    setIsModalOpen(false);
    setQrCodeDataUrl(null);
  };

  const handleSaveTable = async (tableData) => {
    try {
      if (!tableData.tableNumber || tableData.tableNumber < 1) {
        toast.error('Please provide a valid table number.');
        return;
      }
      if (!tableData.capacity || tableData.capacity < 1) {
        toast.error('Please provide a valid table capacity.');
        return;
      }

      if (editingTable) {
        await restaurantAPI.updateTable(restaurantId, editingTable._id, tableData);
        toast.success('Table updated successfully!');
      } else {
        await restaurantAPI.createTable(restaurantId, tableData);
        toast.success('Table added successfully!');
      }
      fetchTables();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save table.');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (window.confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      try {
        await restaurantAPI.deleteTable(restaurantId, tableId);
        toast.success('Table deleted successfully!');
        fetchTables();
      } catch (err) {
        toast.error(err.message || 'Failed to delete table.');
      }
    }
  };

  const handleChangeTableStatus = async (tableId, newStatus) => {
    try {
      await restaurantAPI.updateTable(restaurantId, tableId, { status: newStatus });
      toast.success(`Table status updated to ${newStatus.replace('_', ' ')}!`);
      fetchTables();
    } catch (err) {
      toast.error(err.message || 'Failed to update table status.');
    }
  };

  const handleGenerateQrCode = async (table) => {
    setGeneratingQr(true);
    setQrCodeDataUrl(null);
    setEditingTable(table);
    try {
      const response = await restaurantAPI.generateQrCodeLink(restaurantId, table._id);
      if (response?.success) {
        setQrCodeDataUrl(response.qrCodeDataUrl);
        toast.success('QR Code generated!');
      } else {
        toast.error(response?.message || 'Failed to generate QR Code.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred generating QR Code.');
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleDownloadQrCode = (tableNumber) => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `table-${tableNumber}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR Code downloaded!');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <TableManagementContainer>
      <ActionBar>
        <h3>Tables</h3>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search tables by number or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <ActionButtons>
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white'}}
            >
                <option value="">All Statuses</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="ordering">Ordering</option>
                <option value="cleaning">Cleaning</option>
            </select>
            <Button variant="outline" onClick={fetchTables} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Add New Table</Button>
        </ActionButtons>
      </ActionBar>

      <TableGrid>
        {tables.length > 0 ? (
          tables.map((table) => (
            <TableCard key={table._id} $status={table.status}>
              <FaTable className="table-icon" />
              <h4>Table {table.tableNumber}</h4>
              <div className="capacity">Capacity: {table.capacity}</div>
              <div className="status">Status: {table.status.replace('_', ' ')}</div>
              <div className="actions">
                <Button variant="secondary" size="sm" onClick={() => handleOpenModal(table)}><FaEdit /></Button>
                <select value={table.status} onChange={(e) => handleChangeTableStatus(table._id, e.target.value)} style={{padding: '0.4rem 0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8rem', minWidth: '80px'}}>
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="ordering">Ordering</option>
                  <option value="cleaning">Cleaning</option>
                </select>
                <Button variant="info" size="sm" onClick={() => handleGenerateQrCode(table)} disabled={generatingQr} title="Generate QR Code">
                  {generatingQr && editingTable?._id === table._id ? <SpinningFaSync /> : <FaQrcode />}
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteTable(table._id)}><FaTrash /></Button>
              </div>
              {qrCodeDataUrl && editingTable?._id === table._id && (
                <QrCodeDisplay>
                  <img src={qrCodeDataUrl} alt={`QR Code for Table ${table.tableNumber}`} />
                  <Button variant="success" size="sm" onClick={() => handleDownloadQrCode(table.tableNumber)} style={{marginTop: '0.5rem'}}><FaDownload /> Download QR</Button>
                </QrCodeDisplay>
              )}
            </TableCard>
          ))
        ) : (
          <p>No tables available. Add some to get started!</p>
        )}
      </TableGrid>

      {isModalOpen && (
        <TableModal
          restaurantId={restaurantId}
          tableToEdit={editingTable}
          onClose={handleCloseModal}
          onSave={handleSaveTable}
        />
      )}
    </TableManagementContainer>
  );
};

export default TableManagement;
