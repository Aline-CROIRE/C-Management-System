"use client"
import styled from "styled-components"
import { Link } from "react-router-dom"
import Button from "../components/common/Button"

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: ${(props) => props.theme.colors.surfaceLight};
`

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.primary};
  margin: 0;
  line-height: 1;
`

const ErrorTitle = styled.h2`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.text};
  margin: 1rem 0;
`

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
  max-width: 500px;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`

const NotFound = () => {
  return (
    <NotFoundContainer>
      <ErrorCode>404</ErrorCode>
      <ErrorTitle>Page Not Found</ErrorTitle>
      <ErrorMessage>
        The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
      </ErrorMessage>
      <ButtonGroup>
        <Link to="/dashboard">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </ButtonGroup>
    </NotFoundContainer>
  )
}

export default NotFound
