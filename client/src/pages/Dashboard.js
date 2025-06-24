"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/layout/Header"
import Sidebar from "../components/layout/Sidebar"
import DashboardHome from "../components/dashboard/DashboardHome"

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.colors?.surface || "#f8f9fa"};
`

const DashboardLayout = styled.div`
  display: flex;
  min-height: 100vh;
`

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: ${(props) => (props.$sidebarOpen ? "280px" : "72px")};
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 1024px) {
    margin-left: 0;
  }
`

const ContentArea = styled.div`
  flex: 1;
  padding: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  overflow-y: auto;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  
  @media (max-width: 768px) {
    padding: ${(props) => props.theme.spacing?.xl || "2rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  }
`

const PageHeader = styled.div`
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const PageTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.xlarge || "1.5rem"};
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#333333"};
  margin: 0 0 ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
`

const PageSubtitle = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.medium || "1rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#666666"};
  margin: 0;
`

const ModuleContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const ModuleCard = styled.div`
  background: ${(props) => props.theme.colors?.background || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.large || "12px"};
  box-shadow: ${(props) => props.theme.shadows?.medium || "0 4px 6px rgba(0,0,0,0.1)"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  border: 1px solid ${(props) => props.theme.colors?.surface || "#f8f9fa"};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: ${(props) => props.theme.shadows?.large || "0 10px 25px rgba(0,0,0,0.15)"};
    transform: translateY(-2px);
  }
`

const ModuleIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.borderRadius?.medium || "8px"};
  background: ${(props) => props.iconColor || props.theme.colors?.primary || "#667eea"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`

const ModuleTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.large || "1.25rem"};
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#333333"};
  margin: 0 0 ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
`

const ModuleDescription = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.medium || "1rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#666666"};
  margin: 0;
  line-height: 1.5;
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${(props) => props.theme.borderRadius?.medium || "8px"};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  color: #dc2626;
  text-align: center;
`

// Module configurations
const moduleConfigs = {
  "User Management": {
    icon: "👥",
    color: "#667eea",
    description: "Manage users, roles, and permissions",
  },
  "Inventory Management": {
    icon: "📦",
    color: "#f093fb",
    description: "Track and manage inventory items",
  },
  "Financial Management": {
    icon: "💰",
    color: "#4ade80",
    description: "Handle financial transactions and reports",
  },
  "Project Management": {
    icon: "📋",
    color: "#fb923c",
    description: "Organize and track project progress",
  },
  "Customer Management": {
    icon: "🤝",
    color: "#06b6d4",
    description: "Manage customer relationships and data",
  },
  IMS: {
    icon: "📦",
    color: "#f093fb",
    description: "Inventory Management System",
  },
  ISA: {
    icon: "🌱",
    color: "#4ade80",
    description: "Intelligent Systems Agriculture",
  },
  "Waste Management": {
    icon: "♻️",
    color: "#06b6d4",
    description: "Waste tracking and management",
  },
  "Construction Sites": {
    icon: "🏗️",
    color: "#fb923c",
    description: "Construction site management",
  },
  Reporting: {
    icon: "📊",
    color: "#8b5cf6",
    description: "Generate and view detailed reports",
  },
}

const Dashboard = () => {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState("home")
  const [loading, setLoading] = useState(true)
  const [error, _setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Helper function to check if user has access to a specific module
  const hasModuleAccess = (moduleName) => {
    if (!user?.modules) return false
    return user.modules.includes(moduleName)
  }

  // Helper function to check if user is admin
  const isAdmin = () => {
    return user?.role === "admin" || user?.role === "Administrator"
  }

  const handleModuleClick = (moduleName) => {
    setCurrentView(moduleName.toLowerCase().replace(/\s+/g, "-"))
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const renderModules = () => {
    if (!user?.modules || user.modules.length === 0) {
      return (
        <ErrorContainer>
          <h3>No Modules Assigned</h3>
          <p>Contact your administrator to get access to modules.</p>
        </ErrorContainer>
      )
    }

    return (
      <ModuleContainer>
        {user.modules.map((module) => {
          const config = moduleConfigs[module] || {
            icon: "⚙️",
            color: "#6b7280",
            description: "Module description",
          }

          return (
            <ModuleCard key={module} onClick={() => handleModuleClick(module)}>
              <ModuleIcon iconColor={config.color}>{config.icon}</ModuleIcon>
              <ModuleTitle>{module}</ModuleTitle>
              <ModuleDescription>{config.description}</ModuleDescription>
            </ModuleCard>
          )
        })}
      </ModuleContainer>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <div>Loading dashboard...</div>
        </LoadingContainer>
      )
    }

    if (error) {
      return (
        <ErrorContainer>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
        </ErrorContainer>
      )
    }

    switch (currentView) {
      case "home":
        return <DashboardHome />
      default:
        return (
          <div>
            <PageHeader>
              <PageTitle>Welcome to Your Dashboard</PageTitle>
              <PageSubtitle>Select a module below to get started with your management tasks.</PageSubtitle>
            </PageHeader>
            {renderModules()}
          </div>
        )
    }
  }

  return (
    <DashboardContainer>
      <DashboardLayout>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          userModules={user?.modules || []}
          userRole={user?.role || "user"}
          hasModuleAccess={hasModuleAccess}
          isAdmin={isAdmin}
        />
        <MainContent $sidebarOpen={sidebarOpen}>
          <Header onSidebarToggle={handleSidebarToggle} />
          <ContentArea>{renderContent()}</ContentArea>
        </MainContent>
      </DashboardLayout>
    </DashboardContainer>
  )
}

export default Dashboard
