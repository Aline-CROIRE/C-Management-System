// src/components/reports/ReportsAndAnalytics.js
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaMoneyBillWave, FaChartLine, FaCalendarAlt, FaRedo, FaDownload, FaMinusCircle, FaPlusCircle, FaBalanceScale } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import AlertCard from '../common/AlertCard';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from 'date-fns/locale';
import moment from 'moment';
import { restaurantAPI, reportsAPI } from '../../services/api'; // Import restaurantAPI specifically
import { CSVLink } from 'react-csv';
import toast from 'react-hot-toast'; // Ensure toast is imported

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const ReportContainer = styled.div`
  padding: 2rem;
  background-color: ${(props) => props.theme.colors.background};
  min-height: calc(100vh - 80px);
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
  right: 0;
  z-index: 1000;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
`;

const PnLCard = styled(Card)`
  padding: 2rem;
  margin-bottom: 2rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: ${(props) => props.theme.shadows.lg};
`;

const PnLSection = styled.div`
  margin-bottom: 1.5rem;
  &:last-of-type { margin-bottom: 0; }
`;

const PnLItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px dashed ${(props) => props.theme.colors.border};
  font-size: 1rem;
  color: ${(props) => props.theme.colors.textPrimary};

  &:last-of-type { border-bottom: none; }

  span {
    font-weight: 500;
  }
  strong {
    font-weight: 700;
  }

  &.subtotal {
    border-bottom: 2px solid ${(props) => props.theme.colors.border};
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
  }
  &.net-profit {
    border-top: 2px solid ${(props) => props.theme.colors.primary};
    padding-top: 1.5rem;
    margin-top: 1.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.primary};
  }
  .icon {
      margin-right: 0.5rem;
  }
  .negative { color: ${(props) => props.theme.colors.error}; }
  .positive { color: ${(props) => props.theme.colors.success}; }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors.heading};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
const SmallPrint = styled.p`
    font-size: 0.8rem;
    color: ${(props) => props.theme.colors.textSecondary};
    text-align: center;
    margin-top: 2rem;
`;

const ProfitLossReport = ({ restaurantId }) => { // Assuming restaurantId is passed
    // --- ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL ---
    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            startDate: moment().subtract(30, 'days').toDate(),
            endDate: moment().toDate(),
            key: 'selection'
        }
    ]);

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useCallback for the refetch function to ensure stability for useEffect dependency
    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Corrected to use reportsAPI.getProfitLossReport (which takes params)
            const response = await reportsAPI.getProfitLossReport({
                restaurantId: restaurantId, // Ensure restaurantId is passed if backend expects it
                startDate: moment(dateRange[0].startDate).format('YYYY-MM-DD'),
                endDate: moment(dateRange[0].endDate).format('YYYY-MM-DD'),
            });
            if (response?.success) {
                setReportData(response.data);
            } else {
                throw new Error(response?.message || 'Failed to fetch Profit & Loss report.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred fetching Profit & Loss report.');
            toast.error(err.message || 'An error occurred fetching Profit & Loss report.'); // Use toast for user feedback
        } finally {
            setLoading(false);
        }
    }, [restaurantId, dateRange]); // Dependencies for refetch

    // useEffect to trigger refetch when dateRange changes
    useEffect(() => {
        refetch();
    }, [dateRange, refetch]); // Also add refetch here to ensure it runs when initial dateRange is set

    // Destructure reportData unconditionally for useMemo and JSX
    const {
        totalRevenue = 0,
        totalCogs = 0,
        grossProfit = 0,
        totalOperatingExpenses = 0,
        expensesByCategory = [],
        totalInternalUseCost = 0,
        totalStockAdjustmentLoss = 0,
        netProfit = 0,
    } = reportData || {};

    const csvData = useMemo(() => {
        if (!reportData) return []; // Ensure reportData is available
        const data = [
            ["Profit & Loss Report"],
            [`Period: ${moment(dateRange[0].startDate).format('YYYY-MM-DD')} to ${moment(dateRange[0].endDate).format('YYYY-MM-DD')}`],
            [],
            ["Metric", "Amount (Rwf)"],
            ["Total Revenue", totalRevenue],
            ["Cost of Goods Sold (COGS)", -totalCogs],
            ["", ""],
            ["Gross Profit", grossProfit],
            ["", ""],
            ["Operating Expenses", -totalOperatingExpenses],
        ];

        expensesByCategory.forEach(exp => {
            data.push([`  - ${exp.name} Expense`, -exp.value]);
        });

        data.push(
            ["", ""],
            ["Other Costs/Losses", ""],
            ["  - Internal Use Cost", -totalInternalUseCost],
            ["  - Stock Adjustment Loss", -totalStockAdjustmentLoss],
            ["", ""],
            ["Net Profit", netProfit]
        );
        return data;
    }, [reportData, dateRange, totalRevenue, totalCogs, grossProfit, totalOperatingExpenses, expensesByCategory, totalInternalUseCost, totalStockAdjustmentLoss, netProfit]);

    const handleDateRangeSelect = useCallback((ranges) => {
        setDateRange([ranges.selection]);
    }, []);

    const formatCurrency = useCallback((amount) => {
        return `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }, []);
    // --- END OF ALL HOOKS ---


    // --- Conditional returns come AFTER all hooks ---
    if (loading) {
        return (
            <ReportContainer>
                <LoadingSpinner message="Loading Profit & Loss Report..." />
            </ReportContainer>
        );
    }

    if (error) {
        return (
            <ReportContainer>
                <AlertCard type="error"><p style={{color: 'red'}}>Error: {error}</p></AlertCard> {/* Use AlertCard consistently */}
            </ReportContainer>
        );
    }
    // --- End of conditional returns ---


    return (
        <ReportContainer>
            <ReportHeader>
                <Title><FaChartLine /> Profit & Loss Report</Title>
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
                    {/* CSVLink is safe to use as csvData is memoized */}
                    <CSVLink data={csvData} filename={`profit_loss_report_${moment(dateRange[0].startDate).format('YYYYMMDD')}_${moment(dateRange[0].endDate).format('YYYYMMDD')}.csv`}>
                        <Button variant="info" icon={<FaDownload />}>CSV</Button>
                    </CSVLink>
                </FilterSection>
            </ReportHeader>

            {reportData && (totalRevenue || totalCogs || totalOperatingExpenses || totalInternalUseCost || totalStockAdjustmentLoss) ? (
                <PnLCard>
                    <PnLSection>
                        <SectionTitle><FaPlusCircle /> Income</SectionTitle>
                        <PnLItem>
                            <span>Total Revenue</span>
                            <strong className="positive">{formatCurrency(totalRevenue)}</strong>
                        </PnLItem>
                        <PnLItem className="subtotal">
                            <span>Gross Income</span>
                            <strong>{formatCurrency(totalRevenue)}</strong>
                        </PnLItem>
                    </PnLSection>

                    <PnLSection>
                        <SectionTitle><FaMinusCircle /> Cost of Goods Sold (COGS)</SectionTitle>
                        <PnLItem>
                            <span>Cost of Goods Sold</span>
                            <strong className="negative">{formatCurrency(totalCogs)}</strong>
                        </PnLItem>
                        <PnLItem className="subtotal">
                            <span>Total COGS</span>
                            <strong className="negative">{formatCurrency(totalCogs)}</strong>
                        </PnLItem>
                    </PnLSection>

                    <PnLSection>
                        <PnLItem className="subtotal">
                            <span>Gross Profit</span>
                            <strong className={grossProfit >= 0 ? 'positive' : 'negative'}>{formatCurrency(grossProfit)}</strong>
                        </PnLItem>
                    </PnLSection>

                    <PnLSection>
                        <SectionTitle><FaMinusCircle /> Operating Expenses</SectionTitle>
                        <PnLItem>
                            <span>Total Operating Expenses</span>
                            <strong className="negative">{formatCurrency(totalOperatingExpenses)}</strong>
                        </PnLItem>
                        {expensesByCategory && expensesByCategory.length > 0 && (
                            <div style={{marginLeft: '1.5rem', borderLeft: '2px solid #e2e8f0', paddingLeft: '1rem'}}>
                                {expensesByCategory.map((exp, index) => (
                                    <PnLItem key={exp.name || index} style={{fontSize: '0.9rem', borderBottom: 'none'}}>
                                        <span>- {exp.name}</span>
                                        <span className="negative">{formatCurrency(exp.value)}</span>
                                    </PnLItem>
                                ))}
                            </div>
                        )}
                        <PnLItem className="subtotal">
                            <span>Total Operating Expenses</span>
                            <strong className="negative">{formatCurrency(totalOperatingExpenses)}</strong>
                        </PnLItem>
                    </PnLSection>

                    <PnLSection>
                        <SectionTitle><FaMinusCircle /> Other Costs & Losses</SectionTitle>
                        <PnLItem>
                            <span>Internal Use Cost</span>
                            <strong className="negative">{formatCurrency(totalInternalUseCost)}</strong>
                        </PnLItem>
                        <PnLItem>
                            <span>Stock Adjustment Loss</span>
                            <strong className="negative">{formatCurrency(totalStockAdjustmentLoss)}</strong>
                        </PnLItem>
                        <PnLItem className="subtotal">
                            <span>Total Other Costs</span>
                            <strong className="negative">{formatCurrency(totalInternalUseCost + totalStockAdjustmentLoss)}</strong>
                        </PnLItem>
                    </PnLSection>

                    <PnLItem className="net-profit">
                        <span style={{display: 'flex', alignItems: 'center'}}><FaBalanceScale className="icon"/>Net Profit</span>
                        <strong className={netProfit >= 0 ? 'positive' : 'negative'}>{formatCurrency(netProfit)}</strong>
                    </PnLItem>
                </PnLCard>
            ) : (
                <NoDataMessage>No Profit & Loss data available for the selected period.</NoDataMessage>
            )}
             <SmallPrint>
                **Disclaimer:** This report provides a simplified Profit & Loss statement. For comprehensive financial reporting, please consult with an accountant and consider all applicable income, expenses, assets, and liabilities.
            </SmallPrint>
        </ReportContainer>
    );
};

export default ProfitLossReport;