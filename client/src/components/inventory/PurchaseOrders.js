"use client";

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEye, FaTimes, FaPrint, FaRedo } from 'react-icons/fa';

import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import PurchaseOrderForm from './PurchaseOrderForm';
import POTable from './POTable';
import toast from 'react-hot-toast';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;

const POContainer = styled.div`
  padding: 1.5rem;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const POHeader = styled.div`
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

const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1010; display: flex; align-items: center; justify-content: center; animation: ${fadeIn} 0.3s; padding: 1rem; `;
const ModalContent = styled.div` background: white; border-radius: 1rem; width: 90%; max-width: 800px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: ${slideUp} 0.4s; max-height: 90vh; display: flex; flex-direction: column; `;
const ModalHeader = styled.div` padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; h2 { margin: 0; font-size: 1.25rem; } `;
const ModalBody = styled.div` flex-grow: 1; overflow-y: auto; padding: 1.5rem; `;
const ModalFooter = styled.div` padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; `;
const InfoGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; `;
const InfoItem = styled.div` strong { display: block; color: #718096; font-size: 0.8rem; margin-bottom: 0.25rem; text-transform: uppercase; } span { font-size: 1rem; }`;
const TableWrapper = styled.div` background: #fff; border-radius: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; `;
const Table = styled.table` width: 100%; border-collapse: collapse;`;
const Th = styled.th` padding: 1rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #4a5568; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;`;
const Td = styled.td` padding: 1rem 1.5rem; font-size: 0.9rem; color: #2d3748; vertical-align: middle; border-bottom: 1px solid #e2e8f0;`;
const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;
  background-color: ${({ status }) => {
    if (status === 'Completed') return '#c6f6d5';
    if (status === 'Pending') return '#feebc8';
    if (status === 'Cancelled') return '#fed7d7';
    return '#e2e8f0';
  }};
  color: ${({ status }) => {
    if (status === 'Completed') return '#2f855a';
    if (status === 'Pending') return '#975a16';
    if (status === 'Cancelled') return '#c53030';
    return '#4a5568';
  }};
`;

const ViewPOModal = ({ po, onClose, onUpdateStatus }) => {
    if (!po) return null;
    const modalContent = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Details for PO #{po.orderNumber}</h2>
                    <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    <InfoGrid>
                        <InfoItem><strong>Supplier</strong><span>{po.supplier?.name || 'N/A'}</span></InfoItem>
                        <InfoItem><strong>Order Date</strong><span>{new Date(po.orderDate).toLocaleDateString()}</span></InfoItem>
                        <InfoItem><strong>Status</strong><span><StatusBadge status={po.status}>{po.status}</StatusBadge></span></InfoItem>
                        <InfoItem><strong>Total Amount</strong><span>RWF {po.totalAmount.toLocaleString()}</span></InfoItem>
                    </InfoGrid>
                    <h4>Items Ordered ({po.items.length})</h4>
                    <TableWrapper>
                        <Table>
                            <thead><tr><Th>Item Name</Th><Th>SKU</Th><Th>Qty</Th><Th>Price</Th><Th>Subtotal</Th></tr></thead>
                            <tbody>
                                {po.items.map((item, index) => (
                                    <tr key={index}>
                                        <Td>{item.item?.name || 'N/A'}</Td>
                                        <Td>{item.item?.sku || 'N/A'}</Td>
                                        <Td>{item.quantity}</Td>
                                        <Td>RWF {item.unitPrice.toLocaleString()}</Td>
                                        <Td>RWF {(item.quantity * item.unitPrice).toLocaleString()}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </TableWrapper>
                    {po.notes && <div style={{marginTop: '1.5rem'}}><h4>Notes:</h4><p>{po.notes}</p></div>}
                </ModalBody>
                <ModalFooter>
                    <Button variant="outline"><FaPrint /> Print</Button>
                    <div>
                        {po.status === 'Pending' && (
                          <Button variant="success" onClick={() => onUpdateStatus(po._id, 'Completed')}>Mark as Received</Button>
                        )}
                         {['Ordered', 'Shipped'].includes(po.status) && (
                            <Button variant="success" onClick={() => onUpdateStatus(po._id, 'Completed')}>Mark as Received</Button>
                        )}
                        {!['Completed', 'Cancelled'].includes(po.status) && (
                          <Button variant="danger" onClick={() => onUpdateStatus(po._id, 'Cancelled')} style={{marginLeft: '1rem'}}>Cancel PO</Button>
                        )}
                    </div>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
    return ReactDOM.createPortal(modalContent, document.body);
};


const PurchaseOrders = ({ inventoryData, suppliersData, categoriesData, isDataLoading, createSupplier, createCategory, onAction }) => {
  const [filters, setFilters] = useState({ page: 1, limit: 10, sort: 'orderDate', order: 'desc' });
  const { purchaseOrders, pagination, loading: poLoading, error, createPO, updatePOStatus } = usePurchaseOrders(filters);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingPO, setViewingPO] = useState(null);

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (newSort, newOrder) => {
    setFilters(prev => ({ ...prev, sort: newSort, order: newOrder, page: 1 }));
  };
  
  const handleSave = async (poData) => {
    try {
        await createPO(poData);
        setIsCreating(false);
        toast.success("Purchase Order created successfully!");
        if(onAction) onAction();
    } catch(err) {
        // Error toast is handled by hook/interceptor
    }
  };

  const handleUpdateStatus = async (poId, status) => {
    try {
        await updatePOStatus(poId, status);
        setViewingPO(null);
        toast.success(`PO status updated to ${status}.`);
        if (status === 'Completed' && onAction) {
            onAction();
        }
    } catch(err) {
        // Error toast is handled by hook/interceptor
    }
  };

  const isLoading = isDataLoading || poLoading;

  if (error) return <POContainer><div>Error fetching POs: {error}</div></POContainer>;

  return (
    <POContainer>
      <POHeader>
        <PageTitle>Purchase Orders</PageTitle>
        <Button variant="primary" onClick={() => setIsCreating(true)} disabled={isLoading}>
          <FaPlus style={{marginRight: '0.5rem'}} /> Create PO
        </Button>
      </POHeader>
      
      <POTable
        data={purchaseOrders}
        loading={isLoading}
        pagination={pagination}
        onView={setViewingPO}
        onUpdateStatus={handleUpdateStatus}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        currentSort={filters}
      />
      
      {isCreating && (
        <PurchaseOrderForm
          inventoryItems={inventoryData || []}
          suppliers={suppliersData || []}
          categories={categoriesData || []}
          createSupplier={createSupplier}
          createCategory={createCategory}
          onClose={() => setIsCreating(false)}
          onSave={handleSave}
          loading={poLoading}
        />
      )}

      {viewingPO && (
        <ViewPOModal
            po={viewingPO}
            onClose={() => setViewingPO(null)}
            onUpdateStatus={handleUpdateStatus}
        />
      )}
    </POContainer>
  );
};

export default PurchaseOrders;