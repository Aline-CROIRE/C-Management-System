// client/src/components/restaurant/ReusableProgramManagement.js
"use client";
import React from 'react';
import styled from 'styled-components';

const TempContainer = styled.div`
    padding: 2rem;
    text-align: center;
    background: ${props => props.theme.colors?.background};
    border-radius: ${props => props.theme.borderRadius?.lg};
    box-shadow: ${props => props.theme.shadows?.md};
`;

const ReusableProgramManagement = ({ restaurantId }) => {
  return (
    <TempContainer>
      <h3>Reusable & Refillable Program Management</h3>
      <p>This module is under construction.</p>
      <p>Restaurant ID: {restaurantId}</p>
    </TempContainer>
  );
};
export default ReusableProgramManagement;