"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import styled from "styled-components"
import Card from "../../components/common/Card"
import Button from "../../components/common/Button"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.gradient?.primary || "linear-gradient(45deg, #667eea 0%, #764ba2 100%)"};
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
`

const VerificationCard = styled(Card)`
  max-width: 500px;
  width: 100%;
  text-align: center;
`

const Title = styled.h1`
  color: ${(props) => props.theme.colors?.text || "#333333"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xlarge || "1.5rem"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const Message = styled.p`
  color: ${(props) => props.theme.colors?.textSecondary || "#666666"};
  font-size: ${(props) => props.theme.typography?.fontSize?.medium || "1rem"};
  line-height: 1.6;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const StatusIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  
  &.success {
    color: #10b981;
  }
  
  &.error {
    color: #ef4444;
  }
  
  &.loading {
    color: ${(props) => props.theme.colors?.primary || "#667eea"};
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  justify-content: center;
  flex-wrap: wrap;
`

const EmailVerification = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus("error")
      setMessage("Invalid verification link. Please check your email and try again.")
    }
  }, [token])

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-email/${verificationToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Your email has been successfully verified! You can now log in to your account.")
      } else {
        setStatus("error")
        setMessage(data.message || "Email verification failed. Please try again.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Network error. Please check your connection and try again.")
    }
  }

  const handleGoToLogin = () => {
    navigate("/login")
  }

  const handleResendVerification = () => {
    // Implement resend verification logic
    navigate("/resend-verification")
  }

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <StatusIcon className="loading">
              <LoadingSpinner size="60px" />
            </StatusIcon>
            <Title>Verifying Your Email</Title>
            <Message>Please wait while we verify your email address...</Message>
          </>
        )

      case "success":
        return (
          <>
            <StatusIcon className="success">✅</StatusIcon>
            <Title>Email Verified Successfully!</Title>
            <Message>{message}</Message>
            <ButtonGroup>
              <Button onClick={handleGoToLogin} variant="primary">
                Go to Login
              </Button>
            </ButtonGroup>
          </>
        )

      case "error":
        return (
          <>
            <StatusIcon className="error">❌</StatusIcon>
            <Title>Verification Failed</Title>
            <Message>{message}</Message>
            <ButtonGroup>
              <Button onClick={handleGoToLogin} variant="primary">
                Go to Login
              </Button>
              <Button onClick={handleResendVerification} variant="secondary">
                Resend Verification
              </Button>
            </ButtonGroup>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Container>
      <VerificationCard>{renderContent()}</VerificationCard>
    </Container>
  )
}

export default EmailVerification
