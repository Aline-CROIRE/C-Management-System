"use client"

import React from "react"
import styled from "styled-components"
import Button from "./Button"

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: ${(props) => props.theme.colors.surfaceLight};
`

const ErrorTitle = styled.h1`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.error};
  margin-bottom: 1rem;
`

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
  max-width: 600px;
`

const ErrorDetails = styled.details`
  margin-top: 2rem;
  padding: 1rem;
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.border};
  max-width: 800px;
  width: 100%;
`

const ErrorSummary = styled.summary`
  cursor: pointer;
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 1rem;
`

const ErrorStack = styled.pre`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
  background: ${(props) => props.theme.colors.surfaceLight};
  padding: 1rem;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  overflow-x: auto;
  white-space: pre-wrap;
`

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/dashboard"
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          <ErrorMessage>
            We're sorry, but something unexpected happened. Please try refreshing the page or go back to the dashboard.
          </ErrorMessage>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Button onClick={this.handleReload} variant="primary">
              Refresh Page
            </Button>
            <Button onClick={this.handleGoHome} variant="secondary">
              Go to Dashboard
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <ErrorDetails>
              <ErrorSummary>Error Details (Development Mode)</ErrorSummary>
              <div>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
              {this.state.errorInfo && <ErrorStack>{this.state.errorInfo.componentStack}</ErrorStack>}
            </ErrorDetails>
          )}
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
