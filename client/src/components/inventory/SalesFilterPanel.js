"use client";
import React, { useState } from 'react';
import styled from 'styled-components';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from 'date-fns/locale'; // --- IMPORT THE LOCALE ---
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import Select from '../common/Select';

const PanelOverlay = styled.div`
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1050;
  backdrop-filter: blur(4px);
`;

const PanelContent = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 400px;
  background: ${(props) => props.theme.colors.surface};
  box-shadow: -5px 0 25px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

const PanelHeader = styled.div`
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
`;

const PanelBody = styled.div`
  padding: 1.5rem;
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const PanelFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  gap: 1rem;
  background: ${(props) => props.theme.colors.surfaceLight};
`;

const SalesFilterPanel = ({ customers, onClose, onApply, onClear, initialFilters = {} }) => {
  const [customerId, setCustomerId] = useState(initialFilters.customerId || '');
  const [paymentMethod, setPaymentMethod] = useState(initialFilters.paymentMethod || '');
  const [dateRange, setDateRange] = useState([
    {
      startDate: initialFilters.startDate ? new Date(initialFilters.startDate) : null,
      endDate: initialFilters.endDate ? new Date(initialFilters.endDate) : new Date(),
      key: 'selection'
    }
  ]);

  const handleApply = () => {
    onApply({
      customerId,
      paymentMethod,
      startDate: dateRange[0].startDate?.toISOString(),
      endDate: dateRange[0].endDate?.toISOString(),
    });
  };

  return (
    <PanelOverlay onClick={onClose}>
      <PanelContent onClick={e => e.stopPropagation()}>
        <PanelHeader>
          <PanelTitle>Filter Sales</PanelTitle>
          <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
        </PanelHeader>
        <PanelBody>
          <FormGroup>
            <Label>Date Range</Label>
            <DateRange
                editableDateInputs={true}
                onChange={item => setDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                locale={enUS} // --- PASS THE LOCALE PROP ---
            />
          </FormGroup>
          <FormGroup>
            <Label>Customer</Label>
            <Select value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">All Customers</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Bank Transfer">Bank Transfer</option>
            </Select>
          </FormGroup>
        </PanelBody>
        <PanelFooter>
          <Button variant="secondary" onClick={onClear} fullWidth>Clear Filters</Button>
          <Button variant="primary" onClick={handleApply} fullWidth>Apply Filters</Button>
        </PanelFooter>
      </PanelContent>
    </PanelOverlay>
  );
};

export default SalesFilterPanel;