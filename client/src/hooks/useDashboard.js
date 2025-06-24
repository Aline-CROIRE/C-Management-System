"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"

export const useDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResponse, activitiesResponse] = await Promise.all([
        axios.get("/dashboard/stats"),
        axios.get("/dashboard/activities"),
      ])

      setStats(statsResponse.data)
      setActivities(activitiesResponse.data)
      setError(null)
    } catch (err) {
      console.error("Dashboard data fetch error:", err)
      setError(err.response?.data?.message || "Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const markActivityAsRead = async (activityId) => {
    try {
      await axios.patch(`/dashboard/activities/${activityId}/read`)
      setActivities((prev) =>
        prev.map((activity) => (activity._id === activityId ? { ...activity, isRead: true } : activity)),
      )
    } catch (err) {
      console.error("Mark activity as read error:", err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  return {
    stats,
    activities,
    loading,
    error,
    refetch: fetchDashboardData,
    markActivityAsRead,
  }
}
