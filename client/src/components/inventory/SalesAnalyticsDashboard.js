"use client";
import React from 'react';
import styled from 'styled-components';
import { useSalesAnalytics } from '../../hooks/useSalesAnalytics';
import LoadingSpinner from '../common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaExclamationTriangle } from 'react-icons/fa';

// --- Styled components (no changes needed here) ---
const AnalyticsGrid = styled.div`
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;
    @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;
const ChartCard = styled.div`
    background: #fff; border-radius: 1rem; padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;
    min-height: 300px; display: flex; flex-direction: column;
    h3 { margin-top: 0; font-size: 1.1rem; color: #1a202c; }
`;
const FilterBar = styled(ChartCard)`
    grid-column: 1 / -1; flex-direction: row; align-items: center;
    gap: 1.5rem; min-height: auto;
    input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.5rem; }
`;
const InfoList = styled.ul`
    list-style: none; padding: 0; margin: 0; li { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 0; font-size: 0.9rem; border-bottom: 1px solid #e2e8f0; &:last-child { border-bottom: none; } span { color: #4a5568; } strong { color: #1a202c; } }
`;
const EmptyListState = styled.p`text-align: center; color: #a0aec0; margin-top: 4rem;`;
const ErrorContainer = styled.div`
    background: #fff5f5; border: 1px solid #fecaca; border-radius: 0.75rem;
    padding: 2rem; color: #c53030; text-align: center;
`;
// --- End Styled Components ---

const SalesAnalyticsDashboard = () => {
    const { analytics, loading, error, filters, setFilters } = useSalesAnalytics();

    // =========================================================================
    // ** THIS IS THE FIX for the "startDate" error **
    // On the very first render, the `useSalesAnalytics` hook has not run yet,
    // so `filters` is undefined. This guard clause safely exits until `filters`
    // has been initialized with its default state.
    // =========================================================================
    if (!filters) {
        return <div style={{padding: '4rem', textAlign: 'center'}}><LoadingSpinner /></div>;
    }

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newDate = new Date(value);
        if (!isNaN(newDate)) {
            setFilters(prev => ({ ...prev, [name]: newDate }));
        }
    };

    if (error) return (
        <ErrorContainer>
            <FaExclamationTriangle size={32} style={{marginBottom: '1rem'}}/>
            <h3>Could Not Load Analytics</h3>
            <p>{error}</p>
        </ErrorContainer>
    );

    const formattedSalesData = analytics?.salesOverTime?.map(d => ({
        date: new Date(d._id).toLocaleDateTimeString('en-US', { month: 'short', day: 'numeric' }),
        Revenue: d.totalRevenue
    })) || [];

    return (
        <AnalyticsGrid>
            <FilterBar>
                <h3>Filter by Date</h3>
                <div>
                    <label htmlFor="startDate">Start: </label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={filters.startDate.toISOString().split('T')[0]}
                        onChange={handleDateChange}
                    />
                </div>
                <div>
                    <label htmlFor="endDate">End: </label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={filters.endDate.toISOString().split('T')[0]}
                        onChange={handleDateChange}
                    />
                </div>
            </FilterBar>
            
            {loading ? <div style={{padding: '4rem', textAlign: 'center', gridColumn: '1 / -1'}}><LoadingSpinner /></div> : (
            <>
                <ChartCard style={{ gridColumn: '1 / -1' }}>
                    <h3>Revenue</h3>
                    {formattedSalesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formattedSalesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis tickFormatter={(value) => `Rwf ${value / 1000}k`} />
                                <Tooltip formatter={(value) => `Rwf ${Number(value).toLocaleString()}`}/>
                                <Legend />
                                <Bar dataKey="Revenue" fill="#2F855A" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyListState>No sales data available for this period.</EmptyListState>
                    )}
                </ChartCard>
                <ChartCard>
                    <h3>Most Profitable Products</h3>
                    {analytics?.mostProfitableProducts?.length > 0 ? (
                         <InfoList>
                             {analytics.mostProfitableProducts.map(p => (
                                <li key={p._id || p.name}>
                                    <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                    <strong>Rwf {Number(p.totalProfit).toLocaleString()}</strong>
                                </li>
                            ))}
                        </InfoList>
                    ) : (
                         <EmptyListState>No profit data available.</EmptyListState>
                    )}
                </ChartCard>
            </>
            )}
        </AnalyticsGrid>
    );
};

export default SalesAnalyticsDashboard;