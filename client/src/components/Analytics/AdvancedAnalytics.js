"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { useAuth } from "../../contexts/AuthContext"
import {
  FaChartLine,
  FaDownload,
  FaCalendar,
  FaTrendingUp,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaFilter,
  FaSync,
  FaEye,
} from "react-icons/fa"
import Card from "../common/Card"
import Button from "../common/Button"
import {
  RevenueTrendChart,
  InventoryDistributionChart,
  SalesPerformanceChart,
  ModulePerformanceChart,
  RealTimeActivityChart,
  KPIDashboardChart,
} from "../charts/ChartComponents"

const AnalyticsContainer = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;
`

const HeaderSection = styled.div`
  background: ${(props) => props.theme.gradients?.primary || "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const HeaderContent = styled.div``

const HeaderTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "1.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const HeaderSubtitle = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  opacity: 0.9;
  margin: 0;
`

const ControlsSection = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  flex-wrap: wrap;
`

const DateRangeSelector = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  align-items: center;
`

const DateInput = styled.input`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  color: white;
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`

const FilterButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

const MetricsOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
`

const MetricCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(27, 67, 50, 0.1)"};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.gradient || props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows?.glowLarge || "0 0 40px rgba(64, 145, 108, 0.2)"};
  }
`

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`

const MetricIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.gradient || props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
`

const MetricValue = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const MetricLabel = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium || "500"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => (props.positive ? props.theme.colors?.success || "#2d5016" : props.theme.colors?.error || "#c53030")};
`

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
`

const ChartRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.columns || "2fr 1fr"};
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    grid-template-columns: 1fr;
  }
`

const ReportsSection = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(27, 67, 50, 0.1)"};
`

const ReportsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  padding-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const ReportsTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
`

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const ReportCard = styled.div`
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
    box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
  }
`

const ReportTitle = styled.h4`
  font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0 0 ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
`

const ReportDescription = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0 0 ${(props) => props.theme.spacing?.md || "1rem"} 0;
`

const ReportActions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const AdvancedAnalytics = () => {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const [selectedModules, setSelectedModules] = useState(user?.modules || [])
  const [analyticsData, setAnalyticsData] = useState({})
  const [loading, setLoading] = useState(true)

  // Generate analytics data based on user modules
  const generateAnalyticsData = () => {
    const baseMetrics = [
      {
        title: "Total Revenue",
        value: "$2,847,392",
        change: "+12.5%",
        positive: true,
        icon: <FaDollarSign />,
        gradient: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
      },
    ]

    if (user?.modules?.includes("IMS")) {
      baseMetrics.push({
        title: "Inventory Turnover",
        value: "4.2x",
        change: "+8.3%",
        positive: true,
        icon: <FaTrendingUp />,
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      })
    }

    if (user?.modules?.includes("ISA")) {
      baseMetrics.push({
        title: "Crop Yield",
        value: "94.2%",
        change: "+15.7%",
        positive: true,
        icon: <FaChartLine />,
        gradient: "linear-gradient(135deg, #52734d 0%, #74a478 100%)",
      })
    }

    if (user?.modules?.includes("Waste Management")) {
      baseMetrics.push({
        title: "Waste Efficiency",
        value: "87.5%",
        change: "+5.2%",
        positive: true,
        icon: <FaTrendingUp />,
        gradient: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
      })
    }

    return baseMetrics
  }

  // Generate chart data
  const generateChartData = () => {
    return {
      revenue: [
        { date: "Jan", revenue: 145000 },
        { date: "Feb", revenue: 152000 },
        { date: "Mar", revenue: 148000 },
        { date: "Apr", revenue: 161000 },
        { date: "May", revenue: 155000 },
        { date: "Jun", revenue: 167000 },
        { date: "Jul", revenue: 172000 },
        { date: "Aug", revenue: 168000 },
        { date: "Sep", revenue: 175000 },
        { date: "Oct", revenue: 182000 },
        { date: "Nov", revenue: 178000 },
        { date: "Dec", revenue: 185000 },
      ],
      inventory: [
        { name: "Electronics", value: 35 },
        { name: "Construction Materials", value: 25 },
        { name: "Agricultural Supplies", value: 20 },
        { name: "Food Items", value: 15 },
        { name: "Others", value: 5 },
      ],
      sales: [
        { month: "Jan", sales: 14000, target: 14500 },
        { month: "Feb", sales: 13000, target: 13500 },
        { month: "Mar", sales: 15000, target: 14800 },
        { month: "Apr", sales: 14500, target: 14200 },
        { month: "May", sales: 16000, target: 15500 },
        { month: "Jun", sales: 15500, target: 15200 },
      ],
      modulePerformance: [
        { name: "IMS", value: 85, fill: "#667eea" },
        { name: "ISA", value: 92, fill: "#52734d" },
        { name: "Waste", value: 78, fill: "#ed8936" },
        { name: "Construction", value: 88, fill: "#f093fb" },
      ],
      realTime: [
        { time: "00:00", value: 145 },
        { time: "00:05", value: 152 },
        { time: "00:10", value: 148 },
        { time: "00:15", value: 161 },
        { time: "00:20", value: 155 },
        { time: "00:25", value: 167 },
      ],
      kpi: [
        { name: "Customer Satisfaction", current: 85, target: 90 },
        { name: "Operational Efficiency", current: 78, target: 85 },
        { name: "Revenue Growth", current: 92, target: 88 },
        { name: "Cost Reduction", current: 76, target: 80 },
        { name: "Quality Score", current: 89, target: 85 },
        { name: "Employee Productivity", current: 82, target: 80 },
      ],
    }
  }

  const availableReports = [
    {
      title: "Monthly Revenue Report",
      description: "Comprehensive revenue analysis with trends and forecasts",
      modules: ["IMS", "ISA", "Waste Management", "Construction Sites"],
    },
    {
      title: "Inventory Analysis",
      description: "Stock levels, turnover rates, and optimization recommendations",
      modules: ["IMS"],
    },
    {
      title: "Agricultural Performance",
      description: "Crop yields, soil health, and seasonal analysis",
      modules: ["ISA"],
    },
    {
      title: "Waste Management Efficiency",
      description: "Processing rates, revenue generation, and environmental impact",
      modules: ["Waste Management"],
    },
    {
      title: "Construction Progress",
      description: "Project timelines, resource utilization, and cost analysis",
      modules: ["Construction Sites"],
    },
    {
      title: "Cross-Module Analytics",
      description: "Integrated insights across all your active modules",
      modules: user?.modules || [],
    },
  ]

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setAnalyticsData(generateChartData())
      setLoading(false)
    }

    loadAnalyticsData()
  }, [dateRange, selectedModules])

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleModuleFilter = (modules) => {
    setSelectedModules(modules)
  }

  const exportReport = (reportType) => {
    // In a real app, this would generate and download the specific report
    alert(`Exporting ${reportType} report...`)
  }

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      setAnalyticsData(generateChartData())
      setLoading(false)
    }, 1000)
  }

  const metricsData = generateAnalyticsData()

  // Filter reports based on user modules
  const userReports = availableReports.filter((report) =>
    report.modules.some((module) => user?.modules?.includes(module)),
  )

  if (!user?.modules?.includes("Analytics")) {
    return (
      <AnalyticsContainer>
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "#ffffff",
            borderRadius: "1rem",
            boxShadow: "0 4px 6px -1px rgba(27, 67, 50, 0.1)",
          }}
        >
          <h2 style={{ color: "#2d3748", marginBottom: "1rem" }}>Access Denied</h2>
          <p style={{ color: "#718096" }}>
            You don't have access to the Analytics module. Contact your administrator to request access.
          </p>
        </div>
      </AnalyticsContainer>
    )
  }

  return (
    <AnalyticsContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderTitle>Advanced Analytics</HeaderTitle>
          <HeaderSubtitle>
            Comprehensive insights and reporting for your {user?.modules?.length || 0} active modules
          </HeaderSubtitle>
        </HeaderContent>

        <ControlsSection>
          <DateRangeSelector>
            <FaCalendar style={{ color: "rgba(255, 255, 255, 0.8)" }} />
            <DateInput
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
            />
            <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>to</span>
            <DateInput
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
            />
          </DateRangeSelector>

          <FilterButton onClick={() => handleModuleFilter(user?.modules || [])}>
            <FaFilter /> Filter
          </FilterButton>

          <FilterButton onClick={refreshData}>
            <FaSync /> Refresh
          </FilterButton>

          <FilterButton onClick={() => exportReport("comprehensive")}>
            <FaDownload /> Export All
          </FilterButton>
        </ControlsSection>
      </HeaderSection>

      <MetricsOverview>
        {metricsData.map((metric, index) => (
          <MetricCard key={index} gradient={metric.gradient}>
            <MetricHeader>
              <div>
                <MetricValue>{metric.value}</MetricValue>
                <MetricLabel>{metric.title}</MetricLabel>
                <MetricChange positive={metric.positive}>
                  {metric.positive ? <FaArrowUp /> : <FaArrowDown />}
                  {metric.change} from last period
                </MetricChange>
              </div>
              <MetricIcon gradient={metric.gradient}>{metric.icon}</MetricIcon>
            </MetricHeader>
          </MetricCard>
        ))}
      </MetricsOverview>

      {!loading && analyticsData && (
        <ChartsSection>
          <ChartRow>
            <RevenueTrendChart data={analyticsData.revenue} />
            <InventoryDistributionChart data={analyticsData.inventory} />
          </ChartRow>

          <ChartRow>
            <SalesPerformanceChart data={analyticsData.sales} />
            <ModulePerformanceChart data={analyticsData.modulePerformance} />
          </ChartRow>

          <ChartRow>
            <RealTimeActivityChart data={analyticsData.realTime} />
            <KPIDashboardChart data={analyticsData.kpi} />
          </ChartRow>
        </ChartsSection>
      )}

      <ReportsSection>
        <ReportsHeader>
          <ReportsTitle>Available Reports</ReportsTitle>
          <Button variant="outline" onClick={() => exportReport("all")}>
            <FaDownload /> Export All Reports
          </Button>
        </ReportsHeader>

        <ReportsGrid>
          {userReports.map((report, index) => (
            <ReportCard key={index}>
              <ReportTitle>{report.title}</ReportTitle>
              <ReportDescription>{report.description}</ReportDescription>
              <ReportActions>
                <Button size="sm" onClick={() => exportReport(report.title)}>
                  <FaDownload /> Export
                </Button>
                <Button variant="outline" size="sm">
                  <FaEye /> Preview
                </Button>
              </ReportActions>
            </ReportCard>
          ))}
        </ReportsGrid>
      </ReportsSection>
    </AnalyticsContainer>
  )
}

export default AdvancedAnalytics
