"use client";
import React from 'react';
import styled from 'styled-components';
import { useSalesAnalytics } from '../../hooks/useSalesAnalytics';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LabelList
} from 'recharts';
import { FaExclamationTriangle } from 'react-icons/fa';

const AnalyticsGrid = styled.div`
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    @media (max-width: 1024px) { 
        grid-template-columns: 1fr; 
    }
`;
const ChartCard = styled.div`
    background: #fff; 
    border-radius: 1rem; 
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
    border: 1px solid #e2e8f0;
    min-height: 300px; 
    display: flex; 
    flex-direction: column;
    h3 { 
        margin-top: 0; 
        font-size: 1.1rem; 
        color: #1a202c; 
        margin-bottom: 1rem;
    }
`;
const FilterBar = styled(ChartCard)`
    grid-column: 1 / -1; 
    flex-direction: row; 
    align-items: center;
    gap: 1.5rem; 
    min-height: auto;
    flex-wrap: wrap;
    input { 
        padding: 0.5rem; 
        border: 1px solid #ccc; 
        border-radius: 0.5rem; 
    }
    label {
        font-weight: 500;
        color: #4a5568;
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
        &:last-child { border-bottom: none; } 
        span { color: #4a5568; } 
        strong { color: #1a202c; } 
    }
`;
const EmptyListState = styled.p`text-align: center; color: #a0aec0; margin-top: 4rem;`;
const ErrorContainer = styled.div`
    background: #fff5f5; 
    border: 1px solid #fecaca; 
    border-radius: 0.75rem;
    padding: 2rem; 
    color: #c53030; 
    text-align: center;
    grid-column: 1 / -1;
`;
const StatBox = styled(ChartCard)`
    text-align: center;
    justify-content: center;
    align-items: center;
    h3 { margin-bottom: 0.5rem; }
    .value { font-size: 2.2rem; font-weight: 700; color: #2F855A; }
    .label { font-size: 0.9rem; color: #718096; }
`;
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1942', '#8B008B', '#FFD700', '#6A5ACD', '#DC143C'];


const SalesAnalyticsDashboard = ({ analyticsFilters, setAnalyticsFilters }) => {
    const { analytics, loading, error, filters, setFilters } = useSalesAnalytics(analyticsFilters);

    if (!filters) {
        return <div style={{padding: '4rem', textAlign: 'center'}}><LoadingSpinner /></div>;
    }

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newDate = new Date(value);
        if (!isNaN(newDate)) {
            setFilters(prev => ({ ...prev, [name]: newDate })); 
            setAnalyticsFilters(prev => ({ ...prev, [name]: newDate }));
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
        date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Revenue: Number(d.totalRevenue || 0) // Ensure revenue is a number
    })) || [];

    const formattedPaymentData = analytics?.salesByPaymentMethod?.map(d => ({
        name: d.name || d._id || 'Other Payment Method', // Use d.name, fallback to d._id, then default string
        value: Number(d.totalAmount || 0) // Ensure value is a number
    })) || [];

    const formattedTopSellingProducts = analytics?.topSellingProductsByQuantity?.map(d => ({
        name: d.name || 'Unknown Product',
        'Quantity Sold': Number(d.totalQuantitySold || 0)
    })) || [];

    const formattedSalesByCategory = analytics?.salesByCategory?.map(d => ({
        name: d.name || 'Uncategorized', 
        value: Number(d.value || 0) // Ensure value is a number
    })) || [];

    const totalRevenue = analytics?.overallStats?.totalRevenue || 0;
    const totalSalesCount = analytics?.overallStats?.totalSalesCount || 0;
    const totalProfit = analytics?.overallStats?.totalProfit || 0;

    // Custom formatter for LabelList - improved robustness
    const renderLabelText = ({ name, percent }) => {
      // Check if name is valid and if percent is a valid number
      if (!name || isNaN(percent) || percent === 0) {
        return null; // Don't display label if name is missing or percentage is 0/NaN
      }
      const formattedPercent = (percent * 100).toFixed(0);
      // Optionally hide very small slices unless they are 'Other' or 'Uncategorized' and have some value
      if (formattedPercent < 5 && name !== 'Other Payment Method' && name !== 'Uncategorized' && Number(formattedPercent) === 0) {
        return null;
      }
      return `${name} ${formattedPercent}%`;
    };


    return (
        <AnalyticsGrid>
            <FilterBar>
                <h3>Filter Period:</h3>
                <div>
                    <label htmlFor="startDate">From: </label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={filters.startDate.toISOString().split('T')[0]}
                        onChange={handleDateChange}
                    />
                </div>
                <div>
                    <label htmlFor="endDate">To: </label>
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
                <StatBox>
                    <h3>Total Revenue</h3>
                    <div className="value">Rwf {totalRevenue.toLocaleString()}</div>
                    <div className="label">For selected period</div>
                </StatBox>
                <StatBox>
                    <h3>Total Sales</h3>
                    <div className="value">{totalSalesCount.toLocaleString()}</div>
                    <div className="label">Transactions</div>
                </StatBox>
                <StatBox>
                    <h3>Total Profit</h3>
                    <div className="value">Rwf {totalProfit.toLocaleString()}</div>
                    <div className="label">For selected period</div>
                </StatBox>

                <ChartCard style={{ gridColumn: '1 / -1' }}>
                    <h3>Revenue Over Time</h3>
                    {formattedSalesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formattedSalesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis tickFormatter={(value) => `Rwf ${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => [`Rwf ${Number(value).toLocaleString()}`, 'Revenue']}/>
                                <Legend />
                                <Bar dataKey="Revenue" fill="#2F855A" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyListState>No revenue data available for this period.</EmptyListState>
                    )}
                </ChartCard>

                <ChartCard>
                    <h3>Most Profitable Products</h3>
                    {analytics?.mostProfitableProducts?.length > 0 ? (
                         <InfoList>
                             {analytics.mostProfitableProducts.map((p, index) => (
                                <li key={p._id || `profitable-${index}`}>
                                    <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                    <strong>Rwf {Number(p.totalProfit).toLocaleString()}</strong>
                                </li>
                            ))}
                        </InfoList>
                    ) : (
                         <EmptyListState>No profit data available.</EmptyListState>
                    )}
                </ChartCard>

                <ChartCard>
                    <h3>Sales by Payment Method</h3>
                    {formattedPaymentData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={formattedPaymentData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {formattedPaymentData.map((entry, index) => (
                                        <Cell key={`cell-payment-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                    <LabelList 
                                        dataKey="name" 
                                        position="outside" 
                                        formatter={renderLabelText} 
                                        fill="#000"
                                        stroke="none"
                                        fontSize={12}
                                    />
                                </Pie>
                                <Tooltip formatter={(value) => `Rwf ${Number(value).toLocaleString()}`}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyListState>No payment method data available.</EmptyListState>
                    )}
                </ChartCard>

                <ChartCard>
                    <h3>Sales by Category</h3>
                    {formattedSalesByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={formattedSalesByCategory}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {formattedSalesByCategory.map((entry, index) => (
                                        <Cell key={`cell-category-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                     <LabelList 
                                        dataKey="name" 
                                        position="outside" 
                                        formatter={renderLabelText} 
                                        fill="#000"
                                        stroke="none"
                                        fontSize={12}
                                    />
                                </Pie>
                                <Tooltip formatter={(value) => `Rwf ${Number(value).toLocaleString()}`}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyListState>No sales by category data available.</EmptyListState>
                    )}
                </ChartCard>

                <ChartCard style={{ gridColumn: '1 / -1' }}>
                    <h3>Top Selling Products by Quantity</h3>
                    {formattedTopSellingProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formattedTopSellingProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `${value}`} />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} Units`, 'Quantity Sold']}/>
                                <Legend />
                                <Bar dataKey="Quantity Sold" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyListState>No top selling product data available.</EmptyListState>
                    )}
                </ChartCard>
            </>
            )}
        </AnalyticsGrid>
    );
};

export default SalesAnalyticsDashboard;