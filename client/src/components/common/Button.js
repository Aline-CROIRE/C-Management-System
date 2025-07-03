import styled from "styled-components"
import { forwardRef } from "react"

// Use transient props (prefixed with $) for all props intended for styling only.
// This prevents them from being passed to the underlying DOM element.
const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  font-family: ${(props) => props.theme.typography?.fontFamily || "inherit"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  white-space: nowrap;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(64, 145, 108, 0.3)"};
  }

  &:not(:disabled):active {
    transform: translateY(0);
  }

  /* Shimmer effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }

  /* Size Variants - FIX: Use $size prop */
  ${(props) => {
    switch (props.$size) {
      case "xs":
        return `
          padding: ${props.theme.spacing?.xs || "0.25rem"} ${props.theme.spacing?.sm || "0.5rem"};
          font-size: ${props.theme.typography?.fontSize?.xs || "0.75rem"};
          min-height: 28px;
        `
      case "sm":
        return `
          padding: ${props.theme.spacing?.sm || "0.5rem"} ${props.theme.spacing?.md || "1rem"};
          font-size: ${props.theme.typography?.fontSize?.sm || "0.875rem"};
          min-height: 36px;
        `
      case "lg":
        return `
          padding: ${props.theme.spacing?.md || "1rem"} ${props.theme.spacing?.xl || "2rem"};
          font-size: ${props.theme.typography?.fontSize?.lg || "1.125rem"};
          min-height: 52px;
        `
      case "xl":
        return `
          padding: ${props.theme.spacing?.lg || "1.5rem"} ${props.theme.spacing?.["2xl"] || "3rem"};
          font-size: ${props.theme.typography?.fontSize?.xl || "1.25rem"};
          min-height: 60px;
        `
      default: // 'base' size
        return `
          padding: ${props.theme.spacing?.sm || "0.5rem"} ${props.theme.spacing?.lg || "1.5rem"};
          font-size: ${props.theme.typography?.fontSize?.base || "1rem"};
          min-height: 44px;
        `
    }
  }}

  /* Variant Styles - FIX: Use $variant prop */
  ${(props) => {
    switch (props.$variant) {
      case "primary":
        return `
          background: ${props.theme.gradients?.button || "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)"};
          color: ${props.theme.colors?.textOnDark || "#ffffff"};
          box-shadow: ${props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};
          
          &:not(:disabled):hover {
            background: ${props.theme.gradients?.primary || "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)"};
            filter: brightness(1.1);
          }
        `
      case "secondary":
      case "success": // Grouping similar styles
        return `
          background: ${props.theme.gradients?.success || "linear-gradient(135deg, #2d5016 0%, #52734d 100%)"};
          color: ${props.theme.colors?.textOnDark || "#ffffff"};
          
          &:not(:disabled):hover {
            filter: brightness(1.1);
          }
        `
      case "outline":
        return `
          background: transparent;
          color: ${props.theme.colors?.primary || "#1b4332"};
          border: 2px solid ${props.theme.colors?.primary || "#1b4332"};
          
          &:not(:disabled):hover {
            background: ${props.theme.colors?.primary || "#1b4332"};
            color: ${props.theme.colors?.textOnDark || "#ffffff"};
          }
        `
      case "ghost":
        return `
          background: transparent;
          color: ${props.theme.colors?.text || "#2d3748"};
          
          &:not(:disabled):hover {
            background: ${props.theme.colors?.surfaceLight || "#f7fafc"};
            color: ${props.theme.colors?.primary || "#1b4332"};
          }
        `
      case "danger":
        return `
          background: ${props.theme.gradients?.error || "linear-gradient(135deg, #c53030 0%, #9c2626 100%)"};
          color: ${props.theme.colors?.textOnDark || "#ffffff"};
          
          &:not(:disabled):hover {
            filter: brightness(1.1);
          }
        `
      default: // 'default' variant
        return `
          background: ${props.theme.colors?.surface || "#ffffff"};
          color: ${props.theme.colors?.text || "#2d3748"};
          border: 1px solid ${props.theme.colors?.border || "#e2e8f0"};
          
          &:not(:disabled):hover {
            background: ${props.theme.colors?.surfaceLight || "#f7fafc"};
            border-color: ${props.theme.colors?.primary || "#1b4332"};
            color: ${props.theme.colors?.primary || "#1b4332"};
          }
        `
    }
  }}

  /* Full Width - FIX: Use $fullWidth prop */
  ${(props) =>
    props.$fullWidth && `width: 100%;`
  }

  /* Loading State - FIX: Use $loading prop */
  ${(props) =>
    props.$loading &&
    `
    pointer-events: none;
    
    // Hide the shimmer effect when loading
    &::before {
      display: none;
    }
    
    // Spinner logic
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      margin: auto;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
`

const Button = forwardRef(
  ({ children, variant = "default", size = "base", fullWidth = false, loading = false, ...props }, ref) => {
    return (
      // FIX: Pass transient props to StyledButton, and correctly handle the `disabled` state.
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        $loading={loading}
        // A button should be disabled if it's loading OR if the user explicitly disables it.
        disabled={loading || props.disabled}
        {...props}
      >
        {/* Hide children when loading to make space for the spinner */}
        {!loading && children}
      </StyledButton>
    )
  },
)

Button.displayName = "Button"

export default Button