"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { dashboardAPI } from "../services/api";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { FaExclamationTriangle } from "react-icons/fa";

const fadeIn = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.colors.surfaceLight};
`;

const DashboardLayout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: ${(props) => (props.$isSidebarOpen ? "280px" : "80px")};
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 1024px) {
    margin-left: 0;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;
  @media (max-width: 768px) { padding: 1.5rem; }
`;

const PageHeader = styled.header`
  margin-bottom: 2.5rem;
  animation: ${fadeIn} 0.5s ease-out forwards;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
`;

const PageSubtitle = styled.p`
  font-size: 1.1rem;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-top: 0.5rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const Card = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  box-shadow: ${(props) => props.theme.shadows.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  animation: ${fadeIn} 0.5s ease-out forwards;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const StatCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  p {
    margin: 0;
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 0.9rem;
    text-transform: uppercase;
  }

  h3 {
    margin: 0;
    color: ${(props) => props.theme.colors.heading};
    font-size: 2.25rem;
    font-weight: 700;
  }
`;

const ActivityCard = styled(Card)`
  padding: 1.5rem;
  h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: ${(props) => props.theme.colors.heading};
  }
`;

const ActivityList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActivityItem = styled.li`
  display: flex;
  align-items: center;
  gap: 1rem;

  .icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 1rem;
    color: white;
    background-color: ${(props) => props.color || props.theme.colors.primary};
  }

  .details {
    p { margin: 0; font-weight: 500; color: ${(props) => props.theme.colors.text}; }
    span { font-size: 0.875rem; color: ${(props) => props.theme.colors.textSecondary}; }
  }
`;

const LoadingContainer = styled.div`
  display: grid;
  place-items: center;
  min-height: 50vh;
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const ErrorContainer = styled.div`
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 2rem;
  color: #c53030;
  text-align: center;
`;

const Dashboard = () => {
  const { user, isAdmin, hasModuleAccess } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, activityRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity(),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        else throw new Error(statsRes.message || "Failed to fetch stats.");

        if (activityRes.success) setActivity(activityRes.data);
        else throw new Error(activityRes.message || "Failed to fetch activity.");

      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);

  const renderContent = () => {
    if (isLoading) return <LoadingContainer>Loading Dashboard...</LoadingContainer>;

    if (error) {
      return (
        <ErrorContainer>
          <FaExclamationTriangle size={40} />
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
        </ErrorContainer>
      );
    }
    
    return (
      <>
        <PageHeader>
          <PageTitle>Welcome back, {user?.firstName || "User"}!</PageTitle>
          <PageSubtitle>Here’s a summary of your business activity.</PageSubtitle>
        </PageHeader>
        
        <DashboardGrid>
          {stats?.overview && (
            <>
              <StatCard style={{ animationDelay: '0.1s' }}>
                <p>Total Revenue</p>
                <h3>${(stats.overview.totalRevenue || 0).toLocaleString()}</h3>
              </StatCard>
              <StatCard style={{ animationDelay: '0.2s' }}>
                <p>Total Transactions</p>
                <h3>{stats.overview.totalTransactions || 0}</h3>
              </StatCard>
            </>
          )}

          {stats?.inventory && (
            <>
              <StatCard style={{ animationDelay: '0.3s' }}>
                <p>Total Inventory Value</p>
                <h3>${(stats.inventory.totalValue || 0).toLocaleString()}</h3>
              </StatCard>
              <StatCard style={{ animationDelay: '0.4s' }}>
                <p>Low Stock Items</p>
                <h3>{stats.inventory.lowStockItems || 0}</h3>
              </StatCard>
            </>
          )}

          {activity.length > 0 && (
            <ActivityCard style={{ gridColumn: '1 / -1', animationDelay: '0.5s' }}>
              <h3>Recent Activity</h3>
              <ActivityList>
                {activity.map((item, index) => (
                  <ActivityItem key={index} color={item.color}>
                    <div className="icon">{item.icon}</div>
                    <div className="details">
                      <p>{item.title}</p>
                      <span>{item.description} - {new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </ActivityItem>
                ))}
              </ActivityList>
            </ActivityCard>
          )}
        </DashboardGrid>
      </>
    );
  };

  return (
    <DashboardContainer>
      <DashboardLayout>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          userModules={user?.modules || []}
          userRole={user?.role}
          hasModuleAccess={hasModuleAccess}
          isAdmin={isAdmin}
        />
        <MainContent $isSidebarOpen={sidebarOpen}>
          <Header onSidebarToggle={handleSidebarToggle} />
          <ContentArea>{renderContent()}</ContentArea>
        </MainContent>
      </DashboardLayout>
    </DashboardContainer>
  );
};

export default Dashboard;