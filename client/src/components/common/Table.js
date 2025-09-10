// client/src/components/common/Table.js
import React from 'react';
import styled from 'styled-components';

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; /* Default min-width, can be overridden by specific tables */

  /* Responsive considerations for smaller screens */
  @media (max-width: 768px) {
    min-width: unset; /* Allow table to shrink if content fits */
  }
`;

const StyledTHead = styled.thead`
  background: ${(props) => props.theme?.colors?.surfaceLight || "#f7fafc"};
`;

const StyledTh = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: clamp(0.7rem, 1.5vw, 0.75rem);
  font-weight: 600;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  white-space: nowrap; /* Prevent headers from wrapping too early */
  
  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
  &.hide-on-tablet {
    @media (max-width: 1024px) {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: clamp(0.65rem, 2vw, 0.7rem);
  }
`;

const StyledTBody = styled.tbody``;

const StyledTr = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  &:hover {
    background: ${(props) => props.theme?.colors?.surfaceLight || "#edf2f7"};
  }
  &:last-child {
    border-bottom: none;
  }
`;

const StyledTd = styled.td`
  padding: 1rem 1.5rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: ${(props) => props.theme?.colors?.text || "#2d3748"};
  vertical-align: middle;
  white-space: nowrap; /* Prevent content from wrapping too early */

  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
  &.hide-on-tablet {
    @media (max-width: 1024px) {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: clamp(0.75rem, 2.5vw, 0.8rem);
  }
`;

const Table = ({ columns, data }) => {
  // `headerRenderer` is a function passed from specific table components (e.g., WorkerAssignmentTable).
  // It allows custom rendering of <th> elements, including sort icons and click handlers.
  // If not provided, it falls back to a default `StyledTh`.
  const DefaultTh = ({ children, className, style, onClick }) => (
    <StyledTh className={className} style={style} onClick={onClick}>{children}</StyledTh>
  );

  return (
    <div style={{overflowX: 'auto', WebkitOverflowScrolling: 'touch'}}> {/* Added overflow-x for responsiveness */}
      <StyledTable>
        <StyledTHead>
          <StyledTr>
            {columns.map((col) => {
              // If headerRenderer is provided, use it. Otherwise, use the DefaultTh.
              // We pass all column properties to the headerRenderer, so it can build its own <th>.
              // The default behaviour from TableWrapper's TableHeaderCell handles sort props.
              if (col.headerRenderer) {
                return <React.Fragment key={col.accessor}>{col.headerRenderer(col)}</React.Fragment>;
              } else {
                return (
                  <DefaultTh key={col.accessor} className={col.className}>
                    {col.header}
                  </DefaultTh>
                );
              }
            })}
          </StyledTr>
        </StyledTHead>
        <StyledTBody>
          {data.map((row, rowIndex) => (
            <StyledTr key={row._id || rowIndex}>
              {columns.map((col) => (
                <StyledTd key={`${row._id || rowIndex}-${col.accessor}`} className={col.className}>
                  {/* Render using the custom 'render' function if provided, otherwise directly access property */}
                  {col.render ? col.render(row) : row[col.accessor]}
                </StyledTd>
              ))}
            </StyledTr>
          ))}
        </StyledTBody>
      </StyledTable>
    </div>
  );
};

export default Table;