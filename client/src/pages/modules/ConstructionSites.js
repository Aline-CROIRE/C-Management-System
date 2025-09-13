// client/src/pages/modules/ConstructionSites.js
"use client";

import React from 'react';
import styled from 'styled-components';
import ConstructionDashboard from '../../components/construction/ConstructionDashboard';

const ConstructionModuleContainer = styled.div`
  width: 100%; /* Ensure it takes the full available width from MainContent */
  box-sizing: border-box; /* Include padding in the element's total width */
  
  padding: 1.5rem 2rem;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;
  
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    padding: 1rem 1.5rem;
  }
  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: 1rem;
  }
  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    padding: 0.5rem;
  }
`;

const ConstructionSites = () => {
  return (
    <ConstructionModuleContainer>
      <ConstructionDashboard />
    </ConstructionModuleContainer>
  );
};

export default ConstructionSites;