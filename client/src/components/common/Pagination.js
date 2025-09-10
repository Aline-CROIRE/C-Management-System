// client/src/components/common/Pagination.js
"use client";

import React from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Button from './Button'; // Assuming Button is in the same common folder

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  font-size: clamp(0.8rem, 2vw, 0.875rem);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PageInfo = styled.span`
  flex-shrink: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <PaginationContainer>
      <PageInfo>
        Page {currentPage} of {totalPages}
      </PageInfo>
      <Controls>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage <= 1}
        >
          <FaChevronLeft /> Prev
        </Button>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage >= totalPages}
        >
          Next <FaChevronRight />
        </Button>
      </Controls>
    </PaginationContainer>
  );
};

export default Pagination;