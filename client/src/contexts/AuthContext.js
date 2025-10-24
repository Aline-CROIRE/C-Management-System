// client/src/contexts/AuthContext.js (Focus on login/signup and verifyAuth)
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
        console.log("AuthContext: verifyAuth - Calling authAPI.me()");
        const response = await authAPI.me();
        if (response?.success && response.user) {
          console.log("AuthContext: verifyAuth - User data fetched (includes restaurantId & permissions?):", response.user);
          setUser({ ...response.user });
          setToken(savedToken);
        } else {
          console.log("AuthContext: verifyAuth - Invalid user data or API failure, logging out.", response?.message);
          throw new Error(response?.message || "Invalid user data received from server.");
        }
      } catch (error) {
        console.error("AuthContext: Token verification failed:", error.message, error);
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      }
    } else {
        console.log("AuthContext: No saved token found.");
    }
    setLoading(false);
    console.log("AuthContext: verifyAuth completed, loading set to false.");
  }, []);

  useEffect(() => {
    console.log("AuthContext: useEffect triggered (initial load or verifyAuth changed).");
    verifyAuth();
  }, [verifyAuth]);

  const logout = () => {
    console.log("AuthContext: Logging out.");
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = '/login';
  }

  const login = async (credentials, remember = false) => {
    console.log("AuthContext: Attempting login.");
    const loginResponse = await authAPI.login(credentials);
    if (loginResponse?.success && loginResponse.token) {
      const newToken = loginResponse.token;
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("token", newToken);
      setToken(newToken);
      try {
        console.log("AuthContext: Login successful, fetching profile.");
        const profileResponse = await authAPI.me();
        if (profileResponse?.success && profileResponse.user) {
          console.log("AuthContext: Profile fetched after login (includes restaurantId & permissions?):", profileResponse.user);
          setUser({ ...profileResponse.user });
        } else {
          console.log("AuthContext: Failed to fetch profile after login, logging out.");
          throw new Error(profileResponse?.message || "Login successful, but failed to fetch user profile.");
        }
      } catch (error) {
        console.error("AuthContext: Error fetching profile after login:", error.message, error);
        logout();
        throw error;
      }
    }
    return loginResponse;
  }

  const signup = async (registrationData) => {
    console.log("AuthContext: Attempting signup.");
    const registerResponse = await authAPI.signup(registrationData);
    if (registerResponse?.success && registerResponse.token) {
      const newToken = registerResponse.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      try {
        console.log("AuthContext: Signup successful, fetching profile.");
        const profileResponse = await authAPI.me();
        if (profileResponse?.success && profileResponse.user) {
          console.log("AuthContext: Profile fetched after signup (includes restaurantId & permissions?):", profileResponse.user);
          setUser({ ...profileResponse.user });
        } else {
          console.log("AuthContext: Failed to fetch profile after signup, logging out.");
          throw new Error(profileResponse?.message || "Failed to fetch user profile after registration.");
        }
      } catch (error) {
        console.error("AuthContext: Error fetching profile after signup:", error.message, error);
        logout();
        throw error;
      }
    }
    return registerResponse;
  }

  const isAdmin = useCallback(() => user?.role === "admin", [user]);

  const hasModuleAccess = useCallback((requiredModule) => {
    if (!user || !requiredModule) return false;
    return isAdmin() || user.modules?.includes(requiredModule);
  }, [user, isAdmin]);

  const hasPermission = useCallback((module, action) => {
    if (!user) return false;
    if (isAdmin()) return true;
    if (user.modules?.includes(module)) return true;
    return false;
  }, [user, isAdmin]);

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
    verifyAuth // Expose verifyAuth for components to explicitly trigger a user refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;