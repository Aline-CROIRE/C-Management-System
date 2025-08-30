import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaEye, FaSpinner, FaSort, FaSortUp, FaSortDown, FaEllipsisV, FaPrint, FaRedo, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Button from '../common/Button';
import Select from '../common/Select';
import { poAPI } from '../../services/api';
import toast from 'react-hot-toast';

const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;

const getStatusStyle = (status) => {
  switch (status) {
    case 'Completed': return { background: '#C6F6D5', color: '#2F855A' };
    case 'Pending': return { background: '#FEFBF0', color: '#D69E2E' };
    case 'Ordered': return { background: '#EBF4FF', color: '#3182CE' };
    case 'Shipped': return { background: '#E6FFFA', color: '#319795' };
    case 'Cancelled': return { background: '#FED7D7', color: '#C53030' };
    default: return { background: '#E2E8F0', color: '#718096' };
  }
};

const TableWrapper = styled.div`
  overflow: hidden;
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 1rem 1.25rem;
    text-align: left;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
    white-space: nowrap;
  }
  th {
    background-color: ${(props) => props.theme.colors.surfaceLight};
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${(props) => props.theme.colors.textSecondary};
    cursor: pointer;
    user-select: none;
    .sort-icon {
        opacity: 0.4;
        transition: opacity 0.2s ease;
    }
    &.active .sort-icon {
        opacity: 1;
    }
    &:hover .sort-icon {
        opacity: 0.8;
    }
  }
  tbody tr:hover {
    background-color: ${(props) => props.theme.colors.surfaceLight};
  }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const StatusSelect = styled(Select)`
    font-weight: 600; border: none; padding: 0.4rem 0.75rem; border-radius: 6px;
    -webkit-appearance: none; -moz-appearance: none; appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232D3748%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat; background-position: right .7em top 50%; background-size: .65em auto;
    ${({ status }) => { const styles = getStatusStyle(status); return `background-color: ${styles.background}; color: ${styles.color};`; }}
    &:disabled { cursor: not-allowed; opacity: 0.7; }
`;

const SkeletonRow = styled.tr`
  td {
    padding: 1.25rem;
  }
  td > div {
    background: #e2e8f0;
    background-image: linear-gradient(90deg, #e2e8f0, #f7fafc, #e2e8f0);
    background-size: 2000px 100%;
    animation: ${shimmer} 2s linear infinite;
    border-radius: 4px;
    height: 20px;
  }
`;

const TableFooter = styled.div`
  display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem;
  font-size: 0.875rem; color: ${(props) => props.theme.colors.textSecondary};
`;
const PaginationControls = styled.div` display: flex; gap: 0.5rem; `;
const DropdownMenu = styled.div` position: absolute; right: 0; background: white; border-radius: 8px; box-shadow: ${(props) => props.theme.shadows.lg}; z-index: 10; overflow: hidden;`;
const DropdownItem = styled(Button)` width: 100%; justify-content: flex-start;`;

const POTable = ({ data, loading, pagination, onUpdateStatus, onView, onPageChange, onSortChange, currentSort, onReorder, onDelete }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [printLoadingId, setPrintLoadingId] = useState(null);

  const handleStatusChange = async (poId, newStatus) => {
    setUpdatingId(poId);
    try { await onUpdateStatus(poId, newStatus); }
    catch (error) { console.error("Failed to update status:", error); }
    finally { setUpdatingId(null); }
  };

  const handlePrint = async (poId, orderNumber) => {
    setPrintLoadingId(poId);
    toast.loading('Generating PDF...');
    try {
        const response = await poAPI.generatePDF(poId);
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PO-${orderNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('PDF Downloaded!');
    } catch (error) {
        toast.dismiss();
        toast.error(error.message || 'Failed to generate PDF.');
    } finally {
        setPrintLoadingId(null);
    }
  };

  const handleSort = (key) => {
    const order = currentSort.sort === key && currentSort.order === 'asc' ? 'desc' : 'asc';
    onSortChange(key, order);
  };
  
  const getSortIcon = (key) => {
    if (currentSort.sort !== key) return <FaSort className="sort-icon" />;
    return currentSort.order === 'asc' ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />;
  };

  const renderSkeleton = () => [...Array(10)].map((_, index) => (
    <SkeletonRow key={index}>
      <td><div></div></td> <td><div></div></td> <td><div></div></td>
      <td><div></div></td> <td><div></div></td> <td><div></div></td>
    </SkeletonRow>
  ));

  const validData = Array.isArray(data) ? data.filter(Boolean) : [];

  if (!loading && validData.length === 0) {
    return <EmptyState>No purchase orders found.</EmptyState>;
  }
  
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) || 1 : 1;

  return (
    <TableWrapper>
      <TableContainer>
        <StyledTable>
          <thead>
            <tr>
              <th className={currentSort.sort === 'orderNumber' ? 'active' : ''} onClick={() => handleSort('orderNumber')}>PO Number {getSortIcon('orderNumber')}</th>
              <th>Supplier</th>
              <th className={currentSort.sort === 'orderDate' ? 'active' : ''} onClick={() => handleSort('orderDate')}>Date {getSortIcon('orderDate')}</th>
              <th>Status</th>
              <th className={currentSort.sort === 'totalAmount' ? 'active' : ''} onClick={() => handleSort('totalAmount')}>Total (RWF) {getSortIcon('totalAmount')}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? renderSkeleton() : validData.map((po) => {
              const isFinalState = po.status === 'Completed' || po.status === 'Cancelled';
              const isUpdating = updatingId === po._id;
              return (
                <tr key={po._id}>
                  <td>{po.orderNumber}</td>
                  <td>{po.supplier?.name ?? 'N/A'}</td>
                  <td>{new Date(po.orderDate).toLocaleDateString()}</td>
                  <td>
                   <StatusSelect value={po.status} onChange={(e) => handleStatusChange(po._id, e.target.value)} status={po.status} disabled={isFinalState || isUpdating || !onUpdateStatus}>
                      <option value="Pending">Pending</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Shipped">Shipped</option>
                      {isFinalState && <option value={po.status}>{po.status}</option>}
                      <option value="Cancelled">Cancelled</option>
                   </StatusSelect>
                  </td>
                  <td>{(po.totalAmount ?? 0).toLocaleString()}</td>
                  <td style={{display: 'flex', gap: '0.5rem'}}>
                    <Button variant="ghost" size="sm" onClick={() => onView && onView(po)} disabled={!onView}>
                      <FaEye /> View
                    </Button>
                    <div style={{position: 'relative'}}>
                        <Button variant="ghost" size="sm" iconOnly onClick={() => setActiveDropdown(po._id === activeDropdown ? null : po._id)}><FaEllipsisV/></Button>
                        {activeDropdown === po._id && (
                            <DropdownMenu onMouseLeave={() => setActiveDropdown(null)}>
                                <DropdownItem variant="ghost" onClick={() => handlePrint(po._id, po.orderNumber)} disabled={printLoadingId === po._id}><FaPrint/> {printLoadingId === po._id ? 'Printing...': 'Print'}</DropdownItem>
                                <DropdownItem variant="ghost" onClick={() => onReorder(po)}><FaRedo/> Duplicate</DropdownItem>
                                <DropdownItem variant="ghost" onClick={() => onDelete(po._id)} style={{color: '#c53030'}}><FaTrash/> Delete</DropdownItem>
                            </DropdownMenu>
                        )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </StyledTable>
      </TableContainer>
      {pagination && (
        <TableFooter>
          <span>Page {pagination.page} of {totalPages} ({pagination.total.toLocaleString()} orders)</span>
          <PaginationControls>
            <Button size="sm" variant="secondary" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}><FaChevronLeft /> Prev</Button>
            <Button size="sm" variant="secondary" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}>Next <FaChevronRight /></Button>
          </PaginationControls>
        </TableFooter>
      )}
    </TableWrapper>
  );
};

export default POTable;