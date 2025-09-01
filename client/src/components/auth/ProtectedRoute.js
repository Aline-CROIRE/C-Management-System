"use client"

import { useAuth } from "../../contexts/AuthContext"
import { Navigate, useLocation } from "react-router-dom"
import LoadingSpinner from "../common/LoadingSpinner"
import styled from "styled-components"

// --- Styled-components (Unchanged) ---
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
`
const AccessDeniedContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`
const AccessDeniedCard = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: 3rem;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(0, 0, 0, 0.1)"};
  max-width: 500px;
  width: 100%;
`
const AccessDeniedIcon = styled.div`
  font-size: 4rem;
  color: ${(props) => props.theme.colors?.error || "#c53030"};
  margin-bottom: 1.5rem;
`
const AccessDeniedTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: 1rem;
`
const AccessDeniedMessage = styled.p`
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin-bottom: 2rem;
  line-height: 1.6;
`
const BackButton = styled.button`
  background: ${(props) => props.theme.colors?.primary || "#1b4332"};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: ${(props) => props.theme.colors?.primaryDark || "#0f2419"};
    transform: translateY(-1px);
  }
`

/**
 * A client-side component that guards routes, ensuring the user is authenticated
 * and has the required permissions to access a page. It delegates all logic
 * to the `useAuth` hook, which is the single source of truth for auth state.
 */
const ProtectedRoute = ({ children, requiredModule, requiredRole, requiredPermission }) => {
  const {
    user,
    loading,
    isAuthenticated,
    hasModuleAccess,
    hasPermission,
    isAdmin,
  } = useAuth()
  
  const location = useLocation()

  // 1. Handle Loading State: While verifying the token, show a spinner.
  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="60px" />
      </LoadingContainer>
    )
  }

  // 2. Handle Unauthenticated State: If not logged in, redirect to the login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // This is a safety net for rare cases where auth state is inconsistent.
  if (!user) {
    // This state should ideally never be reached with the new AuthContext.
    // It indicates a severe problem if `isAuthenticated` is true but `user` is null.
    return (
      <AccessDeniedContainer>
        <AccessDeniedCard>
          <AccessDeniedTitle>Authentication Error</AccessDeniedTitle>
          <AccessDeniedMessage>
            Your session data is corrupted. Please try logging out and back in.
          </AccessDeniedMessage>
        </AccessDeniedCard>
      </AccessDeniedContainer>
    )
  }

  // --- Authorization Checks (in order of priority) ---

  // 3. Check Account Status: The most fundamental check.
  if (!user.isActive) {
    return (
      <AccessDeniedContainer>
        <AccessDeniedCard>
          <AccessDeniedIcon>🚫</AccessDeniedIcon>
          <AccessDeniedTitle>Account Deactivated</AccessDeniedTitle>
          <AccessDeniedMessage>
            Your account has been deactivated. Please contact an administrator for assistance.
          </AccessDeniedMessage>
          <BackButton onClick={() => window.history.back()}>Go Back</BackButton>
        </AccessDeniedCard>
      </AccessDeniedContainer>
    )
  }

  // 4. Check Email Verification (for sensitive routes)
  if (!user.isEmailVerified && (requiredRole === "admin" || requiredPermission)) {
    return (
      <AccessDeniedContainer>
        <AccessDeniedCard>
          <AccessDeniedIcon>📧</AccessDeniedIcon>
          <AccessDeniedTitle>Email Verification Required</AccessDeniedTitle>
          <AccessDeniedMessage>
            Please verify your email to access this page. A verification link was sent to your inbox.
          </AccessDeniedMessage>
          <BackButton onClick={() => window.history.back()}>Go Back</BackButton>
        </AccessDeniedCard>
      </AccessDeniedContainer>
    )
  }

  // 5. Check Role Requirement
  if (requiredRole && user.role !== requiredRole && !isAdmin()) {
    return (
      <AccessDeniedContainer>
        <AccessDeniedCard>
          <AccessDeniedIcon>🔒</AccessDeniedIcon>
          <AccessDeniedTitle>Access Denied</AccessDeniedTitle>
          <AccessDeniedMessage>
            You don't have the required role ({requiredRole}) to view this page.
          </AccessDeniedMessage>
          <BackButton onClick={() => window.history.back()}>Go Back</BackButton>
        </AccessDeniedCard>
      </AccessDeniedContainer>
    )
  }

  // 6. Check Module Access
  if (requiredModule && !hasModuleAccess(requiredModule)) {
    return (
      <AccessDeniedContainer>
        <AccessDeniedCard>
          <AccessDeniedIcon>📦</AccessDeniedIcon>
          <AccessDeniedTitle>Module Not Accessible</AccessDeniedTitle>
          <AccessDeniedMessage>
            Your account does not have access to the {requiredModule} module.
          </AccessDeniedMessage>
          <BackButton onClick={() => window.history.back()}>Go Back</BackButton>
        </AccessDeniedCard>
      </AccessDeniedContainer>
    )
  }

  // 7. Check Specific Permission
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return (
      <AccessDeniedContainer>
        <AccessDeniedCard>
          <AccessDeniedIcon>⚠️</AccessDeniedIcon>
          <AccessDeniedTitle>Insufficient Permissions</AccessDeniedTitle>
          <AccessDeniedMessage>
            You do not have permission to '{requiredPermission.action}' in the {requiredPermission.module} module.
          </AccessDeniedMessage>
          <BackButton onClick={() => window.history.back()}>Go Back</BackButton>
        </AccessDeniedCard>
      </AccessDeniedContainer>
    )
  }

  // --- All Checks Passed ---
  // If the user reaches this point, they are fully authorized to view the component.
  return children
}

export default ProtectedRoute