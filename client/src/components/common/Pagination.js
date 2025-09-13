// client/src/components/common/Pagination.js
"use client";

import React from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Button from './Button'; // Assuming you have a Button component

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  font-size: clamp(0.8rem, 2vw, 0.875rem);
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  border-top: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

const PageInfo = styled.span`
  white-space: nowrap;
`;

const Controls = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    justify-content: center;
    width: 100%;
  }
`;

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems = 0, itemsPerPage = 0 }) => {
  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return null; // Don't render pagination if there's only one page or no items
  }

  return (
    <PaginationContainer>
      <PageInfo>
        Page {currentPage} of {totalPages} ({totalItems.toLocaleString()} items)
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