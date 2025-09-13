// client/src/App.js
"use client"; // Ensure this is at the very top for client-side components

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider as CustomThemeProvider } from "./contexts/ThemeContext"; // Renamed to avoid clash with styled-components
import GlobalStyles from "./styles/GlobalStyles";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/publicRoute";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import EmailVerification from "./pages/auth/EmailVerification";
import DynamicDashboard from "./components/dashboard/DynamicDashboard";
import Profile from "./pages/profile";
import Settings from "./pages/Settings";
import InventoryModule from "./pages/modules/IMS";
import AgricultureModule from "./pages/modules/ISA";
import WasteModule from "./pages/modules/WasteManagement";
import ConstructionModule from "./pages/modules/ConstructionSites";
import AnalyticsModule from "./pages/modules/Analytics";
import UserManagement from "./pages/modules/UserManagement";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";
import defaultTheme from "./styles/Theme"; // Renamed local import to avoid clash with context
import { useTheme } from "./contexts/ThemeContext";

function App() {
  const { currentTheme } = useTheme(); // This hook gets the active theme from your CustomThemeProvider

  useEffect(() => {
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    });

    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
    });

    return () => {
      window.removeEventListener("unhandledrejection", () => {});
      window.removeEventListener("error", () => {});
    };
  }, []);

  return (
    <ErrorBoundary>
      {/* Use the currentTheme from context, falling back to the default if not yet loaded */}
      <ThemeProvider theme={currentTheme || defaultTheme}>
        <GlobalStyles />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <div className="App">
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />
              <Route path="/verify-email/:token" element={<EmailVerification />} />
              <Route path="/maintenance" element={<Maintenance />} />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DynamicDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route
                  path="inventory/*"
                  element={
                    <ProtectedRoute requiredModule="IMS">
                      <InventoryModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="agriculture/*"
                  element={
                    <ProtectedRoute requiredModule="ISA">
                      <AgricultureModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="waste/*"
                  element={
                    <ProtectedRoute requiredModule="Waste Management">
                      <WasteModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="construction/*"
                  element={
                    <ProtectedRoute requiredModule="Construction Sites">
                      <ConstructionModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="analytics/*"
                  element={
                    <ProtectedRoute requiredModule="Analytics">
                      <AnalyticsModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="users/*"
                  element={
                    <ProtectedRoute requiredModule="User Management" requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route index element={<Navigate to="/dashboard" replace />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={currentTheme?.name === "dark" ? "dark" : "light"}
            />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Wrapper component to ensure ThemeProvider is available for App
function AppWrapper() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default AppWrapper;