// src/components/reports/ReportsAnalytics.js
"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { FaFilter, FaExclamationTriangle, FaBoxes, FaMoneyBillWave, FaChartLine, FaUsers, FaDollyFlatbed, FaShoppingCart, FaDollarSign, FaTruckLoading, FaWarehouse, FaArrowDown, FaArrowUp, FaClipboardList, FaPercent, FaPrint, FaArchive } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line } from 'recharts';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from 'date-fns/locale';
import { useReportsAnalytics } from "../../hooks/useReportsAnalytics"; // Corrected path
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "../common/Card";
import { useDebounce } from "../../hooks/useDebounce"; // Assuming this hook exists
import moment from "moment";

const Container = styled.div.attrs({
  className: 'printable-report-content' // ADDED THIS LINE
})`
  padding: 1.5rem;
  // No @media print styles here, they are in App.css now for global control
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  // No @media print styles here, they are in App.css now
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  color: #1a202c;
`;

const FiltersSection = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  // No @media print styles here, they are in App.css now
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.875rem;
  color: #4a5568;
`;

const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
`;

const SummaryCard = styled(Card)`
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    .icon {
        font-size: 1.8rem;
        color: #2F855A;
    }
    .value {
        font-size: 1.7rem;
        font-weight: 700;
        color: #1a202c;
    }
    .label {
        font-size: 0.9rem;
        color: #718096;
    }
    .percent-value {
        font-size: 1.7rem;
        font-weight: 700;
        color: ${props => props.$value && props.$value > 0 ? '#2F855A' : (props.$value < 0 ? '#C53030' : '#1a202c')};
    }
`;

const AnalyticsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
    // No @media print styles here, they are in App.css now
`;

const ChartCard = styled(Card)`
    padding: 1.5rem;
    min-height: 350px;
    display: flex;
    flex-direction: column;
    h3 {
        margin-top: 0;
        font-size: 1.1rem;
        color: #1a202c;
        margin-bottom: 1rem;
    }
    // No @media print styles here, they are in App.css now
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
        span { color: #4a5568; }
        strong { color: #1a202c; }
    }
`;

const ErrorContainer = styled(Card)`
    padding: 2rem;
    text-align: center;
    color: #c53030;
    background: #fff5f5;
    grid-column: 1 / -1;
`;

const EmptyListState = styled.div`
    flex-grow: 1;
    display: grid;
    place-items: center;
    text-align: center;
    color: #a0aec0;
    padding: 2rem;
`;

const Disclaimer = styled(Card)`
    grid-column: 1 / -1;
    background: #fff8e1;
    color: #856404;
    border-color: #ffeeba;
    padding: 1rem 1.5rem;
    font-size: 0.9rem;
    margin-top: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    .icon {
        font-size: 1.2rem;
        flex-shrink: 0;
        margin-top: 0.15rem;
    }
    strong {
        color: #856404;
    }
`;

const CHART_COLORS = ['#2F855A', '#2C7A7B', '#2B6CB0', '#553C9A', '#B83280', '#D69E2E', '#DD6B20', '#C53030', '#6B46C1', '#7F5AD5', '#D53F8C', '#F6AD55'];

const ReportsAnalytics = () => {
    const [dateRange, setDateRange] = useState([
        { startDate: moment().subtract(30, 'days').toDate(), endDate: moment().toDate(), key: 'selection' }
    ]);
    const debouncedDateRange = useDebounce(dateRange, 300);
    
    const { reportsData, loading, error } = useReportsAnalytics({
        startDate: debouncedDateRange[0].startDate,
        endDate: debouncedDateRange[0].endDate,
    });

    const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    const formatNumber = (num) => Number(num || 0).toLocaleString();
    const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

    const formattedSalesOverTime = reportsData?.salesOverTime?.map(d => ({
        date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Revenue: Number(d.totalRevenue || 0)
    })) || [];

    const formattedRevenueVsPoData = reportsData?.revenueVsPoData?.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Revenue: Number(d.Revenue || 0),
        POSpend: Number(d.POSpend || 0)
    })) || [];

    const formattedSalesByCategory = reportsData?.salesByCategory?.map(d => ({
        name: d.name || 'Uncategorized',
        value: Number(d.value || 0)
    })) || [];

    const formattedPOStatusOverview = reportsData?.poStatusOverview?.map(d => ({
        name: d.status,
        count: Number(d.count || 0)
    })) || [];

    const formattedSalesByPaymentMethod = reportsData?.salesByPaymentMethod?.map(d => ({
        name: d._id || 'Other/Unknown Payment',
        value: Number(d.totalAmount || 0)
    })) || [];

    const renderPieLabel = ({ name, percent, value }) => {
        if (!name || isNaN(percent) || percent === 0 || value === 0) {
            return null;
        }
        
        const formattedPercent = (percent * 100).toFixed(0);
        if (formattedPercent < 5 && name !== 'Other/Unknown Payment' && name !== 'Uncategorized') {
            return null;
        }
        return `${name} ${formattedPercent}%`;
    };

    const handlePrint = () => {
        window.print();
    };


    const renderContent = () => {
        if (loading) return <div style={{display:'grid', placeItems: 'center', padding: '4rem', gridColumn: '1 / -1'}}><LoadingSpinner/></div>;
        if (error) return (
            <ErrorContainer>
                <FaExclamationTriangle size={32} style={{marginBottom: '1rem'}}/>
                <h3 style={{marginTop: '1rem'}}>Could not load comprehensive reports</h3>
                <p>{error}</p>
            </ErrorContainer>
        );
        if (!reportsData) return <EmptyListState>No data available for the selected period.</EmptyListState>;

        const overallSalesStats = reportsData.overallSalesStats;
        const inventoryValuation = reportsData.inventoryValuation;

        return (
            <>
                <SummaryGrid>
                    <SummaryCard>
                        <FaMoneyBillWave className="icon"/>
                        <div className="value">{formatCurrency(overallSalesStats.totalRevenue)}</div>
                        <div className="label">Total Revenue (for selected period)</div>
                    </SummaryCard>
                    <SummaryCard>
                        <FaDollarSign className="icon"/>
                        <div className="value">{formatCurrency(overallSalesStats.totalProfit)}</div>
                        <div className="label">Total Profit (for selected period)</div>
                    </SummaryCard>
                    <SummaryCard $value={overallSalesStats.grossRoi}>
                        <FaPercent className="icon" style={{color: '#D69E2E'}}/>
                        <div className="percent-value">{formatPercent(overallSalesStats.grossRoi)}</div>
                        <div className="label">Gross ROI (for selected period)</div>
                    </SummaryCard>
                    <SummaryCard>
                        <FaShoppingCart className="icon"/>
                        <div className="value">{formatNumber(overallSalesStats.totalSalesCount)}</div>
                        <div className="label">Total Sales Transactions (for selected period)</div>
                    </SummaryCard>
                    <SummaryCard>
                        <FaTruckLoading className="icon" style={{color: '#2B6CB0'}}/>
                        <div className="value">{formatCurrency(reportsData.totalCompletedPOValue)}</div>
                        <div className="label">Total PO Spend (for selected period)</div>
                    </SummaryCard>
                    <SummaryCard>
                        <FaBoxes className="icon"/>
                        <div className="value">{formatCurrency(inventoryValuation.totalRetailValue)}</div>
                        <div className="label">Current Retail Stock Value</div>
                    </SummaryCard>
                     <SummaryCard>
                        <FaWarehouse className="icon"/>
                        <div className="value">{formatNumber(inventoryValuation.uniqueProducts)}</div>
                        <div className="label">Unique Products in Stock</div>
                    </SummaryCard>
                </SummaryGrid>

                <AnalyticsGrid>
                    <ChartCard style={{ gridColumn: '1 / -1' }}>
                        <h3>Revenue vs. PO Spend Over Time</h3>
                        {formattedRevenueVsPoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={formattedRevenueVsPoData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(value) => `Rwf ${(value / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="Revenue" stroke={CHART_COLORS[0]} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="POSpend" stroke={CHART_COLORS[2]} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyListState>No revenue or PO spend data for this period.</EmptyListState>
                        )}
                    </ChartCard>

                    <ChartCard>
                        <h3>Most Profitable Products</h3>
                        {reportsData.mostProfitableProducts?.length > 0 ? (
                            <InfoList>
                                {reportsData.mostProfitableProducts.map((p, index) => (
                                    <li key={p._id || `profitable-${index}`}>
                                        <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                        <strong>{formatCurrency(p.totalProfit)}</strong>
                                    </li>
                                ))}
                            </InfoList>
                        ) : <EmptyListState>No profit data available.</EmptyListState>}
                    </ChartCard>

                    <ChartCard>
                        <h3>Top Selling Products (by Quantity)</h3>
                        {reportsData.topSellingProductsByQuantity?.length > 0 ? (
                            <InfoList>
                                {reportsData.topSellingProductsByQuantity.map((p, index) => (
                                    <li key={p._id || `topselling-${index}`}>
                                        <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                        <strong>{formatNumber(p.totalQuantitySold)} sold</strong>
                                    </li>
                                ))}
                            </InfoList>
                        ) : <EmptyListState>No top selling products data available.</EmptyListState>}
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
                                        labelLine={false}
                                        label={renderPieLabel}
                                    >
                                        {formattedSalesByCategory.map((entry, index) => (
                                            <Cell key={`cell-category-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <EmptyListState>No category sales data available.</EmptyListState>}
                    </ChartCard>
                    
                    <ChartCard>
                        <h3>Sales by Payment Method</h3>
                        {formattedSalesByPaymentMethod.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={formattedSalesByPaymentMethod}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        labelLine={false}
                                        label={renderPieLabel}
                                    >
                                        {formattedSalesByPaymentMethod.map((entry, index) => (
                                            <Cell key={`cell-payment-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <EmptyListState>No payment method data available.</EmptyListState>}
                    </ChartCard>

                    <ChartCard>
                        <h3>Purchase Order Status</h3>
                        {formattedPOStatusOverview.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                          <BarChart layout="vertical" data={formattedPOStatusOverview}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={formatNumber} />
                                    <YAxis type="category" dataKey="name" width={100} />
                                    <Tooltip formatter={(value) => [`${formatNumber(value)} POs`, 'Count']}/>
                                    <Legend />
                                    <Bar dataKey="count" fill={CHART_COLORS[4]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyListState>No purchase order data available.</EmptyListState>}
                    </ChartCard>

                    <ChartCard>
                        <h3>Low Stock Items <FaArrowDown style={{color: '#DD6B20'}}/></h3>
                        {reportsData.lowStockItems?.length > 0 ? (
                            <InfoList>
                                {reportsData.lowStockItems.map((p, index) => (
                                    <li key={p._id || `lowstock-${index}`}>
                                        <span>{p.name} ({p.sku})</span>
                                        <strong>{formatNumber(p.quantity)} / {formatNumber(p.minStockLevel)}</strong>
                                    </li>
                                ))}
                            </InfoList>
                        ) : <EmptyListState>No low stock items. Great!</EmptyListState>}
                    </ChartCard>

                    <ChartCard>
                        <h3>Dead Stock <FaClipboardList style={{color: '#C53030'}}/></h3>
                        {reportsData.deadStock?.length > 0 ? (
                            <InfoList>
                                {reportsData.deadStock.map((p, index) => (
                                    <li key={p._id || `deadstock-${index}`}>
                                        <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                        <strong>{formatNumber(p.quantity)} in stock (not sold in 90+ days)</strong>
                                    </li>
                                ))}
                            </InfoList>
                        ) : <EmptyListState>No dead stock found. Excellent!</EmptyListState>}
                    </ChartCard>

                    <ChartCard>
                        <h3>Out of Stock Items <FaArchive style={{color: '#718096'}}/></h3>
                        {reportsData.outOfStockItems?.length > 0 ? (
                            <InfoList>
                                {reportsData.outOfStockItems.map((p, index) => (
                                    <li key={p._id || `outofstock-${index}`}>
                                        <span>{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                        <strong>{formatNumber(p.quantity)} in stock</strong>
                                    </li>
                                ))}
                            </InfoList>
                        ) : <EmptyListState>No items currently out of stock. Great!</EmptyListState>}
                    </ChartCard>
                    
                    <ChartCard>
                        <h3>Top Suppliers (by Spend) <FaTruckLoading style={{color: '#553C9A'}}/></h3>
                        {reportsData.topSuppliers?.length > 0 ? (
                            <InfoList>
                                {reportsData.topSuppliers.map((s, index) => (
                                    <li key={s._id || `supplier-${index}`}>
                                        <span>{s.name}</span>
                                        <strong>{formatCurrency(s.totalPurchasedValue)}</strong>
                                    </li>
                                ))}
                            </InfoList>
                        ) : <EmptyListState>No supplier data available.</EmptyListState>}
                    </ChartCard>
                    
                    <ChartCard>
                        <h3>Top Customers (by Spend) <FaUsers style={{color: '#2B6CB0'}}/></h3>
                        {reportsData.topCustomers?.length > 0 ? (
                            <InfoList>
                                {reportsData.topCustomers.map((c, index) => (
                                    <li key={c._id || `customer-${index}`}>
                                        <span>{c.name} {c.email ? `(${c.email})` : ''}</span>
                                        <strong>{formatCurrency(c.totalSpent)}</strong>
                                    </li>
                                ))}
                            </InfoList>
                        ) : <EmptyListState>No customer data available.</EmptyListState>}
                    </ChartCard>

                </AnalyticsGrid>
            </>
        );
    };
    
    return (
        <Container>
            <Header>
                <PageTitle>Comprehensive Business Report</PageTitle>
                <Button variant="secondary" onClick={handlePrint}>
                    <FaPrint style={{marginRight: '0.5rem'}}/> Print Report
                </Button>
            </Header>
            <FiltersSection>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaFilter /> Report Filters</h3>
                <FilterGrid>
                    <FormGroup>
                        <Label>Date Range</Label>
                        <DateRange
                            editableDateInputs={true}
                            onChange={item => setDateRange([item.selection])}
                            moveRangeOnFirstSelection={false}
                            ranges={dateRange}
                            maxDate={new Date()}
                            locale={enUS}
                            direction="horizontal"
                            className="date-range-picker"
                        />
                    </FormGroup>
                </FilterGrid>
                <Disclaimer>
                    <FaExclamationTriangle className="icon"/>
                    <strong>Note on Profitability:</strong> "Gross ROI" (Return on Investment) is calculated here using only direct Cost of Goods Sold (COGS) against Gross Profit.
                    A true "Net ROI" or "Break-even Point" would require tracking all business operating expenses (fixed and variable costs), which are not available in the current inventory-focused data.
                </Disclaimer>
            </FiltersSection>
            
            {renderContent()}
        </Container>
    );
};

export default ReportsAnalytics;