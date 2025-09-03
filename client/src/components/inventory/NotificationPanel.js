
"use client";

import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import styled, { keyframes } from 'styled-components';
import { FaBell, FaTimes, FaCheck, FaTrash, FaExclamationTriangle, FaArchive, FaTruck, FaInfoCircle } from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import moment from 'moment';

const slideIn = keyframes`from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); }`;

const PanelOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: transparent; // Invisible overlay
  z-index: 1090; // Ensure it's above most content
`;

// IMPORTANT: PanelContainer's position is now calculated dynamically
const PanelContainer = styled.div`
  position: fixed; /* Keep fixed for viewport positioning */
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid #e2e8f0;
  z-index: 1100; /* Ensure it's above the overlay and header */
  display: flex;
  flex-direction: column;
  max-height: 500px; /* Limit height and allow scrolling */
  width: 100%;
  max-width: 400px;
  animation: ${slideIn} 0.3s ease-out;

  /* Dynamically set top/right via inline style */
  /* These values will be set by JS in the component, not here */

  @media (max-width: 768px) {
    right: 1rem;
    left: 1rem; /* Allows it to be centered or stretch */
    max-width: calc(100% - 2rem); /* Ensure it doesn't overflow viewport */
    margin: 0 auto; /* Center it horizontally if max-width is set */
  }
`;

const PanelHeader = styled.div`
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  h3 { margin: 0; font-size: 1.1rem; }
`;

const PanelBody = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const NotificationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NotificationItem = styled.li`
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: ${props => props.$isUnread ? '#f8faff' : 'transparent'};
  &:last-child { border-bottom: none; }
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f0f4f8;
  }
`;

const IconWrapper = styled.div`
  margin-right: 1rem;
  flex-shrink: 0;
  font-size: 1.2rem;
  color: ${props => props.$priorityColor || props.theme.colors.primary};
`;

const Content = styled.div`
  flex-grow: 1;
  h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    color: #1a202c;
  }
  p { margin: 0; font-size: 0.9rem; color: #495057; }
  time { font-size: 0.75rem; color: #adb5bd; margin-top: 0.25rem; display: block; }
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    font-size: 0.85rem;
    &:hover { text-decoration: underline; }
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin-left: 1rem;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: #6c757d;
  p { margin-top: 0.5rem; }
`;

const PanelFooter = styled.div`
  padding: 0.75rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
`;

const getNotificationIcon = (type, priority) => {
    switch (type) {
        case 'low_stock': return <FaExclamationTriangle />;
        case 'out_of_stock': return <FaArchive />;
        case 'po_completed': return <FaTruck />;
        case 'warning': return <FaExclamationTriangle />;
        case 'system': return <FaInfoCircle />;
        case 'info': return <FaInfoCircle />;
        default: return <FaBell />;
    }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return '#e53e3e';
    case 'high': return '#dd6b20';
    case 'medium': return '#d69e2e';
    case 'low': return '#4299e1';
    default: return '#718096';
  }
};

const NotificationPanel = ({ onClose, notificationPanelRef, anchorEl }) => { // Accept ref and anchorEl
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refetchNotifications } = useNotifications();
    const [panelPosition, setPanelPosition] = useState({});

    // Calculate and set panel position dynamically
    useEffect(() => {
      if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        // Position it just below the button, aligned to its right edge
        setPanelPosition({
          top: rect.bottom + 10, // 10px below the button
          right: window.innerWidth - rect.right, // Aligned with the right edge of the button
        });
      }
    }, [anchorEl]); // Recalculate if anchorEl changes

    const formatTimeAgo = (date) => {
        return moment(date).fromNow();
    };

    return (
        <>
            <PanelOverlay onClick={onClose} />
            <PanelContainer 
                ref={notificationPanelRef} // Attach ref to the container
                onClick={e => e.stopPropagation()} 
                style={panelPosition} // Apply dynamic position
            >
                <PanelHeader>
                    <h3>Notifications ({unreadCount})</h3>
                    <Button variant="ghost" size="sm" iconOnly title="Close" onClick={onClose}><FaTimes /></Button>
                </PanelHeader>
                <PanelBody>
                    {loading ? (
                        <EmptyState><LoadingSpinner /><p>Loading notifications...</p></EmptyState>
                    ) : notifications.length > 0 ? (
                        <NotificationList>
                            {notifications.map(n => (
                                <NotificationItem key={n._id} $isUnread={!n.read}>
                                    <IconWrapper $priorityColor={getPriorityColor(n.priority)}>
                                        {getNotificationIcon(n.type, n.priority)}
                                    </IconWrapper>
                                    <Content>
                                        <h4>{n.title}</h4>
                                        <p>{n.message}</p>
                                        <time>{formatTimeAgo(n.createdAt)}</time>
                                        {n.link && <a href={n.link} onClick={onClose}>View Details</a>}
                                    </Content>
                                    <Actions>
                                        {!n.read && (
                                            <Button size="sm" iconOnly title="Mark as Read" variant="ghost" onClick={() => markAsRead(n._id)}>
                                                <FaCheck />
                                            </Button>
                                        )}
                                        <Button size="sm" iconOnly title="Delete" variant="ghost" onClick={() => deleteNotification(n._id)}>
                                            <FaTrash />
                                        </Button>
                                    </Actions>
                                </NotificationItem>
                            ))}
                        </NotificationList>
                    ) : (
                        <EmptyState>
                            <FaBell size={32} style={{opacity: 0.5}} />
                            <p>You have no new notifications.</p>
                        </EmptyState>
                    )}
                </PanelBody>
                {notifications.length > 0 && !loading && (
                    <PanelFooter>
                        <Button variant="link" onClick={markAllAsRead}>Mark All as Read</Button>
                        <Button variant="link" onClick={refetchNotifications}>Refresh</Button>
                    </PanelFooter>
                )}
            </PanelContainer>
        </>
    );
};

export default NotificationPanel;