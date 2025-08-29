"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardAPI } from "../../services/api"; // Corrected import path
import { FaDollarSign, FaBoxes, FaTractor, FaUsers, FaRecycle, FaHardHat, FaEye, FaDownload, FaExclamationTriangle } from "react-icons/fa";
import StatsCard from "./statsCard"; // Assuming this component exists and works
import {
  RevenueTrendChart,
  InventoryDistributionChart,
  // Other charts can be added back when you have real data for them
} from "../charts/ChartComponents";

const fadeIn = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;

const DashboardContainer = styled.div`
  padding: 2.5rem;
  background: ${(props) => props.theme.colors.surfaceLight};
  min-height: 100vh;
  animation: ${fadeIn} 0.5s ease-out;
  @media (max-width: 768px) { padding: 1.5rem; }
`;

const WelcomeSection = styled.div`
  margin-bottom: 3rem;
  @media (max-width: 768px) { text-align: left; }
`;

const WelcomeTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-top: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const ModuleCard = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  padding: 2rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: ${(props) => props.gradient};
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${(props) => props.theme.shadows.lg};
  }
`;

const ModuleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ModuleIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${(props) => props.gradient};
  display: grid;
  place-items: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const ModuleInfo = styled.div`
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.heading};
    margin: 0;
  }
  span {
    font-size: 0.875rem;
    color: ${(props) => props.theme.colors.accent};
    font-weight: 500;
  }
`;

const ModuleStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  text-align: center;
`;

const StatItem = styled.div`
  div:first-child {
    font-size: 1.75rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.heading};
  }
  div:last-child {
    font-size: 0.8rem;
    color: ${(props) => props.theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const LoadingContainer = styled.div`
  display: grid;
  place-items: center;
  min-height: 80vh;
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

const MODULE_CONFIGS = {
  IMS: {
    icon: <FaBoxes />,
    title: "Inventory",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    stats: (data) => [
      { label: "Items", value: data?.inventory?.uniqueProducts || 0 },
      { label: "Low Stock", value: data?.inventory?.lowStockItems || 0 },
      { label: "Value", value: `$${(data?.inventory?.totalValue || 0).toLocaleString()}` },
    ],
  },
  ISA: {
    icon: <FaTractor />,
    title: "Agriculture",
    gradient: "linear-gradient(135deg, #52734d 0%, #74a478 100%)",
    stats: (data) => [
      { label: "Fields", value: data?.agriculture?.activeFields || 0 },
      { label: "Crops", value: data?.agriculture?.activeCrops || 0 },
      { label: "Avg. Yield", value: `${data?.agriculture?.avgYield || 0}%` },
    ],
  },
  "Waste Management": {
    icon: <FaRecycle />,
    title: "Waste Mgmt.",
    gradient: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
    stats: (data) => [
      { label: "Processed (T)", value: data?.waste?.processedToday || 0 },
      { label: "Revenue", value: `$${(data?.waste?.monthlyRevenue || 0).toLocaleString()}` },
      { label: "Efficiency", value: `${data?.waste?.efficiency || 0}%` },
    ],
  },
  "Construction Sites": {
    icon: <FaHardHat />,
    title: "Construction",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    stats: (data) => [
      { label: "Sites", value: data?.construction?.activeSites || 0 },
      { label: "Equipment", value: data?.construction?.totalEquipment || 0 },
      { label: "Avg. Progress", value: `${data?.construction?.avgProgress || 0}%` },
    ],
  },
};

const DynamicDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats();
        if (response.success) {
          setStats(response.data);
        } else {
          throw new Error(response.message || "Failed to fetch dashboard data.");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const renderModules = () => {
    if (!user?.modules || user.modules.length === 0) {
      return (
        <ErrorContainer>
          No modules assigned. Contact your administrator for access.
        </ErrorContainer>
      );
    }
    return (
      <ModulesGrid>
        {user.modules.map((moduleKey) => {
          const config = MODULE_CONFIGS[moduleKey];
          if (!config) return null;
          const moduleStats = config.stats(stats);
          return (
            <ModuleCard key={moduleKey} gradient={config.gradient}>
              <ModuleHeader>
                <ModuleIcon gradient={config.gradient}>{config.icon}</ModuleIcon>
                <ModuleInfo>
                  <h3>{config.title}</h3>
                  <span>Active and Running</span>
                </ModuleInfo>
              </ModuleHeader>
              <ModuleStats>
                {moduleStats.map((stat) => (
                  <StatItem key={stat.label}>
                    <div>{stat.value}</div>
                    <div>{stat.label}</div>
                  </StatItem>
                ))}
              </ModuleStats>
            </ModuleCard>
          );
        })}
      </ModulesGrid>
    );
  };

  if (loading) {
    return <LoadingContainer>Loading Dashboard...</LoadingContainer>;
  }

  if (error) {
    return (
      <DashboardContainer>
        <ErrorContainer>
          <FaExclamationTriangle size={40} />
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
        </ErrorContainer>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Welcome back, {user?.firstName || "User"}!</WelcomeTitle>
        <WelcomeSubtitle>
          Here's your real-time business overview.
        </WelcomeSubtitle>
      </WelcomeSection>

      <StatsGrid>
        <StatsCard
          title="Total Revenue"
          value={`$${(stats?.overview?.totalRevenue || 0).toLocaleString()}`}
          icon={<FaDollarSign />}
          iconColor="#10b981"
        />
        <StatsCard
          title="Total Transactions"
          value={(stats?.overview?.totalTransactions || 0).toLocaleString()}
          icon={<FaBoxes />}
          iconColor="#3b82f6"
        />
        {stats?.inventory && (
          <StatsCard
            title="Inventory Value"
            value={`$${(stats.inventory.totalValue || 0).toLocaleString()}`}
            icon={<FaBoxes />}
            iconColor="#8b5cf6"
          />
        )}
        {stats?.users && (
           <StatsCard
            title="Total Users"
            value={stats.users.total || 0}
            icon={<FaUsers />}
            iconColor="#f59e0b"
          />
        )}
      </StatsGrid>

      <SectionTitle>Your Active Modules</SectionTitle>
      {renderModules()}

      {/* Example Chart Section */}
      {/* You can add real data to these charts when ready */}
      {/* <SectionTitle style={{marginTop: '3rem'}}>Analytics Overview</SectionTitle>
      <ChartsGrid>
        <RevenueTrendChart data={[]} />
        <InventoryDistributionChart data={[]} />
      </ChartsGrid> */}
    </DashboardContainer>
  );
};

export default DynamicDashboard;