"use client"
import styled from "styled-components"
import Button from "../components/common/Button"

const MaintenanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: ${(props) => props.theme.gradients.background};
`

const MaintenanceIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 2rem;
`

const MaintenanceTitle = styled.h1`
  font-size: 2.5rem;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 1rem;
`

const MaintenanceMessage = styled.p`
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;
`

const EstimatedTime = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: 1rem 2rem;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  margin-bottom: 2rem;
  border: 1px solid ${(props) => props.theme.colors.border};
`

const Maintenance = () => {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <MaintenanceContainer>
      <MaintenanceIcon>🔧</MaintenanceIcon>
      <MaintenanceTitle>System Maintenance</MaintenanceTitle>
      <MaintenanceMessage>
        We're currently performing scheduled maintenance to improve your experience. The system will be back online
        shortly. Thank you for your patience.
      </MaintenanceMessage>
      <EstimatedTime>
        <strong>Estimated completion time:</strong> 30 minutes
      </EstimatedTime>
      <Button onClick={handleRefresh} variant="primary">
        Check Again
      </Button>
    </MaintenanceContainer>
  )
}

export default Maintenance
