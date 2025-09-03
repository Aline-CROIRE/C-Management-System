"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
import { notificationsAPI } from "../services/api"
import { useAuth } from "./AuthContext" // Assuming AuthContext provides isAuthenticated and loading

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth() // Renamed loading to authLoading to avoid conflict

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true); // Added loading state for notifications itself

  const fetchNotifications = useCallback(async () => {
    if (authLoading || !isAuthenticated) { // Only fetch if authenticated and auth is not loading
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await notificationsAPI.getAll();
      if (response?.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount); // Use the unreadCount from the API response
      } else {
        // API interceptor should handle toast for errors, but log here
        console.error("Failed to fetch notifications from API:", response?.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // toast.error is usually handled by the axios interceptor
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    // Fetch immediately on mount if authenticated
    fetchNotifications();

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    
    // Cleanup interval on unmount or if auth status changes
    return () => clearInterval(interval);
  }, [fetchNotifications]); // Re-run effect if fetchNotifications changes (i.e., auth status changes)

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        const response = await notificationsAPI.delete(notificationId);
        if (response.success) {
            const notificationToDelete = notifications.find((n) => n._id === notificationId);
            setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
            if (notificationToDelete && !notificationToDelete.read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifications] // Dependency on 'notifications' is correct here.
  );

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
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading, // Expose loading state
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast,
    refetchNotifications: fetchNotifications, // Provide a refetch function
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}