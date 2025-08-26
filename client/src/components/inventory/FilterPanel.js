// components/inventory/FilterPanel.jsx

"use client";

import { useState } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import Select from '../common/Select'; // Assuming a common Select component

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

const FilterPanel = ({ onClose, onApply, onClear, categories = [], locations = [], initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    location: initialFilters.location || '',
    status: initialFilters.status || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFilters({ category: '', location: '', status: '' });
    onClear();
  };

  return (
    <PanelOverlay onClick={onClose}>
      <PanelContent onClick={e => e.stopPropagation()}>
        <PanelHeader>
          <PanelTitle>Filter Inventory</PanelTitle>
          <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
        </PanelHeader>
        <PanelBody>
          <FormGroup>
            <Label htmlFor="status">Stock Status</Label>
            <Select name="status" id="status" value={filters.status} onChange={handleChange}>
              <option value="">All Statuses</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="category">Category</Label>
            <Select name="category" id="category" value={filters.category} onChange={handleChange}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="location">Location</Label>
            <Select name="location" id="location" value={filters.location} onChange={handleChange}>
              <option value="">All Locations</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </Select>
          </FormGroup>
        </PanelBody>
        <PanelFooter>
          <Button variant="secondary" onClick={handleClear} fullWidth>Clear Filters</Button>
          <Button variant="primary" onClick={() => onApply(filters)} fullWidth>Apply Filters</Button>
        </PanelFooter>
      </PanelContent>
    </PanelOverlay>
  );
};

export default FilterPanel;