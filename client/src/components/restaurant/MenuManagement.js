// client/src/components/restaurant/MenuManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaFilter, FaSearch, FaSync } from 'react-icons/fa';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

import MenuItemModal from './modals/MenuItemModal';

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

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

// NEW: Styled component for the status badge
const StatusBadge = styled.span`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: ${props => props.$isActive ? props.theme.colors?.successLight : props.theme.colors?.dangerLight};
  color: ${props => props.$isActive ? props.theme.colors?.successDark : props.theme.colors?.dangerDark};
  padding: 0.25rem 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius?.sm};
  font-size: 0.75rem;
  font-weight: 600;
`;

const MenuItemCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.theme.colors?.primary || '#1b4332'}; /* Consistent top border */
  }

  img {
    max-width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
  h4 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    color: ${(props) => props.theme.colors?.heading};
  }
  p {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#666"};
    flex-grow: 1;
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
  .price {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
    color: ${(props) => props.theme.colors?.primary || "#1b4332"};
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
  }
  /* Remove old status-badge styling here */
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;

const MenuManagement = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterActiveStatus, setFilterActiveStatus] = useState('');

  const uniqueCategories = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    const categories = menuItems.map(item => item.category);
    return [...new Set(categories)].filter(Boolean);
  }, [menuItems]);


  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        category: selectedCategory,
        search: debouncedSearchQuery,
        isActive: filterActiveStatus === 'active' ? true : (filterActiveStatus === 'inactive' ? false : undefined),
      };
      const response = await restaurantAPI.getMenuItems(restaurantId, params);
      if (response?.success) {
        setMenuItems(response.data);
      } else {
        setError(response?.message || 'Failed to fetch menu items.');
        toast.error(response?.message || 'Failed to fetch menu items.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching menu items.');
      toast.error(err.message || 'An error occurred fetching menu items.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, selectedCategory, debouncedSearchQuery, filterActiveStatus]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSaveMenuItem = async (itemData) => {
    try {
      if (!itemData.name || !itemData.price || itemData.price <= 0) {
        toast.error('Please provide valid item name and price.');
        return;
      }

      if (editingItem) {
        await restaurantAPI.updateMenuItem(restaurantId, editingItem._id, itemData);
        toast.success('Menu item updated successfully!');
      } else {
        await restaurantAPI.createMenuItem(restaurantId, itemData);
        toast.success('Menu item added successfully!');
      }
      fetchMenuItems();
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save menu item.');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      try {
        await restaurantAPI.deleteMenuItem(restaurantId, itemId);
        toast.success('Menu item deleted successfully!');
        fetchMenuItems();
      } catch (err) {
        toast.error(err.message || 'Failed to delete menu item.');
      }
    }
  };

  const handleToggleItemStatus = async (itemId, currentStatus) => {
    try {
      await restaurantAPI.updateMenuItem(restaurantId, itemId, { isActive: !currentStatus });
      toast.success(`Menu item ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchMenuItems();
    } catch (err) {
      toast.error(err.message || 'Failed to update item status.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <MenuContainer>
      <ActionBar>
        <h3>Menu Items</h3>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search menu by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <ActionButtons>
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white'}}
            >
                <option value="">All Categories</option>
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
                value={filterActiveStatus}
                onChange={(e) => setFilterActiveStatus(e.target.value)}
                style={{padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white'}}
            >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" onClick={fetchMenuItems} disabled={loading}><SpinningFaSync /> Refresh</Button>
            <Button onClick={() => handleOpenModal()}><FaPlus /> Add New Item</Button>
        </ActionButtons>
      </ActionBar>

      <MenuGrid>
        {menuItems.length > 0 ? (
          menuItems.map((item) => (
            <MenuItemCard key={item._id}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <div className="price">${item.price.toFixed(2)}</div>
              <StatusBadge $isActive={item.isActive}> {/* Use the new StatusBadge component */}
                {item.isActive ? 'Active' : 'Inactive'}
              </StatusBadge>
              <div className="actions">
                <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)}><FaEdit /></Button>
                <Button variant={item.isActive ? "success" : "warning"} size="sm" onClick={() => handleToggleItemStatus(item._id, item.isActive)}>
                  {item.isActive ? '✓ Active' : '✗ Inactive'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteMenuItem(item._id)}><FaTrash /></Button>
              </div>
            </MenuItemCard>
          ))
        ) : (
          <p>No menu items available. Add some to get started!</p>
        )}
      </MenuGrid>

      {isModalOpen && (
        <MenuItemModal
          restaurantId={restaurantId}
          itemToEdit={editingItem}
          onClose={handleCloseModal}
          onSave={handleSaveMenuItem}
        />
      )}
    </MenuContainer>
  );
};

export default MenuManagement;