"use client";
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEye, FaFileInvoiceDollar } from 'react-icons/fa';

// Component Imports
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import CreateSaleModal from './CreateSalesModal';
import ViewSaleModal from './ViewSalesModal';

// Hook Imports
import { useSales } from '../../hooks/useSales'; 
import { useInventory } from '../../hooks/useInventory';
import { useNotifications } from '../../contexts/NotificationContext';

// --- STYLED COMPONENTS ---
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
  color: ${(props) => props.theme.colors?.heading || '#1a202c'};
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
  .icon {
    font-size: 3rem;
    opacity: 0.3;
    margin-bottom: 1rem;
  }
`;

// --- Sales Table Sub-component ---
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
                    <Th>Actions</Th>
                </tr>
            </thead>
            <tbody>
                {sales.map(sale => (
                    <tr key={sale._id}>
                        <Td>#{sale.receiptNumber}</Td>
                        <Td>{sale.customerName || 'N/A'}</Td>
                        <Td>{new Date(sale.createdAt).toLocaleDateString()}</Td>
                        <Td>{sale.items.length}</Td>
                        <Td>${sale.totalAmount.toFixed(2)}</Td>
                        <Td>
                            <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(sale)}><FaEye /></Button>
                        </Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    </TableWrapper>
);

// --- MAIN SALES COMPONENT ---
const Sales = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [viewingSale, setViewingSale] = useState(null);
    const { addNotification } = useNotifications();

    // Mock hooks - replace with your actual data-fetching hooks
    const { sales, loading: salesLoading, error: salesError, createSale } = useSales() || {
        sales: [
            { _id: 'sale1', receiptNumber: 'S-001', customerName: 'John Doe', createdAt: new Date(), items: [ { name: 'Wireless Mouse', quantity: 2, price: 25.00 } ], totalAmount: 50.00 },
            { _id: 'sale2', receiptNumber: 'S-002', customerName: 'Jane Smith', createdAt: new Date(), items: [ { name: 'Laptop Pro', quantity: 1, price: 1200.00 }, { name: 'USB-C Hub', quantity: 1, price: 45.00 } ], totalAmount: 1245.00 },
        ],
        salesLoading: false,
        salesError: null,
        createSale: async (data) => { console.log("Saving Sale:", data); return { success: true }; },
    };
    const { inventory, refreshData: refreshInventory } = useInventory() || {
        inventory: [
             { _id: 'item1', name: 'Laptop Pro', sku: 'LP-123', quantity: 15, price: 1200.00 },
             { _id: 'item2', name: 'Wireless Mouse', sku: 'MS-456', quantity: 50, price: 25.00 },
             { _id: 'item3', name: 'USB-C Hub', sku: 'HUB-789', quantity: 30, price: 45.00 },
             { _id: 'item4', name: 'Mechanical Keyboard', sku: 'KB-012', quantity: 0, price: 150.00 }, // Out of stock item
        ],
        refreshInventory: () => console.log("Refreshing inventory data..."),
    };

    const handleSaveSale = async (saleData) => {
        const result = await createSale(saleData);
        if (result.success) {
            setIsCreating(false);
            addNotification({ type: 'success', title: 'Sale Recorded', message: 'The sale has been saved and inventory updated.' });
            // This is the most important part: refresh inventory after a sale
            refreshInventory();
            // Your useSales hook should also auto-refresh its own list
        } else {
            addNotification({ type: 'error', title: 'Save Failed', message: result.message || 'Could not record the sale.' });
        }
    };

    if (salesError) return <SalesContainer>Error: {salesError.message}</SalesContainer>;

    return (
        <SalesContainer>
            <SalesHeader>
                <PageTitle>Sales Receipts</PageTitle>
                <Button variant="primary" onClick={() => setIsCreating(true)}>
                    <FaPlus /> Record New Sale
                </Button>
            </SalesHeader>

            {salesLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}><LoadingSpinner /></div>
            ) : sales.length === 0 ? (
                <EmptyState>
                    <div className="icon"><FaFileInvoiceDollar /></div>
                    <h3>No Sales Recorded Yet</h3>
                    <p>Click "Record New Sale" to get started.</p>
                </EmptyState>
            ) : (
                <SalesTable sales={sales} onView={setViewingSale} />
            )}

            {isCreating && (
                <CreateSaleModal
                    inventoryItems={inventory}
                    onClose={() => setIsCreating(false)}
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