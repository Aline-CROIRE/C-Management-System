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
  
  // --- THE CORRECTED LOGIN FUNCTION ---
  const login = async (credentials, remember = false) => {
    // Step 1: Authenticate and get the token from the login response.
    const loginResponse = await authAPI.login(credentials);

    if (loginResponse && loginResponse.token) {
      // Step 2: Immediately save the new token so the next API call is authenticated.
      const newToken = loginResponse.token;
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("token", newToken);
      setToken(newToken);

      try {
        // Step 3: Fetch the complete and authoritative user profile from the '/auth/me' endpoint.
        const profileResponse = await authAPI.me();
        if (profileResponse && profileResponse.user) {
          // Step 4: Set the user state with the complete data.
          setUser(profileResponse.user);
        } else {
          throw new Error("Login successful, but failed to fetch user profile.");
        }
      } catch (error) {
        logout(); // If fetching profile fails, clear state
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


  const value = {
    user,
    token,
    loading,
    login,
    logout,

    signup,

    isAuthenticated: !!token && !!user,
    isAdmin,
    hasModuleAccess,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext