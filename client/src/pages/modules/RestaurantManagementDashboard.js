// client/src/pages/modules/RestaurantManagementDashboard.js
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { default as styled, keyframes, css } from 'styled-components';
import {
  FaUtensils, FaListAlt, FaTable, FaClipboardList, FaUsers, FaChartBar, FaCog, FaThLarge,
  FaCashRegister, FaCalendarAlt, FaLeaf, FaRecycle, FaCommentDots, FaTruckMoving, FaBoxes, FaHandSparkles, FaUser
} from 'react-icons/fa'; // All necessary icons imported

import { useAuth } from '../../contexts/AuthContext';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import AlertCard from '../../components/common/AlertCard';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

// Import sub-components for each tab
import RestaurantOverview from '../../components/restaurant/RestaurantOverview';
import MenuManagement from '../../components/restaurant/MenuManagement';
import TableManagement from '../../components/restaurant/TableManagement';
import OrderManagement from '../../components/restaurant/OrderManagement';
import KDSView from '../../components/restaurant/KDSView';
import CustomerManagement from '../../components/restaurant/CustomerManagement';
import ReportsAndAnalytics from '../../components/restaurant/ReportsAndAnalytics';
import RestaurantSettings from '../../components/restaurant/RestaurantSettings';

// NEW: Import new modules (PLACEHOLDER IMPORTS - YOU NEED TO CREATE THESE FILES)
// For now, create empty files like:
// const ScheduleManagement = ({ restaurantId }) => <p>Schedule Management coming soon...</p>;
// This will fix the 'Module not found' errors.
import POSSystem from '../../components/restaurant/POSSystem';
import StaffManagement from '../../components/restaurant/StaffManagement';
import ScheduleManagement from '../../components/restaurant/ScheduleManagement';
import WasteManagement from '../../components/restaurant/WasteManagement';
import ResourceConsumptionManagement from '../../components/restaurant/ResourceConsumptionManagement';
import SustainableSourcingManagement from '../../components/restaurant/SustainableSourcingManagement';
import ReusableProgramManagement from '../../components/restaurant/ReusableProgramManagement';
import UpcyclingLogManagement from '../../components/restaurant/UpcyclingLogManagement';
import FeedbackManagement from '../../components/restaurant/FeedbackManagement';


const DashboardContainer = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.md || "1rem"};
  }
`;

const PageHeader = styled.div`
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  text-align: center;
`;

const PageTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "2rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.extrabold || "800"};
  color: ${(props) => props.theme.colors?.heading || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`;

const PageSubtitle = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0;
`;

const TabNavigationContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  background: ${(props) => props.theme.colors?.background || "#ffffff"};
  padding: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  box-shadow: ${(props) => props.theme.shadows?.sm || "0 1px 2px 0 rgba(0, 0, 0, 0.05)"};
`;

const TabButton = styled.button`
  padding: ${(props) => props.theme.spacing?.md || "0.8rem"} ${(props) => props.theme.spacing?.lg || "1.25rem"};
  border: none;
  background: transparent;
  color: ${(props) => props.theme.colors?.textSecondary || "#666"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  white-space: nowrap;
  position: relative;

  &:hover:not(:disabled):not(.$active) {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f0f4f8"};
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }

  ${props => props.$active && css`
    background: ${props.theme.colors?.primary || "#1b4332"};
    color: white;
    box-shadow: ${(props) => props.theme.shadows?.sm || "0 1px 2px 0 rgba(0, 0, 0, 0.05)"};
  `}

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    flex-grow: 1;
  }
`;

const TabContentArea = styled(Card)`
  background: ${(props) => props.theme.colors?.background || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  flex-grow: 1;

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  }
`;

const RestaurantManagementDashboard = ({ restaurantId }) => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRestaurantDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await restaurantAPI.getRestaurantById(restaurantId);
      if (response?.success) {
        setRestaurantData(response.data);
      } else {
        setError(response?.message || 'Failed to fetch restaurant details.');
        toast.error(response?.message || 'Failed to fetch restaurant details.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching restaurant details.');
      toast.error(err.message || 'An error occurred fetching restaurant details.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails();
    }
  }, [restaurantId, fetchRestaurantDetails]);

  // Define these helper functions here so they are in scope for JSX
  const hasReadPerm = useCallback((resource) => hasPermission(resource, 'read'), [hasPermission]);
  const hasWritePerm = useCallback((resource) => hasPermission(resource, 'write'), [hasPermission]);


  if (loading) {
    return (
      <DashboardContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner size="50px" />
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <PageHeader><PageTitle>Error Loading Restaurant</PageTitle></PageHeader>
        <AlertCard type="error"><p>{error}</p></AlertCard>
      </DashboardContainer>
    );
  }

  if (!restaurantData) {
      return (
          <DashboardContainer>
              <PageHeader><PageTitle>No Restaurant Data</PageTitle></PageHeader>
              <AlertCard type="warning"><p>Could not retrieve restaurant details. Please try again later.</p></AlertCard>
          </DashboardContainer>
      );
  }

  const renderTabContent = () => {
    const hasRestaurantAccess = hasReadPerm('restaurant');

    switch (activeTab) {
      case 'overview': return <RestaurantOverview restaurantId={restaurantId} />;
      case 'pos': return <POSSystem restaurantId={restaurantId} />;
      case 'menu': return <MenuManagement restaurantId={restaurantId} />;
      case 'tables': return <TableManagement restaurantId={restaurantId} />;
      case 'orders': return <OrderManagement restaurantId={restaurantId} />;
      case 'kds': return <KDSView restaurantId={restaurantId} />;
      case 'customers': return <CustomerManagement restaurantId={restaurantId} />;
      case 'staff': return <StaffManagement restaurantId={restaurantId} />;
      case 'schedule': return <ScheduleManagement restaurantId={restaurantId} />;
      case 'feedback': return <FeedbackManagement restaurantId={restaurantId} />;
      case 'waste': return <WasteManagement restaurantId={restaurantId} />;
      case 'resources': return <ResourceConsumptionManagement restaurantId={restaurantId} />;
      case 'sourcing': return <SustainableSourcingManagement restaurantId={restaurantId} />;
      case 'reusables': return <ReusableProgramManagement restaurantId={restaurantId} />;
      case 'upcycling': return <UpcyclingLogManagement restaurantId={restaurantId} />;
      case 'reports': return <ReportsAndAnalytics restaurantId={restaurantId} />;
      case 'settings': return <RestaurantSettings restaurantId={restaurantId} currentRestaurantData={restaurantData} onUpdate={fetchRestaurantDetails} />;
      default: return <AlertCard type="info"><p>Select a tab to manage your restaurant.</p></AlertCard>;
    }
  };

  return (
    <DashboardContainer>
      <PageHeader>
        <PageTitle>{restaurantData.name} Operations Dashboard</PageTitle>
        <PageSubtitle>Manage your restaurant efficiently and sustainably.</PageSubtitle>
      </PageHeader>

      <TabNavigationContainer>
        <TabButton $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><FaThLarge /> Overview</TabButton>
        <TabButton $active={activeTab === 'pos'} onClick={() => setActiveTab('pos')}><FaCashRegister /> POS</TabButton>
        <TabButton $active={activeTab === 'menu'} onClick={() => setActiveTab('menu')}><FaListAlt /> Menu</TabButton>
        <TabButton $active={activeTab === 'tables'} onClick={() => setActiveTab('tables')}><FaTable /> Tables</TabButton>
        <TabButton $active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}><FaClipboardList /> Orders</TabButton>
        <TabButton $active={activeTab === 'kds'} onClick={() => setActiveTab('kds')}><FaUtensils /> KDS</TabButton>
        <TabButton $active={activeTab === 'customers'} onClick={() => setActiveTab('customers')}><FaUsers /> Customers</TabButton>
        <TabButton $active={activeTab === 'staff'} onClick={() => setActiveTab('staff')}><FaUser /> Staff</TabButton>
        <TabButton $active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')}><FaCalendarAlt /> Schedule</TabButton>
        <TabButton $active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')}><FaCommentDots /> Feedback</TabButton>
        {/* Circular Economy Section */}
        <TabButton $active={activeTab === 'waste'} onClick={() => setActiveTab('waste')}><FaRecycle /> Waste</TabButton>
        <TabButton $active={activeTab === 'resources'} onClick={() => setActiveTab('resources')}><FaLeaf /> Resources</TabButton>
        <TabButton $active={activeTab === 'sourcing'} onClick={() => setActiveTab('sourcing')}><FaTruckMoving /> Sourcing</TabButton>
        <TabButton $active={activeTab === 'reusables'} onClick={() => setActiveTab('reusables')}><FaBoxes /> Reusables</TabButton>
        <TabButton $active={activeTab === 'upcycling'} onClick={() => setActiveTab('upcycling')}><FaHandSparkles /> Upcycling</TabButton>

        <TabButton $active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}><FaChartBar /> Reports</TabButton>
        <TabButton $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}><FaCog /> Settings</TabButton>
      </TabNavigationContainer>

      <TabContentArea>
        {renderTabContent()}
      </TabContentArea>
    </DashboardContainer>
  );
};

export default RestaurantManagementDashboard;