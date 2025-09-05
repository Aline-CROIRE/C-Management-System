// client/src/pages/modules/ConstructionSites.js
"use client";

import React from 'react';
import styled from 'styled-components';
import ConstructionDashboard from '../../components/construction/ConstructionDashboard';

const ConstructionModuleContainer = styled.div`
  padding: 1.5rem 2rem;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;
  
  @media (max-width: 1200px) {
    padding: 1rem 1.5rem;
  }
  @media (max-width: 768px) {
    padding: 1rem;
  }
  @media (max-width: 480px) {
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