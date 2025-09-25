"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import {
  FaBoxes, FaPlus, FaSearch, FaFilter, FaDownload, FaExclamationTriangle, FaFileCsv, FaFileCode,
  FaChartLine, FaTruck, FaUsers, FaDollarSign, FaSync, FaTimes, FaFileInvoiceDollar, FaUndo, FaBell,
  FaMoneyBillWave, FaBalanceScale, FaHandshake, FaUserTie, FaClipboardList, FaArrowDown, FaExchangeAlt // FaExchangeAlt is unused in current code, but kept if user plans to use
} from "react-icons/fa";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import InventoryTable from "../../components/inventory/InventoryTable";
import AddItemModal from "../../components/inventory/AddItemModal";
import ViewItemModal from "../../components/inventory/ViewItemModal";
import FilterPanel from "../../components/inventory/FilterPanel";
import PurchaseOrders from "../../components/inventory/PurchaseOrders";
import SupplierManagement from "../../components/inventory/SupplierManagement";
import Sales from "../../components/sales/Sales";
import ReportsAnalytics from "../../components/inventory/ReportsAnalytics";
import NotificationPanel from "../../components/inventory/NotificationPanel";

import ExpenseManagement from "../../components/expenses/ExpenseManagement";
import RecordMultiInternalUseModal from "../../components/inventory/RecordMultiInternalUseModal";
import InternalUseHistory from "../../components/inventory/InternalUseHistory";

import { useInventory } from "../../hooks/useInventory";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useCustomers } from "../../hooks/useCustomers";
import { useNotifications } from "../../contexts/NotificationContext";
import { useDebounce } from "../../hooks/useDebounce";
import { inventoryAPI } from "../../services/api";
import { useInternalUse } from "../../hooks/useInternalUse";


// Keyframes for subtle animations
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(64, 145, 108, 0.4); }
  70% { transform: scale(1.01); box-shadow: 0 0 0 8px rgba(64, 145, 108, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(64, 145, 108, 0); }
`;

const IMSContainer = styled.div`
  padding: 1.5rem 2rem; /* Desktop default */
  background: ${(props) => props.theme.colors.background}; /* Use theme background */
  min-height: 100vh;
  transition: all 0.3s ease; /* Smooth transitions for theme changes / padding */

  @media (max-width: 1200px) { /* Larger tablets/small laptops */
    padding: 1rem 1.5rem;
  }
  @media (max-width: 768px) { /* Tablets */
    padding: 1rem;
  }
  @media (max-width: 480px) { /* Mobile phones */
    padding: 0.75rem; /* Slightly reduced for small screens */
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 2.5rem; /* Increased spacing */
  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;
const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Align to top for multi-line titles */
  flex-wrap: wrap;
  gap: 1.5rem; /* Spacing between blocks */
  padding-bottom: 1rem; /* Space below header content */
  border-bottom: 1px solid ${(props) => props.theme.colors.border}; /* Subtle separator */

  @media (max-width: 480px) {
    flex-direction: column; /* Stack vertically on small mobile */
    align-items: stretch; /* Stretch items to full width */
    gap: 1rem;
    padding-bottom: 0.75rem;
  }
`;
const HeaderInfo = styled.div`
  flex: 1; /* Allow to take available space */
  min-width: 200px; /* Ensure title has space */
  @media (max-width: 480px) {
    min-width: unset; /* Remove min-width to allow full stretch */
  }
`;
const HeaderTitle = styled.h1`
  font-size: 2.2rem; /* Slightly larger */
  font-weight: 700;
  margin: 0;
  color: ${(props) => props.theme.colors.heading};
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;
const HeaderSubtitle = styled.p`
  font-size: 0.95rem; /* Slightly smaller for balance */
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0.5rem 0 0 0; /* More space below title */
  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
`;
const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem; /* Reduced gap for more compact layout */
  align-items: center;
  flex-wrap: wrap; /* Allow wrapping if many buttons */

  @media (max-width: 480px) {
    width: 100%; /* Take full width */
    justify-content: stretch; /* Stretch buttons if they wrap */
    button {
      flex-grow: 1; /* Allow buttons to expand */
    }
  }
`;
const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textSecondary}; /* Use theme color */
  padding: 0.5rem; /* Make clickable area larger */
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s ease-in-out;
  &:hover { 
    background: ${(props) => props.theme.colors.surfaceLight}; 
    color: ${(props) => props.theme.colors.text};
  }
  .badge {
    position: absolute;
    top: -4px; /* Adjusted position */
    right: -4px; /* Adjusted position */
    background-color: ${(props) => props.theme.colors.error}; /* Theme error color */
    color: white;
    border-radius: 50%;
    width: 20px; /* Slightly smaller badge */
    height: 20px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${(props) => props.theme.colors.surface}; /* Theme surface color for border */
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Adjusted min-width for more columns */
  gap: 1.5rem; /* Consistent gap */
  margin-top: 2rem;

  @media (max-width: 1024px) { /* Smaller desktops/large tablets */
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.25rem;
  }
  @media (max-width: 768px) { /* Tablets */
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }
  @media (max-width: 480px) { /* Mobile phones */
    grid-template-columns: 1fr; /* Stack on very small screens */
    gap: 0.75rem;
  }
`;

const StatCard = styled(Card)`
  padding: 1.5rem; /* Increased padding */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px; /* Taller cards */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 1px solid ${(props) => props.theme.colors.border}; /* Theme border */
  border-radius: ${(props) => props.theme.borderRadius.lg}; /* Larger border radius */
  box-shadow: ${(props) => props.theme.shadows.sm}; /* Subtle shadow */
  background: ${(props) => props.theme.colors.surface}; /* Theme surface background */

  &:hover {
    transform: translateY(-5px); /* More pronounced lift */
    box-shadow: ${(props) => props.theme.shadows.md}; /* Larger shadow on hover */
  }
  &.active {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.primary}30, ${(props) => props.theme.shadows.md}; /* Primary ring and larger shadow */
    animation: ${pulse} 1s infinite alternate; /* Subtle pulse for active card */
  }

  @media (max-width: 480px) {
    min-height: 100px;
    padding: 1.25rem;
    flex-direction: row; /* Horizontal layout on mobile */
    align-items: center;
    justify-content: space-between;
  }
`;
const StatHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem; /* Space between header and footer */

  @media (max-width: 480px) {
    flex-direction: row-reverse; /* Icon to the right */
    align-items: center;
    flex-grow: 1;
    justify-content: flex-end;
    gap: 1rem;
    margin-bottom: 0; /* No margin-bottom on mobile row layout */
  }
`;
const StatIcon = styled.div`
  width: 48px; /* Larger icon */
  height: 48px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px; /* Larger icon font */
  background: ${(props) => props.iconColor};
  box-shadow: ${(props) => props.theme.shadows.sm}; /* Subtle shadow for icon */

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
`;
const StatContent = styled.div`
  text-align: left;
  /* Allow text to wrap naturally */
`;
const StatValue = styled.div`
  font-size: 1.8rem; /* Larger value font */
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
  white-space: nowrap; /* Prevent value from wrapping */

  &.debt-color {
    color: ${(props) => props.theme.colors.error};
  }
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
  @media (max-width: 480px) {
    font-size: 1.3rem;
  }
`;
const StatLabel = styled.div`
  font-size: 0.8rem; /* Consistent smaller label */
  text-transform: uppercase;
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 0.25rem; /* Space between value and label */

  @media (max-width: 480px) {
    font-size: 0.7rem;
    margin-top: 0;
  }
`;
const StatFooter = styled.div`
  font-size: 0.85rem; /* Slightly larger footer text */
  color: ${(props) => props.theme.colors.textLight}; /* Lighter text for footer */
  margin-top: 0.75rem;

  @media (max-width: 480px) {
    display: none; /* Hide footer on very small screens to save space */
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem; /* More spacing */
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem; /* Consistent gap */

  @media (max-width: 768px) {
    margin-top: 2rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 480px) {
    flex-direction: column; /* Stack vertically on mobile */
    align-items: stretch;
    gap: 0.75rem;
  }
`;
const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px; /* Minimum width for search bar */
  max-width: 450px; /* Max width for larger screens */

  @media (max-width: 480px) {
    min-width: unset;
    max-width: unset;
    width: 100%; /* Take full width on mobile */
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
  padding-left: 3rem; /* More space for icon */
  border-radius: ${(props) => props.theme.borderRadius.lg}; /* Larger border radius */
  border: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: 480px) {
    padding: 0.85rem 1rem; /* Slightly larger padding */
    padding-left: 2.85rem;
  }
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem; /* Reduced gap */
  flex-wrap: wrap; /* Allow buttons to wrap */

  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch;
    button {
      flex-grow: 1; /* Stretch buttons to fill width */
      padding: 0.75rem; /* Consistent padding */
      font-size: 0.9rem; /* Slightly smaller font for mobile buttons */
    }
  }
`;
const DropdownMenu = styled.div`
  position: absolute;
  top: 110%;
  right: 0;
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.md};
  box-shadow: ${(props) => props.theme.shadows.md};
  border: 1px solid ${(props) => props.theme.colors.border};
  z-index: 100;
  overflow: hidden;
  animation: ${keyframes`from{opacity:0; transform: translateY(-10px)} to{opacity:1; transform: translateY(0)}`} 0.2s ease;
`;
const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: ${(props) => props.theme.colors.text};
  text-align: left;
  cursor: pointer;
  &:hover { background: ${(props) => props.theme.colors.surfaceLight}; }
`;
const TabContainer = styled.div`
  display: flex;
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  overflow-x: auto; /* Allow horizontal scrolling for many tabs */
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 480px) {
    padding: 0.25rem;
    border-radius: ${(props) => props.theme.borderRadius.md};
    margin-bottom: 1rem;
  }
`;
const Tab = styled.button`
  flex: 1; /* Allow tabs to grow */
  min-width: 130px; /* Minimum width for each tab */
  padding: 0.85rem 1.2rem; /* Slightly larger padding */
  border: none;
  background: ${(props) => (props.active ? props.theme.colors.primary : "transparent")};
  color: ${(props) => (props.active ? "white" : props.theme.colors.textSecondary)};
  border-radius: ${(props) => props.theme.borderRadius.md}; /* Rounded corners for active tab */
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  white-space: nowrap;
  &:hover:not(:disabled):not(.active) {
    background: ${(props) => props.theme.colors.surfaceLight}; /* Lighter hover background */
    color: ${(props) => props.theme.colors.text};
  }
  @media (max-width: 480px) {
    min-width: 100px;
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
    gap: 0.5rem;
  }
`;
const ContentArea = styled.div`
  min-height: 600px;
  background: ${(props) => props.theme.colors.surface}; /* Use theme surface for content area */
  border-radius: ${(props) => props.theme.borderRadius.xl};
  box-shadow: ${(props) => props.theme.shadows.lg}; /* Consistent shadow */
  border: 1px solid ${(props) => props.theme.colors.border}; /* Consistent border */
  overflow: hidden; /* Ensure child content doesn't break rounded corners */

  @media (max-width: 768px) {
    min-height: 400px;
    border-radius: ${(props) => props.theme.borderRadius.lg};
  }
`;
const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;
const FilterIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background-color: ${(props) => props.theme.colors.info}10; /* Lighter info background */
  color: ${(props) => props.theme.colors.info}; /* Info text color */
  border: 1px solid ${(props) => props.theme.colors.info}30; /* Info border */
  border-radius: ${(props) => props.theme.borderRadius.md};
  margin-bottom: 1.5rem;
  font-weight: 600;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    span {
      font-size: 0.8rem;
    }
    button {
      padding: 0.25rem 0.5rem;
    }
  }
`;

const IMS = () => {
    const [activeTab, setActiveTab] = useState("inventory");
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [isModalOpen, setIsModalOpen] = useState({ 
        add: false, edit: false, view: false, filter: false, notifications: false, export: false,
        recordExpense: false, 
        internalUseMulti: false,
    });
    const [openExpenseModalOnTabLoad, setOpenExpenseModalOnTabLoad] = useState(false); 

    const [selectedItem, setSelectedItem] = useState(null);
    const { unreadCount } = useNotifications();
    
    const {
        inventory, loading: inventoryLoading, stats, error: inventoryError,
        categories, locations, units, suppliers: inventorySuppliers, pagination, refreshData,
        updateFilters, changePage, filters = {},
        addItem, updateItem, deleteItem, createCategory, createLocation, createUnit, createSupplier,
    } = useInventory();
    
    const { suppliers: managementSuppliers, loading: suppliersLoading } = useSuppliers(); 
    const { customers, loading: customersLoading, createCustomer, refetchCustomers } = useCustomers();

    const { totalValueStats: internalUseSummary } = useInternalUse({});

    const totalOutstandingCustomerDebt = useMemo(() => {
      return customers.reduce((sum, customer) => sum + (customer.currentBalance || 0), 0);
    }, [customers]);

    useEffect(() => {
        if (debouncedSearchQuery !== (filters.search || '')) {
            updateFilters({ search: debouncedSearchQuery });
        }
    }, [debouncedSearchQuery, filters, updateFilters]);

    const handleModal = (modal, item = null) => {
        setSelectedItem(item);
        setIsModalOpen(prev => ({...Object.fromEntries(Object.keys(prev).map(k => [k, false])), [modal]: !prev[modal]}));
    };
    const closeAllModals = () => setIsModalOpen({ 
        add: false, edit: false, view: false, filter: false, notifications: false, export: false,
        recordExpense: false,
        internalUseMulti: false,
    });

    const handleAddItem = async (payload) => {
        const success = await addItem(payload);
        if (success) closeAllModals();
    };
    const handleUpdateItem = async (payload) => {
        if (!selectedItem?._id) return;
        const success = await updateItem(selectedItem._id, payload);
        if (success) closeAllModals();
    };
    const handleDeleteItem = useCallback((itemId) => {
        if (window.confirm("Are you sure? This action cannot be undone.")) deleteItem(itemId);
    }, [deleteItem]);

    const handleApplyFilters = useCallback((appliedFilters) => {
        setActiveTab('inventory');
        updateFilters(appliedFilters);
        closeAllModals();
    }, [updateFilters]);

    const handleClearFilters = useCallback(() => {
        setSearchQuery('');
        updateFilters({});
        closeAllModals();
    }, [updateFilters]);
    
    const handleExport = async (format) => {
        try {
            await inventoryAPI.exportInventory(format, filters);
        } catch (err) { }
        setIsModalOpen(prev => ({...prev, export: false}));
    };

    const handleRecordExpense = () => {
        setActiveTab('expenses');
        setOpenExpenseModalOnTabLoad(true);
    };

    const handleRecordMultiInternalUse = () => {
        handleModal('internalUseMulti');
    };

    const activeFilterName = useMemo(() => {
        const activeFilters = Object.keys(filters).filter(key => filters[key] && !['search', 'page', 'limit'].includes(key));
        if (activeFilters.length === 0) return null;
        return activeFilters.map(key => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${filters[key]}`).join(', ');
    }, [filters]);

    const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    const formatNumber = (num) => Number(num || 0).toLocaleString();

    const renderContent = () => {
        const isDataLoading = inventoryLoading || suppliersLoading || customersLoading;
        switch (activeTab) {
            case "inventory":
                return (
                    <>
                        {activeFilterName && (
                            <FilterIndicator>
                                <span>Showing filtered results for: <strong>{activeFilterName}</strong></span>
                                <Button variant="ghost" size="sm" onClick={handleClearFilters}><FaUndo style={{marginRight: '0.5rem'}}/>Show All Items</Button>
                            </FilterIndicator>
                        )}
                        <InventoryTable 
                            data={inventory} 
                            loading={inventoryLoading} 
                            pagination={pagination} 
                            onPageChange={changePage} 
                            onEdit={(item) => handleModal('edit', item)} 
                            onDelete={handleDeleteItem} 
                            onView={(item) => handleModal('view', item)} 
                        />
                    </>
                );
            case "purchase-orders":
                return <PurchaseOrders 
                          inventoryData={inventory} 
                          suppliersData={inventorySuppliers} 
                          categoriesData={categories} 
                          isDataLoading={isDataLoading} 
                          createSupplier={createSupplier} 
                          createCategory={createCategory} 
                          onAction={refreshData} 
                        />;
            case "sales":
                return <Sales inventoryData={inventory} isDataLoading={isDataLoading} onAction={() => { refreshData(); refetchCustomers(); }} />;
            case "suppliers":
                return <SupplierManagement />;
            case "expenses":
                return (
                    <ExpenseManagement 
                        onAction={refreshData} 
                        openModalInitially={isModalOpen.recordExpense} 
                        setOpenModalInitially={() => setIsModalOpen(prev => ({...prev, recordExpense: false}))}
                    />
                );
            case "internal-use-history":
                return (
                    <InternalUseHistory
                        onAction={refreshData}
                        openModalInitially={isModalOpen.internalUseMulti} 
                        setOpenModalInitially={() => setIsModalOpen(prev => ({...prev, internalUseMulti: false}))}
                    />
                );
            case "reports":
                return <ReportsAnalytics />;
            default: return null;
        }
    };

    if (inventoryError) return <IMSContainer>Error: {inventoryError}. <Button onClick={refreshData}>Retry</Button></IMSContainer>;

    return (
        <IMSContainer>
            <HeaderSection>
                <HeaderContent>
                    <HeaderInfo><HeaderTitle>Inventory Management System</HeaderTitle><HeaderSubtitle>Welcome! Here is your operational overview.</HeaderSubtitle></HeaderInfo>
                    <HeaderActions>
                        <NotificationBadge onClick={() => handleModal('notifications')}>
                            <FaBell size={24} />
                            {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                        </NotificationBadge>
                        <Button variant="outline" onClick={refreshData} disabled={inventoryLoading}>
                            {inventoryLoading ? <SpinningFaSync /> : <FaSync />} 
                            {inventoryLoading ? 'Syncing...' : 'Sync Data'}
                        </Button>
                    </HeaderActions>
                </HeaderContent>

                <StatsGrid>
                    <StatCard className={activeTab === 'inventory' && !activeFilterName ? 'active' : ''} onClick={() => { setActiveTab('inventory'); handleClearFilters(); }}>
                        <StatHeader>
                            <StatContent><StatValue>{formatNumber(stats.totalItems)}</StatValue><StatLabel>Total Unique Items</StatLabel></StatContent>
                            <StatIcon iconColor="#3182ce"><FaBoxes /></StatIcon>
                        </StatHeader>
                        <StatFooter>All products in system</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'inventory' && (filters.status === 'in-stock' || !activeFilterName) ? 'active' : ''} onClick={() => { setActiveTab('inventory'); handleApplyFilters({ status: 'in-stock' }); }}>
                        <StatHeader>
                            <StatContent><StatValue>{formatCurrency(stats.totalValue)}</StatValue><StatLabel>Retail Stock Value</StatLabel></StatContent>
                            <StatIcon iconColor="#38A169"><FaMoneyBillWave /></StatIcon>
                        </StatHeader>
                        <StatFooter>Potential revenue from current stock</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'inventory' && (filters.status === 'in-stock' || !activeFilterName) ? 'active' : ''} onClick={() => { setActiveTab('inventory'); handleApplyFilters({ status: 'in-stock' }); }}>
                        <StatHeader>
                            <StatContent><StatValue>{formatCurrency(stats.totalCostValue)}</StatValue><StatLabel>Cost Stock Value</StatLabel></StatContent>
                            <StatIcon iconColor="#D69E2E"><FaBalanceScale /></StatIcon>
                        </StatHeader>
                        <StatFooter>Total cost of current stock</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'inventory' && filters.status === 'low-stock' ? 'active' : ''} onClick={() => { setActiveTab('inventory'); handleApplyFilters({ status: 'low-stock' }); }}>
                        <StatHeader>
                            <StatContent><StatValue>{formatNumber(stats.lowStockCount)}</StatValue><StatLabel>Items Low on Stock</StatLabel></StatContent>
                            <StatIcon iconColor="#dd6b20"><FaExclamationTriangle /></StatIcon>
                        </StatHeader>
                        <StatFooter>Requires urgent attention</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'inventory' && filters.status === 'out-of-stock' ? 'active' : ''} onClick={() => { setActiveTab('inventory'); handleApplyFilters({ status: 'out-of-stock' }); }}>
                        <StatHeader>
                            <StatContent><StatValue>{formatNumber(stats.outOfStockCount)}</StatValue><StatLabel>Items Out of Stock</StatLabel></StatContent>
                            <StatIcon iconColor="#c53030"><FaTimes /></StatIcon>
                        </StatHeader>
                        <StatFooter>Lost sales opportunity</StatFooter>
                    </StatCard>
                     <StatCard className={activeTab === 'inventory' && filters.status === 'on-order' ? 'active' : ''} onClick={() => { setActiveTab('inventory'); handleApplyFilters({ status: 'on-order' }); }}>
                        <StatHeader>
                            <StatContent><StatValue>{formatNumber(stats.onOrderCount)}</StatValue><StatLabel>Items On Order</StatLabel></StatContent>
                            <StatIcon iconColor="#805ad5"><FaTruck /></StatIcon>
                        </StatHeader>
                        <StatFooter>Incoming shipments</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'suppliers' ? 'active' : ''} onClick={() => setActiveTab('suppliers')}>
                        <StatHeader>
                            <StatContent><StatValue>{formatNumber(managementSuppliers.length)}</StatValue><StatLabel>Total Suppliers</StatLabel></StatContent>
                            <StatIcon iconColor="#319795"><FaHandshake /></StatIcon>
                        </StatHeader>
                        <StatFooter>Partners in procurement</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>
                        <StatHeader>
                            <StatContent><StatValue>{formatNumber(customers.length)}</StatValue><StatLabel>Total Customers</StatLabel></StatContent>
                            <StatIcon iconColor="#4299e1"><FaUserTie /></StatIcon>
                        </StatHeader>
                        <StatFooter>Your valuable clients</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'sales' ? 'active' : ''} onClick={() => { setActiveTab('sales'); }}>
                        <StatHeader>
                            <StatContent><StatValue className="debt-color">{formatCurrency(totalOutstandingCustomerDebt)}</StatValue><StatLabel>Total Customer Debt</StatLabel></StatContent>
                            <StatIcon iconColor="#c53030"><FaDollarSign /></StatIcon>
                        </StatHeader>
                        <StatFooter>Across all customer accounts</StatFooter>
                    </StatCard>
                    <StatCard className={activeTab === 'internal-use-history' ? 'active' : ''} onClick={() => setActiveTab('internal-use-history')}>
                        <StatHeader>
                            <StatContent><StatValue>{formatCurrency(internalUseSummary.totalValue)}</StatValue><StatLabel>Total Value Used (Internal)</StatLabel></StatContent>
                            <StatIcon iconColor="#6c757d"><FaClipboardList /></StatIcon>
                        </StatHeader>
                        <StatFooter>Items used internally by owner/staff</StatFooter>
                    </StatCard>
                </StatsGrid>
            </HeaderSection>

            <ActionBar>
                <SearchContainer>
                    <SearchIcon><FaSearch /></SearchIcon>
                    <SearchInput type="text" placeholder="Search products by name or SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </SearchContainer>
                <ActionButtons>
                    <Button variant="secondary" onClick={() => handleModal('filter')}><FaFilter /> Filter</Button>
                    <div style={{position: 'relative'}}>
                        <Button variant="outline" onClick={() => setIsModalOpen(prev => ({...prev, export: !prev.export}))}><FaDownload /> Export</Button>
                        {isModalOpen.export && (
                            <DropdownMenu onMouseLeave={() => setIsModalOpen(prev => ({...prev, export: false}))}>
                                <DropdownItem onClick={() => handleExport('csv')}><FaFileCsv /> Export as CSV</DropdownItem>
                                <DropdownItem onClick={() => handleExport('json')}><FaFileCode /> Export as JSON</DropdownItem>
                            </DropdownMenu>
                        )}
                    </div>
                    <Button variant="primary" onClick={() => handleModal('add')}><FaPlus /> Add New Item</Button>
                    <Button variant="info" onClick={handleRecordMultiInternalUse}><FaClipboardList /> Record Internal Use</Button>
                    <Button variant="warning" onClick={handleRecordExpense}><FaMoneyBillWave /> Record Expense</Button>
                </ActionButtons>
            </ActionBar>

            <TabContainer>
                <Tab active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}><FaBoxes /> Inventory</Tab>
                <Tab active={activeTab === "purchase-orders"} onClick={() => setActiveTab("purchase-orders")}><FaTruck /> Purchase Orders</Tab>
                <Tab active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")}><FaUsers /> Suppliers</Tab>
                <Tab active={activeTab === "sales"} onClick={() => setActiveTab("sales")}><FaFileInvoiceDollar /> Sales</Tab>
                <Tab active={activeTab === "expenses"} onClick={() => setActiveTab("expenses")}><FaMoneyBillWave /> Expenses</Tab>
                <Tab active={activeTab === "internal-use-history"} onClick={() => setActiveTab("internal-use-history")}><FaClipboardList /> Internal Use History</Tab>
                <Tab active={activeTab === "reports"} onClick={() => setActiveTab("reports")}><FaChartLine /> Reports</Tab>
            </TabContainer>
            <ContentArea>{renderContent()}</ContentArea>

            {isModalOpen.add && <AddItemModal onClose={closeAllModals} onSave={handleAddItem} categories={categories} locations={locations} units={units} suppliers={inventorySuppliers} createCategory={createCategory} createLocation={createLocation} createUnit={createUnit} createSupplier={createSupplier} loading={inventoryLoading || suppliersLoading} />}
            {isModalOpen.edit && selectedItem && <AddItemModal itemToEdit={selectedItem} onClose={closeAllModals} onSave={(payload) => handleUpdateItem(payload)} categories={categories} locations={locations} units={units} suppliers={inventorySuppliers} createCategory={createCategory} createLocation={createLocation} createUnit={createUnit} createSupplier={createSupplier} loading={inventoryLoading || suppliersLoading} />}
            {isModalOpen.view && selectedItem && <ViewItemModal item={selectedItem} onClose={closeAllModals} />}
            {isModalOpen.filter && <FilterPanel onClose={closeAllModals} onApply={handleApplyFilters} onClear={handleClearFilters} categories={categories} locations={locations} initialFilters={filters} />}
            {isModalOpen.notifications && <NotificationPanel onClose={closeAllModals} />}
            
            {isModalOpen.recordExpense && (
                <ExpenseManagement 
                    onAction={refreshData} 
                    openModalInitially={isModalOpen.recordExpense} 
                    setOpenModalInitially={() => setIsModalOpen(prev => ({...prev, recordExpense: false}))}
                />
            )}

            {isModalOpen.internalUseMulti && (
                <RecordMultiInternalUseModal 
                    inventoryItems={inventory}
                    onClose={closeAllModals} 
                    onSave={refreshData}
                    loading={inventoryLoading}
                />
            )}
        </IMSContainer>
    );
};

export default IMS;