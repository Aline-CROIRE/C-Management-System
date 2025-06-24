import styled, { keyframes } from "styled-components"

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div`
  height: ${(props) => props.size || "35px"};
  width: ${(props) => props.size || "35px"};
  border-radius: 50%;
  /* Fallback gradient to prevent errors */
  background: linear-gradient(45deg, ${(props) => props.theme.colors.primary || "#667eea"} 0%, ${(props) => props.theme.colors.secondary || "#764ba2"} 100%);
  animation: ${rotate} 0.8s linear infinite;
  margin: ${(props) => props.margin || "0 auto"};
`

const LoadingSpinner = (props) => {
  return <Spinner {...props} />
}

export default LoadingSpinner
