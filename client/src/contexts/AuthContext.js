"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
  const [loading, setLoading] = useState(true)

  const verifyAuth = useCallback(async () => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token")
    if (savedToken) {
      try {
        const response = await authAPI.me()
        if (response && response.user) {
          setUser(response.user)
          setToken(savedToken)
        } else {
          throw new Error("Invalid user data received from server.")
        }
      } catch (error) {
        console.error("Token verification failed:", error.message)
        setUser(null)
        setToken(null)
        localStorage.removeItem("token")
        sessionStorage.removeItem("token")
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    sessionStorage.removeItem("token")
    window.location.href = '/login'
  }

  const login = async (credentials, remember = false) => {
    const loginResponse = await authAPI.login(credentials);
    if (loginResponse && loginResponse.token) {
      const newToken = loginResponse.token;
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("token", newToken);
      setToken(newToken);
      try {
        const profileResponse = await authAPI.me();
        if (profileResponse && profileResponse.user) {
          setUser(profileResponse.user);
        } else {
          throw new Error("Login successful, but failed to fetch user profile.");
        }
      } catch (error) {
        logout();
        throw error;
      }
    }
    return loginResponse;
  }

  const signup = async (registrationData) => {
    const registerResponse = await authAPI.signup(registrationData)
    if (registerResponse && registerResponse.token) {
      const newToken = registerResponse.token
      localStorage.setItem("token", newToken)
      setToken(newToken)
      try {
        const profileResponse = await authAPI.me()
        if (profileResponse && profileResponse.user) {
          setUser(profileResponse.user)
        } else {
          throw new Error("Failed to fetch user profile after registration.")
        }
      } catch (error) {
        logout()
        throw error
      }
    }
    return registerResponse
  }

  const isAdmin = useCallback(() => user?.role === "admin", [user])

  const hasModuleAccess = useCallback((requiredModule) => {
    if (!user || !requiredModule) return false
    return isAdmin() || user.modules?.includes(requiredModule)
  }, [user, isAdmin])

  const hasPermission = useCallback((module, action) => {
    if (!user || !module || !action) return false
    if (isAdmin()) return true
    const userPermissions = user.permissions?.[module]
    return userPermissions?.includes(action)
  }, [user, isAdmin])

  // --- THE CRITICAL PART ---
  // Ensure 'signup' is included in this value object.
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    signup, // This is the line that was likely missing or incorrect
    isAuthenticated: !!token && !!user,
    isAdmin,
    hasModuleAccess,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext