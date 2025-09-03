"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { FaFilter, FaExclamationTriangle } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from 'date-fns/locale';
import { useSalesAnalytics } from "../../hooks/useSalesAnalytics";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "../common/Card";
import { useDebounce } from "../../hooks/useDebounce";

const Container = styled.div`
  padding: 1.5rem;
`;

const FiltersSection = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.875rem;
`;

const AnalyticsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const ChartCard = styled(Card)`
    padding: 1.5rem;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    h3 {
        margin-top: 0;
        font-size: 1.1rem;
    }
`;

const InfoList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.85rem 0;
        font-size: 0.9rem;
        border-bottom: 1px solid #e2e8f0;
        &:last-child {
            border-bottom: none;
        }
    }
`;

const ErrorContainer = styled(Card)`
    padding: 2rem;
    text-align: center;
    color: #c53030;
    background: #fff5f5;
`;

const EmptyListState = styled.div`
    flex-grow: 1;
    display: grid;
    place-items: center;
    text-align: center;
    color: #a0aec0;
`;

const PIE_CHART_COLORS = ['#2F855A', '#2C7A7B', '#2B6CB0', '#553C9A', '#B83280'];

const ReportsAnalytics = () => {
    const [dateRange, setDateRange] = useState([
        { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date(), key: 'selection' }
    ]);
    const debouncedDateRange = useDebounce(dateRange, 500);
    const { analytics, loading, error } = useSalesAnalytics({
        startDate: debouncedDateRange[0].startDate?.toISOString(),
        endDate: debouncedDateRange[0].endDate?.toISOString(),
    });

    const formattedSalesChartData = analytics?.salesOverTime?.map(d => ({
        date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Revenue: d.totalRevenue
    })) || [];

    const renderContent = () => {
        if (loading) return <div style={{display:'grid', placeItems: 'center', padding: '4rem'}}><LoadingSpinner/></div>;
        if (error) return <ErrorContainer><FaExclamationTriangle size={32}/><h3 style={{marginTop: '1rem'}}>Could not load analytics</h3><p>{error}</p></ErrorContainer>;
        if (!analytics) return null;

        return (
            <AnalyticsGrid>
                <ChartCard style={{ gridColumn: '1 / -1' }}>
                    <h3>Revenue (Last 30 Days)</h3>
                    {formattedSalesChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formattedSalesChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis tickFormatter={(value) => `Rwf ${value / 1000}k`} />
                                <Tooltip formatter={(value) => `Rwf ${value.toLocaleString()}`}/>
                                <Bar dataKey="Revenue" fill="#2F855A" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyListState>No sales data for this period.</EmptyListState>
                    )}
                </ChartCard>

                <ChartCard>
                    <h3>Most Profitable Products</h3>
                    {analytics.mostProfitableProducts?.length > 0 ? (
                        <InfoList>
                            {analytics.mostProfitableProducts.map(p => (
                                <li key={p._id}>
                                    <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                    <strong>Rwf {p.totalProfit.toLocaleString()}</strong>
                                </li>
                            ))}
                        </InfoList>
                    ) : <EmptyListState>No profit data available.</EmptyListState>}
                </ChartCard>

                <ChartCard>
                    <h3>Top Selling Products (by Qty)</h3>
                    {analytics.topSellingProducts?.length > 0 ? (
                        <InfoList>
                            {analytics.topSellingProducts.map(p => (
                                <li key={p._id}>
                                    <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                    <strong>{p.totalQuantitySold.toLocaleString()} sold</strong>
                                </li>
                            ))}
                        </InfoList>
                    ) : <EmptyListState>No sales data available.</EmptyListState>}
                </ChartCard>

                <ChartCard>
                    <h3>Category Performance (by Revenue)</h3>
                     {analytics.categoryPerformance?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart layout="vertical" data={analytics.categoryPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={150} stroke="#333" />
                                <Tooltip formatter={(value) => `Rwf ${value.toLocaleString()}`}/>
                                <Bar dataKey="revenue" fill="#2C7A7B" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyListState>No category data available.</EmptyListState>}
                </ChartCard>

                <ChartCard>
                    <h3>Dead Stock (Not Sold in 90+ Days)</h3>
                    {analytics.deadStock?.length > 0 ? (
                        <InfoList>
                            {analytics.deadStock.map(p => (
                                <li key={p._id}>
                                    <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                    <strong>{p.quantity.toLocaleString()} in stock</strong>
                                </li>
                            ))}
                        </InfoList>
                    ) : <EmptyListState>No dead stock found. Great!</EmptyListState>}
                </ChartCard>
            </AnalyticsGrid>
        );
    };
    
    return (
        <Container>
            <FiltersSection>
                <h3 style={{ margin: 0 }}><FaFilter /> Analytics Dashboard</h3>
                <p style={{ margin: 0, color: '#718096' }}>The dashboard updates automatically as you change the filters.</p>
                <FilterGrid>
                    <FormGroup>
                        <Label>Filter by Date Range</Label>
                        <DateRange
                            editableDateInputs={true}
                            onChange={item => setDateRange([item.selection])}
                            moveRangeOnFirstSelection={false}
                            ranges={dateRange}
                            maxDate={new Date()}
                            locale={enUS}
                        />
                    </FormGroup>
                </FilterGrid>
            </FiltersSection>
            
            {renderContent()}
        </Container>
    );
};

export default ReportsAnalytics;