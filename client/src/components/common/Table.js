// client/src/components/common/Table.js
"use client";

import React from 'react';
import styled from 'styled-components';
import LoadingSpinner from './LoadingSpinner'; // Assuming you have this
import { FaInfoCircle } from 'react-icons/fa'; // For EmptyState icon

const TableContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: ${(props) => props.theme?.borderRadius?.md || '0.5rem'}; /* Ensure inner table scrollbar has rounded corners */

  &::-webkit-scrollbar {
    height: 8px;
    background-color: ${(props) => props.theme?.colors?.surfaceLight || "#f7fafc"};
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme?.colors?.border || "#cbd5e0"};
    border-radius: 10px;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px; /* Default min-width for generic tables, adjust as needed */

  @media (max-width: 768px) {
    min-width: 600px; /* Allow smaller min-width on mobile */
  }
`;

const TableHeader = styled.thead`
  background: ${(props) => props.theme?.colors?.surfaceLight || "#f7fafc"};
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: clamp(0.8rem, 1.5vw, 1rem);
  font-weight: 600;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
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
  white-space: nowrap; /* Default, but can be overridden by Cell renderer */

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  h3 { color: ${(props) => props.theme?.colors?.text || "#2d3748"}; margin-bottom: 0.5rem; }
`;

const Table = ({ columns, data, loading, emptyMessage = "No data found.", minWidth = '800px' }) => {
  if (loading && data.length === 0) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: '200px', padding: "4rem" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <EmptyState>
        <FaInfoCircle className="icon" />
        <h3>{emptyMessage}</h3>
      </EmptyState>
    );
  }

  return (
    <TableContainer>
      <StyledTable style={{ minWidth }}>
        <TableHeader>
          <tr>
            {columns.map((col) => (
              col.headerRenderer ? col.headerRenderer() : (
                <TableHeaderCell key={col.accessor} className={col.className}>
                  {col.header}
                </TableHeaderCell>
              )
            ))}
          </tr>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={row.id || row._id || rowIndex}>
              {columns.map((col) => {
                const value = col.accessor ? row[col.accessor] : undefined;
                return (
                  <TableCell key={col.accessor} className={col.className}>
                    {col.Cell ? col.Cell({ value, row: { original: row } }) : value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};

export default Table;