"use client";

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus } from 'react-icons/fa';

import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import Button from '../common/Button';
import PurchaseOrderForm from './PurchaseOrderForm';
import POTable from './POTable';
import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal';
import ReceivePOModal from './ReceivePOModal';
import toast from 'react-hot-toast';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

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

const PurchaseOrders = ({ inventoryData, suppliersData, categoriesData, isDataLoading, createSupplier, createCategory, onAction }) => {
  const [filters, setFilters] = useState({ page: 1, limit: 10, sort: 'orderDate', order: 'desc' });
  const { purchaseOrders, pagination, loading: poLoading, error, createPO, updatePOStatus, deletePO } = usePurchaseOrders(filters);
  
  const [modalState, setModalState] = useState({ view: false, create: false, receive: false });
  const [selectedPO, setSelectedPO] = useState(null);

  const handleOpenModal = (modal, po = null) => {
    setSelectedPO(po);
    setModalState({ view: false, create: false, receive: false, [modal]: true });
  };

  const handleCloseModals = () => {
    setSelectedPO(null);
    setModalState({ view: false, create: false, receive: false });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (newSort, newOrder) => {
    setFilters(prev => ({ ...prev, sort: newSort, order: newOrder, page: 1 }));
  };
  
  const handleSavePO = async (poData) => {
    try {
        await createPO(poData);
        handleCloseModals();
        toast.success("Purchase Order created successfully!");
        if(onAction) onAction();
    } catch(err) {
        toast.error(err.message || "Failed to create PO.");
    }
  };

  const handleUpdateStatus = async (poId, status, receivedItemsData = null) => {
    try {
        await updatePOStatus(poId, status, receivedItemsData);
        handleCloseModals();
        toast.success(`PO status updated to ${status}.`);
        if (status === 'Completed' && onAction) {
            onAction();
        }
    } catch(err) {
        toast.error(err.message || "Failed to update status.");
    }
  };

  const handleReorder = (poToDuplicate) => {
    handleCloseModals();
    handleOpenModal('create', poToDuplicate);
  };
  
  const handleDelete = async (poId) => {
    if (window.confirm("Are you sure you want to delete this PO? This action cannot be undone.")) {
        try {
            await deletePO(poId);
            handleCloseModals();
            toast.success("Purchase Order deleted.");
        } catch (err) {
            toast.error(err.message || "Failed to delete PO.");
        }
    }
  };

  const isLoading = isDataLoading || poLoading;

  if (error) return <POContainer><div>Error fetching POs: {error}</div></POContainer>;

  return (
    <POContainer>
      <POHeader>
        <PageTitle>Purchase Orders</PageTitle>
        <Button variant="primary" onClick={() => handleOpenModal('create')} disabled={isLoading}>
          <FaPlus style={{marginRight: '0.5rem'}} /> Create PO
        </Button>
      </POHeader>
      
      <POTable
        data={purchaseOrders}
        loading={isLoading}
        pagination={pagination}
        onView={(po) => handleOpenModal('view', po)}
        onReorder={handleReorder}
        onDelete={handleDelete}
        onUpdateStatus={handleUpdateStatus}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        currentSort={filters}
      />
      
      {modalState.create && (
        <PurchaseOrderForm
          poToDuplicate={selectedPO}
          inventoryItems={inventoryData || []}
          suppliers={suppliersData || []}
          categories={categoriesData || []}
          createSupplier={createSupplier}
          createCategory={createCategory}
          onClose={handleCloseModals}
          onSave={handleSavePO}
          loading={poLoading}
        />
      )}

      {modalState.view && selectedPO && (
        <PurchaseOrderDetailsModal
            order={selectedPO}
            onClose={handleCloseModals}
            onReceive={() => handleOpenModal('receive', selectedPO)}
            onCancel={(poId) => handleUpdateStatus(poId, 'Cancelled')}
            onDelete={handleDelete}
            onMarkAsOrdered={(poId) => handleUpdateStatus(poId, 'Ordered')}
            onReorder={handleReorder}
        />
      )}

      {modalState.receive && selectedPO && (
        <ReceivePOModal
          order={selectedPO}
          onClose={handleCloseModals}
          onConfirm={(receivedData) => handleUpdateStatus(selectedPO._id, 'Completed', receivedData)}
          loading={poLoading}
        />
      )}
    </POContainer>
  );
};

export default PurchaseOrders;

