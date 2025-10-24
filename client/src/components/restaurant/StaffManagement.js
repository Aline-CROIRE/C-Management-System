// client/src/components/restaurant/StaffManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUserTie, FaSync, FaPhone, FaEnvelope, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { staffAPI, restaurantAPI } from '../../services/api'; // staffAPI is now correctly exported
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

import StaffModal from './modals/StaffModal';

const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};

  @media (max-width: 768px) {
    margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
    flex-direction: column;
    align-items: stretch;
    gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  flex-wrap: wrap;
  align-items: center;

  select {
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors?.border};
    background: white;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 450px;

  @media (max-width: 480px) {
    min-width: unset;
    max-width: unset;
    width: 100%;
  }
`;
const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors.textSecondary};
  z-index: 2;
  pointer-events: none;
`;
const SearchInput = styled(Input)`
  padding-left: 3rem;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  border: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: 480px) {
    padding: 0.85rem 1rem;
    padding-left: 2.85rem;
  }
`;

const StaffManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const StaffCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.theme.colors?.info}; /* Consistent top border */
  }

  .staff-icon {
    font-size: 2.5rem;
    color: ${(props) => props.theme.colors?.primary};
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    align-self: center;
  }
  h4 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: 0 0 ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    color: ${(props) => props.theme.colors?.heading};
  }
  p {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#666"};
    margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .role-badge {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${(props) => props.theme.colors?.accent};
    margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    text-transform: capitalize;
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
    justify-content: flex-end;
    width: 100%;
  }
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;

const StaffManagement = ({ restaurantId }) => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterRole, setFilterRole] = useState('');

  const fetchStaffMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: filterRole, search: debouncedSearchQuery };
      const response = await staffAPI.getStaff(restaurantId, params);
      if (response?.success) {
        setStaffMembers(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch staff members.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching staff members.');
      toast.error(err.message || 'An error occurred fetching staff members.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterRole, debouncedSearchQuery]);

  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  const handleOpenModal = (staff = null) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingStaff(null);
    setIsModalOpen(false);
  };

  const handleSaveStaff = async (staffData) => {
    try {
      if (editingStaff) {
        await staffAPI.updateStaffMember(restaurantId, editingStaff._id, staffData);
        toast.success('Staff member updated successfully!');
      } else {
        await staffAPI.createStaffMember(restaurantId, staffData);
        toast.success('Staff member added successfully!');
      }
      fetchStaffMembers();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save staff member.');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      try {
        await staffAPI.deleteStaffMember(restaurantId, staffId);
        toast.success('Staff member deleted successfully!');
        fetchStaffMembers();
      } catch (err) {
        toast.error(err.message || 'Failed to delete staff member.');
      }
    }
  };

  const uniqueRoles = useMemo(() => {
    const roles = staffMembers.map(staff => staff.role);
    return [...new Set(roles)].filter(Boolean);
  }, [staffMembers]);


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <StaffManagementContainer>
      <ActionBar>
        <h3>Restaurant Staff</h3>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search staff by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <FilterGroup>
            <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white'}}
            >
                <option value="">All Roles</option>
                {uniqueRoles.map(role => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
            </select>
            <Button variant="outline" onClick={fetchStaffMembers} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Add New Staff</Button>
        </FilterGroup>
      </ActionBar>

      <StaffGrid>
        {staffMembers.length > 0 ? (
          staffMembers.map((staff) => (
            <StaffCard key={staff._id}>
              <FaUserTie className="staff-icon" />
              <h4>{staff.firstName} {staff.lastName}</h4>
              {staff.email && <p><FaEnvelope /> {staff.email}</p>}
              {staff.phone && <p><FaPhone /> {staff.phone}</p>}
              {staff.hireDate && <p><FaCalendarAlt /> Hired: {new Date(staff.hireDate).toLocaleDateString()}</p>}
              <p className="role-badge">Role: {staff.role.replace(/_/g, ' ')}</p>
              <div className="actions">
                <Button variant="secondary" size="sm" onClick={() => handleOpenModal(staff)}><FaEdit /></Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteStaff(staff._id)}><FaTrash /></Button>
              </div>
            </StaffCard>
          ))
        ) : (
          <p>No staff members found. Add some or adjust your search/filters.</p>
        )}
      </StaffGrid>

      {isModalOpen && (
        <StaffModal
          restaurantId={restaurantId}
          staffToEdit={editingStaff}
          onClose={handleCloseModal}
          onSave={handleSaveStaff}
        />
      )}
    </StaffManagementContainer>
  );
};

export default StaffManagement;