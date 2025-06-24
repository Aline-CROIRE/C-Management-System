import styled from "styled-components"

const CardContainer = styled.div`
  background: ${(props) => props.theme.colors?.background || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px rgba(0,0,0,0.1)"};
  padding: ${(props) => props.theme.spacing?.["2xl"] || "3rem"} ${(props) => props.theme.spacing?.xl || "2rem"};
  transition: all 0.3s ease;
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
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
    box-shadow: ${(props) => props.theme.shadows?.xl || "0 20px 25px rgba(0,0,0,0.15)"};
    transform: translateY(-8px);
  }
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const CardTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.medium || "1rem"};
  font-weight: 600;
  color: ${(props) => props.theme.colors?.textSecondary || "#666666"};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.borderRadius?.medium || "8px"};
  background: ${(props) => props.iconColor || props.theme.colors?.primary || "#667eea"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`

const CardValue = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: ${(props) => props.theme.colors?.text || "#333333"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  line-height: 1;
  
  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    font-size: 2.5rem;
  }
`

const CardChange = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.small || "0.875rem"};
  font-weight: 500;
  
  &.positive {
    color: #10b981;
  }
  
  &.negative {
    color: #ef4444;
  }
  
  &.neutral {
    color: ${(props) => props.theme.colors?.textSecondary || "#666666"};
  }
`

const ChangeIcon = styled.span`
  font-size: 16px;
`

const StatsCard = ({ title, value, change, changeType = "neutral", icon, iconColor, className }) => {
  const formatValue = (val) => {
    if (typeof val === "number") {
      return val.toLocaleString()
    }
    return val
  }

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return "↗"
      case "negative":
        return "↘"
      default:
        return "→"
    }
  }

  return (
    <CardContainer className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {icon && <CardIcon iconColor={iconColor}>{icon}</CardIcon>}
      </CardHeader>

      <CardValue>{formatValue(value)}</CardValue>

      {change && (
        <CardChange className={changeType}>
          <ChangeIcon>{getChangeIcon()}</ChangeIcon>
          {change}
        </CardChange>
      )}
    </CardContainer>
  )
}

export default StatsCard
