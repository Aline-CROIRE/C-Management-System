// src/components/reports/ReportsPage.js
"use client";
import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card'; 
import { FaChartLine, FaTag, FaFileAlt, FaBoxes, FaBalanceScale, FaLeaf } from 'react-icons/fa';
// Removed useNavigate as setActiveTab is passed directly

const ReportsContainer = styled.div`
    padding: 2rem;
    background-color: ${props => props.theme.colors.background};
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ReportCard = styled(Card)`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: ${props => props.theme.shadows.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  svg {
    font-size: 3rem;
    color: ${props => props.theme.colors.primary};
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: ${props => props.theme.colors.textPrimary};
  }

  p {
    font-size: 0.9rem;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SectionTitle = styled.h1`
    font-size: 2rem;
    color: ${props => props.theme.colors.primary};
    margin-bottom: 1.5rem;
`;

const ReportsPage = ({ setActiveTab }) => {
    const handleReportClick = (tabName) => {
        setActiveTab(tabName); 
    };

    return (
        <ReportsContainer>
            <SectionTitle>General Reports & Analytics</SectionTitle>
            <p>Explore various reports to gain insights into your business operations.</p>
            
            <ReportsGrid>
                <ReportCard onClick={() => handleReportClick("reports-analytics")}> {/* This will render ReportsAnalytics directly */}
                    <FaChartLine />
                    <h3>Comprehensive Analytics</h3>
                    <p>Overview of sales, stock, and business performance.</p>
                </ReportCard>

                <ReportCard onClick={() => handleReportClick("profit-loss")}> 
                    <FaBalanceScale />
                    <h3>Profit & Loss Statement</h3>
                    <p>Detailed breakdown of income vs. expenses and overall profitability.</p>
                </ReportCard>

                <ReportCard onClick={() => handleReportClick("daily-stock-report")}> 
                    <FaBoxes />
                    <h3>Daily Stock Report</h3>
                    <p>Track opening and closing stock levels daily.</p>
                </ReportCard>

                <ReportCard onClick={() => handleReportClick("circular-economy")}> 
                    <FaLeaf />
                    <h3>Circular Economy Report</h3>
                    <p>Insights into packaging usage, deposits, and returns.</p>
                </ReportCard>

            </ReportsGrid>
        </ReportsContainer>
    );
};

export default ReportsPage;


