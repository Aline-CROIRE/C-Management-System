// client/src/pages/DynamicDashboard.js
"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { useAuth } from "../../contexts/AuthContext"
import { FaDollarSign, FaTractor, FaBoxes, FaRecycle, FaHardHat, FaEye, FaDownload, FaUtensils } from "react-icons/fa" // Added FaUtensils
import StatsCard from "./statsCard" 
import {
  RevenueTrendChart,
  InventoryDistributionChart,
  SalesPerformanceChart,
  ModulePerformanceChart,
  RealTimeActivityChart,
  KPIDashboardChart,
} from "../../components/charts/ChartComponents"

const DashboardContainer = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.md || "1rem"};
  }
`

const WelcomeSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
  text-align: center;
  
  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
    text-align: left;
  }
`

const WelcomeTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "1.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  background: ${(props) => props.theme.gradients?.primary || "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)"};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
  }
`

const WelcomeSubtitle = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0;
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium || "500"};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  }

  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    grid-template-columns: 1fr;
    gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  }
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

const ModulesSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
`

const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};

  &::before {
    content: '';
    width: 4px;
    height: 28px;
    background: ${(props) => props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
    border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  }
`

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    grid-template-columns: 1fr;
  }
`

const ModuleCard = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;

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
    box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(64, 145, 108, 0.3)"}, 
                ${(props) => props.theme.shadows?.xl || "0 20px 25px -5px rgba(27, 67, 50, 0.1)"};
  }
`

const ModuleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const ModuleIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  background: ${(props) => props.gradient || props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
`

const ModuleInfo = styled.div`
  flex: 1;
`

const ModuleTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0 0 ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
`

const ModuleStatus = styled.span`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.accent || "#40916c"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium || "500"};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => props.theme.colors?.accent || "#40916c"};
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const ModuleStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  margin-top: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const StatLabel = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium || "500"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const QuickActions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  margin-top: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const ActionButton = styled.button`
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};

  &:hover {
    background: ${(props) => props.theme.colors?.primary || "#1b4332"};
    color: white;
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }
`

const MODULE_CONFIGS = {
  IMS: {
    icon: <FaBoxes />,
    title: "Inventory Management",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    getStats: (data) => ({
      items: data?.inventory?.totalItems || "0",
      lowStock: data?.inventory?.lowStockItems || "0",
      value: data?.inventory?.totalValue || "$0",
    }),
  },
  ISA: {
    icon: <FaTractor />,
    title: "Smart Agriculture",
    gradient: "linear-gradient(135deg, #52734d 0%, #74a478 100%)",
    getStats: (data) => ({
      fields: data?.agriculture?.activeFields || "0",
      crops: data?.agriculture?.activeCrops || "0",
      yield: data?.agriculture?.expectedYield || "0%",
    }),
  },
  "Waste Management": {
    icon: <FaRecycle />,
    title: "Waste Management",
    gradient: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
    getStats: (data) => ({
      processed: data?.waste?.processedToday || "0",
      revenue: data?.waste?.revenue || "$0",
      efficiency: data?.waste?.efficiency || "0%",
    }),
  },
  "Construction Sites": {
    icon: <FaHardHat />,
    title: "Construction Sites",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    getStats: (data) => ({
      sites: data?.construction?.activeSites || "0",
      equipment: data?.construction?.equipment || "0",
      progress: data?.construction?.avgProgress || "0%",
    }),
  },
  // NEW: Restaurant Module Configuration
  "Restaurant": {
    icon: <FaUtensils />,
    title: "Restaurant Operations",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", // A distinct red gradient
    getStats: (data) => ({
      orders: data?.restaurant?.totalOrdersToday || "0",
      tables: data?.restaurant?.activeTables || "0",
      revenue: data?.restaurant?.revenueToday || "$0",
    }),
  },
}

const DynamicDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState({})
  const [loading, setLoading] = useState(true)

  const generateStatsData = () => {
    const baseStats = [
      {
        title: "Total Revenue",
        value: "$2,847,392", // Placeholder
        change: "+12.5% from last month",
        changeType: "positive",
        icon: <FaDollarSign />,
        iconColor: "#1b4332",
      },
    ]

    if (user?.modules?.includes("IMS")) {
      baseStats.push({
        title: "Inventory Items",
        value: dashboardData.inventory?.totalItems || "0",
        change: "+8.2% from last month", // Placeholder
        changeType: "positive",
        icon: <FaBoxes />,
        iconColor: "#667eea",
      })
    }

    if (user?.modules?.includes("ISA")) {
      baseStats.push({
        title: "Active Fields",
        value: dashboardData.agriculture?.activeFields || "0",
        change: "+15.3% from last month", // Placeholder
        changeType: "positive",
        icon: <FaTractor />,
        iconColor: "#52734d",
      })
    }

    if (user?.modules?.includes("Waste Management")) {
      baseStats.push({
        title: "Waste Revenue",
        value: dashboardData.waste?.revenue || "$0",
        change: "+23.8% from last month", // Placeholder
        changeType: "positive",
        icon: <FaRecycle />,
        iconColor: "#ed8936",
      })
    }

    if (user?.modules?.includes("Construction Sites")) {
      baseStats.push({
        title: "Active Sites",
        value: dashboardData.construction?.activeSites || "0",
        change: "+5.1% from last month", // Placeholder
        changeType: "positive",
        icon: <FaHardHat />,
        iconColor: "#f093fb",
      })
    }

    // NEW: Add Restaurant stats to top grid if module is active
    if (user?.modules?.includes("Restaurant")) {
        baseStats.push({
            title: "Restaurant Orders Today",
            value: dashboardData.restaurant?.totalOrdersToday || "0",
            change: "+7.1% from yesterday", // Placeholder
            changeType: "positive",
            icon: <FaUtensils />,
            iconColor: "#ef4444",
        });
    }

    return baseStats
  }

  const generateChartData = () => {
    return {
      revenue: [
        { date: "Jan", revenue: 45000 },
        { date: "Feb", revenue: 52000 },
        { date: "Mar", revenue: 48000 },
        { date: "Apr", revenue: 61000 },
        { date: "May", revenue: 55000 },
        { date: "Jun", revenue: 67000 },
      ],
      inventory: [
        { name: "Electronics", value: 35 },
        { name: "Construction", value: 25 },
        { name: "Agriculture", value: 20 },
        { name: "Food Items", value: 20 },
      ],
      sales: [
        { month: "Jan", sales: 4000, target: 4500 },
        { month: "Feb", sales: 3000, target: 3500 },
        { month: "Mar", sales: 5000, target: 4800 },
        { month: "Apr", sales: 4500, target: 4200 },
        { month: "May", sales: 6000, target: 5500 },
        { month: "Jun", sales: 5500, target: 5200 },
      ],
      modulePerformance: [
        { name: "IMS", value: 85, fill: "#667eea" },
        { name: "ISA", value: 92, fill: "#52734d" },
        { name: "Waste", value: 78, fill: "#ed8936" },
        { name: "Construction", value: 88, fill: "#f093fb" },
        { name: "Restaurant", value: 90, fill: "#ef4444" }, // NEW: Restaurant data
      ],
      realTime: [
        { time: "00:00", value: 45 },
        { time: "00:05", value: 52 },
        { time: "00:10", value: 48 },
        { time: "00:15", value: 61 },
        { time: "00:20", value: 55 },
        { time: "00:25", value: 67 },
      ],
      kpi: [
        { name: "Customer Satisfaction", current: 85, target: 90 },
        { name: "Operational Efficiency", current: 78, target: 85 },
        { name: "Revenue Growth", current: 92, target: 88 },
        { name: "Cost Reduction", current: 76, target: 80 },
      ],
    }
  }

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockData = {
        inventory: {
          totalItems: "12,847",
          lowStockItems: "23",
          totalValue: "$1,234,567",
        },
        agriculture: {
          activeFields: "156",
          activeCrops: "12",
          expectedYield: "94%",
        },
        waste: {
          processedToday: "2.3T",
          revenue: "$89,432",
          efficiency: "87%",
        },
        construction: {
          activeSites: "23",
          equipment: "145",
          avgProgress: "76%",
        },
        // NEW: Mock data for Restaurant module
        restaurant: {
            totalOrdersToday: "125",
            activeTables: "15",
            revenueToday: "$4,500",
        },
      }

      setDashboardData(mockData)
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  const statsData = generateStatsData()
  const chartData = generateChartData()

  const handleModuleClick = (moduleName) => {
    // This function will eventually navigate to the module's specific route
    // For now, it just logs. The actual navigation is handled by `App.js` routes
    // and `DynamicSidebar`.
    console.log(`Navigating to ${moduleName}`)
  }

  const renderUserModules = () => {
    if (!user?.modules || user.modules.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "2rem", color: "#718096" }}>
          <p>No modules assigned. Contact your administrator to get access to modules.</p>
        </div>
      )
    }

    return (
      <ModulesGrid>
        {user.modules.map((moduleName) => {
          const config = MODULE_CONFIGS[moduleName]
          if (!config) return null

          const stats = config.getStats(dashboardData)

          return (
            <ModuleCard key={moduleName} gradient={config.gradient} onClick={() => handleModuleClick(moduleName)}>
              <ModuleHeader>
                <ModuleIcon gradient={config.gradient}>{config.icon}</ModuleIcon>
                <ModuleInfo>
                  <ModuleTitle>{config.title}</ModuleTitle>
                  <ModuleStatus>Active and running</ModuleStatus>
                </ModuleInfo>
              </ModuleHeader>

              <ModuleStats>
                {Object.entries(stats).map(([key, value]) => (
                  <StatItem key={key}>
                    <StatValue>{value}</StatValue>
                    <StatLabel>{key}</StatLabel>
                  </StatItem>
                ))}
              </ModuleStats>

              <QuickActions>
                <ActionButton>
                  <FaEye /> View
                </ActionButton>
                <ActionButton>
                  <FaDownload /> Export
                </ActionButton>
              </QuickActions>
            </ModuleCard>
          )
        })}
      </ModulesGrid>
    )
  }

  if (loading) {
    return (
      <DashboardContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            fontSize: "1.125rem",
            color: "#718096",
          }}
        >
          Loading dashboard...
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Welcome back, {user?.firstName || "User"}!</WelcomeTitle>
        <WelcomeSubtitle>
          Here's what's happening with your {user?.modules?.length || 0} active modules today.
        </WelcomeSubtitle>
      </WelcomeSection>

      <StatsGrid>
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            iconColor={stat.iconColor}
          />
        ))}
      </StatsGrid>

      {/* Charts Section - Only show if user has analytics access */}
      {user?.modules?.includes("Analytics") && (
        <>
          <SectionTitle>Analytics & Insights</SectionTitle>
          <ChartsGrid>
            <RevenueTrendChart data={chartData.revenue} />
            <InventoryDistributionChart data={chartData.inventory} />
          </ChartsGrid>

          <ChartsGrid>
            <SalesPerformanceChart data={chartData.sales} />
            <ModulePerformanceChart data={chartData.modulePerformance} />
          </ChartsGrid>

          <ChartsGrid>
            <RealTimeActivityChart data={chartData.realTime} />
            <KPIDashboardChart data={chartData.kpi} />
          </ChartsGrid>
        </>
      )}

      <ModulesSection>
        <SectionTitle>Your Active Modules</SectionTitle>
        {renderUserModules()}
      </ModulesSection>
    </DashboardContainer>
  )
}

export default DynamicDashboard