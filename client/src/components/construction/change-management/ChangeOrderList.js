import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaEdit, FaTrash, FaSearch, FaFileAlt, FaCheck, FaTimes, 
  FaComments, FaHistory, FaFileExport, FaFilter, FaChartLine 
} from 'react-icons/fa';
import Table from '../../common/Table';
import Button from '../../common/Button';
import SearchInput from '../../common/SearchInput';
import Badge from '../../common/Badge';
import DateRangePicker from '../../common/DateRangePicker';
import Modal from '../../common/Modal';
import Chart from '../../common/Chart';

const ListContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ListActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors?.border};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const StatusBadge = styled(Badge)`
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
`;

const AnalyticsPanel = styled.div`
  padding: 1rem;
  background: ${props => props.theme.colors?.background};
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const FilterPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.colors?.surfaceLight};
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const ChangeOrderList = ({ 
  siteId, 
  loading, 
  onApprove, 
  onReject, 
  onEdit, 
  onDelete,
  onExport,
  onComment,
  data = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    costImpact: 'all',
    priority: 'all',
    category: 'all'
  });

  // Analytics calculations
  const analytics = {
    totalOrders: data.length,
    pendingApproval: data.filter(o => o.status === 'Pending').length,
    totalCostImpact: data.reduce((sum, o) => sum + o.costImpact, 0),
    averageProcessingTime: calculateAverageProcessingTime(data)
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: 'id',
      width: '120px'
    },
    {
      header: 'Description',
      accessor: 'description',
      Cell: ({ value }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaFileAlt />
          {value}
        </div>
      )
    },
    {
      header: 'Requested By',
      accessor: 'requestedBy'
    },
    {
      header: 'Date',
      accessor: 'date'
    },
    {
      header: 'Cost Impact',
      accessor: 'costImpact',
      Cell: ({ value }) => (
        <span style={{ color: value >= 0 ? '#4CAF50' : '#f44336' }}>
          ${Math.abs(value).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
        <StatusBadge
          variant={
            value === 'Approved' ? 'success' :
            value === 'Pending' ? 'warning' :
            value === 'Rejected' ? 'danger' : 'default'
          }
        >
          {value}
        </StatusBadge>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.original.status === 'Pending' && (
            <>
              <Button variant="icon" color="success" onClick={() => onApprove(row.original.id)}>
                <FaCheck />
              </Button>
              <Button variant="icon" color="danger" onClick={() => onReject(row.original.id)}>
                <FaTimes />
              </Button>
            </>
          )}
          <Button variant="icon" onClick={() => onEdit(row.original.id)}>
            <FaEdit />
          </Button>
          <Button variant="icon" color="danger" onClick={() => onDelete(row.original.id)}>
            <FaTrash />
          </Button>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      Cell: ({ value }) => (
        <Badge variant={value === 'High' ? 'danger' : value === 'Medium' ? 'warning' : 'info'}>
          {value}
        </Badge>
      )
    },
    {
      header: 'Category',
      accessor: 'category'
    },
    {
      header: 'Timeline Impact',
      accessor: 'timelineImpact',
      Cell: ({ value }) => `${value} days`
    },
    {
      header: 'Comments',
      accessor: 'comments',
      Cell: ({ row }) => (
        <Button 
          variant="icon" 
          onClick={() => handleCommentClick(row.original)}
          badge={row.original.comments?.length}
        >
          <FaComments />
        </Button>
      )
    },
  ];

  const handleExport = (format) => {
    const filteredData = applyFilters(data);
    onExport(filteredData, format);
  };

  const applyFilters = (data) => {
    return data.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch = order.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateRange = isWithinDateRange(order.date, dateRange);
      const matchesCustomFilters = matchesAdvancedFilters(order, filters);
      return matchesStatus && matchesSearch && matchesDateRange && matchesCustomFilters;
    });
  };

  return (
    <ListContainer>
      <AnalyticsPanel>
        <Button onClick={() => setShowAnalytics(!showAnalytics)}>
          <FaChartLine /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </Button>
        {showAnalytics && (
          <Chart
            data={data}
            type="line"
            options={{
              xAxis: 'date',
              yAxis: 'costImpact',
              groupBy: 'status'
            }}
          />
        )}
      </AnalyticsPanel>

      <FilterPanel>
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={setDateRange}
        />
        <SearchInput
          placeholder="Search change orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<FaSearch />}
        />
        {/* Advanced filters */}
      </FilterPanel>

      <ListActions>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={() => handleExport('pdf')}>
            <FaFileExport /> Export PDF
          </Button>
          <Button onClick={() => handleExport('excel')}>
            <FaFileExport /> Export Excel
          </Button>
        </div>
      </ListActions>

      <Table
        columns={columns}
        data={applyFilters(data)}
        loading={loading}
        pagination
        searchTerm={searchTerm}
        sortable
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Modals for comments, history, etc. */}
    </ListContainer>
  );
};

export default ChangeOrderList;