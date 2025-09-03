"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import {
  FaTruck,
  FaWrench,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaEdit,
  FaEye,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaTools,
  FaBuilding,
  FaDollarSign,
} from "react-icons/fa"
import Card from "../../components/common/Card"
import Button from "../../components/common/Button"

const ConstructionContainer = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;
`

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(40%, -40%);
  }
`

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
`

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
`

const StatCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(255, 154, 158, 0.1)"};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${(props) => props.theme.shadows?.glowLarge || "0 0 40px rgba(254, 207, 239, 0.2)"};
  }
`

const SitesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
`

const SiteCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(255, 154, 158, 0.1)"};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.statusColor || "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"};
  }
`

const SiteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const SiteInfo = styled.div`
  flex: 1;
`

const SiteName = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const SiteDetails = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0;
`

const SiteStatus = styled.div`
  padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"};
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};

  ${(props) => {
    switch (props.status) {
      case "active":
        return `
          background: ${props.theme.colors?.success || "#2d5016"}20;
          color: ${props.theme.colors?.success || "#2d5016"};
        `
      case "delayed":
        return `
          background: ${props.theme.colors?.warning || "#ed8936"}20;
          color: ${props.theme.colors?.warning || "#ed8936"};
        `
      case "completed":
        return `
          background: ${props.theme.colors?.info || "#1b4332"}20;
          color: ${props.theme.colors?.info || "#1b4332"};
        `
      default:
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
    }
  }}
`

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  overflow: hidden;
  margin: ${(props) => props.theme.spacing?.lg || "1.5rem"} 0;
`

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  width: ${(props) => props.progress || 0}%;
  transition: width 0.3s ease;
`

const SiteMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const MetricItem = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
`

const MetricIcon = styled.div`
  font-size: 1.5rem;
  color: ${(props) => props.color || props.theme.colors?.primary || "#1b4332"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const MetricValue = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const MetricLabel = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const EquipmentSection = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(255, 154, 158, 0.1)"};
  overflow: hidden;
`

const SectionHeader = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`

const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const EquipmentGrid = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const EquipmentCard = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-left: 4px solid ${(props) => props.statusColor || props.theme.colors?.primary || "#1b4332"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceDark || "#edf2f7"};
    transform: translateY(-2px);
  }
`

const EquipmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`

const EquipmentInfo = styled.div`
  flex: 1;
`

const EquipmentName = styled.div`
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const EquipmentDetails = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`

const EquipmentStatus = styled.div`
  padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"};
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => props.color || props.theme.colors?.primary || "#1b4332"}20;
  color: ${(props) => props.color || props.theme.colors?.primary || "#1b4332"};
`

const ConstructionSites = () => {
  const [sitesData, setSitesData] = useState([])
  const [equipmentData, setEquipmentData] = useState([])

  // Sample data
  const sampleSitesData = [
    {
      id: 1,
      name: "Downtown Plaza",
      type: "Commercial Building",
      location: "Downtown District",
      status: "active",
      statusColor: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
      progress: 45,
      workers: 25,
      equipment: 12,
      budget: "$2.5M",
      deadline: "Dec 2024",
      manager: "John Smith",
    },
    {
      id: 2,
      name: "Riverside Apartments",
      type: "Residential Complex",
      location: "Riverside Area",
      status: "active",
      statusColor: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
      progress: 78,
      workers: 18,
      equipment: 8,
      budget: "$1.8M",
      deadline: "Oct 2024",
      manager: "Sarah Johnson",
    },
    {
      id: 3,
      name: "Industrial Warehouse",
      type: "Industrial Building",
      location: "Industrial Zone",
      status: "delayed",
      statusColor: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
      progress: 32,
      workers: 15,
      equipment: 10,
      budget: "$3.2M",
      deadline: "Jan 2025",
      manager: "Mike Davis",
    },
  ]

  const sampleEquipmentData = [
    {
      id: 1,
      name: "Excavator CAT 320",
      type: "Heavy Machinery",
      site: "Downtown Plaza",
      status: "operational",
      statusColor: "#2d5016",
      lastMaintenance: "2 weeks ago",
      nextMaintenance: "In 2 weeks",
      utilization: "85%",
    },
    {
      id: 2,
      name: "Crane Tower TC-7032",
      type: "Lifting Equipment",
      site: "Riverside Apartments",
      status: "maintenance",
      statusColor: "#ed8936",
      lastMaintenance: "Yesterday",
      nextMaintenance: "In 1 month",
      utilization: "0%",
    },
    {
      id: 3,
      name: "Concrete Mixer CM-500",
      type: "Mixing Equipment",
      site: "Industrial Warehouse",
      status: "operational",
      statusColor: "#2d5016",
      lastMaintenance: "1 week ago",
      nextMaintenance: "In 3 weeks",
      utilization: "92%",
    },
    {
      id: 4,
      name: "Bulldozer BD-180",
      type: "Heavy Machinery",
      site: "Downtown Plaza",
      status: "idle",
      statusColor: "#718096",
      lastMaintenance: "3 days ago",
      nextMaintenance: "In 1 week",
      utilization: "45%",
    },
  ]

  useEffect(() => {
    setSitesData(sampleSitesData)
    setEquipmentData(sampleEquipmentData)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <FaCheckCircle />
      case "delayed":
        return <FaExclamationTriangle />
      case "completed":
        return <FaCheckCircle />
      case "operational":
        return <FaCheckCircle />
      case "maintenance":
        return <FaWrench />
      case "idle":
        return <FaClock />
      default:
        return <FaClock />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Active"
      case "delayed":
        return "Delayed"
      case "completed":
        return "Completed"
      case "operational":
        return "Operational"
      case "maintenance":
        return "Maintenance"
      case "idle":
        return "Idle"
      default:
        return "Unknown"
    }
  }

  return (
    <ConstructionContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderTitle>Construction Site Management</HeaderTitle>
          <HeaderSubtitle>
            Comprehensive management of construction equipment, materials, and site operations
          </HeaderSubtitle>
        </HeaderContent>
      </HeaderSection>

      <StatsGrid>
        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                23
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Active Sites
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaBuilding />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#2d5016",
            }}
          >
            <FaChartLine />
            +3 new sites this month
          </div>
        </StatCard>

        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                156
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Equipment Units
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaTruck />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#2d5016",
            }}
          >
            <FaChartLine />
            87% operational
          </div>
        </StatCard>

        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                342
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Workers
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaUsers />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#2d5016",
            }}
          >
            <FaChartLine />
            +15 new hires
          </div>
        </StatCard>

        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                8
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Maintenance Due
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaWrench />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#ed8936",
            }}
          >
            <FaExclamationTriangle />
            Requires attention
          </div>
        </StatCard>
      </StatsGrid>

      <SitesGrid>
        {sitesData.map((site) => (
          <SiteCard key={site.id} statusColor={site.statusColor}>
            <SiteHeader>
              <SiteInfo>
                <SiteName>{site.name}</SiteName>
                <SiteDetails>
                  {site.type} • {site.location}
                </SiteDetails>
              </SiteInfo>
              <SiteStatus status={site.status}>
                {getStatusIcon(site.status)}
                {getStatusText(site.status)}
              </SiteStatus>
            </SiteHeader>

            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#718096" }}>Progress</span>
                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#2d3748" }}>{site.progress}%</span>
              </div>
              <ProgressBar>
                <ProgressFill progress={site.progress} />
              </ProgressBar>
            </div>

            <SiteMetrics>
              <MetricItem>
                <MetricIcon color="#2d5016">
                  <FaUsers />
                </MetricIcon>
                <MetricValue>{site.workers}</MetricValue>
                <MetricLabel>Workers</MetricLabel>
              </MetricItem>

              <MetricItem>
                <MetricIcon color="#667eea">
                  <FaTruck />
                </MetricIcon>
                <MetricValue>{site.equipment}</MetricValue>
                <MetricLabel>Equipment</MetricLabel>
              </MetricItem>

              <MetricItem>
                <MetricIcon color="#ed8936">
                  <FaDollarSign />
                </MetricIcon>
                <MetricValue>{site.budget}</MetricValue>
                <MetricLabel>Budget</MetricLabel>
              </MetricItem>
            </SiteMetrics>

            <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#718096" }}>
              <div>
                <strong>Manager:</strong> {site.manager}
              </div>
              <div>
                <strong>Deadline:</strong> {site.deadline}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button variant="outline" size="sm">
                <FaEye /> View
              </Button>
              <Button variant="primary" size="sm">
                <FaEdit /> Manage
              </Button>
            </div>
          </SiteCard>
        ))}
      </SitesGrid>

      <EquipmentSection>
        <SectionHeader>
          <SectionTitle>
            <FaTools /> Equipment Management
          </SectionTitle>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="outline" size="sm">
              <FaDownload /> Export
            </Button>
            <Button variant="primary" size="sm">
              <FaPlus /> Add Equipment
            </Button>
          </div>
        </SectionHeader>

        <EquipmentGrid>
          {equipmentData.map((equipment) => (
            <EquipmentCard key={equipment.id} statusColor={equipment.statusColor}>
              <EquipmentHeader>
                <EquipmentInfo>
                  <EquipmentName>{equipment.name}</EquipmentName>
                  <EquipmentDetails>
                    {equipment.type} • {equipment.site}
                  </EquipmentDetails>
                </EquipmentInfo>
                <EquipmentStatus color={equipment.statusColor}>
                  {getStatusIcon(equipment.status)}
                  {getStatusText(equipment.status)}
                </EquipmentStatus>
              </EquipmentHeader>

              <div style={{ fontSize: "0.875rem", color: "#718096", lineHeight: "1.5" }}>
                <div>
                  <strong>Last Maintenance:</strong> {equipment.lastMaintenance}
                </div>
                <div>
                  <strong>Next Maintenance:</strong> {equipment.nextMaintenance}
                </div>
                <div>
                  <strong>Utilization:</strong> {equipment.utilization}
                </div>
              </div>
            </EquipmentCard>
          ))}
        </EquipmentGrid>
      </EquipmentSection>
    </ConstructionContainer>
  )
}

export default ConstructionSites
