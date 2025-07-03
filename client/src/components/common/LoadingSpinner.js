"use client"

import styled, { keyframes } from "styled-components"

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const Spinner = styled.div`
  border: 3px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-top: 3px solid ${(props) => props.theme.colors?.primary || "#1b4332"};
  border-radius: 50%;
  width: ${(props) => props.size || "40px"};
  height: ${(props) => props.size || "40px"};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto;
`

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${(props) => props.padding || "1rem"};
`

const LoadingSpinner = ({ size, padding, className }) => {
  return (
    <Container padding={padding} className={className}>
      <Spinner size={size} />
    </Container>
  )
}

export default LoadingSpinner
