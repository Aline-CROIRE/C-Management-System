// src/components/sales/Sales.js
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEye, FaFileInvoiceDollar, FaChartLine, FaFilter, FaUndo, FaMoneyBillWave } from 'react-icons/fa';

import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import CreateSaleModal from './CreateSaleModal';
import ViewSaleModal from './ViewSaleModal';
import SalesAnalyticsDashboard from '../inventory/SalesAnalyticsDashboard';
import SalesFilterPanel from '../inventory/SalesFilterPanel';
import { useSales } from '../../hooks/useSales'; 
import { useInventory } from '../../hooks/useInventory';
import { useCustomers } from '../../hooks/useCustomers';
import moment from 'moment'; // Make sure moment is installed

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const SalesContainer = styled.div`
  padding: 1.5rem;
  animation: ${fadeIn} 0.5s ease-in-out;
`;
const SalesHeader = styled.div`
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
const HeaderActions = styled.div` display: flex; gap: 1rem; `;
const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
`;
const StatCard = styled.div`
    background: ${props => props.theme.colors.surface};
    border-radius: ${props => props.theme.borderRadius.lg};
    padding: 1.5rem;
    box-shadow: ${props => props.theme.shadows.sm};
    border: 1px solid ${props => props.theme.colors.border};
`;
const StatValue = styled.div`
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.theme.colors.heading};
    &.debt-color {
        color: ${props => props.theme.colors.error};
    }
`;
const StatLabel = styled.div`
    font-size: 0.875rem;
    color: ${props => props.theme.colors.textSecondary};
    margin-top: 0.25rem;
`;
const TableWrapper = styled.div`
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  overflow: hidden;
`;
const Table = styled.table` width: 100%; border-collapse: collapse; min-width: 800px; `;
const Th = styled.th` padding: 1rem 1.5rem; text-align: left; font-size: 0.8rem; font-weight: 600; color: #4a5568; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;`;
const Td = styled.td` padding: 1rem 1.5rem; font-size: 0.9rem; color: #2d3748; vertical-align: middle; border-bottom: 1px solid #e2e8f0; &:last-child { border-bottom: none; } `;
const EmptyState = styled.div`
  padding: 4rem;
  text-align: center;
  color: #718096;
  .icon { font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; }
`;
const TabContainer = styled.div` display: flex; border-bottom: 2px solid #e2e8f0; margin-bottom: 2rem; `;
const Tab = styled.button` padding: 1rem 1.5rem; border: none; background: transparent; color: ${(props) => (props.active ? props.theme.colors.primary : props.theme.colors.textSecondary)}; border-bottom: 3px solid ${(props) => (props.active ? props.theme.colors.primary : "transparent")}; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.75rem; white-space: nowrap; &:hover { color: ${(props) => props.theme.colors.primary}; } `;
const FilterIndicator = styled.div` display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; background-color: #e6fffa; color: #234e52; border: 1px solid #b2f5ea; border-radius: 0.75rem; margin-bottom: 1.5rem; font-weight: 600;`;

const SalesTable = ({ sales, onView }) => (
    <TableWrapper>
        <Table>
            <thead>
                <tr>
                    <Th>Receipt #</Th>
                    <Th>Customer</Th>
                    <Th>Date</Th>
                    <Th>Items</Th>
                    <Th>Total Amount</Th>
                    <Th>Paid</Th>
                    <Th>Balance</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                </tr>
            </thead>
            <tbody>
                {sales.map(sale => (
                    <tr key={sale._id}>
                        <Td>#{sale.receiptNumber}</Td>
                        <Td>{sale.customer?.name || 'Walk-in Customer'}</Td>
                        <Td>{new Date(sale.createdAt).toLocaleDateString()}</Td>
                        <Td>{sale.items.length}</Td>
                        <Td>Rwf {(sale.totalAmount || 0).toLocaleString()}</Td>
                        <Td>Rwf {(sale.amountPaid || 0).toLocaleString()}</Td>
                        <Td style={{color: sale.paymentStatus !== 'Paid' ? '#c53030' : undefined, fontWeight: sale.paymentStatus !== 'Paid' ? 'bold' : 'normal'}}>
                            Rwf {(sale.totalAmount - (sale.amountPaid || 0)).toLocaleString()}
                        </Td>
                        <Td>{sale.paymentStatus}</Td>
                        <Td>
                            <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(sale)}><FaEye /></Button>
                        </Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    </TableWrapper>
);

const Sales = ({ inventoryData, isDataLoading, onAction }) => {
    const [activeTab, setActiveTab] = useState('transactions');
    const [isCreating, setIsCreating] = useState(false);
    const [viewingSale, setViewingSale] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [filters, setFilters] = useState({});
    
    const [analyticsFilters, setAnalyticsFilters] = useState({
        startDate: moment().subtract(30, 'days').toDate(),
        endDate: moment().toDate(),
    });

    const { sales, loading: salesLoading, error: salesError, createSale, processReturn, refetch: refetchSales } = useSales(filters);
    const { inventory, refetch: refetchInventory } = useInventory();
    const { customers, createCustomer, refetchCustomers } = useCustomers();

    const transactionStats = useMemo(() => {
        if (!sales) return { totalRevenue: 0, salesCount: 0, totalOutstandingBalance: 0 };
        return sales.reduce((acc, sale) => {
            acc.totalRevenue += sale.totalAmount;
            acc.salesCount += 1;
            acc.totalOutstandingBalance += (sale.totalAmount - (sale.amountPaid || 0));
            return acc;
        }, { totalRevenue: 0, salesCount: 0, totalOutstandingBalance: 0 });
    }, [sales]);

    const handleSaveSale = async (saleData) => {
        try {
            await createSale(saleData);
            setIsCreating(false);
            refetchInventory();
            refetchCustomers();
            if(onAction) onAction();
        } catch(error) {
            // Error is handled by hook
        }
    };
    
    const handleReturn = async (saleId, returnedItems) => {
        try {
            await processReturn(saleId, returnedItems);
            setViewingSale(null);
            refetchInventory();
            refetchCustomers();
            if(onAction) onAction();
        } catch(error) {
            // Error is handled by hook
        }
    }

    const handleRecordPaymentSuccess = () => {
        refetchSales(); // Refresh sales to update payment status
        refetchCustomers(); // Refresh customers to update balances
        if(onAction) onAction(); // Trigger overall IMS refresh
    }
    
    const handleApplyFilters = (appliedFilters) => {
        setFilters(appliedFilters);
        if (appliedFilters.startDate || appliedFilters.endDate) {
            setAnalyticsFilters(prev => ({
                ...prev,
                startDate: appliedFilters.startDate ? new Date(appliedFilters.startDate) : prev.startDate,
                endDate: appliedFilters.endDate ? new Date(appliedFilters.endDate) : prev.endDate,
            }));
        }
        setIsFiltering(false);
    };

    const handleClearFilters = () => {
        setFilters({});
        setAnalyticsFilters({
            startDate: moment().subtract(30, 'days').toDate(),
            endDate: moment().toDate(),
        });
        setIsFiltering(false);
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    if (salesError) return <SalesContainer>Error: {salesError}</SalesContainer>;

    const renderContent = () => {
        if (activeTab === 'analytics') {
            return (
                <SalesAnalyticsDashboard 
                    analyticsFilters={analyticsFilters} 
                    setAnalyticsFilters={setAnalyticsFilters} 
                />
            );
        }
        
        if (salesLoading) {
            return <div style={{ padding: '4rem', textAlign: 'center' }}><LoadingSpinner /></div>;
        }
        
        if (sales.length === 0) {
            return (
                <EmptyState>
                    <div className="icon"><FaFileInvoiceDollar /></div>
                    <h3>No Sales Recorded Yet</h3>
                    <p>{activeFilterCount > 0 ? "Try adjusting your filters." : "Click 'Record New Sale' to get started."}</p>
                </EmptyState>
            );
        }
        
        return <SalesTable sales={sales} onView={setViewingSale} />;
    };

    return (
        <SalesContainer>
            <SalesHeader>
                <PageTitle>Sales Management</PageTitle>
                <HeaderActions>
                    <Button variant="secondary" onClick={() => setIsFiltering(p => !p)}>
                        <FaFilter style={{marginRight: '0.5rem'}}/> Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                    </Button>
                    <Button variant="primary" onClick={() => setIsCreating(true)}>
                        <FaPlus style={{marginRight: '0.5rem'}}/> Record New Sale
                    </Button>
                </HeaderActions>
            </SalesHeader>
            
            {activeFilterCount > 0 && (
                 <FilterIndicator>
                    <span>Showing filtered results for transactions</span>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}><FaUndo style={{marginRight: '0.5rem'}}/>Clear Filters</Button>
                </FilterIndicator>
            )}

            <StatsGrid>
                <StatCard>
                    <StatValue>Rwf {transactionStats.totalRevenue.toLocaleString()}</StatValue>
                    <StatLabel>Total Revenue (Transactions Table)</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue>{transactionStats.salesCount.toLocaleString()}</StatValue>
                    <StatLabel>Total Sales Count (Transactions Table)</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue className="debt-color">Rwf {transactionStats.totalOutstandingBalance.toLocaleString()}</StatValue>
                    <StatLabel>Total Outstanding Balance <FaMoneyBillWave style={{color: 'inherit'}}/></StatLabel>
                </StatCard>
            </StatsGrid>
            
            <TabContainer>
                <Tab active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>
                    <FaFileInvoiceDollar/> Transactions
                </Tab>
                <Tab active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
                    <FaChartLine/> Analytics & Reports
                </Tab>
            </TabContainer>

            {renderContent()}
            
            {isFiltering && (
                <SalesFilterPanel
                    customers={customers}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                    onClose={() => setIsFiltering(false)}
                    initialFilters={filters}
                />
            )}

            {isCreating && (
                <CreateSaleModal
                    inventoryItems={inventory}
                    customers={customers}
                    createCustomer={createCustomer}
                    onClose={() => setIsCreating(false)}
                    onSave={handleSaveSale}
                    loading={salesLoading || isDataLoading}
                />
            )}

            {viewingSale && (
                <ViewSaleModal
                    sale={viewingSale}
                    onClose={() => setViewingSale(null)}
                    onReturn={handleReturn}
                    onRecordPaymentSuccess={handleRecordPaymentSuccess}
                />
            )}
        </SalesContainer>
    );
};

export default Sales;