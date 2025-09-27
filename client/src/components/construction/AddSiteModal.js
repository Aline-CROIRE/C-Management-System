"use client"

import styled from "styled-components"
import Button from "../components/common/Button"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: ${({ theme }) => theme.gradients.background};

  @media (max-width: 480px) {
    padding: 1.5rem;
  }
`

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    font-size: 3rem;
  }
`

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    font-size: 1.8rem;
  }
`

const Message = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
`

const TimeBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: 1rem 2rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 2rem;
  font-size: 1rem;

  @media (max-width: 480px) {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
`

const Maintenance = () => {
  const handleRefresh = () => window.location.reload()

  return (
    <Container>
      <Icon>🔧</Icon>
      <Title>System Maintenance</Title>
      <Message>
        We’re performing scheduled maintenance to enhance your experience. The system will be back online shortly.
        Thank you for your patience.
      </Message>
      <TimeBox>
        <strong>Estimated completion time:</strong> 30 minutes
      </TimeBox>
      <Button onClick={handleRefresh} variant="primary">
        Check Again
      </Button>
    </Container>
  )
}

export default Maintenance
