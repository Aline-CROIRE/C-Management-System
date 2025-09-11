// client/src/components/construction/EquipmentTable.js
"use client";

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaTools, FaEdit, FaEye, FaTrash,
  FaSort, FaSortUp, FaSortDown, FaTag,
  FaChevronLeft, FaChevronRight, FaWrench, FaBuilding, FaCheckCircle, FaExclamationTriangle, FaClock, FaInfoCircle,
  FaDollarSign, FaIndustry // Added for Manufacturer
} from "react-icons/fa";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import moment from "moment";

const TableWrapper = styled.div`
  background: ${(props) => props.theme?.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme?.shadows?.lg || "0 4px 6px rgba(0, 0, 0, 0.1)"};
  overflow: hidden;
  border: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme?.colors?.border || "#cbd5e0"};
    border-radius: 10px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1300px; /* Increased min-width for new columns */
`;

const TableHeader = styled.thead`
  background: ${(props) => props.theme?.colors?.surfaceLight || "#f7fafc"};
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: clamp(0.7rem, 1.5vw, 0.75rem);
  font-weight: 600;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  cursor: ${(props) => (props.$sortable ? "pointer" : "default")};
  user-select: none;
  white-space: nowrap;

  &:hover .sort-icon {
    opacity: 1;
  }

  .sort-icon {
    margin-left: 0.5rem;
    opacity: ${(props) => (props.$sorted ? 1 : 0.3)};
    transition: opacity 0.2s ease;
  }

  &.hide-on-tablet {
    @media (max-width: 1024px) {
      display: none;
    }
  }
  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  &:hover {
    background: ${(props) => props.theme?.colors?.surfaceLight || "#edf2f7"};
  }
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: ${(props) => props.theme?.colors?.text || "#2d3748"};
  vertical-align: middle;
  white-space: nowrap;
  
  &.hide-on-tablet {
    @media (max-width: 1024px) {
      display: none;
    }
  }
  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const EquipmentInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const EquipmentName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme?.colors?.heading || "#1a202c"};
`;

const EquipmentTag = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

  ${({ status, theme }) => {
    switch (status) {
      case "Operational": return `background: ${theme?.colors?.success || "#4CAF50"}20; color: ${theme?.colors?.success || "#4CAF50"};`;
      case "In Maintenance": return `background: ${theme?.colors?.warning || "#FFC107"}20; color: ${theme?.colors?.warning || "#FFC107"};`;
      case "Idle": return `background: ${theme?.colors?.info || "#2196F3"}20; color: ${theme?.colors?.info || "#2196F3"};`;
      case "Broken": return `background: ${theme?.colors?.error || "#F44336"}20; color: ${theme?.colors?.error || "#F44336"};`;
      case "In Transit": return `background: ${theme?.colors?.primary || "#1b4332"}20; color: ${theme?.colors?.primary || "#1b4332"};`;
      case "Out of Service": return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
      default: return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const ActionButtonGroup = styled.div` display: flex; align-items: center; gap: 0.25rem; `;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  h3 { color: ${(props) => props.theme?.colors?.text || "#2d3748"}; margin-bottom: 0.5rem; }
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  font-size: clamp(0.8rem, 2vw, 0.875rem);
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PaginationControls = styled.div` display: flex; gap: 0.5rem; `;

const EquipmentTable = ({
  equipment = [],
  loading = false,
  pagination = { page: 1, total: 0, limit: 10 },
  onEdit,
  onDelete,
  onView,
  onPageChange,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  const sortedEquipment = useMemo(() => {
    let sortableItems = [...equipment];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle nested properties for sorting
        if (sortConfig.key === 'currentSite') {
            aValue = a[sortConfig.key]?.name || '';
            bValue = b[sortConfig.key]?.name || '';
        }
        if (['purchaseDate', 'lastMaintenance', 'nextMaintenance', 'warrantyExpiry'].includes(sortConfig.key)) {
            aValue = moment(aValue).valueOf();
            bValue = moment(bValue).valueOf();
        }
        if (['purchaseCost', 'currentValue', 'hourlyRate', 'utilization'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue || 0);
            bValue = parseFloat(bValue || 0);
        }


        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [equipment, sortConfig]);

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Operational": return <FaCheckCircle />;
      case "In Maintenance": case "Broken": return <FaExclamationTriangle />;
      case "Idle": case "In Transit": case "Out of Service": return <FaClock />;
      default: return <FaInfoCircle />;
    }
  };
  
  if (loading && equipment.length === 0) {
    return <div style={{ display: "grid", placeItems: "center", padding: "4rem" }}><LoadingSpinner /></div>;
  }

  if (!loading && equipment.length === 0) {
    return (
      <TableWrapper>
        <EmptyState>
          <FaTools className="icon" />
          <h3>No Equipment Found</h3>
          <p>Click "Add Equipment" to start tracking your machinery.</p>
        </EmptyState>
      </TableWrapper>
    );
  }
  
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;


  return (
    <TableWrapper>
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell $sortable $sorted={sortConfig.key === "name"} onClick={() => handleSort("name")}>Equipment Name {getSortIcon("name")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" $sortable $sorted={sortConfig.key === "assetTag"} onClick={() => handleSort("assetTag")}>Asset Tag {getSortIcon("assetTag")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "type"} onClick={() => handleSort("type")}>Type {getSortIcon("type")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "manufacturer"} onClick={() => handleSort("manufacturer")}>Manufacturer {getSortIcon("manufacturer")}</TableHeaderCell> {/* NEW */}
              <TableHeaderCell $sortable $sorted={sortConfig.key === "status"} onClick={() => handleSort("status")}>Status {getSortIcon("status")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" $sortable $sorted={sortConfig.key === "currentSite"} onClick={() => handleSort("currentSite")}>Assigned Site {getSortIcon("currentSite")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "hourlyRate"} onClick={() => handleSort("hourlyRate")}>Rate/Hr {getSortIcon("hourlyRate")}</TableHeaderCell> {/* NEW */}
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "nextMaintenance"} onClick={() => handleSort("nextMaintenance")}>Next Maintenance {getSortIcon("nextMaintenance")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "warrantyExpiry"} onClick={() => handleSort("warrantyExpiry")}>Warranty {getSortIcon("warrantyExpiry")}</TableHeaderCell> {/* NEW */}
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedEquipment.map((eq) => (
              <TableRow key={eq._id}>
                <TableCell>
                  <EquipmentInfo>
                    <EquipmentName>{eq.name}</EquipmentName>
                    <EquipmentTag><FaTag /> {eq.assetTag}</EquipmentTag>
                  </EquipmentInfo>
                </TableCell>
                <TableCell className="hide-on-mobile">{eq.assetTag}</TableCell>
                <TableCell className="hide-on-tablet">{eq.type}</TableCell>
                <TableCell className="hide-on-tablet"><FaIndustry size={10} style={{marginRight: '0.25rem'}}/>{eq.manufacturer || 'N/A'}</TableCell> {/* NEW */}
                <TableCell><StatusBadge status={eq.status}>{getStatusIcon(eq.status)} {eq.status}</StatusBadge></TableCell>
                <TableCell className="hide-on-mobile">{eq.currentSite?.name || 'None'}</TableCell>
                <TableCell className="hide-on-tablet">{formatCurrency(eq.hourlyRate)}</TableCell> {/* NEW */}
                <TableCell className="hide-on-tablet">{eq.nextMaintenance ? moment(eq.nextMaintenance).format('MMM Do, YYYY') : 'N/A'}</TableCell>
                <TableCell className="hide-on-tablet">{eq.warrantyExpiry ? moment(eq.warrantyExpiry).format('MMM Do, YYYY') : 'N/A'}</TableCell> {/* NEW */}
                <TableCell>
                  <ActionButtonGroup>
                    <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(eq)}><FaEye /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Edit Equipment" onClick={() => onEdit(eq)}><FaEdit /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Delete Equipment" onClick={() => onDelete(eq._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                  </ActionButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TableFooter>
        <span>Page {pagination.page} of {totalPages} ({pagination.total.toLocaleString()} items)</span>
        <PaginationControls>
          <Button size="sm" variant="secondary" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}><FaChevronLeft /> Prev</Button>
          <Button size="sm" variant="secondary" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}>Next <FaChevronRight /></Button>
        </PaginationControls>
      </TableFooter>
    </TableWrapper>
  );
};

export default EquipmentTable;