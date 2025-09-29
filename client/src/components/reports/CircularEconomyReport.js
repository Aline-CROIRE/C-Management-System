// src/components/reports/CircularEconomyReport.js
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaRecycle, FaMoneyBillWave, FaBoxes, FaChartPie, FaCalendarAlt, FaRedo, FaDownload, FaLeaf, FaArrowUp, FaArrowDown, FaInfoCircle } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input'; // Not used in this version but often useful
import Select from '../common/Select'; // Not used in this version but often useful
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { enUS } from 'date-fns/locale';
import moment from 'moment';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'; // Assuming recharts is installed
import { useCircularEconomy } from '../../hooks/useCircularEconomy';
import { CSVLink } from 'react-csv'; // Assuming react-csv is installed

// Keyframes for animations
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

// Styled Components
const ReportContainer = styled.div`
  padding: 2rem;
  background-color: ${(props) => props.theme.colors.background};
  min-height: calc(100vh - 80px); /* Adjust based on header height */
  animation: ${fadeIn} 0.5s ease-out;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const DateRangePickerContainer = styled.div`
  position: absolute;
  top: 100%;
  right: 0; /* Position dropdown to the right */
  z-index: 1000;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  border-radius: 0.5rem;
  overflow: hidden;
  background: white; /* Ensure background is white */
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  border-left: 5px solid ${({ theme, color }) => color || theme.colors.primary}; /* FIX: Destructure theme */
`;

const StatLabel = styled.span`
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatValue = styled.span`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.textPrimary};
`;

const StatDescription = styled.small`
  font-size: 0.75rem;
  color: ${(props) => props.theme.colors.textLight};
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors.primary};
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: ${(props) => props.theme.shadows.sm};
  margin-bottom: 2rem;
`;

const Th = styled.th`
  background-color: ${(props) => props.theme.colors.primaryLight};
  color: ${(props) => props.theme.colors.primary};
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const Td = styled.td`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  color: ${(props) => props.theme.colors.textPrimary};
  font-size: 0.9rem;

  &:last-child {
    border-right: none;
  }
`;

const TableRow = styled.tr`
  &:last-child ${Td} {
    border-bottom: none;
  }
  &:hover {
    background-color: ${(props) => props.theme.colors.hover};
  }
`;

const ChartContainer = styled(Card)`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  margin-bottom: 2rem;
  height: 400px; /* Fixed height for charts */
`;

const TooltipContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: #2d3748;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  strong { color: ${(props) => props.theme.colors.primary}; }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 1.1rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  margin-top: 2rem;
`;

const FilterWrapper = styled.div`
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: center;
`;


const CircularEconomyReport = () => {
    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            startDate: moment().subtract(30, 'days').toDate(),
            endDate: moment().toDate(),
            key: 'selection'
        }
    ]);

    const { reportData, loading, error, setFilters, refetch } = useCircularEconomy({
        startDate: dateRange[0].startDate,
        endDate: dateRange[0].endDate,
    });

    useEffect(() => {
        setFilters({
            startDate: dateRange[0].startDate,
            endDate: dateRange[0].endDate,
        });
    }, [dateRange, setFilters]);

    const handleDateRangeSelect = (ranges) => {
        setDateRange([ranges.selection]);
    };

    const formatCurrency = (amount) => {
        return `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF0080'];

    const pieChartData = useMemo(() => {
        if (!reportData?.otherPackagingSoldDetails) return [];
        return reportData.otherPackagingSoldDetails.map(p => ({
            name: p._id,
            value: p.totalQuantity
        }));
    }, [reportData?.otherPackagingSoldDetails]);

    // CSV Data Preparation
    const depositsChargedCsvData = useMemo(() => {
        if (!reportData?.depositsChargedDetails) return [];
        return reportData.depositsChargedDetails.map(d => ({
            'Product Name': d.itemName,
            'SKU': d.itemSku,
            'Packaging Type': d.packagingTypeSnapshot,
            'Quantity Charged': d.totalChargedQuantity,
            'Total Deposit Charged (Rwf)': d.totalChargedDeposit,
        }));
    }, [reportData?.depositsChargedDetails]);

    const depositsRefundedCsvData = useMemo(() => {
        if (!reportData?.depositsRefundedDetails) return [];
        return reportData.depositsRefundedDetails.map(d => ({
            'Product Name': d.itemName,
            'SKU': d.itemSku,
            'Total Returned Quantity': d.totalReturnedQuantity,
            'Total Refunded Deposit (Rwf)': d.totalRefundedDeposit,
        }));
    }, [reportData?.depositsRefundedDetails]);

    const otherPackagingCsvData = useMemo(() => {
        if (!reportData?.otherPackagingSoldDetails) return [];
        return reportData.otherPackagingSoldDetails.map(p => ({
            'Packaging Type': p._id,
            'Total Quantity Sold': p.totalQuantity,
        }));
    }, [reportData?.otherPackagingSoldDetails]);

    if (loading) {
        return (
            <ReportContainer>
                <LoadingSpinner message="Loading Circular Economy Report..." />
            </ReportContainer>
        );
    }

    if (error) {
        return (
            <ReportContainer>
                <Card><p style={{color: 'red'}}>Error: {error}</p></Card>
            </ReportContainer>
        );
    }

    const {
        totalDepositsCharged,
        totalDepositsRefunded,
        outstandingDeposits,
        depositsChargedDetails,
        depositsRefundedDetails,
        otherPackagingSoldDetails,
    } = reportData || {};

    return (
        <ReportContainer>
            <ReportHeader>
                <Title><FaLeaf /> Circular Economy Report</Title>
                <FilterSection>
                    <FilterWrapper>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                            icon={<FaCalendarAlt />}
                        >
                            {moment(dateRange[0].startDate).format('MMM D, YYYY')} - {moment(dateRange[0].endDate).format('MMM D, YYYY')}
                        </Button>
                        {showDateRangePicker && (
                            <DateRangePickerContainer>
                                <DateRange
                                    ranges={dateRange}
                                    onChange={handleDateRangeSelect}
                                    moveRangeOnFirstSelection={false}
                                    months={2}
                                    direction="horizontal"
                                    locale={enUS}
                                />
                            </DateRangePickerContainer>
                        )}
                    </FilterWrapper>
                    <Button variant="outline" onClick={refetch} icon={<FaRedo />}>
                        Refresh
                    </Button>
                    <CSVLink data={depositsChargedCsvData} filename={`deposits_charged_report_${moment(dateRange[0].startDate).format('YYYYMMDD')}_${moment(dateRange[0].endDate).format('YYYYMMDD')}.csv`}>
                        <Button variant="info" icon={<FaDownload />}>CSV</Button>
                    </CSVLink>
                </FilterSection>
            </ReportHeader>

            <StatsGrid>
                <StatCard color="#007bff">
                    <StatLabel><FaMoneyBillWave /> Total Deposits Charged</StatLabel>
                    <StatValue>{formatCurrency(totalDepositsCharged)}</StatValue>
                    <StatDescription>Total packaging deposits collected from sales in this period.</StatDescription>
                </StatCard>
                <StatCard color="#28a745">
                    <StatLabel><FaMoneyBillWave /> Total Deposits Refunded</StatLabel>
                    <StatValue>{formatCurrency(totalDepositsRefunded)}</StatValue>
                    <StatDescription>Total packaging deposits returned to customers in this period.</StatDescription>
                </StatCard>
                <StatCard color="#ffc107">
                    <StatLabel><FaMoneyBillWave /> Outstanding Deposits</StatLabel>
                    <StatValue>{formatCurrency(outstandingDeposits)}</StatValue>
                    <StatDescription>Total deposits still held, awaiting packaging return.</StatDescription>
                </StatCard>
                <StatCard color="#17a2b8">
                    <StatLabel><FaBoxes /> Reusable Packaging Sold (Units)</StatLabel>
                    <StatValue>{depositsChargedDetails?.reduce((sum, d) => sum + d.totalChargedQuantity, 0).toLocaleString() || 0}</StatValue>
                    <StatDescription>Quantity of items sold with reusable packaging in this period.</StatDescription>
                </StatCard>
            </StatsGrid>

            {depositsChargedDetails?.length > 0 ? (
                <>
                    <SectionTitle><FaArrowUp /> Deposits Charged Details</SectionTitle>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Product Name</Th>
                                <Th>SKU</Th>
                                <Th>Packaging Type</Th>
                                <Th style={{textAlign: 'right'}}>Quantity Charged</Th>
                                <Th style={{textAlign: 'right'}}>Total Deposit</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {depositsChargedDetails.map((item) => (
                                <TableRow key={item._id}>
                                    <Td>{item.itemName}</Td>
                                    <Td>{item.itemSku}</Td>
                                    <Td>{item.packagingTypeSnapshot}</Td>
                                    <Td style={{textAlign: 'right'}}>{item.totalChargedQuantity}</Td>
                                    <Td style={{textAlign: 'right'}}>{formatCurrency(item.totalChargedDeposit)}</Td>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </>
            ) : (
                <NoDataMessage>No packaging deposits charged in this period.</NoDataMessage>
            )}

            {depositsRefundedDetails?.length > 0 ? (
                 <>
                    <SectionTitle><FaArrowDown /> Deposits Refunded Details</SectionTitle>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Product Name</Th>
                                <Th>SKU</Th>
                                <Th style={{textAlign: 'right'}}>Quantity Returned</Th>
                                <Th style={{textAlign: 'right'}}>Total Refunded</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {depositsRefundedDetails.map((item, index) => (
                                <TableRow key={item._id || index}>
                                    <Td>{item.itemName || 'N/A'}</Td>
                                    <Td>{item.itemSku || 'N/A'}</Td>
                                    <Td style={{textAlign: 'right'}}>{item.totalReturnedQuantity}</Td>
                                    <Td style={{textAlign: 'right'}}>{formatCurrency(item.totalRefundedDeposit)}</Td>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                 </>
            ) : (
                <NoDataMessage>No packaging deposits refunded in this period.</NoDataMessage>
            )}

            {pieChartData.length > 0 && (
                <>
                    <SectionTitle><FaChartPie /> Other Packaging Types Sold</SectionTitle>
                    <ChartContainer>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <TooltipContent>
                                                <strong>{data.name}</strong><br/>
                                                Quantity: {data.value.toLocaleString()} units<br/>
                                                Percentage: {(data.percent * 100).toFixed(2)}%
                                            </TooltipContent>
                                        );
                                    }
                                    return null;
                                }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <StatDescription style={{textAlign: 'center', marginTop: '1rem'}}>
                            <FaInfoCircle /> Quantity of non-reusable packaging types recorded in sales within the selected period.
                        </StatDescription>
                    </ChartContainer>
                </>
            )}

            {(depositsChargedDetails?.length === 0 && depositsRefundedDetails?.length === 0 && pieChartData.length === 0) && (
                <NoDataMessage>No circular economy data found for the selected period.</NoDataMessage>
            )}

        </ReportContainer>
    );
};

export default CircularEconomyReport;