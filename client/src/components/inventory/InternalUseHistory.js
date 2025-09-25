// src/components/inventory/InternalUseHistory.js
"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaClipboardList, FaFilter, FaCalendarAlt, FaDollarSign, FaBoxes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import InternalUseModal from './InternalUseModal';
import { useInternalUse } from '../../hooks/useInternalUse';
import { useInventory } from '../../hooks/useInventory';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const HistoryContainer = styled.div`
  padding: 1.5rem;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  color: ${(props) => props.theme.colors.heading};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 110px;
  .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.heading};
  }
  .label {
    font-size: 0.85rem;
    color: ${(props) => props.theme.colors.textSecondary};
    text-transform: uppercase;
    font-weight: 600;
  }
`;


const FiltersSection = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const TableWrapper = styled.div`
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
`;

const Th = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  border-bottom: 2px solid #e2e8f0;
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  color: #2d3748;
  vertical-align: middle;
  border-bottom: 1px solid #e2e8f0;
  &:last-child { border-bottom: none; }
`;

const EmptyState = styled.div`
  padding: 4rem;
  text-align: center;
  color: #718096;
  .icon { font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; }
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
`;
const PaginationControls = styled.div` display: flex; gap: 0.5rem; `;


const InternalUseHistory = ({ onAction, openModalInitially, setOpenModalInitially }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemForUse, setSelectedItemForUse] = useState(null);
    const [currentFilters, setCurrentFilters] = useState({});

    const { 
        internalUses, loading, error, 
        totalValueStats,
        createInternalUse, deleteInternalUse, 
        pagination, setFilters, refetch, refetchTotalValue 
    } = useInternalUse(currentFilters);

    const { inventory: allInventoryItems, loading: inventoryLoading, refreshData: refetchInventory } = useInventory();

    useEffect(() => {
        if (openModalInitially) {
            setSelectedItemForUse(null);
            setIsModalOpen(true);
            setOpenModalInitially(false);
        }
    }, [openModalInitially, setOpenModalInitially]);

    const handleSaveInternalUse = async (useData) => {
        const success = await createInternalUse(useData);
        if (success) {
            setIsModalOpen(false);
            setSelectedItemForUse(null);
            if(onAction) onAction();
            refetchInventory();
        }
    };

    const handleDeleteInternalUse = async (id) => {
        if (window.confirm("Are you sure you want to delete this internal use record? This will restock the item.")) {
            const success = await deleteInternalUse(id);
            if (success) {
                if(onAction) onAction();
                refetchInventory();
            }
        }
    };

    const openCreateModal = () => {
        setSelectedItemForUse(null);
        setIsModalOpen(true);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1, 
        }));
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1,
        }));
    };

    const handleClearFilters = () => {
      setCurrentFilters({});
      setFilters({});
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    if (error) return <HistoryContainer>Error: {error}</HistoryContainer>;

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) || 1 : 1;

    return (
        <HistoryContainer>
            <HistoryHeader>
                <PageTitle>Internal Use History</PageTitle>
                <Button variant="primary" onClick={openCreateModal} disabled={loading || inventoryLoading}>
                    <FaPlus style={{marginRight: '0.5rem'}} /> Record New Use
                </Button>
            </HistoryHeader>

            <StatsGrid>
                <StatCard>
                    <div className="value">{totalValueStats.recordCount?.toLocaleString() || '0'}</div> {/* ADDED optional chaining */}
                    <div className="label">Total Records</div>
                </StatCard>
                <StatCard>
                    <div className="value">{totalValueStats.totalQuantity?.toLocaleString() || '0'}</div> {/* ADDED optional chaining */}
                    <div className="label">Total Quantity Used</div>
                </StatCard>
                <StatCard>
                    <div className="value">Rwf {(totalValueStats.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div> {/* ADDED default 0 */}
                    <div className="label">Total Value Used</div>
                </StatCard>
            </StatsGrid>
            
            <FiltersSection>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaFilter /> Filter History</h3>
                <FilterGrid>
                    <FormGroup>
                        <Label htmlFor="search">Search</Label>
                        <Input
                            id="search"
                            name="search"
                            type="text"
                            placeholder="Item name, SKU, reason..."
                            value={currentFilters.search || ''}
                            onChange={handleFilterChange}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="itemFilter">Item</Label>
                        <Select
                            id="itemFilter"
                            name="item"
                            value={currentFilters.item || ''}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Items</option>
                            {allInventoryItems.map(item => (
                                <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                            ))}
                        </Select>
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="startDate">From Date</Label>
                        <Input
                            id="startDate"
                            name="startDate"
                            type="date"
                            value={currentFilters.startDate ? new Date(currentFilters.startDate).toISOString().split('T')[0] : ''}
                            onChange={handleFilterChange}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="endDate">To Date</Label>
                        <Input
                            id="endDate"
                            name="endDate"
                            type="date"
                            value={currentFilters.endDate ? new Date(currentFilters.endDate).toISOString().split('T')[0] : ''}
                            onChange={handleFilterChange}
                        />
                    </FormGroup>
                    <Button variant="secondary" onClick={handleClearFilters} style={{ gridColumn: 'span 2', maxWidth: '200px' }}>Clear Filters</Button>
                </FilterGrid>
            </FiltersSection>

            {loading && internalUses.length === 0 ? (
                <div style={{padding: '4rem', textAlign: 'center'}}><LoadingSpinner /></div>
            ) : internalUses.length === 0 ? (
                <EmptyState>
                    <div className="icon"><FaClipboardList /></div>
                    <h3>No Internal Use Records Found</h3>
                    <p>Click 'Record New Use' to get started or adjust your filters.</p>
                </EmptyState>
            ) : (
                <TableWrapper>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Date <FaCalendarAlt style={{marginLeft: '0.5rem'}}/></Th>
                                <Th>Item</Th>
                                <Th>SKU</Th>
                                <Th>Reason</Th>
                                <Th>Qty Used</Th>
                                <Th style={{textAlign: 'right'}}>Unit Price</Th>
                                <Th style={{textAlign: 'right'}}>Total Value</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {internalUses.map(record => (
                                <tr key={record._id}>
                                    <Td>{new Date(record.date).toLocaleDateString()}</Td>
                                    <Td>{record.itemName}</Td>
                                    <Td>{record.itemSku}</Td>
                                    <Td>{record.reason}</Td>
                                    <Td>{record.quantity} {record.unit}</Td>
                                    <Td style={{textAlign: 'right'}}>Rwf {(record.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td> {/* ADDED default 0 */}
                                    <Td style={{textAlign: 'right'}}>Rwf {(record.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td> {/* ADDED default 0 */}
                                    <Td style={{display: 'flex', gap: '0.5rem'}}>
                                        <Button size="sm" variant="ghost" iconOnly title="Delete Record" onClick={() => handleDeleteInternalUse(record._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {pagination && (
                      <TableFooter>
                          <span>Page {pagination.page} of {totalPages} ({pagination.total.toLocaleString()} records)</span>
                          <PaginationControls>
                              <Button size="sm" variant="secondary" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}><FaChevronLeft /> Prev</Button>
                              <Button size="sm" variant="secondary" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}>Next <FaChevronRight /></Button>
                          </PaginationControls>
                      </TableFooter>
                    )}
                </TableWrapper>
            )}

            {isModalOpen && (
                <InternalUseModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveInternalUse}
                    loading={loading || inventoryLoading}
                    inventoryItems={allInventoryItems}
                    item={selectedItemForUse}
                />
            )}
        </HistoryContainer>
    );
};

export default InternalUseHistory;