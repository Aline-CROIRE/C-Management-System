"use client"

import { useState, useEffect, useCallback } from "react"
import styled from "styled-components"
import {
  FaChartLine,
  FaDownload,
  FaFilter,
  FaFileAlt,
  FaChartBar,
  FaChartPie,
  FaTrendingUp,
  FaDollarSign,
  FaBoxes,
  FaExclamationTriangle,
} from "react-icons/fa"
import Button from "../common/Button"
import Input from "../common/Input"
import LoadingSpinner from "../common/LoadingSpinner"
import Card from "../common/Card"
import { reportsAPI, inventoryAPI } from "../../services/api"
import { useNotifications } from "../../contexts/NotificationContext"

const Container = styled.div`
  padding: 2rem;
`

const FiltersSection = styled.div`
  background: white;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
`

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
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

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  background: white;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }
`

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const ReportCard = styled(Card)`
  padding: 1.5rem;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
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
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.iconColor || props.theme.colors?.primary || "#1b4332"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
`

const ReportInfo = styled.div`
  flex: 1;
`

const ReportTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0 0 0.25rem 0;
`

const ReportDescription = styled.p`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0;
`

const StatsSection = styled.div`
  background: white;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`

const StatCard = styled.div`
  text-align: center;
  padding: 1rem;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: 0.25rem;
`

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-weight: 500;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }
`

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    category: "",
    location: "",
    reportType: "summary",
  })

  const { addNotification } = useNotifications()

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await reportsAPI.getInventoryReport(filters)

      if (response.success) {
        setReportData(response.data)
      } else {
        throw new Error(response.message || "Failed to fetch report data")
      }
    } catch (err) {
      setError(err.message)
      addNotification({
        type: "error",
        title: "Error Loading Report",
        message: err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [filters, addNotification])

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  // Generate report
  const handleGenerateReport = (reportType) => {
    setFilters((prev) => ({ ...prev, reportType }))
    fetchReportData()
  }

  // Export report
  const handleExportReport = async (format) => {
    try {
      setLoading(true)

      // For now, export current inventory data
      const response = await inventoryAPI.export(format, filters)

      if (response.success) {
        // Create and download file
        const dataStr = format === "json" ? JSON.stringify(response.data, null, 2) : convertToCSV(response.data)

        const dataBlob = new Blob([dataStr], { type: format === "json" ? "application/json" : "text/csv" })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = response.filename || `report.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        addNotification({
          type: "success",
          title: "Export Complete",
          message: `Report exported as ${format.toUpperCase()}`,
        })
      }
    } catch (err) {
      addNotification({
        type: "error",
        title: "Export Failed",
        message: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Convert data to CSV format
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
    ].join("\n")

    return csvContent
  }

  // Initialize data
  useEffect(() => {
    fetchReportData()
  }, [])

  const reportTypes = [
    {
      id: "inventory-summary",
      title: "Inventory Summary",
      description: "Overview of current inventory levels and values",
      icon: <FaBoxes />,
      iconColor: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
    },
    {
      id: "low-stock",
      title: "Low Stock Report",
      description: "Items that need to be restocked",
      icon: <FaExclamationTriangle />,
      iconColor: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
    },
    {
      id: "valuation",
      title: "Inventory Valuation",
      description: "Total value of inventory by category and location",
      icon: <FaDollarSign />,
      iconColor: "linear-gradient(135deg, #40916c 0%, #2d5016 100%)",
    },
    {
      id: "movement",
      title: "Stock Movement",
      description: "Track inventory movements over time",
      icon: <FaTrendingUp />,
      iconColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      id: "abc-analysis",
      title: "ABC Analysis",
      description: "Categorize items by value and importance",
      icon: <FaChartPie />,
      iconColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      id: "supplier-performance",
      title: "Supplier Performance",
      description: "Analyze supplier delivery and quality metrics",
      icon: <FaChartBar />,
      iconColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
  ]

  return (
    <Container>
      {/* Filters Section */}
      <FiltersSection>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaFilter /> Report Filters
        </h3>

        <FilterGrid>
          <FilterGroup>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <Label>Category</Label>
            <Select value={filters.category} onChange={(e) => handleFilterChange("category", e.target.value)}>
              <option value="">All Categories</option>
              <option value="Construction Materials">Construction Materials</option>
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="Electronics">Electronics</option>
              <option value="Office Supplies">Office Supplies</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label>Location</Label>
            <Select value={filters.location} onChange={(e) => handleFilterChange("location", e.target.value)}>
              <option value="">All Locations</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
              <option value="Cold Storage">Cold Storage</option>
              <option value="Retail Floor">Retail Floor</option>
            </Select>
          </FilterGroup>
        </FilterGrid>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={() => handleExportReport("csv")}>
            <FaDownload /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("json")}>
            <FaDownload /> Export JSON
          </Button>
          <Button variant="primary" onClick={fetchReportData}>
            <FaChartLine /> Generate Report
          </Button>
        </div>
      </FiltersSection>

      {/* Report Statistics */}
      {reportData && (
        <StatsSection>
          <h3 style={{ marginBottom: "1rem" }}>Report Summary</h3>
          <StatsGrid>
            <StatCard>
              <StatValue>{reportData.categoryStats?.length || 0}</StatValue>
              <StatLabel>Categories</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{reportData.locationStats?.length || 0}</StatValue>
              <StatLabel>Locations</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{reportData.statusStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}</StatValue>
              <StatLabel>Total Items</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                ${reportData.categoryStats?.reduce((sum, cat) => sum + cat.totalValue, 0)?.toLocaleString() || "0"}
              </StatValue>
              <StatLabel>Total Value</StatLabel>
            </StatCard>
          </StatsGrid>
        </StatsSection>
      )}

      {/* Available Reports */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaFileAlt /> Available Reports
        </h3>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <LoadingSpinner size="60px" />
        </div>
      ) : error ? (
        <EmptyState>
          <div className="icon">
            <FaExclamationTriangle />
          </div>
          <h3>Error Loading Reports</h3>
          <p>{error}</p>
          <Button onClick={fetchReportData}>Try Again</Button>
        </EmptyState>
      ) : (
        <ReportsGrid>
          {reportTypes.map((report) => (
            <ReportCard key={report.id} onClick={() => handleGenerateReport(report.id)}>
              <ReportHeader>
                <ReportIcon iconColor={report.iconColor}>{report.icon}</ReportIcon>
                <ReportInfo>
                  <ReportTitle>{report.title}</ReportTitle>
                  <ReportDescription>{report.description}</ReportDescription>
                </ReportInfo>
              </ReportHeader>
              <Button variant="outline" style={{ width: "100%" }}>
                Generate Report
              </Button>
            </ReportCard>
          ))}
        </ReportsGrid>
      )}
    </Container>
  )
}

export default ReportsAnalytics
