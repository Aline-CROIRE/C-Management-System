"use client"
import styled from "styled-components"
import { FaTimes, FaBell, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaClock, FaEye } from "react-icons/fa"
import Button from "../common/Button"

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`

const ModalContent = styled.div`
  background: white;
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: ${(props) => props.theme.shadows?.xl || "0 25px 50px -12px rgba(0, 0, 0, 0.25)"};
`

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.border || "#e2e8f0"};
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }
`

const NotificationsList = styled.div`
  max-height: 60vh;
  overflow-y: auto;
`

const NotificationItem = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: ${(props) => (props.read ? "transparent" : props.theme.colors?.surfaceLight || "#f7fafc")};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.border || "#e2e8f0"};
  }

  &:last-child {
    border-bottom: none;
  }
`

const NotificationIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 18px;

  ${(props) => {
    switch (props.type) {
      case "low_stock":
      case "reorder_point":
        return `background: ${props.theme.colors?.warning || "#ed8936"};`
      case "out_of_stock":
      case "expiry_warning":
        return `background: ${props.theme.colors?.error || "#c53030"};`
      case "system":
        return `background: ${props.theme.colors?.primary || "#1b4332"};`
      default:
        return `background: ${props.theme.colors?.textSecondary || "#718096"};`
    }
  }}
`

const NotificationContent = styled.div`
  flex: 1;
`

const NotificationTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
`

const NotificationMessage = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  line-height: 1.5;
`

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`

const PriorityBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    switch (props.priority) {
      case "critical":
        return `
          background: ${props.theme.colors?.error || "#c53030"}20;
          color: ${props.theme.colors?.error || "#c53030"};
        `
      case "high":
        return `
          background: ${props.theme.colors?.warning || "#ed8936"}20;
          color: ${props.theme.colors?.warning || "#ed8936"};
        `
      case "medium":
        return `
          background: ${props.theme.colors?.primary || "#1b4332"}20;
          color: ${props.theme.colors?.primary || "#1b4332"};
        `
      default:
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
    }
  }}
`

const NotificationActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  transition: all 0.3s ease;
  font-size: 0.875rem;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};

  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }
`

const AlertsPanel = ({ notifications = [], onClose, onMarkAsRead, onClearAll }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
      case "reorder_point":
        return <FaExclamationTriangle />
      case "expiry_warning":
        return <FaClock />
      case "system":
        return <FaInfoCircle />
      default:
        return <FaBell />
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FaBell /> Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#ff4757",
                  color: "white",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {unreadCount}
              </span>
            )}
          </ModalTitle>
          <HeaderActions>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearAll}>
                Clear All
              </Button>
            )}
            <CloseButton onClick={onClose}>
              <FaTimes />
            </CloseButton>
          </HeaderActions>
        </ModalHeader>

        <NotificationsList>
          {notifications.length === 0 ? (
            <EmptyState>
              <div className="icon">
                <FaCheckCircle />
              </div>
              <h3>All caught up!</h3>
              <p>No new notifications at this time.</p>
            </EmptyState>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} read={notification.read}>
                <NotificationIcon type={notification.type}>{getNotificationIcon(notification.type)}</NotificationIcon>
                <NotificationContent>
                  <NotificationTitle>{notification.title}</NotificationTitle>
                  <NotificationMessage>{notification.message}</NotificationMessage>
                  <NotificationMeta>
                    <PriorityBadge priority={notification.priority}>{notification.priority}</PriorityBadge>
                    <span>{formatTimestamp(notification.timestamp)}</span>
                  </NotificationMeta>
                </NotificationContent>
                <NotificationActions>
                  {!notification.read && (
                    <ActionButton onClick={() => onMarkAsRead(notification.id)} title="Mark as read">
                      <FaEye />
                    </ActionButton>
                  )}
                  <ActionButton
                    onClick={() => {
                      /* Handle view item */
                    }}
                    title="View item"
                  >
                    <FaInfoCircle />
                  </ActionButton>
                </NotificationActions>
              </NotificationItem>
            ))
          )}
        </NotificationsList>
      </ModalContent>
    </ModalOverlay>
  )
}

export default AlertsPanel
