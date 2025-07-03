"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import {
  FaSeedling,
  FaMapMarkedAlt,
  FaTint,
  FaThermometerHalf,
  FaCalendarAlt,
  FaChartLine,
  FaPlus,
  FaEdit,
  FaEye,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa"
import Card from "../../components/common/Card"
import Button from "../../components/common/Button"

const ISAContainer = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;
`

const HeaderSection = styled.div`
  background: ${(props) => props.theme.gradients?.secondary || "linear-gradient(135deg, #2d5016 0%, #52734d 100%)"};
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
    transform: translate(50%, -50%);
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
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(45, 80, 22, 0.1)"};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${(props) => props.theme.shadows?.glowLarge || "0 0 40px rgba(82, 115, 77, 0.2)"};
  }
`

const WeatherWidget = styled(Card)`
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  text-align: center;
`

const WeatherIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`

const Temperature = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "1.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const WeatherCondition = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  opacity: 0.9;
`

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
`

const FieldCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(45, 80, 22, 0.1)"};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.statusColor || props.theme.gradients?.secondary || "linear-gradient(135deg, #2d5016 0%, #52734d 100%)"};
  }
`

const FieldHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const FieldInfo = styled.div`
  flex: 1;
`

const FieldName = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const FieldDetails = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin: 0;
`

const FieldStatus = styled.div`
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
      case "healthy":
        return `
          background: ${props.theme.colors?.success || "#2d5016"}20;
          color: ${props.theme.colors?.success || "#2d5016"};
        `
      case "attention":
        return `
          background: ${props.theme.colors?.warning || "#ed8936"}20;
          color: ${props.theme.colors?.warning || "#ed8936"};
        `
      case "critical":
        return `
          background: ${props.theme.colors?.error || "#c53030"}20;
          color: ${props.theme.colors?.error || "#c53030"};
        `
      default:
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
    }
  }}
`

const FieldMetrics = styled.div`
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

const ActionButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  justify-content: flex-end;
`

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  border: none;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.secondary || "#2d5016"};
    color: white;
    transform: translateY(-2px);
  }
`

const TasksSection = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(45, 80, 22, 0.1)"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const TasksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`

const TaskItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  border-left: 4px solid ${(props) => props.priorityColor || props.theme.colors?.primary || "#1b4332"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceDark || "#edf2f7"};
    transform: translateX(4px);
  }
`

const TaskInfo = styled.div`
  flex: 1;
`

const TaskTitle = styled.div`
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const TaskDetails = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`

const TaskPriority = styled.div`
  padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"};
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => props.color || props.theme.colors?.primary || "#1b4332"}20;
  color: ${(props) => props.color || props.theme.colors?.primary || "#1b4332"};
`

const ISA = () => {
  const [fieldsData, setFieldsData] = useState([])
  const [tasksData, setTasksData] = useState([])
  const [weatherData, setWeatherData] = useState({
    temperature: "24°C",
    condition: "Partly Cloudy",
    humidity: "65%",
    rainfall: "12mm",
  })

  // Sample data
  const sampleFieldsData = [
    {
      id: 1,
      name: "Field A-12",
      crop: "Tomatoes",
      area: "5.2 hectares",
      status: "healthy",
      statusColor: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
      soilMoisture: "68%",
      temperature: "26°C",
      ph: "6.8",
      lastIrrigation: "2 hours ago",
      nextTask: "Fertilizer application",
    },
    {
      id: 2,
      name: "Field B-7",
      crop: "Corn",
      area: "8.1 hectares",
      status: "attention",
      statusColor: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
      soilMoisture: "45%",
      temperature: "28°C",
      ph: "7.2",
      lastIrrigation: "6 hours ago",
      nextTask: "Irrigation needed",
    },
    {
      id: 3,
      name: "Field C-3",
      crop: "Lettuce",
      area: "3.5 hectares",
      status: "healthy",
      statusColor: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
      soilMoisture: "72%",
      temperature: "22°C",
      ph: "6.5",
      lastIrrigation: "1 hour ago",
      nextTask: "Pest inspection",
    },
  ]

  const sampleTasksData = [
    {
      id: 1,
      title: "Irrigation System Check - Field B-7",
      details: "Check and repair irrigation system in corn field",
      priority: "high",
      priorityColor: "#c53030",
      dueDate: "Today, 2:00 PM",
    },
    {
      id: 2,
      title: "Fertilizer Application - Field A-12",
      details: "Apply organic fertilizer to tomato plants",
      priority: "medium",
      priorityColor: "#ed8936",
      dueDate: "Tomorrow, 8:00 AM",
    },
    {
      id: 3,
      title: "Pest Inspection - Field C-3",
      details: "Weekly pest inspection for lettuce field",
      priority: "low",
      priorityColor: "#2d5016",
      dueDate: "Friday, 10:00 AM",
    },
  ]

  useEffect(() => {
    setFieldsData(sampleFieldsData)
    setTasksData(sampleTasksData)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <FaCheckCircle />
      case "attention":
        return <FaExclamationTriangle />
      case "critical":
        return <FaExclamationTriangle />
      default:
        return <FaCheckCircle />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "healthy":
        return "Healthy"
      case "attention":
        return "Needs Attention"
      case "critical":
        return "Critical"
      default:
        return "Unknown"
    }
  }

  return (
    <ISAContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderTitle>Integrated Smart Agriculture</HeaderTitle>
          <HeaderSubtitle>
            Advanced agricultural management with IoT sensors, weather monitoring, and crop optimization
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
                Active Fields
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
              <FaMapMarkedAlt />
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
            +8.2% from last month
          </div>
        </StatCard>

        <WeatherWidget>
          <WeatherIcon>☀️</WeatherIcon>
          <Temperature>{weatherData.temperature}</Temperature>
          <WeatherCondition>{weatherData.condition}</WeatherCondition>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginTop: "1rem",
              fontSize: "0.875rem",
            }}
          >
            <div>💧 {weatherData.humidity}</div>
            <div>🌧️ {weatherData.rainfall}</div>
          </div>
        </WeatherWidget>

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
                Irrigation Active
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaTint />
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
            +12.5% efficiency
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
                $89,432
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
                Crop Value
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #40916c 0%, #2d5016 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaSeedling />
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
            +15.3% from last season
          </div>
        </StatCard>
      </StatsGrid>

      <FieldsGrid>
        {fieldsData.map((field) => (
          <FieldCard key={field.id} statusColor={field.statusColor}>
            <FieldHeader>
              <FieldInfo>
                <FieldName>{field.name}</FieldName>
                <FieldDetails>
                  {field.crop} • {field.area}
                </FieldDetails>
              </FieldInfo>
              <FieldStatus status={field.status}>
                {getStatusIcon(field.status)}
                {getStatusText(field.status)}
              </FieldStatus>
            </FieldHeader>

            <FieldMetrics>
              <MetricItem>
                <MetricIcon color="#4facfe">
                  <FaTint />
                </MetricIcon>
                <MetricValue>{field.soilMoisture}</MetricValue>
                <MetricLabel>Soil Moisture</MetricLabel>
              </MetricItem>

              <MetricItem>
                <MetricIcon color="#ed8936">
                  <FaThermometerHalf />
                </MetricIcon>
                <MetricValue>{field.temperature}</MetricValue>
                <MetricLabel>Temperature</MetricLabel>
              </MetricItem>

              <MetricItem>
                <MetricIcon color="#2d5016">
                  <FaSeedling />
                </MetricIcon>
                <MetricValue>{field.ph}</MetricValue>
                <MetricLabel>Soil pH</MetricLabel>
              </MetricItem>
            </FieldMetrics>

            <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#718096" }}>
              <div>
                <strong>Last Irrigation:</strong> {field.lastIrrigation}
              </div>
              <div>
                <strong>Next Task:</strong> {field.nextTask}
              </div>
            </div>

            <ActionButtons>
              <ActionButton title="View Details">
                <FaEye />
              </ActionButton>
              <ActionButton title="Edit Field">
                <FaEdit />
              </ActionButton>
              <ActionButton title="Download Report">
                <FaDownload />
              </ActionButton>
            </ActionButtons>
          </FieldCard>
        ))}
      </FieldsGrid>

      <TasksSection>
        <SectionTitle>
          <FaCalendarAlt /> Scheduled Tasks
        </SectionTitle>

        <TasksList>
          {tasksData.map((task) => (
            <TaskItem key={task.id} priorityColor={task.priorityColor}>
              <TaskInfo>
                <TaskTitle>{task.title}</TaskTitle>
                <TaskDetails>
                  {task.details} • Due: {task.dueDate}
                </TaskDetails>
              </TaskInfo>
              <TaskPriority color={task.priorityColor}>{task.priority}</TaskPriority>
            </TaskItem>
          ))}
        </TasksList>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Button variant="primary">
            <FaPlus /> Add New Task
          </Button>
        </div>
      </TasksSection>
    </ISAContainer>
  )
}

export default ISA
