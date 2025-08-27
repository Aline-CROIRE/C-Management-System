"use client";

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaBell, FaTimes, FaCheck, FaTrash } from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';
import Button from '../common/Button';

// --- Styled Components ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideIn = keyframes`from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); }`;

const PanelOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: transparent; // Invisible overlay to catch clicks
  z-index: 1090;
`;

const PanelContainer = styled.div`
  position: absolute;
  top: 70px; // Position below the header
  right: 2rem;
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid #e2e8f0;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  max-height: 500px;
  animation: ${slideIn} 0.3s ease-out;
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
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: ${props => props.isUnread ? '#e6f7ff' : 'transparent'};
  &:last-child { border-bottom: none; }
`;

const IconWrapper = styled.div`
  margin-right: 1rem;
  color: ${props => props.theme.colors.primary};
`;

const Content = styled.div`
  flex-grow: 1;
  p { margin: 0; font-size: 0.9rem; color: #495057; }
  time { font-size: 0.75rem; color: #adb5bd; margin-top: 0.25rem; }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
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
`;

// Helper function to format time
const formatTimeAgo = (date) => {
    // ... (Your time formatting logic)
    return new Date(date).toLocaleString(); // Placeholder
};

const NotificationPanel = ({ onClose }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    return (
        <>
            <PanelOverlay onClick={onClose} />
            <PanelContainer>
                <PanelHeader>
                    <h3>Notifications ({unreadCount})</h3>
                    <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                </PanelHeader>
                <PanelBody>
                    {notifications.length > 0 ? (
                        <NotificationList>
                            {notifications.map(n => (
                                <NotificationItem key={n._id} isUnread={!n.read}>
                                    <IconWrapper><FaBell /></IconWrapper>
                                    <Content>
                                        <p>{n.message}</p>
                                        <time>{formatTimeAgo(n.createdAt)}</time>
                                    </Content>
                                    <Actions>
                                        {/*!n.read && <Button size="sm" iconOnly title="Mark as Read" variant="ghost" onClick={() => markAsRead(n._id)}><FaCheck /></Button>*/}
                                        <Button size="sm" iconOnly title="Delete" variant="ghost" onClick={() => deleteNotification(n._id)}><FaTrash /></Button>
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
                {notifications.length > 0 && (
                    <PanelFooter>
                        <Button variant="link" onClick={markAllAsRead}>Mark All as Read</Button>
                    </PanelFooter>
                )}
            </PanelContainer>
        </>
    );
};

export default NotificationPanel;