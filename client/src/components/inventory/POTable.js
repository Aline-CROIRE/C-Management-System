import React from 'react';
import styled from 'styled-components';
import { FaEye } from 'react-icons/fa';
import Button from '../common/Button';
import Select from '../common/Select';

// --- FIX: Define a default theme object as a fallback ---
// This makes the component resilient and prevents crashes if it's rendered
// outside of a ThemeProvider (e.g., in tests or Storybook).
const defaultTheme = {
  colors: {
    surface: '#FFFFFF',
    surfaceLight: '#F7FAFC',
    border: '#E2E8F0',
    textSecondary: '#718096',
  },
  borderRadius: {
    lg: '8px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return '#2f855a'; // green
    case 'Pending': return '#d69e2e'; // yellow/orange
    case 'Cancelled': return '#c53030'; // red
    default: return '#718096'; // gray
  }
};

// --- FIX: Apply the default theme to each styled component ---
const TableWrapper = styled.div`
  overflow-x: auto;
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
`;
TableWrapper.defaultProps = { theme: defaultTheme };

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
  }
  th {
    background-color: ${(props) => props.theme.colors.surfaceLight};
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${(props) => props.theme.colors.textSecondary};
  }
  tbody tr:hover {
    background-color: ${(props) => props.theme.colors.surfaceLight};
  }
`;
StyledTable.defaultProps = { theme: defaultTheme };

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: ${(props) => props.theme.colors.textSecondary};
`;
EmptyState.defaultProps = { theme: defaultTheme };


const StatusSelect = styled(Select)`
    background-color: ${props => props.color || '#718096'};
    color: white;
    font-weight: bold;
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right .7em top 50%;
    background-size: .65em auto;

    &:-ms-expand {
        display: none;
    }
`;

const POTable = ({ data, loading, onUpdateStatus, onView }) => {
  if (loading) {
    return <EmptyState>Loading purchase orders...</EmptyState>;
  }

  // --- FIX: Ensure 'data' is an array and filter out any invalid entries ---
  // This prevents the map function from crashing on null/undefined 'po' objects.
  const validData = Array.isArray(data) ? data.filter(Boolean) : [];

  if (validData.length === 0) {
    return <EmptyState>No purchase orders found. Create one to get started!</EmptyState>;
  }

  return (
    <TableWrapper>
      <StyledTable>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Supplier</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {validData.map((po) => (
            <tr key={po._id || po.orderNumber}> {/* Fallback key */}
              {/* --- FIX: Use optional chaining (?.) and nullish coalescing (??) for safety --- */}
              <td>{po.orderNumber ?? 'N/A'}</td>
              <td>{po.supplier?.name ?? 'N/A'}</td>
              <td>{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}</td>
              <td>
                 <StatusSelect 
                    value={po.status} 
                    onChange={(e) => onUpdateStatus && onUpdateStatus(po._id, e.target.value)}
                    color={getStatusColor(po.status)}
                    disabled={!onUpdateStatus}
                 >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                 </StatusSelect>
              </td>
              <td>RWF {(po.totalAmount ?? 0).toLocaleString()}</td>
              <td>
                <Button variant="ghost" size="sm" onClick={() => onView && onView(po)} disabled={!onView}>
                  <FaEye style={{ marginRight: '4px' }} /> View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </TableWrapper>
  );
};

export default POTable;