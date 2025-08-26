"use client";
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaTimes, FaEdit, FaTrash, FaEye, FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useSuppliers } from '../../hooks/useSuppliers';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';

// --- Styled Components ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;
const Container = styled.div` padding: 1.5rem; animation: ${fadeIn} 0.5s ease-in-out; `;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; `;
const PageTitle = styled.h2` margin: 0; font-size: 1.75rem; color: ${(props) => props.theme.colors?.heading || '#1a202c'};`;
const TableWrapper = styled.div` background: ${(props) => props.theme.colors?.surface || '#ffffff'}; border-radius: ${(props) => props.theme.borderRadius?.xl || '1rem'}; box-shadow: ${(props) => props.theme.shadows?.lg || '0 10px 15px -3px rgba(0,0,0,0.1)'}; overflow-x: auto; `;
const Table = styled.table` width: 100%; border-collapse: collapse; min-width: 800px; `;
const Thead = styled.thead` background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"}; `;
const Tr = styled.tr` border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"}; &:last-child { border-bottom: none; } `;
const Th = styled.th` padding: 1rem 1.5rem; text-align: left; font-size: 0.8rem; font-weight: 600; color: ${(props) => props.theme.colors?.textSecondary || "#4a5568"}; text-transform: uppercase; letter-spacing: 0.5px; `;
const Td = styled.td` padding: 1rem 1.5rem; font-size: 0.9rem; color: ${(props) => props.theme.colors?.text || "#2d3748"}; vertical-align: middle; `;
const EmptyState = styled.div` padding: 4rem; text-align: center; color: ${(props) => props.theme.colors?.textSecondary || "#718096"}; `;
const ActionsTd = styled(Td)` display: flex; gap: 0.5rem; align-items: center; `;

// --- Reusable Modal Components ---
const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: ${fadeIn} 0.3s; padding: 1rem;`;
const ModalContent = styled.div` background: white; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: ${slideUp} 0.4s ease-out; `;
const ModalHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h2 { margin: 0; font-size: 1.5rem; } `;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 1rem; margin: 1.5rem 0; `;
const ModalFooter = styled.div` display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; `;

// --- Edit/Create Modal Component ---
const SupplierModal = ({ supplierToEdit, onClose, onSave, loading }) => {
    const isEditMode = Boolean(supplierToEdit);
    const [supplierData, setSupplierData] = useState({ name: supplierToEdit?.name || '', contactPerson: supplierToEdit?.contactPerson || '', email: supplierToEdit?.email || '', phone: supplierToEdit?.phone || '', address: supplierToEdit?.address || '' });
    const handleChange = (e) => setSupplierData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSave = () => { if (!supplierData.name.trim()) return alert("Supplier name is required."); onSave(supplierData); };
    return (
        <ModalOverlay onClick={onClose}><ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader><h2>{isEditMode ? 'Edit Supplier' : 'Add New Supplier'}</h2><Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button></ModalHeader>
            <FormGroup>
                <Input name="name" placeholder="Supplier Name*" value={supplierData.name} onChange={handleChange} />
                <Input name="contactPerson" placeholder="Contact Person" value={supplierData.contactPerson} onChange={handleChange} />
                <Input type="email" name="email" placeholder="Email Address" value={supplierData.email} onChange={handleChange} />
                <Input name="phone" placeholder="Phone Number" value={supplierData.phone} onChange={handleChange} />
                <Input name="address" placeholder="Address" value={supplierData.address} onChange={handleChange} />
            </FormGroup>
            <ModalFooter><Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={loading}>{isEditMode ? 'Save Changes' : 'Save Supplier'}</Button></ModalFooter>
        </ModalContent></ModalOverlay>
    );
};

// --- NEW: View-Only Modal Component ---
const ViewDetailsContent = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const DetailItem = styled.div` display: flex; align-items: center; gap: 1rem; font-size: 0.95rem; svg { color: ${(props) => props.theme.colors.primary}; flex-shrink: 0; } span { color: ${(props) => props.theme.colors.textSecondary}; }`;

const ViewSupplierModal = ({ supplier, onClose }) => {
    if (!supplier) return null;
    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader><h2>Supplier Details</h2><Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button></ModalHeader>
                <ViewDetailsContent>
                    <DetailItem><FaBuilding size={18} /><span><strong>{supplier.name}</strong></span></DetailItem>
                    <DetailItem><FaUser /><span>{supplier.contactPerson || 'N/A'}</span></DetailItem>
                    <DetailItem><FaEnvelope /><span>{supplier.email || 'N/A'}</span></DetailItem>
                    <DetailItem><FaPhone /><span>{supplier.phone || 'N/A'}</span></DetailItem>
                    <DetailItem><FaMapMarkerAlt /><span>{supplier.address || 'No address provided'}</span></DetailItem>
                </ViewDetailsContent>
            </ModalContent>
        </ModalOverlay>
    );
};

// --- Main Supplier Management Page ---
const SupplierManagement = () => {
  const { suppliers, loading, error, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null); // <-- NEW STATE for view modal

  const openEditModal = (supplier = null) => { setEditingSupplier(supplier); setIsEditModalOpen(true); };
  const closeEditModal = () => { setEditingSupplier(null); setIsEditModalOpen(false); };
  const openViewModal = (supplier) => setViewingSupplier(supplier);
  const closeViewModal = () => setViewingSupplier(null);

  const handleSave = async (data) => {
    try {
      if (editingSupplier) await updateSupplier(editingSupplier._id, data);
      else await createSupplier(data);
      closeEditModal();
    } catch (err) { console.error("Save failed", err); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
        try { await deleteSupplier(id); } catch (err) { console.error("Delete failed", err); }
    }
  };

  if (error) return <Container>Error: {error.message || 'Failed to load suppliers.'}</Container>;

  return (
    <Container>
      <Header>
        <PageTitle>Supplier Management</PageTitle>
        <Button variant="primary" onClick={() => openEditModal()} disabled={loading}><FaPlus /> Add Supplier</Button>
      </Header>
      
      {loading && suppliers.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><LoadingSpinner /></div>
      ) : suppliers.length === 0 ? (
        <EmptyState><h3>No Suppliers Found</h3><p>Click "Add Supplier" to get started.</p></EmptyState>
      ) : (
        <TableWrapper>
            <Table>
                <Thead>
                    <Tr><Th>Name</Th><Th>Contact</Th><Th>Email</Th><Th>Phone</Th><Th>Actions</Th></Tr>
                </Thead>
                <tbody>
                    {suppliers.map(s => (
                        <Tr key={s._id}>
                            <Td>{s.name}</Td>
                            <Td>{s.contactPerson || 'N/A'}</Td>
                            <Td>{s.email || 'N/A'}</Td>
                            <Td>{s.phone || 'N/A'}</Td>
                            <ActionsTd>
                                {/* --- THE FIX: ADDED VIEW BUTTON --- */}
                                <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => openViewModal(s)}><FaEye /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Edit" onClick={() => openEditModal(s)}><FaEdit /></Button>
                                <Button size="sm" variant="ghost" iconOnly title="Delete" onClick={() => handleDelete(s._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                            </ActionsTd>
                        </Tr>
                    ))}
                </tbody>
            </Table>
        </TableWrapper>
      )}

      {isEditModalOpen && <SupplierModal onClose={closeEditModal} onSave={handleSave} loading={loading} supplierToEdit={editingSupplier} />}
      {viewingSupplier && <ViewSupplierModal supplier={viewingSupplier} onClose={closeViewModal} />}
    </Container>
  );
};

export default SupplierManagement;