
// src/components/inventory/InventoryTable.js
"use client";

import { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaBoxes, FaEdit, FaEye, FaTrash,
  FaSort, FaSortUp, FaSortDown, FaBarcode,
  FaChevronLeft, FaChevronRight, FaCalendarTimes, FaExclamationCircle, FaExchangeAlt // Added FaExchangeAlt
} from "react-icons/fa";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";


const getImageUrlBase = () => {
  const apiUrl = process.env.REACT_APP_API_URL || "https://c-management-system.onrender.com/api";
  return apiUrl.replace(/\/api$/, ''); 
};


const TableWrapper = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  box-shadow: ${(props) => props.theme.shadows.lg};
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.border};
    border-radius: 10px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
`;

const TableHeader = styled.thead`
  background: ${(props) => props.theme.colors.surfaceLight};
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid ${(props) => props.theme.colors.border};
  cursor: ${(props) => (props.sortable ? "pointer" : "default")};
  user-select: none;
  white-space: nowrap;

  &:hover .sort-icon {
    opacity: 1;
  }

  .sort-icon {
    margin-left: 0.5rem;
    opacity: ${(props) => (props.sorted ? 1 : 0.3)};
    transition: opacity 0.2s ease;
  }

  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
  }
  &:last-child {
    border-bottom: none;
  }
  ${(props) => props.$isExpired && `
    background-color: #ffe0e0;
    &:hover {
      background-color: #ffcccc;
    }
  `}
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.text};
  vertical-align: middle;
  white-space: nowrap;
  
  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ProductImage = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  background: ${(props) => props.theme.colors.surfaceLight};
  display: grid;
  place-items: center;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 1.5rem;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const ProductName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.colors.heading};
`;

const ProductSKU = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme.colors.textSecondary};
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
    const statusColors = {
      'in-stock': theme.colors.success,
      'low-stock': theme.colors.warning,
      'out-of-stock': theme.colors.error,
      'on-order': theme.colors.info,
      'expired': '#C53030',
      default: theme.colors.textSecondary,
    };
    const color = statusColors[status] || statusColors.default;
    return `
      background-color: ${color}20;
      color: ${color};
    `;
  }}
`;

const StockQuantity = styled.div` font-weight: 700; `;
const StockUnit = styled.div` font-size: 0.8rem; color: ${(props) => props.theme.colors.textSecondary}; `;
const ActionButtonGroup = styled.div` display: flex; align-items: center; gap: 0.25rem; `;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme.colors.textSecondary};
  .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  h3 { color: ${(props) => props.theme.colors.text}; margin-bottom: 0.5rem; }
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PaginationControls = styled.div` display: flex; gap: 0.5rem; `;

const InventoryTable = ({
  data = [],
  loading = false,
  pagination = { page: 1, total: 0, limit: 10 },
  onEdit,
  onDelete,
  onView,
  onPageChange,
  onAdjustStock // NEW PROP: Callback for stock adjustment
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "updatedAt", direction: "desc" });

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'category' || sortConfig.key === 'location' || sortConfig.key === 'supplier') {
            aValue = a[sortConfig.key]?.name || '';
            bValue = b[sortConfig.key]?.name || '';
        }

        if (sortConfig.key === 'expiryDate') {
            const dateA = aValue ? new Date(aValue).getTime() : 0;
            const dateB = bValue ? new Date(bValue).getTime() : 0;
            if (dateA < dateB) return sortConfig.direction === "asc" ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        }

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
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === "asc" ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />;
  };

  if (loading && data.length === 0) {
    return (
      <TableWrapper>
        <div style={{ display: "grid", placeItems: "center", padding: "4rem" }}><LoadingSpinner /></div>
      </TableWrapper>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <TableWrapper>
        <EmptyState>
          <FaBoxes className="icon" />
          <h3>No Inventory Found</h3>
          <p>Try adding a new item or adjusting your filters.</p>
        </EmptyState>
      </TableWrapper>
    );
  }
  
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const isItemExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  return (
    <TableWrapper>
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell sortable sorted={sortConfig.key === "name"} onClick={() => handleSort("name")}>Product {getSortIcon("name")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" sortable sorted={sortConfig.key === "category"} onClick={() => handleSort("category")}>Category {getSortIcon("category")}</TableHeaderCell>
              <TableHeaderCell sortable sorted={sortConfig.key === "quantity"} onClick={() => handleSort("quantity")}>Stock {getSortIcon("quantity")}</TableHeaderCell>
              <TableHeaderCell sortable sorted={sortConfig.key === "price"} onClick={() => handleSort("price")}>Price {getSortIcon("price")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" sortable sorted={sortConfig.key === "totalValue"} onClick={() => handleSort("totalValue")}>Value {getSortIcon("totalValue")}</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" sortable sorted={sortConfig.key === "expiryDate"} onClick={() => handleSort("expiryDate")}>Expiry Date {getSortIcon("expiryDate")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" sortable sorted={sortConfig.key === "updatedAt"} onClick={() => handleSort("updatedAt")}>Last Updated {getSortIcon("updatedAt")}</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => {
                const expired = isItemExpired(item.expiryDate);
                const displayStatus = expired ? 'expired' : item.status?.replace('-', ' ');
                return (
              <TableRow key={item._id} $isExpired={expired}>
                <TableCell>
                  <ProductInfo>
                    <ProductImage>
                      <FaBoxes /> 
                    </ProductImage>
                    <div>
                      <ProductName>{item.name}</ProductName>
                      <ProductSKU><FaBarcode /> {item.sku}</ProductSKU>
                    </div>
                  </ProductInfo>
                </TableCell>
                <TableCell className="hide-on-mobile">{item.category?.name || 'N/A'}</TableCell>
                <TableCell>
                  <div>
                    <StockQuantity>{item.quantity?.toLocaleString() ?? '0'}</StockQuantity>
                    <StockUnit>{item.unit}</StockUnit>
                  </div>
                </TableCell>
                <TableCell>Rwf {item.price?.toFixed(2) ?? '0.00'}</TableCell>
                <TableCell className="hide-on-mobile">Rwf {item.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</TableCell>
                <TableCell><StatusBadge status={displayStatus}>{displayStatus}</StatusBadge></TableCell>
                <TableCell className="hide-on-mobile">
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                    {expired && <FaCalendarTimes style={{ marginLeft: '0.5rem', color: '#c53030' }} title="Expired" />}
                </TableCell>
                <TableCell className="hide-on-mobile">{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <ActionButtonGroup>
                    <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(item)}><FaEye /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Edit Item" onClick={() => onEdit(item)}><FaEdit /></Button>
                    {onAdjustStock && (
                        <Button size="sm" variant="ghost" iconOnly title="Adjust Stock" onClick={() => onAdjustStock(item)}><FaExchangeAlt style={{color: '#ed8936'}}/></Button> // Changed icon and color for clarity
                    )}
                    <Button size="sm" variant="ghost" iconOnly title="Delete Item" onClick={() => onDelete(item._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                  </ActionButtonGroup>
                </TableCell>
              </TableRow>
            )})}
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
export default InventoryTable;