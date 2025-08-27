"use client";
import React, { useState, useEffect, useCallback } from "react"
import styled from "styled-components"
import {
  FaChartLine, FaDownload, FaFilter, FaFileAlt, FaChartBar, FaChartPie,
   FaDollarSign, FaBoxes, FaExclamationTriangle,
} from "react-icons/fa"
import Button from "../common/Button"
import Input from "../common/Input"
import Select from "../common/Select"
import LoadingSpinner from "../common/LoadingSpinner"
import Card from "../common/Card"
import { reportsAPI, inventoryAPI } from "../../services/api" // Assuming these API services exist
import { useNotifications } from "../../contexts/NotificationContext"

const Container = styled.div`
  padding: 2rem;
`
const FiltersSection = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 2rem;
`
const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`
const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`
const Label = styled.label`
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  font-size: 0.875rem;
`
const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
`
const ReportCard = styled(Card)`
  padding: 1.5rem;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: 1px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(0, 0, 0, 0.1)"};
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }
`
const ReportHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`
const ReportIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${(props) => props.iconColor || props.theme.colors?.primary || "#1b4332"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
`
const ReportInfo = styled.div`flex: 1;`
const ReportTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.heading || "#1a202c"};
  margin: 0 0 0.25rem 0;
`
const ReportDescription = styled.p`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0;
`
const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: 1rem;
  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.3;
  }
`

const ReportsAnalytics = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        category: "",
    })
    const { addNotification } = useNotifications();

    // This function would be in your API service file.
    // It's here as a placeholder for a real API call.
    const mockGenerateReport = async (reportId, filters) => {
        console.log(`Generating report '${reportId}' with filters:`, filters);
        setLoading(true);
        await new Promise(res => setTimeout(res, 1000)); // Simulate network delay
        setLoading(false);
        if (reportId === 'low-stock') {
            return { success: true, data: [
                { sku: 'LP-123', name: 'Laptop Pro', quantity: 3, reorderPoint: 5 },
                { sku: 'MS-456', name: 'Wireless Mouse', quantity: 8, reorderPoint: 10 },
            ]};
        }
        return { success: true, data: [{ message: `Data for ${reportId} would appear here.` }]};
    };


    const handleGenerateReport = (report) => {
        // In a real app, you would fetch data here and display it.
        mockGenerateReport(report.id, filters);
        addNotification({
            type: 'info',
            title: `Generating ${report.title}`,
            message: 'Your report is being prepared...'
        });
    }

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }))
    }
    
    const reportTypes = [
        { id: "inventory-summary", title: "Inventory Summary", description: "Overview of current stock levels and values", icon: <FaBoxes />, iconColor: "#2c7a7b" },
        { id: "low-stock", title: "Low Stock Report", description: "Items that have fallen below their reorder point", icon: <FaExclamationTriangle />, iconColor: "#dd6b20" },
        { id: "valuation", title: "Inventory Valuation", description: "Total financial value of all inventory items", icon: <FaDollarSign />, iconColor: "#2f855a" },
        { id: "sales-history", title: "Sales History", description: "Track sales performance over a date range", icon: <FaChartBar />, iconColor: "#553c9a" },
        { id: "abc-analysis", title: "ABC Analysis", description: "Categorize items based on their value to the business", icon: <FaChartPie />, iconColor: "#b83280" },
        { id: "supplier-performance", title: "Supplier Performance", description: "Analyze supplier delivery times and order accuracy", icon: <FaChartBar />, iconColor: "#065f46" },
    ]

    return (
        <Container>
            <FiltersSection>
                <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FaFilter /> Report Filters
                </h3>
                <FilterGrid>
                    <FilterGroup>
                        <Label>Start Date</Label>
                        <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
                    </FilterGroup>
                    <FilterGroup>
                        <Label>End Date</Label>
                        <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
                    </FilterGroup>
                    <FilterGroup>
                        <Label>Category</Label>
                        <Select value={filters.category} onChange={(e) => handleFilterChange("category", e.target.value)}>
                            <option value="">All Categories</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Hardware">Hardware</option>
                        </Select>
                    </FilterGroup>
                </FilterGrid>
            </FiltersSection>
            
            <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FaFileAlt /> Available Reports
                </h3>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><LoadingSpinner size="60px" /></div>
            ) : error ? (
                <EmptyState>
                    <div className="icon"><FaExclamationTriangle /></div>
                    <h3>Error Loading Reports</h3>
                    <p>{error}</p>
                </EmptyState>
            ) : (
                <ReportsGrid>
                    {reportTypes.map((report) => (
                        <ReportCard key={report.id} onClick={() => handleGenerateReport(report)}>
                            <ReportHeader>
                                <ReportIcon iconColor={report.iconColor}>{report.icon}</ReportIcon>
                                <ReportInfo>
                                    <ReportTitle>{report.title}</ReportTitle>
                                    <ReportDescription>{report.description}</ReportDescription>
                                </ReportInfo>
                            </ReportHeader>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                <Button variant="primary" fullWidth>Generate</Button>
                                <Button variant="outline" iconOnly title="Download as CSV"><FaDownload /></Button>
                            </div>
                        </ReportCard>
                    ))}
                </ReportsGrid>
            )}
        </Container>
    )
}

export default ReportsAnalytics