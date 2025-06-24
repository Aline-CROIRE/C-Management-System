"use client"

import { useAuth } from "../../contexts/AuthContext"
import LoadingSpinner from "../common/LoadingSpinner"

const ProtectedRoute = ({ children, requiredRole = null, requiredModule = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <div>Access denied. Please log in.</div>
  }

  // Check role-based access
  if (requiredRole && !checkRoleAccess(user.role, requiredRole)) {
    return <div>Access denied. Insufficient permissions.</div>
  }

  // Check module-based access
  if (requiredModule && !user.modules.includes(requiredModule) && user.role !== "Super Admin") {
    return <div>Access denied. Module not available for your account.</div>
  }

  return children
}

const checkRoleAccess = (userRole, requiredRole) => {
  const roleHierarchy = {
    "Super Admin": 4,
    Admin: 3,
    Manager: 2,
    User: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export default ProtectedRoute
