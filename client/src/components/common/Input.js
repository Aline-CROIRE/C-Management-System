"use client"

import styled from "styled-components"
import { forwardRef, useState } from "react"

// --- STYLED COMPONENTS (No changes needed here, they are well-defined) ---
const InputContainer = styled.div`
  width: 100%;
  position: relative;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const StyledInput = styled.input`
  width: 100%;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  border: 2px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
  font-family: ${(props) => props.theme.typography?.fontFamily || "inherit"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;

  &::placeholder {
    color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  }

  &:focus {
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
    box-shadow: 0 0 0 3px ${(props) => `${props.theme.colors?.primary}33` || "#1b433233"};
  }

  ${(props) => props.$hasIcon && `padding-left: 2.75rem;`}

  ${(props) =>
    props.$error &&
    `
    border-color: ${props.theme.colors?.error || "#c53030"};
    &:focus {
      border-color: ${props.theme.colors?.error || "#c53030"};
      box-shadow: 0 0 0 3px ${`${props.theme.colors?.error}33` || "#c5303033"};
    }
  `}
`

const IconContainer = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: 1rem;
  transition: color 0.3s ease;
  pointer-events: ${(props) => (props.$clickable ? "auto" : "none")};
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  ${InputWrapper}:focus-within & {
    color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }

  ${(props) =>
    props.$error &&
    `${InputWrapper}:focus-within & {
      color: ${props.theme.colors?.error || "#c53030"};
    }`}
`

const ErrorMessage = styled.p`
  color: ${(props) => props.theme.colors?.error || "#c53030"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

// --- COMPONENT LOGIC ---

const Input = forwardRef(
  (
    // FIXED: Destructure and alias 'icon' prop to 'Icon' (with a capital letter)
    { className, error, icon: Icon, onIconClick, ...props },
    ref,
  ) => {
    return (
      <InputContainer className={className}>
        <InputWrapper>
          {/* FIXED: Render the Icon as a component if it exists */}
          {Icon && (
            <IconContainer $clickable={!!onIconClick} onClick={onIconClick} $error={!!error}>
              <Icon />
            </IconContainer>
          )}
          <StyledInput ref={ref} $error={!!error} $hasIcon={!!Icon} {...props} />
        </InputWrapper>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputContainer>
    )
  },
)

Input.displayName = "Input"
export default Input