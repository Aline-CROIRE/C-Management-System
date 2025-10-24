
// client/src/components/restaurant/KDSView.js
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaCheck, FaTimes, FaHourglassHalf, FaSync, FaUtensils, FaTable, FaUser, FaClock } from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const KDSContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const KDSHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const KDSGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const OrderTicket = styled(Card)`
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
  border-left: 5px solid ${props => {
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
  ${props => props.$orderStatus === 'ready' && css`
    animation: ${blink} 1s infinite;
  `}

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
    align-items: center;
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    border-bottom: 1px dashed ${(props) => props.theme.colors?.borderLight};

    strong {
      flex-grow: 1;
    }
    .status-actions {
        display: flex;
        gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    }
    .item-status-tag {
        background: ${props => {
            switch (props.$itemStatus) {
                case 'pending': return props.theme.colors?.warningLight;
                case 'preparing': return props.theme.colors?.infoLight;
                case 'ready': return props.theme.colors?.successLight;
                case 'served': return props.theme.colors?.secondaryLight;
                default: return props.theme.colors?.surfaceLight;
            }
        }};
        color: ${props => {
            switch (props.$itemStatus) {
                case 'pending': return props.theme.colors?.warningDark;
                case 'preparing': return props.theme.colors?.infoDark;
                case 'ready': return props.theme.colors?.successDark;
                case 'served': return props.theme.colors?.secondaryDark;
                default: return props.theme.colors?.textSecondary;
            }
        }};
        padding: 0.2rem 0.5rem;
        border-radius: ${(props) => props.theme.borderRadius?.sm || "3px"};
        font-size: 0.75rem;
        text-transform: capitalize;
    }
  }
  .overall-actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
  }
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;


const KDSView = ({ restaurantId }) => {
  const [kdsOrders, setKdsOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIntervalId, setRefreshIntervalId] = useState(null);

  const fetchKdsOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await restaurantAPI.getKdsOrders(restaurantId);
      if (response?.success) {
        setKdsOrders(response.data);
      } else {
        setError(response?.message || 'Failed to fetch KDS orders.');
        toast.error(response?.message || 'Failed to fetch KDS orders.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching KDS orders.');
      toast.error(err.message || 'An error occurred fetching KDS orders.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchKdsOrders();

    const interval = setInterval(fetchKdsOrders, 10000);
    setRefreshIntervalId(interval);

    return () => clearInterval(interval);
  }, [fetchKdsOrders]);

  const handleUpdateOrderItemStatus = async (orderId, itemId, newStatus) => {
    try {
      await restaurantAPI.updateKdsOrderItemStatus(restaurantId, orderId, itemId, { status: newStatus });
      toast.success(`Item status updated to ${newStatus}!`);
      fetchKdsOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to update item status.');
    }
  };

  const handleMarkOrderReady = async (orderId) => {
    try {
        const orderToUpdate = kdsOrders.find(o => o._id === orderId);
        if (!orderToUpdate) return;

        for (const item of orderToUpdate.items) {
            if (item.status !== 'ready' && item.status !== 'served' && item.status !== 'cancelled') {
                await restaurantAPI.updateKdsOrderItemStatus(restaurantId, orderId, item._id, { status: 'ready' });
            }
        }
        await restaurantAPI.updateOrder(restaurantId, orderId, { status: 'ready' });
        toast.success(`Order ${orderId.slice(-6)} marked as Ready!`);
        fetchKdsOrders();
    } catch (err) {
        toast.error(err.message || 'Failed to mark order ready.');
    }
  };

  const handleMarkOrderServed = async (orderId) => {
    try {
        await restaurantAPI.updateOrder(restaurantId, orderId, { status: 'served' });
        toast.success(`Order ${orderId.slice(-6)} marked as Served!`);
        fetchKdsOrders();
    } catch (err) {
        toast.error(err.message || 'Failed to mark order served.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <KDSContainer>
      <KDSHeader>
        <h3>Kitchen Display System</h3>
        <div>
          <Button variant="outline" onClick={fetchKdsOrders} disabled={loading}><SpinningFaSync /> Refresh</Button>
        </div>
      </KDSHeader>

      <KDSGrid>
        {kdsOrders.length > 0 ? (
          kdsOrders.map((order) => (
            <OrderTicket key={order._id} $orderStatus={order.status}>
              <h4>Order #{order._id.slice(-6)}</h4>
              <div className="order-meta">
                <span><FaClock style={{marginRight: '0.2rem'}} /> {new Date(order.createdAt).toLocaleTimeString()}</span>
                {order.table && <span><FaTable style={{marginRight: '0.2rem'}} /> Table {order.table.tableNumber}</span>}
                {order.customerName && <span><FaUser style={{marginRight: '0.2rem'}} /> {order.customerName}</span>}
              </div>

              <div className="items-list">
                {order.items.map((item) => (
                  <div key={item._id} className="item-entry" $itemStatus={item.status}>
                    <strong>{item.quantity}x {item.name}</strong>
                    <div className="status-actions">
                      <span className="item-status-tag" $itemStatus={item.status}>{item.status}</span>
                      {item.status === 'pending' && (
                          <Button size="sm" variant="info" onClick={() => handleUpdateOrderItemStatus(order._id, item._id, 'preparing')}><FaHourglassHalf /></Button>
                      )}
                      {item.status === 'preparing' && (
                          <Button size="sm" variant="success" onClick={() => handleUpdateOrderItemStatus(order._id, item._id, 'ready')}><FaCheck /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="overall-actions">
                {order.status === 'preparing' && (
                    <Button variant="success" onClick={() => handleMarkOrderReady(order._id)}><FaCheck /> Mark All Ready</Button>
                )}
                {order.status === 'ready' && (
                    <Button variant="primary" onClick={() => handleMarkOrderServed(order._id)}><FaCheck /> Mark Served</Button>
                )}
              </div>
            </OrderTicket>
          ))
        ) : (
          <p>No active orders in the kitchen.</p>
        )}
      </KDSGrid>
    </KDSContainer>
  );
};

export default KDSView;
