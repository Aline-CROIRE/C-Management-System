// client/src/components/construction/worker-management/WorkerAssignmentTable.js
"use client";

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaUserCog, FaEdit, FaEye, FaTrash, FaSort, FaSortUp, FaSortDown, FaPhone, FaEnvelope, FaToolbox, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import Button from "../../common/Button"; // CORRECTED PATH
import LoadingSpinner from "../../common/LoadingSpinner"; // CORRECTED PATH
import Table from "../../common/Table"; // CORRECTED PATH
import Pagination from "../../common/Pagination"; // CORRECTED PATH


const TableWrapper = styled.div`
  background: ${(props) => props.theme?.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme?.shadows?.lg || "0 4px 6px rgba(0, 0, 0, 0.1)"};
  overflow: hidden;
  border: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  h3 { color: ${(props) => props.theme?.colors?.text || "#2d3748"}; margin-bottom: 0.5rem; }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: clamp(0.7rem, 1.5vw, 0.75rem);
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  ${({ isActive, theme }) => isActive ? 
    `background: ${theme?.colors?.success || "#4CAF50"}20; color: ${theme?.colors?.success || "#4CAF50"};` :
    `background: ${theme?.colors?.error || "#F44336"}20; color: ${theme?.colors?.error || "#F44336"};`
  }
`;

const ActionButtonGroup = styled.div` display: flex; align-items: center; gap: 0.25rem; `;


const WorkerAssignmentTable = ({
  workers = [],
  loading = false,
  pagination = { page: 1, total: 0, limit: 10, totalPages: 1 },
  onEdit,
  onDelete,
  onView,
  onPageChange,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "fullName", direction: "asc" });

  const sortedWorkers = useMemo(() => {
    let sortableItems = [...workers];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'isActive') {
            aValue = aValue ? 1 : 0;
            bValue = bValue ? 1 : 0;
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [workers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === "asc" ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />;
  };

  if (loading && workers.length === 0) {
    return (
      <TableWrapper style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </TableWrapper>
    );
  }

  if (!loading && workers.length === 0) {
    return (
      <TableWrapper>
        <EmptyState>
          <FaUserCog className="icon" />
          <h3>No Workers Found</h3>
          <p>Add new workers to assign them to tasks and projects.</p>
        </EmptyState>
      </TableWrapper>
    );
  }
  
  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.page || 1;
  const totalItems = pagination.total || 0;

  const columns = [
    { 
      header: 'Full Name', 
      accessor: 'fullName',
      render: (worker) => <strong>{worker.fullName}</strong>,
      sortable: true
    },
    { 
      header: 'Role', 
      accessor: 'role',
      sortable: true,
      className: 'hide-on-mobile'
    },
    { 
      header: 'Contact', 
      accessor: 'contactNumber',
      render: (worker) => worker.contactNumber ? <><FaPhone size={10} style={{marginRight: '0.5em'}}/>{worker.contactNumber}</> : 'N/A',
      className: 'hide-on-tablet'
    },
    { 
      header: 'Email', 
      accessor: 'email',
      render: (worker) => worker.email ? <><FaEnvelope size={10} style={{marginRight: '0.5em'}}/>{worker.email}</> : 'N/A',
      className: 'hide-on-tablet'
    },
    {
      header: 'Active',
      accessor: 'isActive',
      render: (worker) => (
        <StatusBadge isActive={worker.isActive}>
          {worker.isActive ? <FaCheckCircle /> : <FaTimesCircle />} {worker.isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (worker) => (
        <ActionButtonGroup>
          <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(worker)}><FaEye /></Button>
          <Button size="sm" variant="ghost" iconOnly title="Edit Worker" onClick={() => onEdit(worker)}><FaEdit /></Button>
          <Button size="sm" variant="ghost" iconOnly title="Delete Worker" onClick={() => onDelete(worker._id)}><FaTrash style={{color: '#c53030'}}/></Button>
        </ActionButtonGroup>
      ),
    },
  ];

  return (
    <TableWrapper>
      <Table 
        columns={columns.map(col => ({
          ...col,
          headerRenderer: () => (
            <th 
              key={col.accessor} 
              className={col.className} 
              style={{ cursor: col.sortable ? 'pointer' : 'default' }}
              onClick={col.sortable ? () => handleSort(col.accessor) : undefined}
            >
              {col.header} {col.sortable && getSortIcon(col.accessor)}
            </th>
          )
        }))} 
        data={sortedWorkers} 
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </TableWrapper>
  );
};

export default WorkerAssignmentTable;