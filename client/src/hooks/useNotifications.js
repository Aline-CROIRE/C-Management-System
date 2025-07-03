"use client"

import { useState, useEffect, useCallback } from "react"

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])

  // Mock notifications - in real app these would come from API/WebSocket
  const mockNotifications = [
    {
      id: 1,
      type: "low_stock",
      title: "Low Stock Alert",
      message: "Organic Tomatoes is running low (45 kg remaining)",
      timestamp: new Date().toISOString(),
      read: false,
      priority: "high",
      itemId: 2,
    },
    {
      id: 2,
      type: "out_of_stock",
      title: "Out of Stock",
      message: "Industrial Cement is completely out of stock",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      priority: "critical",
      itemId: 3,
    },
    {
      id: 3,
      type: "reorder_point",
      title: "Reorder Point Reached",
      message: "Construction Steel Bars has reached reorder point",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      priority: "medium",
      itemId: 1,
    },
    {
      id: 4,
      type: "expiry_warning",
      title: "Expiry Warning",
      message: "Organic Tomatoes will expire in 3 days",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      read: false,
      priority: "high",
      itemId: 2,
    },
  ]

  useEffect(() => {
    // Initialize with mock data
    setNotifications(mockNotifications)

    // Simulate real-time notifications
    const interval = setInterval(() => {
      // Add random notification occasionally
      if (Math.random() < 0.1) {
        // 10% chance every interval
        const newNotification = {
          id: Date.now(),
          type: "system",
          title: "System Update",
          message: "Inventory data has been synchronized",
          timestamp: new Date().toISOString(),
          read: false,
          priority: "low",
        }
        setNotifications((prev) => [newNotification, ...prev])
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      priority: "medium",
      ...notification,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length
  const criticalCount = notifications.filter((n) => n.priority === "critical" && !n.read).length

  return {
    notifications,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    addNotification,
  }
}
