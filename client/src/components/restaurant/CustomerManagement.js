// client/src/components/restaurant/CustomerManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { default as styled, keyframes, css } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUser, FaSync, FaEnvelope, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

import CustomerModal from './modals/CustomerModal'; // Make sure this import path is correct

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};

  @media (max-width: 768px) {
    margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  }
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
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

const ActionButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  flex-wrap: wrap;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch;
    button {
      flex-grow: 1;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  }
`;

const CustomerManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const CustomerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const CustomerCard = styled(Card)`
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

  .customer-icon {
    font-size: 2.5rem;
    color: ${(props) => props.theme.colors?.info};
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
  .loyalty {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${(props) => props.theme.colors?.success};
    margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
  .last-order {
    font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
    color: ${(props) => props.theme.colors?.textLight};
    margin-top: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    display: flex;
    align-items: center;
    gap: 0.4rem;
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

const CustomerManagement = ({ restaurantId }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); // This will hold the customer object if we are editing
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await restaurantAPI.getRestaurantCustomers(restaurantId, { search: debouncedSearchQuery });
      if (response?.success) {
        setCustomers(response.data);
      } else {
        setError(response?.message || 'Failed to fetch customers.');
        toast.error(response?.message || 'Failed to fetch customers.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching customers.');
      toast.error(err.message || 'An error occurred fetching customers.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, debouncedSearchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handler to open the modal, optionally with a customer object for editing
  const handleOpenModal = (customer = null) => {
    setEditingCustomer(customer); // Set the customer to be edited
    setIsModalOpen(true);        // Open the modal
  };

  // Handler to close the modal
  const handleCloseModal = () => {
    setEditingCustomer(null);    // Clear the editing customer state
    setIsModalOpen(false);       // Close the modal
  };

  // Handler to save a customer (create new or update existing)
  const handleSaveCustomer = async (customerData) => {
    // A slight improvement to handle loading state for the modal's save button
    // The modal already handles its own `submitting` state, so this is just for clarity.
    // For `CustomerManagement`, we just care about refreshing data after save.
    try {
      if (editingCustomer) {
        // If editingCustomer exists, we are updating an existing customer
        await restaurantAPI.updateRestaurantCustomer(restaurantId, editingCustomer._id, customerData);
        toast.success('Customer updated successfully!');
      } else {
        // Otherwise, we are creating a new customer
        await restaurantAPI.createRestaurantCustomer(restaurantId, customerData);
        toast.success('Customer added successfully!');
      }
      fetchCustomers();       // Refresh the list of customers
      handleCloseModal();     // Close the modal after successful save
    } catch (err) {
      // It's good that CustomerModal has its own `submitting` state.
      // We can just rely on the toast for feedback here.
      toast.error(err.message || 'Failed to save customer.');
      // Important: if the modal has its own `submitting` state, ensure `onSave` in the modal handles errors
      // to reset its own submitting state. (Your CustomerModal already does this implicitly by `setSubmitting(false)`).
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await restaurantAPI.deleteRestaurantCustomer(restaurantId, customerId);
        toast.success('Customer deleted successfully!');
        fetchCustomers();
      } catch (err) {
        toast.error(err.message || 'Failed to delete customer.');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <CustomerManagementContainer>
      <ActionBar>
        <h3>Restaurant Customers</h3>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <ActionButtons>
            <Button variant="outline" onClick={fetchCustomers} disabled={loading}><SpinningFaSync /> Refresh</Button>
            {/* Button to open the modal for adding a new customer */}
            <Button onClick={() => handleOpenModal()}><FaPlus /> Add New Customer</Button>
        </ActionButtons>
      </ActionBar>

      <CustomerGrid>
        {customers.length > 0 ? (
          customers.map((customer) => (
            <CustomerCard key={customer._id}>
              <FaUser className="customer-icon" />
              <h4>{customer.firstName} {customer.lastName}</h4>
              {customer.email && <p><FaEnvelope /> {customer.email}</p>}
              {customer.phone && <p><FaPhone /> {customer.phone}</p>}
              {customer.dietaryRestrictions?.length > 0 && <p>Dietary: {customer.dietaryRestrictions.join(', ')}</p>}
              <p className="loyalty">Loyalty Points: {customer.loyaltyPoints}</p>
              {customer.lastOrderAt && <p className="last-order"><FaCalendarAlt /> Last Order: {new Date(customer.lastOrderAt).toLocaleDateString()}</p>}
              <div className="actions">
                {/* Button to open the modal for editing an existing customer */}
                <Button variant="secondary" size="sm" onClick={() => handleOpenModal(customer)}><FaEdit /></Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteCustomer(customer._id)}><FaTrash /></Button>
              </div>
            </CustomerCard>
          ))
        ) : (
          <p>No customers found. Add some or adjust your search.</p>
        )}
      </CustomerGrid>

      {/* Conditional rendering of CustomerModal */}
      {isModalOpen && (
        <CustomerModal
          restaurantId={restaurantId}        // Pass the restaurant ID
          customerToEdit={editingCustomer}   // Pass the customer object for editing (null for new customer)
          onClose={handleCloseModal}         // Callback to close the modal
          onSave={handleSaveCustomer}        // Callback to handle saving customer data
        />
      )}
    </CustomerManagementContainer>
  );
};

export default CustomerManagement;