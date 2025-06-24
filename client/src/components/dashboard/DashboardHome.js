"use client"

import styled from "styled-components"
import {
  FaUsers,
  FaProjectDiagram,
  FaDollarSign,
  FaChartLine, // Use FaChartLine instead of FaTrendingUp
  FaTractor,
  FaBell,
  FaLeaf,
} from "react-icons/fa"
import StatsCard from "./statsCard"

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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

const ModuleCard = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
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
  background: ${(props) => props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
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

const ActivitySection = styled.div`
  margin-top: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
`

const ActivityCard = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const ActivityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const ActivityTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const ViewAllButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors?.accent || "#40916c"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium || "500"};
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }
`

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceDark || "#edf2f7"};
    transform: translateX(4px);
  }
`

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.theme.gradients?.secondary || "linear-gradient(135deg, #2d5016 0%, #52734d 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
`

const ActivityContent = styled.div`
  flex: 1;
`

const ActivityText = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium || "500"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const ActivityTime = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`

const DashboardHome = () => {
  const statsData = [
    {
      title: "Total Users",
      value: "2,847",
      change: "+12.5% from last month",
      changeType: "positive",
      icon: <FaUsers />,
      iconColor: "#1b4332",
    },
    {
      title: "Active Projects",
      value: "156",
      change: "+8.2% from last month",
      changeType: "positive",
      icon: <FaProjectDiagram />,
      iconColor: "#2d5016",
    },
    {
      title: "Revenue",
      value: "$89,432",
      change: "+15.3% from last month",
      changeType: "positive",
      icon: <FaDollarSign />,
      iconColor: "#40916c",
    },
    {
      title: "Growth Rate",
      value: "23.8%",
      change: "+2.1% from last month",
      changeType: "positive",
      icon: <FaChartLine />, // Changed from FaTrendingUp to FaChartLine
      iconColor: "#52734d",
    },
  ]

  const recentActivities = [
    {
      icon: <FaTractor />,
      text: "New agriculture module activated",
      time: "2 hours ago",
    },
    {
      icon: <FaUsers />,
      text: "5 new users registered",
      time: "4 hours ago",
    },
    {
      icon: <FaChartLine />,
      text: "Monthly report generated",
      time: "6 hours ago",
    },
    {
      icon: <FaBell />,
      text: "System maintenance completed",
      time: "1 day ago",
    },
  ]

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Welcome back, Aline!</WelcomeTitle>
        <WelcomeSubtitle>Here's what's happening with your business today.</WelcomeSubtitle>
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

      <ModulesSection>
        <SectionTitle>Active Modules</SectionTitle>
        <ModuleCard>
          <ModuleHeader>
            <ModuleIcon>
              <FaLeaf />
            </ModuleIcon>
            <ModuleInfo>
              <ModuleTitle>Smart Agriculture</ModuleTitle>
              <ModuleStatus>Active and running</ModuleStatus>
            </ModuleInfo>
          </ModuleHeader>

          <ModuleStats>
            <StatItem>
              <StatValue>58</StatValue>
              <StatLabel>Items</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>23</StatValue>
              <StatLabel>Active</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>8</StatValue>
              <StatLabel>Alerts</StatLabel>
            </StatItem>
          </ModuleStats>
        </ModuleCard>
      </ModulesSection>

      <ActivitySection>
        <ActivityCard>
          <ActivityHeader>
            <ActivityTitle>
              <FaBell />
              Recent Activity
            </ActivityTitle>
            <ViewAllButton>View All</ViewAllButton>
          </ActivityHeader>

          <ActivityList>
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index}>
                <ActivityIcon>{activity.icon}</ActivityIcon>
                <ActivityContent>
                  <ActivityText>{activity.text}</ActivityText>
                  <ActivityTime>{activity.time}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityList>
        </ActivityCard>
      </ActivitySection>
    </DashboardContainer>
  )
}

export default DashboardHome
