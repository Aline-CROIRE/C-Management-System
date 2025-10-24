
// client/src/components/restaurant/RestaurantOverview.js
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaUtensils, FaChartLine, FaRecycle, FaWater, FaBolt, FaBoxes, FaTable, FaSync, FaDollarSign } from 'react-icons/fa'; // Added FaDollarSign
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

// Keyframes for animations (now imported)
const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// Reusing IMS's StatCard and related styles for consistency
const StatCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  border: 1px solid ${(props) => props.theme.colors.border};
  border-top: 5px solid ${(props) => props.$topBorderColor || props.theme.colors.primary};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  background: ${(props) => props.theme.colors.surface};
  transform: translateY(0);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.06);
    background: ${(props) => props.theme.colors.surfaceLight};
    border-top-color: ${(props) => props.$topBorderColor || props.theme.colors.primaryDark};
  }

  @media (max-width: 480px) {
    min-height: 100px;
    padding: 1.25rem;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    
    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        background: ${(props) => props.theme.colors.surface};
        border-top-color: ${(props) => props.$topBorderColor || props.theme.colors.primary};
    }
  }
`;
const StatHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: row-reverse;
    align-items: center;
    flex-grow: 1;
    justify-content: flex-end;
    gap: 1rem;
    margin-bottom: 0;
  }
`;
const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  background: ${(props) => props.iconColor};
  box-shadow: ${(props) => props.theme.shadows.sm};

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
`;
const StatContent = styled.div`
  text-align: left;
`;
const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
  white-space: nowrap;

  &.debt-color {
    color: ${(props) => props.theme.colors.error};
  }
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
  @media (max-width: 480px) {
    font-size: 1.3rem;
  }
`;
const StatLabel = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    margin-top: 0;
  }
`;
const StatFooter = styled.div`
  font-size: 0.85rem;
  color: ${(props) => props.theme.colors.textLight};
  margin-top: 0.75rem;

  @media (max-width: 480px) {
    display: none;
  }
`;

const OverviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const SectionTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-top: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;


const RestaurantOverview = ({ restaurantId }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await restaurantAPI.getRestaurantSummary(restaurantId);
      if (response?.success) {
        setSummaryData(response.data);
      } else {
        setError(response?.message || 'Failed to fetch restaurant summary.');
        toast.error(response?.message || 'Failed to fetch restaurant summary.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching summary data.');
      toast.error(err.message || 'An error occurred fetching summary data.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const formatNumber = (num) => Number(num || 0).toLocaleString();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <OverviewContainer>
      <HeaderBar>
        <SectionTitle>Today's Snapshot</SectionTitle>
        <Button variant="outline" onClick={fetchSummary} disabled={loading}><SpinningFaSync /> Refresh Data</Button> {/* Using SpinningFaSync */}
      </HeaderBar>

      <StatsGrid>
        <StatCard $topBorderColor="#4CAF50">
            <StatHeader>
                <StatContent><StatValue>{formatNumber(summaryData?.totalOrdersToday)}</StatValue><StatLabel>Orders Today</StatLabel></StatContent>
                <StatIcon iconColor="#4CAF50"><FaUtensils /></StatIcon>
            </StatHeader>
            <StatFooter>Total orders placed today</StatFooter>
        </StatCard>
        <StatCard $topBorderColor="#2196F3">
            <StatHeader>
                <StatContent><StatValue>{formatCurrency(summaryData?.revenueToday)}</StatValue><StatLabel>Revenue Today</StatLabel></StatContent>
                <StatIcon iconColor="#2196F3"><FaDollarSign /></StatIcon>
            </StatHeader>
            <StatFooter>Total revenue from paid orders today</StatFooter>
        </StatCard>
        <StatCard $topBorderColor="#FFC107">
            <StatHeader>
                <StatContent><StatValue>{formatNumber(summaryData?.activeTables)}</StatValue><StatLabel>Active Tables</StatLabel></StatContent>
                <StatIcon iconColor="#FFC107"><FaTable /></StatIcon>
            </StatHeader>
            <StatFooter>Tables currently occupied or ordering</StatFooter>
        </StatCard>
        <StatCard $topBorderColor="#9C27B0">
            <StatHeader>
                <StatContent><StatValue>{formatNumber(summaryData?.pendingKdsItems)}</StatValue><StatLabel>KDS Items Pending</StatLabel></StatContent>
                <StatIcon iconColor="#9C27B0"><FaBoxes /></StatIcon>
            </StatHeader>
            <StatFooter>Items awaiting preparation in kitchen</StatFooter>
        </StatCard>
      </StatsGrid>

      <HeaderBar>
        <SectionTitle>Circular Economy & Sustainability (Last 7 Days)</SectionTitle>
      </HeaderBar>
      <StatsGrid>
        <StatCard $topBorderColor="#4CAF50">
            <StatHeader>
                <StatContent><StatValue>{formatNumber(summaryData?.circularEconomySummary?.last7DaysWasteByDisposal.find(d => d._id === 'compost')?.totalQuantity || 0)} kg</StatValue><StatLabel>Composted Waste</StatLabel></StatContent>
                <StatIcon iconColor="#4CAF50"><FaRecycle /></StatIcon>
            </StatHeader>
            <StatFooter>Food waste diverted to compost</StatFooter>
        </StatCard>
        <StatCard $topBorderColor="#FFC107">
            <StatHeader>
                <StatContent><StatValue>{formatNumber(summaryData?.circularEconomySummary?.last7DaysWasteByDisposal.find(d => d._id === 'recycling')?.totalQuantity || 0)} kg</StatValue><StatLabel>Recycled Waste</StatLabel></StatContent>
                <StatIcon iconColor="#FFC107"><FaRecycle /></StatIcon>
            </StatHeader>
            <StatFooter>Packaging and other materials recycled</StatFooter>
        </StatCard>
        <StatCard $topBorderColor="#2196F3">
            <StatHeader>
                <StatContent><StatValue>{formatNumber(summaryData?.circularEconomySummary?.last7DaysResourceConsumption.find(r => r._id === 'electricity')?.totalValue || 0)} kWh</StatValue><StatLabel>Electricity Used</StatLabel></StatContent>
                <StatIcon iconColor="#2196F3"><FaBolt /></StatIcon>
            </StatHeader>
            <StatFooter>Energy consumption in kilowatt-hours</StatFooter>
        </StatCard>
        <StatCard $topBorderColor="#00BCD4">
            <StatHeader>
                <StatContent><StatValue>{formatNumber(summaryData?.circularEconomySummary?.last7DaysResourceConsumption.find(r => r._id === 'water')?.totalValue || 0)} m³</StatValue><StatLabel>Water Used</StatLabel></StatContent>
                <StatIcon iconColor="#00BCD4"><FaWater /></StatIcon>
            </StatHeader>
            <StatFooter>Water consumption in cubic meters</StatFooter>
        </StatCard>
      </StatsGrid>
    </OverviewContainer>
  );
};

export default RestaurantOverview;

