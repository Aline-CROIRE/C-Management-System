"use client";

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaBuilding, FaEdit, FaEye, FaTrash,
  FaSort, FaSortUp, FaSortDown, FaCode,
  FaChevronLeft, FaChevronRight, FaChartPie, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaInfoCircle
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
  min-width: 1000px;
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

const SiteInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SiteName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme?.colors?.heading || "#1a202c"};
`;

const SiteCode = styled.div`
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
      case "Planning": return `background: ${theme?.colors?.info || "#2196F3"}20; color: ${theme?.colors?.info || "#2196F3"};`;
      case "Active": return `background: ${theme?.colors?.success || "#4CAF50"}20; color: ${theme?.colors?.success || "#4CAF50"};`;
      case "On-Hold": return `background: ${theme?.colors?.warning || "#FFC107"}20; color: ${theme?.colors?.warning || "#FFC107"};`;
      case "Delayed": return `background: ${theme?.colors?.error || "#F44336"}20; color: ${theme?.colors?.error || "#F44336"};`;
      case "Completed": return `background: ${theme?.colors?.primary || "#1b4332"}20; color: ${theme?.colors?.primary || "#1b4332"};`;
      case "Cancelled": return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
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

const SiteTable = ({
  sites = [],
  loading = false,
  pagination = { page: 1, total: 0, limit: 10 },
  onEdit,
  onDelete,
  onView,
  onPageChange,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "startDate", direction: "desc" });

  const sortedSites = useMemo(() => {
    let sortableItems = [...sites];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (['startDate', 'endDate', 'actualEndDate'].includes(sortConfig.key)) {
            aValue = moment(aValue).valueOf();
            bValue = moment(bValue).valueOf();
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [sites, sortConfig]);

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
      case "Active": case "Completed": return <FaCheckCircle />;
      case "Delayed": case "On-Hold": case "Cancelled": return <FaExclamationTriangle />;
      case "Planning": return <FaCalendarAlt />;
      default: return <FaInfoCircle />;
    }
  };

  if (loading && sites.length === 0) {
    return <div style={{ display: "grid", placeItems: "center", padding: "4rem" }}><LoadingSpinner /></div>;
  }

  if (!loading && sites.length === 0) {
    return (
      <TableWrapper>
        <EmptyState>
          <FaBuilding className="icon" />
          <h3>No Construction Sites Found</h3>
          <p>Click "Add New Site" to start managing your projects.</p>
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
              <TableHeaderCell $sortable $sorted={sortConfig.key === "name"} onClick={() => handleSort("name")}>Site Name {getSortIcon("name")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" $sortable $sorted={sortConfig.key === "projectCode"} onClick={() => handleSort("projectCode")}>Code {getSortIcon("projectCode")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "location"} onClick={() => handleSort("location")}>Location {getSortIcon("location")}</TableHeaderCell>
              <TableHeaderCell $sortable $sorted={sortConfig.key === "status"} onClick={() => handleSort("status")}>Status {getSortIcon("status")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" $sortable $sorted={sortConfig.key === "progress"} onClick={() => handleSort("progress")}>Progress {getSortIcon("progress")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" $sortable $sorted={sortConfig.key === "budget"} onClick={() => handleSort("budget")}>Budget {getSortIcon("budget")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "endDate"} onClick={() => handleSort("endDate")}>Deadline {getSortIcon("endDate")}</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedSites.map((site) => (
              <TableRow key={site._id}>
                <TableCell>
                  <SiteInfo>
                    <SiteName>{site.name}</SiteName>
                    <SiteCode><FaCode /> {site.projectCode}</SiteCode>
                  </SiteInfo>
                </TableCell>
                <TableCell className="hide-on-mobile">{site.projectCode}</TableCell>
                <TableCell className="hide-on-tablet">{site.location}</TableCell>
                <TableCell><StatusBadge status={site.status}>{getStatusIcon(site.status)} {site.status}</StatusBadge></TableCell>
                <TableCell className="hide-on-mobile">{site.progress}%</TableCell>
                <TableCell className="hide-on-mobile">{formatCurrency(site.budget)}</TableCell>
                <TableCell className="hide-on-tablet">{moment(site.endDate).format('MMM Do, YYYY')}</TableCell>
                <TableCell>
                  <ActionButtonGroup>
                    <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(site)}><FaEye /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Edit Site" onClick={() => onEdit(site)}><FaEdit /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Delete Site" onClick={() => onDelete(site._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                  </ActionButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TableFooter>
        <span>Page {pagination.page} of {totalPages} ({pagination.total.toLocaleString()} sites)</span>
        <PaginationControls>
          <Button size="sm" variant="secondary" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}><FaChevronLeft /> Prev</Button>
          <Button size="sm" variant="secondary" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}>Next <FaChevronRight /></Button>
        </PaginationControls>
      </TableFooter>
    </TableWrapper>
  );
};

export default SiteTable;