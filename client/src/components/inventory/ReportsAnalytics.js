"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { FaFilter, FaExclamationTriangle, FaPrint, FaSpinner } from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from 'date-fns/locale';

import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "../common/Card";
import { analyticsAPI } from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";

/* ========= STYLES ========= */

const Container = styled.div`
  padding: 1.5rem;
  background: #f9fafb;
  min-height: 100vh;
`;

const FiltersSection = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  align-items: flex-start;
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

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ReportTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 1.5rem;
`;

const ChartCard = styled(Card)`
  padding: 1.5rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    text-align: center;
    font-weight: 600;
    color: #2d3748;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #718096;
  border: 2px dashed #e2e8f0;
  border-radius: 1rem;
`;

const ErrorContainer = styled(EmptyState)`
  color: #c53030;
  background: #fff5f5;
  border-color: #fecaca;
`;

const PIE_CHART_COLORS = ['#2F855A', '#2C7A7B', '#2B6CB0', '#553C9A', '#B83280'];

const Spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const Spinner = styled(FaSpinner)` animation: ${Spin} 1s linear infinite; `;

/* ========= COMPONENT ========= */

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);

  const [dateRange, setDateRange] = useState([
    { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date(), key: 'selection' }
  ]);
  const debouncedDateRange = useDebounce(dateRange, 500);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const payload = {
      startDate: debouncedDateRange[0].startDate?.toISOString(),
      endDate: debouncedDateRange[0].endDate?.toISOString(),
    };

    try {
      const response = await analyticsAPI.getSalesSummary(payload);
      if (response.success) {
        setReportData(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch report data.");
      toast.error(err.message || "Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  }, [debouncedDateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handlePrint = async () => {
    setPrintLoading(true);
    toast.loading("Generating Report PDF...");
    try {
      const payload = {
        startDate: dateRange[0].startDate?.toISOString(),
        endDate: dateRange[0].endDate?.toISOString(),
      };
      const response = await analyticsAPI.printSalesReport(payload);
      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sales-Analytics-Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("Report downloaded successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || "Failed to print report.");
    } finally {
      setPrintLoading(false);
    }
  };

  const formattedSalesChartData = reportData?.salesOverTime?.map(d => ({
    date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Revenue: d.totalRevenue
  })) || [];

  return (
    <Container>
      <FiltersSection>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>
          <FaFilter /> Analytics Dashboard
        </h3>
        <p style={{ margin: 0, color: '#718096', fontSize: "0.9rem" }}>
          The dashboard updates automatically as you change the filters.
        </p>
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

      {loading && (
        <div style={{ display: 'grid', placeItems: 'center', padding: '4rem' }}>
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <ErrorContainer>
          <FaExclamationTriangle size={32} />
          <h3 style={{ marginTop: '1rem' }}>Could not load data</h3>
          <p>{error}</p>
        </ErrorContainer>
      )}

      {!loading && !error && reportData && (
        <div>
          <ReportHeader>
            <ReportTitle>Sales Report</ReportTitle>
            <Button variant="outline" onClick={handlePrint} disabled={printLoading}>
              {printLoading ? <Spinner /> : <FaPrint />} Print Report
            </Button>
          </ReportHeader>
          <AnalyticsGrid>
            {/* Revenue Chart */}
            <ChartCard style={{ gridColumn: "1 / -1" }}>
              <h3>Revenue Over Period</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={formattedSalesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `Rwf ${value / 1000}k`} />
                  <Tooltip formatter={(value) => `Rwf ${value.toLocaleString()}`} />
                  <Bar dataKey="Revenue" fill="#2F855A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Sales by Category */}
            <ChartCard>
              <h3>Sales by Category</h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={reportData.categoryPerformance}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"     // keep chart static vertically
                    outerRadius={110}
                    labelLine={false}
                  >
                    {reportData.categoryPerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rwf ${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={40} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Sales by Location */}
            <ChartCard>
              <h3>Sales by Location</h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={reportData.locationPerformance}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"     // fixed position
                    outerRadius={110}
                    labelLine={false}
                  >
                    {reportData.locationPerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_CHART_COLORS.slice().reverse()[index % PIE_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rwf ${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={40} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </AnalyticsGrid>
        </div>
      )}
    </Container>
  );
};

export default ReportsAnalytics;
