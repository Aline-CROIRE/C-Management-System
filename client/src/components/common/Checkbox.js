// client/src/components/common/Checkbox.js
import React from 'react';
import styled from 'styled-components';

const StyledCheckbox = styled.input.attrs({ type: 'checkbox' })`
  /* Custom checkbox styling for responsiveness and theme integration */
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1px solid ${(props) => props.theme.colors?.border || '#cbd5e0'};
  border-radius: ${(props) => props.theme.borderRadius?.sm || '4px'};
  cursor: pointer;
  display: inline-block;
  vertical-align: middle;
  position: relative;
  background-color: ${(props) => props.theme.colors?.surface || '#ffffff'};
  transition: all 0.2s ease-in-out;
  flex-shrink: 0; // Prevent checkbox from shrinking in flex containers

  &:checked {
    background-color: ${(props) => props.theme.colors?.primary || '#1b4332'};
    border-color: ${(props) => props.theme.colors?.primary || '#1b4332'};
  }

  &:checked::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 2px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(props) => props.theme.colors?.primary}40;
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors?.background || '#edf2f7'};
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 480px) {
    width: 16px;
    height: 16px;
    &:checked::after {
      left: 4px;
      top: 1px;
      width: 3px;
      height: 7px;
    }
  }
`;

const Checkbox = ({ id, name, checked, onChange, ...props }) => {
  return (
    <StyledCheckbox
      id={id}
      name={name}
      checked={checked}
      onChange={onChange}
      {...props}
    />
  );
};

export default Checkbox;