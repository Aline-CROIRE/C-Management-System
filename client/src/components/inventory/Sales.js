"use client";
import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEye, FaFileInvoiceDollar, FaTrash, FaPrint, FaRedo, FaEllipsisV } from 'react-icons/fa';

import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import CreateSaleModal from './CreateSaleModal';
import ViewSaleModal from './ViewSaleModal';
import { useSales } from '../../hooks/useSales'; 
import { useInventory } from '../../hooks/useInventory';
import { salesAPI } from '../../services/api';
import toast from 'react-hot-toast';

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
const DropdownMenu = styled.div` position: absolute; right: 0; background: white; border-radius: 8px; box-shadow: ${(props) => props.theme.shadows.lg}; z-index: 10; overflow: hidden;`;
const DropdownItem = styled(Button)` width: 100%; justify-content: flex-start;`;

const SalesTable = ({ sales, onView, onDelete, onDuplicate }) => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [printLoadingId, setPrintLoadingId] = useState(null);

    const handlePrint = async (saleId, receiptNumber) => {
        setPrintLoadingId(saleId);
        toast.loading('Generating Receipt...');
        try {
            const response = await salesAPI.generatePDF(saleId);
            const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt-${receiptNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success('Receipt Downloaded!');
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Failed to generate receipt.');
        } finally {
            setPrintLoadingId(null);
        }
    };

    return (
        <TableWrapper>
            <Table>
                <thead>
                    <tr>
                        <Th>Receipt #</Th>
                        <Th>Customer</Th>
                        <Th>Date</Th>
                        <Th>Items</Th>
                        <Th>Total Amount</Th>
                        <Th>Actions</Th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        <tr key={sale._id}>
                            <Td>#{sale.receiptNumber}</Td>
                            <Td>{sale.customerName || 'Walk-in Customer'}</Td>
                            <Td>{new Date(sale.createdAt).toLocaleDateString()}</Td>
                            <Td>{sale.items.length}</Td>
                            <Td>Rwf {(sale.totalAmount || 0).toLocaleString()}</Td>
                            <Td style={{display: 'flex', gap: '0.5rem'}}>
                                <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(sale)}><FaEye /></Button>
                                <div style={{position: 'relative'}}>
                                    <Button variant="ghost" size="sm" iconOnly onClick={() => setActiveDropdown(sale._id === activeDropdown ? null : sale._id)}><FaEllipsisV/></Button>
                                    {activeDropdown === sale._id && (
                                        <DropdownMenu onMouseLeave={() => setActiveDropdown(null)}>
                                            <DropdownItem variant="ghost" onClick={() => handlePrint(sale._id, sale.receiptNumber)} disabled={printLoadingId === sale._id}><FaPrint/> {printLoadingId === sale._id ? 'Printing...': 'Print'}</DropdownItem>
                                            <DropdownItem variant="ghost" onClick={() => onDuplicate(sale)}><FaRedo/> Duplicate</DropdownItem>
                                            <DropdownItem variant="ghost" onClick={() => onDelete(sale._id)} style={{color: '#c53030'}}><FaTrash/> Delete</DropdownItem>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </TableWrapper>
    )
};

const Sales = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [viewingSale, setViewingSale] = useState(null);
    const [saleToDuplicate, setSaleToDuplicate] = useState(null);

    const { sales, loading: salesLoading, error: salesError, createSale, deleteSale } = useSales();
    const { inventory, refetch: refetchInventory } = useInventory();

    const stats = useMemo(() => {
        if (!sales) return { totalRevenue: 0, salesCount: 0 };
        return sales.reduce((acc, sale) => {
            acc.totalRevenue += sale.totalAmount;
            acc.salesCount += 1;
            return acc;
        }, { totalRevenue: 0, salesCount: 0 });
    }, [sales]);

    const handleSaveSale = async (saleData) => {
        try {
            await createSale(saleData);
            setIsCreating(false);
            setSaleToDuplicate(null);
            refetchInventory();
        } catch(error) {
            // Error toast is handled by hook
        }
    };

    const handleDeleteSale = async (saleId) => {
        if (window.confirm("Are you sure you want to delete this sale? This will restock the sold items.")) {
            try {
                await deleteSale(saleId);
                toast.success("Sale deleted successfully.");
                refetchInventory();
            } catch (err) {
                toast.error(err.message || "Failed to delete sale.");
            }
        }
    };

    const handleDuplicateSale = (sale) => {
        setSaleToDuplicate(sale);
        setIsCreating(true);
    };

    if (salesError) return <SalesContainer>Error: {salesError}</SalesContainer>;

    return (
        <SalesContainer>
            <SalesHeader>
                <PageTitle>Sales Management</PageTitle>
                <Button variant="primary" onClick={() => setIsCreating(true)}>
                    <FaPlus style={{marginRight: '0.5rem'}}/> Record New Sale
                </Button>
            </SalesHeader>

            <StatsGrid>
                <StatCard>
                    <StatValue>Rwf {stats.totalRevenue.toLocaleString()}</StatValue>
                    <StatLabel>Total Revenue</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue>{stats.salesCount.toLocaleString()}</StatValue>
                    <StatLabel>Total Sales Transactions</StatLabel>
                </StatCard>
            </StatsGrid>

            {salesLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}><LoadingSpinner /></div>
            ) : sales.length === 0 ? (
                <EmptyState>
                    <div className="icon"><FaFileInvoiceDollar /></div>
                    <h3>No Sales Recorded Yet</h3>
                    <p>Click "Record New Sale" to get started.</p>
                </EmptyState>
            ) : (
                <SalesTable 
                    sales={sales} 
                    onView={setViewingSale} 
                    onDelete={handleDeleteSale}
                    onDuplicate={handleDuplicateSale}
                />
            )}

            {isCreating && (
                <CreateSaleModal
                    inventoryItems={inventory}
                    saleToDuplicate={saleToDuplicate}
                    onClose={() => { setIsCreating(false); setSaleToDuplicate(null); }}
                    onSave={handleSaveSale}
                    loading={salesLoading}
                />
            )}

            {viewingSale && (
                <ViewSaleModal
                    sale={viewingSale}
                    onClose={() => setViewingSale(null)}
                />
            )}
        </SalesContainer>
    );
};

export default Sales;