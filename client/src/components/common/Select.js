// components/common/Select.jsx

"use client";

import { forwardRef } from 'react';
import styled from 'styled-components';

// This SVG is a simple chevron-down icon, URL-encoded to be used in CSS.
// The stroke color is hardcoded here but could be themed if needed.
const customArrow = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

const StyledSelect = styled.select`
  // --- Base & Theme Styles ---
  // These styles are consistent with your other form inputs.
  display: block;
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem; // Extra right padding for the arrow
  font-size: 0.9rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.5;
  color: ${(props) => props.theme.colors.text};
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  // --- Custom Arrow Styling ---
  appearance: none; // This is crucial to hide the default browser arrow
  background-image: ${customArrow};
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25em;

  // --- Interaction States ---
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.primary}40; // 40 is for ~25% opacity
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.surfaceLight};
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

/**
 * A themed, styled <select> component that accepts all standard props.
 * @param {React.ReactNode} children - The <option> elements to be rendered inside the select.
 */
const Select = forwardRef(({ children, ...props }, ref) => {
  return (
    <StyledSelect ref={ref} {...props}>
      {children}
    </StyledSelect>
  );
});

Select.displayName = 'Select';

export default Select;