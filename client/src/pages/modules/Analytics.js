"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Card from "../../components/common/Card"
import Button from "../../components/common/Button"
import api from "../../utils/api"

const AnalyticsContainer = styled.div`
  padding: 2rem;
`

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

const Title = styled.h1`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.text};
`

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
`

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`

const ChartCard = styled(Card)`
  padding: 1.5rem;
`

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 1rem;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`

const StatCard = styled(Card)`
  padding: 1.5rem;
  text-align: center;
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`

const StatLabel = styled.div`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`

const COLORS = ["#1b4332", "#2d5016", "#40916c", "#52734d", "#74c69d"]

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    revenue: [],
    inventory: [],
    sales: [],
    modules: [],
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      activeUsers: 0,
      inventoryValue: 0,
    },
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/analytics/dashboard?days=${timeRange}`)
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await api.get(`/analytics/export?days=${timeRange}`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `analytics-${timeRange}days.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  if (loading) {
    return <div>Loading analytics...</div>
  }

  return (
    <AnalyticsContainer>
      <AnalyticsHeader>
        <Title>Analytics Dashboard</Title>
        <FilterContainer>
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </Select>
          <Button onClick={exportData} variant="secondary">
            Export Data
          </Button>
        </FilterContainer>
      </AnalyticsHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>${data.stats.totalRevenue.toLocaleString()}</StatValue>
          <StatLabel>Total Revenue</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{data.stats.totalOrders.toLocaleString()}</StatValue>
          <StatLabel>Total Orders</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{data.stats.activeUsers.toLocaleString()}</StatValue>
          <StatLabel>Active Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>${data.stats.inventoryValue.toLocaleString()}</StatValue>
          <StatLabel>Inventory Value</StatLabel>
        </StatCard>
      </StatsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>Revenue Trend</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#1b4332" fill="#1b4332" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Sales Performance</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#2d5016" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Inventory Distribution</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.inventory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.inventory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Module Usage</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.modules}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="IMS" stroke="#1b4332" />
              <Line type="monotone" dataKey="ISA" stroke="#2d5016" />
              <Line type="monotone" dataKey="Waste" stroke="#40916c" />
              <Line type="monotone" dataKey="Construction" stroke="#52734d" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>
    </AnalyticsContainer>
  )
}

export default Analytics
