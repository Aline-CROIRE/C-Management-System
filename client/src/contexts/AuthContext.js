"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
// Import the specific, structured API methods
import { authAPI } from "../services/api"

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true) // Start true to show a loader while verifying

  /**
   * Verifies the user's token on initial app load.
   * Fetches the latest user data from the server to ensure all state is fresh.
   */
  const verifyAuth = useCallback(async () => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token")

    if (savedToken) {
      try {
        // Your api.js interceptor returns the data object directly, so `response`
        // will be an object like { success: true, user: {...} }
        const response = await authAPI.me()
        
        // --- THE KEY FIX IS HERE ---
        // We access `response.user` directly, not `response.data.user`.
        // We also check if `response` and `response.user` exist before setting state.
        if (response && response.user) {
          setUser(response.user)
          setToken(savedToken)
        } else {
          // If the response is successful but doesn't contain a user, logout.
          throw new Error("Invalid user data received from server.");
        }
      } catch (error) {
        // If the token is invalid (e.g., expired), the API call will fail.
        // The interceptor will show a toast, and we ensure the user is logged out.
        console.error("Token verification failed:", error.message)
        setUser(null)
        setToken(null)
        localStorage.removeItem("token")
        sessionStorage.removeItem("token")
      }
    }
    // Always stop loading after verification attempt is complete.
    setLoading(false)
  }, [])

  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  /**
   * Handles user login. Stores user data and token.
   * @param {object} userData - The full user object from the API response.
   * @param {string} authToken - The JWT token.
   * @param {boolean} remember - Whether to use localStorage or sessionStorage.
   */
  const login = (userData, authToken, remember = false) => {
    setUser(userData)
    setToken(authToken)

    const storage = remember ? localStorage : sessionStorage
    storage.setItem("token", authToken)
    // It's often better not to store the full user object in storage
    // as it can become stale. The token is the source of truth.
  }

  /**
   * Logs the user out, clears all stored session data, and redirects to login.
   */
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    sessionStorage.removeItem("token")
    // A hard redirect is often used to clear all app state.
    window.location.href = '/login'
  }

  // --- Authorization Helper Functions ---
  const isAdmin = useCallback(() => user?.role === "admin", [user])

  const hasModuleAccess = useCallback((requiredModule) => {
    if (!user || !requiredModule) return false
    // An admin has access to all modules implicitly.
    return isAdmin() || user.modules?.includes(requiredModule)
  }, [user, isAdmin])

  const hasPermission = useCallback((module, action) => {
    if (!user || !module || !action) return false
    // An admin has all permissions implicitly.
    if (isAdmin()) return true;
    
    const userPermissions = user.permissions?.[module]
    return userPermissions?.includes(action)
  }, [user, isAdmin])

  // The value provided to the rest of the application.
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin,
    hasModuleAccess,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext