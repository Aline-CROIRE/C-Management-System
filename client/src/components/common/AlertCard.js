// client/src/components/common/AlertCard.js
"use client";

import React from 'react';
import styled from 'styled-components';
import Card from './Card'; // Assuming you have a common Card component

const StyledAlertCard = styled(Card)`
  background: ${props => props.$type === 'error' ? props.theme.colors?.dangerLight || '#fef2f2' : (props.$type === 'warning' ? props.theme.colors?.warningLight || '#fff3cd' : props.theme.colors?.infoLight || '#ebf8ff')};
  border: 1px solid ${props => props.$type === 'error' ? props.theme.colors?.danger || '#dc2626' : (props.$type === 'warning' ? props.theme.colors?.warning || '#fbbf24' : props.theme.colors?.info || '#38b2ac')};
  color: ${props => props.$type === 'error' ? props.theme.colors?.dangerDark || '#991b1b' : (props.$type === 'warning' ? props.theme.colors?.warningDark || '#92400e' : props.theme.colors?.infoDark || '#006d6b')};
  padding: ${props => props.theme.spacing?.lg || '1.5rem'};
  margin: ${props => props.theme.spacing?.md || '1rem'} 0;
  text-align: left;
  font-size: ${props => props.theme.typography?.fontSize?.md || '1rem'};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing?.sm || '0.5rem'};

  strong {
    font-weight: ${props => props.theme.typography?.fontWeight?.bold};
  }
`;

const AlertCard = ({ children, type = 'info', ...props }) => {
  return (
    <StyledAlertCard $type={type} {...props}>
      {children}
    </StyledAlertCard>
  );
};

export default AlertCard;