
// client/src/components/restaurant/OrderManagement.js
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  FaCheck,
  FaTimes,
  FaDollarSign,
  FaEye,
  FaSync,
  FaSearch,
  FaFilter,
  FaClock,
  FaTable,
  FaUser
} from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};

  @media (max-width: 768px) {
    margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  }
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 450px;

  @media (max-width: 480px) {
    min-width: unset;
    max-width: unset;
    width: 100%;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors.textSecondary};
  z-index: 2;
  pointer-events: none;
`;

const SearchInput = styled(Input)`
  padding-left: 3rem;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  border: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: 480px) {
    padding: 0.85rem 1rem;
    padding-left: 2.85rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  flex-wrap: wrap;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch;
    button {
      flex-grow: 1;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  }
`;

const OrderManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const OrderList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const OrderCard = styled(Card)`
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 5px;
    background: ${(props) => {
      switch (props.$orderStatus) {
        case 'pending': return props.theme.colors?.warning;
        case 'preparing': return props.theme.colors?.info;
        case 'ready': return props.theme.colors?.success;
        case 'served': return props.theme.colors?.primary;
        case 'completed': return props.theme.colors?.secondary;
        case 'cancelled': return props.theme.colors?.danger;
        default: return props.theme.colors?.border;
      }
    }};
  }

  h4 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: 0 0 ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    color: ${(props) => props.theme.colors?.heading};
  }

  .order-meta {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#666"};
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }
  }

  .items-list {
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
    flex-grow: 1;
  }

  .item-entry {
    display: flex;
    justify-content: space-between;
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    border-bottom: 1px dashed ${(props) => props.theme.colors?.borderLight};

    &:last-child {
      border-bottom: none;
    }
  }

  .total {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
    display: flex;
    justify-content: space-between;
    border-top: 1px solid ${(props) => props.theme.colors?.border};
    padding-top: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  }

  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
    flex-wrap: wrap;
  }
`;

const OrderManagement = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: filterStatus, paymentStatus: filterPaymentStatus, search: debouncedSearchQuery };
      const response = await restaurantAPI.getOrders(restaurantId, params);
      if (response?.success) {
        setOrders(response.data);
      } else {
        setError(response?.message || 'Failed to fetch orders.');
        toast.error(response?.message || 'Failed to fetch orders.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching orders.');
      toast.error(err.message || 'An error occurred fetching orders.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterStatus, filterPaymentStatus, debouncedSearchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOrders]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await restaurantAPI.updateOrder(restaurantId, orderId, { status: newStatus });
      toast.success(`Order ${orderId.slice(-6)} status updated to ${newStatus}!`);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to update order status.');
    }
  };

  const handleProcessPayment = async (orderId, totalAmount) => {
    const validMethods = ['cash', 'card', 'mobile_pay', 'bank_transfer'];
    const paymentMethod = prompt(
      `Processing payment for Order ${orderId.slice(-6)} for Rwf ${totalAmount.toFixed(2)}.\nEnter payment method:\n${validMethods.join(', ')}`
    );
    
    if (!paymentMethod) return;

    const method = paymentMethod.toLowerCase().trim();
    if (!validMethods.includes(method)) {
      toast.error(`Invalid payment method. Use: ${validMethods.join(', ')}`);
      return;
    }

    try {
      const amountPaid = parseFloat(prompt(`Amount paid (Rwf ${totalAmount.toFixed(2)}):`)) || totalAmount;
      
      if (amountPaid < totalAmount) {
        toast.error(`Insufficient payment. Amount due: Rwf ${totalAmount.toFixed(2)}`);
        return;
      }

      await restaurantAPI.processPayment(restaurantId, orderId, { 
        paymentMethod: method, 
        amountPaid 
      });
      
      const change = amountPaid - totalAmount;
      toast.success(`Payment processed for Order ${orderId.slice(-6)}!${change > 0 ? ` Change: Rwf ${change.toFixed(2)}` : ''}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to process payment.');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'amount_high') return b.totalAmount - a.totalAmount;
    if (sortBy === 'amount_low') return a.totalAmount - b.totalAmount;
    return 0;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <OrderManagementContainer>
      <ActionBar>
        <h3>All Orders</h3>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search orders by customer name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <ActionButtons>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
            title="Filter by order status"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
            title="Filter by payment status"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
            title="Sort orders"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_high">Highest Amount</option>
            <option value="amount_low">Lowest Amount</option>
          </select>
          <Button variant={autoRefresh ? "success" : "outline"} onClick={() => setAutoRefresh(!autoRefresh)} title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}>
            {autoRefresh ? '✓ Auto' : '✗ Manual'}
          </Button>
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            <SpinningFaSync /> Refresh
          </Button>
        </ActionButtons>
      </ActionBar>

      <OrderList>
        {sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <OrderCard key={order._id} $orderStatus={order.status}>
              <h4>Order #{order._id.slice(-6)}</h4>
              <div className="order-meta">
                <span><FaClock /> {new Date(order.createdAt).toLocaleString()}</span>
                {order.table && <span><FaTable style={{ marginRight: '0.2rem' }} /> Table {order.table.tableNumber}</span>}
                {order.customerName && <span><FaUser style={{ marginRight: '0.2rem' }} /> {order.customerName}</span>}
                <span>Status: <strong style={{ textTransform: 'capitalize' }}>{order.status}</strong></span>
                <span>Payment: <strong style={{ textTransform: 'capitalize' }}>{order.paymentStatus.replace('_', ' ')}</strong></span>
              </div>
              <div className="items-list">
                {order.items.map((item, index) => (
                  <div key={index} className="item-entry">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="total">
                <span>Total:</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="actions">
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'served' && (
                  <>
                    <Button size="sm" variant="success" onClick={() => handleUpdateOrderStatus(order._id, 'served')}>
                      <FaCheck /> Mark Served
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}>
                      <FaTimes /> Cancel
                    </Button>
                  </>
                )}
                {order.paymentStatus === 'pending' && (
                  <Button size="sm" variant="primary" onClick={() => handleProcessPayment(order._id, order.totalAmount)}>
                    <FaDollarSign /> Pay Now
                  </Button>
                )}
              </div>
            </OrderCard>
          ))
        ) : (
          <p>No orders found for the selected filters.</p>
        )}
      </OrderList>
    </OrderManagementContainer>
  );
};

export default OrderManagement;
