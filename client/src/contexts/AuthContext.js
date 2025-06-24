"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import toast from "react-hot-toast"

const AuthContext = createContext()

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      localStorage.setItem("token", token)
    } else {
      delete axios.defaults.headers.common["Authorization"]
      localStorage.removeItem("token")
    }
  }

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      setAuthToken(token)
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post("/auth/register", userData)
      toast.success(response.data.message)
      return { success: true, data: response.data }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed"
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password })
      const { token, user: userData } = response.data

      setAuthToken(token)
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))

      toast.success("Login successful!")
      return { success: true, data: response.data }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed"
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Logout function
  const logout = () => {
    setAuthToken(null)
    setUser(null)
    localStorage.removeItem("user")
    toast.success("Logged out successfully")

    // Redirect to login page
    setTimeout(() => {
      navigate("/login")
    }, 1000)
  }

  // Verify email function
  const verifyEmail = async (token) => {
    try {
      const response = await axios.post(`/auth/verify-email/${token}`)
      toast.success(response.data.message)
      return { success: true, data: response.data }
    } catch (error) {
      const message = error.response?.data?.message || "Email verification failed"
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    verifyEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
