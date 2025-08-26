"use client";

import { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaBoxes, FaEdit, FaEye, FaTrash,
  FaSort, FaSortUp, FaSortDown, FaBarcode,
  FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";

// Use an environment variable for your API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ========= STYLED COMPONENTS (Enhanced and Complete) =========

const TableWrapper = styled.div`
  background: ${(props) => props.theme.colors?.surface || '#ffffff'};
  border-radius: ${(props) => props.theme.borderRadius?.xl || '1rem'};
  box-shadow: ${(props) => props.theme.shadows?.lg || '0 10px 15px -3px rgba(0,0,0,0.1)'};
  overflow: hidden;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
`;

const TableHeader = styled.thead`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.textSecondary || "#4a5568"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  cursor: ${(props) => (props.sortable ? "pointer" : "default")};
  user-select: none;
  white-space: nowrap;

  &:hover {
    background: ${(props) => (props.sortable ? props.theme.colors?.border || "#e2e8f0" : "transparent")};
  }
  .sort-icon {
    margin-left: 0.5rem;
    opacity: ${(props) => (props.sorted ? 1 : 0.3)};
    transition: opacity 0.2s;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  transition: background-color 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f8f9fa"};
  }
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  vertical-align: middle;
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ProductImage = styled.div`
  width: 50px;
  height: 50px;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f0f0f0"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.colors?.textSecondary || "#a0aec0"};
  font-size: 1.5rem;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.colors?.border || '#e2e8f0'};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProductDetails = styled.div``;
const ProductName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.colors?.heading || '#1a202c'};
`;
const ProductSKU = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme.colors?.textSecondary || '#718096'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;

  ${({ status, theme }) => {
    // --- THIS IS THE CORRECTED STATUS LOGIC ---
    const statusColors = {
      'in-stock': theme?.colors?.success || '#2f855a',
      'low-stock': theme?.colors?.warning || '#dd6b20',
      'out-of-stock': theme?.colors?.error || '#c53030',
      'on-order': theme?.colors?.info || '#3182ce', // <-- ADDED 'on-order' STATUS
      default: theme?.colors?.textSecondary || '#718096',
    };
    
    const color = statusColors[status] || statusColors.default;
    
    return `
      background-color: ${color}20; /* 20% opacity background */
      color: ${color};
    `;
  }}
`;

const StockInfo = styled.div``;
const StockQuantity = styled.div`
  font-weight: 700;
`;
const StockUnit = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme.colors?.textSecondary || '#718096'};
`;
const UnitPrice = styled.div``;
const TotalValue = styled.div`
  font-weight: 600;
`;
const ActionButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  .icon { font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.5; }
  h3 { color: ${(props) => props.theme.colors?.text || "#2d3748"}; margin-bottom: 0.5rem; }
`;
const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${(props) => props.theme.colors?.border || '#e2e8f0'};
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || '#718096'};
`;
const PaginationInfo = styled.span``;
const PaginationControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const InventoryTable = ({
  data = [],
  loading = false,
  pagination = { page: 1, total: 0, limit: 10 },
  onEdit,
  onDelete,
  onView,
  onPageChange,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "updatedAt", direction: "desc" });

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === "asc" ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />;
  };

  if (loading && data.length === 0) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><LoadingSpinner /></div>;
  }

  if (!loading && (!data || data.length === 0)) {
    return (
      <TableWrapper>
        <EmptyState>
          <FaBoxes className="icon" />
          <h3>No Inventory Items Found</h3>
          <p>Your inventory is empty or no items match the current filters.</p>
        </EmptyState>
      </TableWrapper>
    );
  }
  
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <TableWrapper>
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell sortable sorted={sortConfig.key === "name"} onClick={() => handleSort("name")}>Product {getSortIcon("name")}</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell sortable sorted={sortConfig.key === "quantity"} onClick={() => handleSort("quantity")}>Stock {getSortIcon("quantity")}</TableHeaderCell>
              <TableHeaderCell sortable sorted={sortConfig.key === "price"} onClick={() => handleSort("price")}>Unit Price {getSortIcon("price")}</TableHeaderCell>
              <TableHeaderCell sortable sorted={sortConfig.key === "totalValue"} onClick={() => handleSort("totalValue")}>Total Value {getSortIcon("totalValue")}</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell sortable sorted={sortConfig.key === "updatedAt"} onClick={() => handleSort("updatedAt")}>Last Updated {getSortIcon("updatedAt")}</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow key={item._id || item.id}>
                <TableCell>
                  <ProductInfo>
                    <ProductImage>
                      {item.imageUrl ? <img src={`${API_BASE_URL}/${item.imageUrl.replace(/\\/g, '/')}`} alt={item.name} /> : <FaBoxes />}
                    </ProductImage>
                    <ProductDetails>
                      <ProductName>{item.name || "N/A"}</ProductName>
                      <ProductSKU><FaBarcode /> {item.sku || "N/A"}</ProductSKU>
                    </ProductDetails>
                  </ProductInfo>
                </TableCell>
                <TableCell>{item.category || "Uncategorized"}</TableCell>
                <TableCell>
                  <StockInfo>
                    <StockQuantity>{(typeof item.quantity === 'number') ? item.quantity.toLocaleString() : '0'}</StockQuantity>
                    <StockUnit>{item.unit || "unit"}</StockUnit>
                  </StockInfo>
                </TableCell>
                <TableCell><UnitPrice>${(typeof item.price === 'number') ? item.price.toFixed(2) : '0.00'}</UnitPrice></TableCell>
                <TableCell><TotalValue>${(typeof item.totalValue === 'number') ? item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</TotalValue></TableCell>
                <TableCell><StatusBadge status={item.status}>{item.status?.replace('-', ' ') || "Unknown"}</StatusBadge></TableCell>
                <TableCell>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <ActionButtonGroup>
                    <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView?.(item)}><FaEye /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Edit Item" onClick={() => onEdit?.(item)}><FaEdit /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Delete Item" onClick={() => onDelete?.(item._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                  </ActionButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TableFooter>
        <PaginationInfo>Page {pagination.page} of {totalPages} ({pagination.total.toLocaleString()} items)</PaginationInfo>
        <PaginationControls>
          <Button size="sm" variant="secondary" onClick={() => onPageChange?.(pagination.page - 1)} disabled={pagination.page <= 1}><FaChevronLeft /> Previous</Button>
          <Button size="sm" variant="secondary" onClick={() => onPageChange?.(pagination.page + 1)} disabled={pagination.page >= totalPages}>Next <FaChevronRight /></Button>
        </PaginationControls>
      </TableFooter>
    </TableWrapper>
  );
};

export default InventoryTable;