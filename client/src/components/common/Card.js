import styled from "styled-components"

const CardContainer = styled.div`
  background: ${(props) => props.theme.gradients?.card || "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${(props) => props.theme.gradients?.primary || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"};
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(0, 0, 0, 0.1)"};
    transform: translateY(-4px);
    
    &::before {
      opacity: 1;
    }
  }

  ${(props) => {
    switch (props.$size) {
      case "sm":
        return `padding: ${props.theme.spacing?.md || "1rem"};`
      case "lg":
        return `padding: ${props.theme.spacing?.["2xl"] || "3rem"};`
      default:
        return `padding: ${props.theme.spacing?.xl || "2rem"};`
    }
  }}

  ${(props) =>
    props.$interactive &&
    `
    cursor: pointer;
  `}

  ${(props) =>
    props.$variant === "elevated" &&
    `
    box-shadow: ${props.theme.shadows?.xl || "0 20px 25px -5px rgba(0, 0, 0, 0.1)"};
  `}

  ${(props) =>
    props.$variant === "outlined" &&
    `
    background: ${props.theme.colors?.surface || "#ffffff"};
    border: 2px solid ${props.theme.colors?.border || "#e2e8f0"};
    box-shadow: none;
  `}

  ${(props) =>
    props.$variant === "filled" &&
    `
    background: ${props.theme.colors?.surfaceLight || "#f7fafc"};
    border: none;
  `}
`

const CardHeader = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  padding-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }
`

const CardTitle = styled.h3`
  margin: 0;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  line-height: ${(props) => props.theme.typography?.lineHeight?.tight || "1.25"};
`

const CardSubtitle = styled.p`
  margin: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0 0 0;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
  line-height: ${(props) => props.theme.typography?.lineHeight?.normal || "1.5"};
`

const CardBody = styled.div`
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  line-height: ${(props) => props.theme.typography?.lineHeight?.relaxed || "1.625"};
`

const CardFooter = styled.div`
  border-top: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  padding-top: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  margin-top: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};

  &:first-child {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }
`

const Card = ({
  title,
  subtitle,
  children,
  footer,
  className,
  size = "base",
  variant = "default",
  interactive = false,
  ...props
}) => {
  return (
    <CardContainer className={className} $size={size} $variant={variant} $interactive={interactive} {...props}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
        </CardHeader>
      )}

      <CardBody>{children}</CardBody>

      {footer && <CardFooter>{footer}</CardFooter>}
    </CardContainer>
  )
}

export default Card
export { CardContainer, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter }
