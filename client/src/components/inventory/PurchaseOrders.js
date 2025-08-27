"use client";

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEye, FaRedo, FaTimes, FaPrint } from 'react-icons/fa';

// Local Hooks
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useNotifications } from '../../contexts/NotificationContext';

// Child Components
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import PurchaseOrderForm from './PurchaseOrderForm';

// --- Styled Components ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;
const POContainer = styled.div` padding: 1.5rem; animation: ${fadeIn} 0.5s ease-in-out; `;
const POHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; `;
const PageTitle = styled.h2` margin: 0; font-size: 1.75rem; color: ${(props) => props.theme.colors?.heading || '#1a202c'};`;
const TableWrapper = styled.div` background: #fff; border-radius: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; `;
const Table = styled.table` width: 100%; border-collapse: collapse; min-width: 800px; `;
const Th = styled.th` padding: 1rem 1.5rem; text-align: left; font-size: 0.8rem; font-weight: 600; color: #4a5568; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;`;
const Td = styled.td` padding: 1rem 1.5rem; font-size: 0.9rem; color: #2d3748; vertical-align: middle; border-bottom: 1px solid #e2e8f0; `;
const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;
  background-color: ${({ status }) => { if (status === 'Completed') return '#c6f6d5'; if (status === 'Pending') return '#feebc8'; if (status === 'Cancelled') return '#fed7d7'; return '#e2e8f0'; }};
  color: ${({ status }) => { if (status === 'Completed') return '#2f855a'; if (status === 'Pending') return '#975a16'; if (status === 'Cancelled') return '#c53030'; return '#4a5568'; }};
`;
const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1010; display: flex; align-items: center; justify-content: center; animation: ${fadeIn} 0.3s; `;
const ModalContent = styled.div` background: white; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 800px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: ${slideUp} 0.4s; max-height: 90vh; display: flex; flex-direction: column; `;
const ModalHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h2 { margin: 0; font-size: 1.25rem; } `;
const ModalBody = styled.div` flex-grow: 1; overflow-y: auto; `;
const ModalFooter = styled.div` padding-top: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; `;
const InfoGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; `;
const InfoItem = styled.div` strong { display: block; color: #718096; font-size: 0.8rem; margin-bottom: 0.25rem; text-transform: uppercase; } span { font-size: 1rem; }`;

// --- Reusable Child Components for this Page ---

// --- THIS IS THE CORRECTED POTable COMPONENT ---
const POTable = ({ data, loading, onView }) => {
    if (loading) return <div style={{padding: '4rem', textAlign: 'center'}}><LoadingSpinner /></div>;
    if (!data || data.length === 0) return <div style={{padding: '4rem', textAlign: 'center'}}>No Purchase Orders found.</div>;
    
    return (
        <TableWrapper>
            <Table>
                {/* 1. Add the "Items" column header */}
                <thead><tr><Th>Order #</Th><Th>Supplier</Th><Th>Items</Th><Th>Total</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                <tbody>
                    {data.map(po => (
                        <tr key={po._id}>
                            <Td>#{po.orderNumber}</Td>
                            <Td>{po.supplier?.name || 'N/A'}</Td>

                            {/* 2. Map over the po.items array to display the names */}
                            <Td>
                                {po.items && po.items.length > 0
                                    // Join the item names with a comma
                                    ? po.items.map(i => i.name).join(', ').substring(0, 50) + (po.items.map(i => i.name).join(', ').length > 50 ? '...' : '')
                                    : 'No items'
                                }
                            </Td>

                            <Td>RWF {(po.totalAmount || 0).toLocaleString()}</Td>
                            <Td><StatusBadge status={po.status}>{po.status}</StatusBadge></Td>
                            <Td>
                                <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(po)}><FaEye /></Button>
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </TableWrapper>
    );
};

const ViewPOModal = ({ po, onClose, onReorder, onUpdateStatus }) => {
    if (!po) return null;
    const modalContent = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Purchase Order Details: #{po.orderNumber}</h2>
                    <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    <InfoGrid>
                        <InfoItem><strong>Supplier</strong><span>{po.supplier?.name || 'N/A'}</span></InfoItem>
                        <InfoItem><strong>Order Date</strong><span>{new Date(po.orderDate).toLocaleDateString()}</span></InfoItem>
                        <InfoItem><strong>Status</strong><span><StatusBadge status={po.status}>{po.status}</StatusBadge></span></InfoItem>
                        <InfoItem><strong>Total Amount</strong><span>RWF {po.totalAmount.toLocaleString()}</span></InfoItem>
                    </InfoGrid>
                    <h4>Items Ordered</h4>
                    <Table>
                        <thead><tr><th>Item Name</th><th>SKU</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                        <tbody>
                            {po.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.sku}</td>
                                    <td>{item.quantity}</td>
                                    <td>RWF {item.unitPrice.toLocaleString()}</td>
                                    <td>RWF {(item.quantity * item.unitPrice).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {po.notes && <div style={{marginTop: '1.5rem'}}><h4>Notes:</h4><p>{po.notes}</p></div>}
                </ModalBody>
                <ModalFooter>
                    <div>
                        <Button variant="outline" style={{marginRight: '1rem'}}><FaPrint /> Print</Button>
                        <Button variant="secondary" onClick={() => onReorder(po)}><FaRedo /> Re-order</Button>
                    </div>
                    <div>
                        {po.status === 'Pending' && (
                            <>
                                <Button variant="success" onClick={() => onUpdateStatus(po._id, 'Completed')}>Mark as Received</Button>
                                <Button variant="danger" onClick={() => onUpdateStatus(po._id, 'Cancelled')} style={{marginLeft: '1rem'}}>Cancel PO</Button>
                            </>
                        )}
                         {po.status === 'Ordered' && (
                            <Button variant="success" onClick={() => onUpdateStatus(po._id, 'Completed')}>Mark as Received</Button>
                        )}
                    </div>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
    return ReactDOM.createPortal(modalContent, document.body);
};


const PurchaseOrders = ({ inventoryData, suppliersData, categoriesData, isDataLoading, createSupplier, createCategory, onAction }) => {
  const { showToast } = useNotifications();
  const { purchaseOrders, loading: poLoading, error, createPO, updatePOStatus } = usePurchaseOrders();
  const [isCreating, setIsCreating] = useState(false);
  const [viewingPO, setViewingPO] = useState(null);

  const handleSave = async (poData) => {
    const success = await createPO(poData);
    if (success) {
      setIsCreating(false);
      showToast("Purchase Order created successfully!", "success");
      onAction();
    }
  };

  const handleUpdateStatus = async (poId, status) => {
    const success = await updatePOStatus(poId, status);
    if (success) {
      setViewingPO(null);
      showToast(`PO status updated to ${status}.`, "info");
      if (status === 'Completed') {
        onAction();
      }
    }
  };
  
  const handleReorder = async (po) => {
    const reorderPayload = {
        supplierId: po.supplier._id,
        items: po.items.map(i => ({ item: i.item, name: i.name, sku: i.sku, quantity: i.quantity, unitPrice: i.unitPrice, isNew: false, category: i.category })),
        totalAmount: po.totalAmount,
        notes: `Re-order of PO #${po.orderNumber}`
    };
    const success = await createPO(reorderPayload);
    if (success) {
        setViewingPO(null);
        showToast("Re-order PO created successfully.", "success");
        onAction();
    }
  };

  const isLoading = isDataLoading || poLoading;

  if (error) return <POContainer><div>Error fetching POs: {error}</div></POContainer>;

  return (
    <POContainer>
      <POHeader>
        <PageTitle>Purchase Orders</PageTitle>
        <Button variant="primary" onClick={() => setIsCreating(true)} disabled={isLoading}>
          <FaPlus /> Create PO
        </Button>
      </POHeader>
      
      <POTable data={purchaseOrders} loading={poLoading} onView={setViewingPO} />
      
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
            onReorder={handleReorder}
            onUpdateStatus={handleUpdateStatus}
        />
      )}
    </POContainer>
  );
};

export default PurchaseOrders;