"use client"

import { useState } from "react"
import styled from "styled-components"
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaDownload,
  FaCalendar,
  FaTrendingUp,
  FaTrendingDown,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
} from "react-icons/fa"
import Card from "../common/Card"
import Button from "../common/Button"

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

const DateRangeSelector = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  flex-wrap: wrap;
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

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
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
    transform: translateY(-4px);
    box-shadow: ${(props) => props.theme.shadows?.glowLarge || "0 0 40px rgba(64, 145, 108, 0.2)"};
  }
`

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const MetricIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  background: ${(props) => props.gradient || props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(64, 145, 108, 0.3)"};
`

const MetricValue = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "1.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const MetricLabel = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium || "500"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => (props.positive ? props.theme.colors?.success || "#2d5016" : props.theme.colors?.error || "#c53030")};
`

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    grid-template-columns: 1fr;
  }
`

const ChartCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(27, 67, 50, 0.1)"};
`

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  padding-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const ChartTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const ChartContainer = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
`

const TableContainer = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(27, 67, 50, 0.1)"};
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const TableHeader = styled.thead`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

const TableHeaderCell = styled.th`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  text-align: left;
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const TableBody = styled.tbody``

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  }

  &:last-child {
    border-bottom: none;
  }
`

const TableCell = styled.td`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
`

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })

  const [analyticsData, setAnalyticsData] = useState({
    metrics: [
      {
        title: "Total Revenue",
        value: "$2,847,392",
        change: "+12.5%",
        positive: true,
        icon: <FaDollarSign />,
        gradient: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
      },
      {
        title: "Inventory Turnover",
        value: "4.2x",
        change: "+8.3%",
        positive: true,
        icon: <FaTrendingUp />,
        gradient: "linear-gradient(135deg, #40916c 0%, #2d5016 100%)",
      },
      {
        title: "Stock Value",
        value: "$1,234,567",
        change: "+15.7%",
        positive: true,
        icon: <FaChartLine />,
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        title: "Low Stock Items",
        value: "23",
        change: "-5.2%",
        positive: true,
        icon: <FaTrendingDown />,
        gradient: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
      },
    ],
    topProducts: [
      { name: "Construction Steel Bars", revenue: "$156,250", growth: "+23.5%" },
      { name: "Industrial Cement", revenue: "$89,430", growth: "+18.2%" },
      { name: "Organic Tomatoes", revenue: "$67,890", growth: "+12.8%" },
      { name: "Construction Tools", revenue: "$45,670", growth: "+9.4%" },
      { name: "Agricultural Seeds", revenue: "$34,520", growth: "+7.1%" },
    ],
  })

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const exportReport = () => {
    // In a real app, this would generate and download a report
    alert("Analytics report exported successfully!")
  }

  return (
    <AnalyticsContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderTitle>Analytics & Reports</HeaderTitle>
          <HeaderSubtitle>Comprehensive insights into your business performance and trends</HeaderSubtitle>
        </HeaderContent>

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
          <Button
            variant="outline"
            onClick={exportReport}
            style={{ color: "white", borderColor: "rgba(255, 255, 255, 0.3)" }}
          >
            <FaDownload /> Export
          </Button>
        </DateRangeSelector>
      </HeaderSection>

      <MetricsGrid>
        {analyticsData.metrics.map((metric, index) => (
          <MetricCard key={index} gradient={metric.gradient}>
            <MetricHeader>
              <div>
                <MetricValue>{metric.value}</MetricValue>
                <MetricLabel>{metric.title}</MetricLabel>
              </div>
              <MetricIcon gradient={metric.gradient}>{metric.icon}</MetricIcon>
            </MetricHeader>
            <MetricChange positive={metric.positive}>
              {metric.positive ? <FaArrowUp /> : <FaArrowDown />}
              {metric.change} from last period
            </MetricChange>
          </MetricCard>
        ))}
      </MetricsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <FaChartLine /> Revenue Trends
            </ChartTitle>
            <Button variant="outline" size="sm">
              <FaDownload /> Export
            </Button>
          </ChartHeader>
          <ChartContainer>📈 Revenue chart would be rendered here using Chart.js or Recharts</ChartContainer>
        </ChartCard>

        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <FaChartPie /> Category Distribution
            </ChartTitle>
            <Button variant="outline" size="sm">
              <FaDownload /> Export
            </Button>
          </ChartHeader>
          <ChartContainer>🥧 Pie chart would be rendered here</ChartContainer>
        </ChartCard>
      </ChartsGrid>

      <TableContainer>
        <ChartHeader style={{ padding: "1.5rem" }}>
          <ChartTitle>
            <FaChartBar /> Top Performing Products
          </ChartTitle>
          <Button variant="outline" size="sm">
            <FaDownload /> Export
          </Button>
        </ChartHeader>

        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Product Name</TableHeaderCell>
              <TableHeaderCell>Revenue</TableHeaderCell>
              <TableHeaderCell>Growth</TableHeaderCell>
              <TableHeaderCell>Trend</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {analyticsData.topProducts.map((product, index) => (
              <TableRow key={index}>
                <TableCell>
                  <strong>{product.name}</strong>
                </TableCell>
                <TableCell>{product.revenue}</TableCell>
                <TableCell>
                  <MetricChange positive={true}>
                    <FaArrowUp />
                    {product.growth}
                  </MetricChange>
                </TableCell>
                <TableCell>
                  <FaTrendingUp style={{ color: "#2d5016" }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AnalyticsContainer>
  )
}

export default AnalyticsDashboard
