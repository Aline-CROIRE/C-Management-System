"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
// Note: Ensure this path is correct for your project structure.
// You previously provided a file at 'services/api.js'.
import { notificationsAPI } from "../services/api"
import { useAuth } from "./AuthContext"

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // This function is now much cleaner.
  const fetchNotifications = useCallback(async () => {
    try {
      // 1. No need for manual headers. The 'api.js' interceptor handles the token.
      const response = await notificationsAPI.getAll()

      // 2. Access 'success' and 'notifications' directly on the response.
      // The 'api.js' interceptor has already unwrapped 'response.data'.
      if (response?.success) {
        setNotifications(response.notifications)
        setUnreadCount(response.notifications.filter((n) => !n.read).length)
      }
    } catch (error) {
      // The interceptor will show a toast, but we can still log the error here.
      console.error("Error fetching notifications:", error)
    }
  }, []) // The 'token' dependency is no longer needed here as it's handled in the interceptor.

  useEffect(() => {
    if (loading) return // Don't fetch while auth is loading
    if (!isAuthenticated) {
      // Clear notifications if the user logs out.
      setNotifications([])
      setUnreadCount(0)
      return
    }

    fetchNotifications()

    const interval = setInterval(fetchNotifications, 30000) // 30-second polling
    return () => clearInterval(interval)
  }, [loading, isAuthenticated, fetchNotifications])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      // No manual headers needed.
      await notificationsAPI.markAsRead(notificationId)

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      // No manual headers needed.
      await notificationsAPI.markAllAsRead()

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [])

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        // No manual headers needed.
        await notificationsAPI.delete(notificationId)
        
        // Find the notification before updating state
        const notificationToDelete = notifications.find((n) => n._id === notificationId)
        
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
        
        // Only decrement unread count if the deleted notification was unread
        if (notificationToDelete && !notificationToDelete.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }

      } catch (error) {
        console.error("Error deleting notification:", error)
      }
    },
    [notifications] // Dependency on 'notifications' is correct here.
  )

  const showToast = useCallback((message, type = "info") => {
    switch (type) {
      case "success":
        toast.success(message)
        break
      case "error":
       toast.error(message)
        break
      case "warning":
        toast.warning(message)
        break
      default:
        toast.info(message)
    }
  }, [])

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast,
    fetchNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}