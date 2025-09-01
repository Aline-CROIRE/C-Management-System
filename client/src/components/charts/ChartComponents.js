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
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from "recharts"

const ChartContainer = styled.div`
  width: 100%;
  height: ${(props) => props.height || "400px"};
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  padding-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const ChartTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
`

const ChartSubtitle = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0;
`

const FilterButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const FilterButton = styled.button`
  padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  background: ${(props) => (props.$active ? props.theme.colors?.primary || "#1b4332" : "transparent")};
  color: ${(props) => (props.$active ? "white" : props.theme.colors?.text || "#2d3748")};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.primary || "#1b4332"};
    color: white;
  }
`

// Color schemes for charts
const COLORS = {
  primary: ["#1b4332", "#2d5a47", "#40916c", "#52734d", "#74a478"],
  success: ["#2d5016", "#52734d", "#74a478", "#95d5b2", "#b7e4c7"],
  warning: ["#ed8936", "#dd6b20", "#c05621", "#9c4221", "#7c2d12"],
  error: ["#c53030", "#e53e3e", "#f56565", "#fc8181", "#feb2b2"],
  info: ["#3182ce", "#4299e1", "#63b3ed", "#90cdf4", "#bee3f8"],
}

// Revenue Trend Chart
export const RevenueTrendChart = ({ data, period = "7d" }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  const periods = [
    { key: "7d", label: "7D" },
    { key: "30d", label: "30D" },
    { key: "90d", label: "90D" },
    { key: "1y", label: "1Y" },
  ]

  return (
    <ChartContainer>
      <ChartHeader>
        <div>
          <ChartTitle>Revenue Trends</ChartTitle>
          <ChartSubtitle>Track revenue performance over time</ChartSubtitle>
        </div>
        <FilterButtons>
          {periods.map((p) => (
            <FilterButton key={p.key} $active={selectedPeriod === p.key} onClick={() => setSelectedPeriod(p.key)}>
              {p.label}
            </FilterButton>
          ))}
        </FilterButtons>
      </ChartHeader>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1b4332" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1b4332" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#718096" fontSize={12} />
          <YAxis stroke="#718096" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(27, 67, 50, 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#1b4332"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Inventory Distribution Chart
export const InventoryDistributionChart = ({ data }) => {
  return (
    <ChartContainer height="350px">
      <ChartHeader>
        <div>
          <ChartTitle>Inventory Distribution</ChartTitle>
          <ChartSubtitle>Stock levels by category</ChartSubtitle>
        </div>
      </ChartHeader>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Sales Performance Chart
export const SalesPerformanceChart = ({ data }) => {
  return (
    <ChartContainer>
      <ChartHeader>
        <div>
          <ChartTitle>Sales Performance</ChartTitle>
          <ChartSubtitle>Monthly sales comparison</ChartSubtitle>
        </div>
      </ChartHeader>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#718096" fontSize={12} />
          <YAxis stroke="#718096" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(27, 67, 50, 0.1)",
            }}
          />
          <Legend />
          <Bar dataKey="sales" fill="#1b4332" name="Sales" />
          <Line type="monotone" dataKey="target" stroke="#40916c" strokeWidth={2} name="Target" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Module Performance Chart
export const ModulePerformanceChart = ({ data }) => {
  return (
    <ChartContainer height="350px">
      <ChartHeader>
        <div>
          <ChartTitle>Module Performance</ChartTitle>
          <ChartSubtitle>Usage and efficiency metrics</ChartSubtitle>
        </div>
      </ChartHeader>
      <ResponsiveContainer width="100%" height={250}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={data}>
          <RadialBar
            minAngle={15}
            label={{ position: "insideStart", fill: "#fff" }}
            background
            clockWise
            dataKey="value"
            fill="#1b4332"
          />
          <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
          <Tooltip />
        </RadialBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Real-time Activity Chart
export const RealTimeActivityChart = ({ data }) => {
  const [liveData, setLiveData] = useState(data)

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data updates
      setLiveData((prevData) =>
        prevData.map((item) => ({
          ...item,
          value: Math.max(0, item.value + (Math.random() - 0.5) * 10),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <ChartContainer>
      <ChartHeader>
        <div>
          <ChartTitle>Real-time Activity</ChartTitle>
          <ChartSubtitle>Live system metrics</ChartSubtitle>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#40916c",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: "12px", color: "#718096" }}>Live</span>
        </div>
      </ChartHeader>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={liveData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="time" stroke="#718096" fontSize={12} />
          <YAxis stroke="#718096" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(27, 67, 50, 0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#40916c"
            strokeWidth={2}
            dot={{ fill: "#40916c", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#40916c", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// KPI Dashboard Chart
export const KPIDashboardChart = ({ data }) => {
  return (
    <ChartContainer>
      <ChartHeader>
        <div>
          <ChartTitle>Key Performance Indicators</ChartTitle>
          <ChartSubtitle>Critical business metrics</ChartSubtitle>
        </div>
      </ChartHeader>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#718096" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#718096" fontSize={12} width={100} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(27, 67, 50, 0.1)",
            }}
          />
          <Bar dataKey="current" fill="#1b4332" name="Current" />
          <Bar dataKey="target" fill="#40916c" name="Target" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export default {
  RevenueTrendChart,
  InventoryDistributionChart,
  SalesPerformanceChart,
  ModulePerformanceChart,
  RealTimeActivityChart,
  KPIDashboardChart,
}
