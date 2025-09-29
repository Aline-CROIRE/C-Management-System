// src/pages/modules/IMS.js
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes, ThemeProvider } from "styled-components";
import {
  FaBoxes, FaPlus, FaSearch, FaFilter, FaDownload, FaExclamationTriangle, FaFileCsv, FaFileCode,
  FaChartLine, FaTruck, FaUsers, FaDollarSign, FaSync, FaTimes, FaFileInvoiceDollar, FaUndo, FaBell,
  FaMoneyBillWave, FaBalanceScale, FaHandshake, FaUserTie, FaClipboardList, FaArrowDown, FaExchangeAlt,
  FaLeaf // Import FaLeaf for Circular Economy
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
// Corrected report paths below:
import ReportsAnalytics from "../../components/reports/ReportsAnalytics"; 
import NotificationPanel from "../../components/inventory/NotificationPanel";

import ExpenseManagement from "../../components/expenses/ExpenseManagement"; 
import RecordMultiInternalUseModal from "../../components/inventory/RecordMultiInternalUseModal";
import InternalUseHistory from "../../components/inventory/InternalUseHistory";
import StockAdjustmentModal from "../../components/inventory/StockAdjustmentModal";
import StockAdjustmentHistory from "../../components/inventory/StockAdjustmentHistory"; 

// NEW Imports for Advanced Features
import CircularEconomyReport from "../../components/reports/CircularEconomyReport"; 
import DailyStockReport from "../../components/reports/DailyStockReport"; 
import ProfitLossReport from "../../components/reports/ProfitLossReport"; 
import ReportsPage from "../../components/reports/ReportsPage"; 


import { useInventory } from "../../hooks/useInventory";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useCustomers } from "../../hooks/useCustomers";
import { useNotifications } from "../../contexts/NotificationContext"; 
import { useDebounce } from "../../hooks/useDebounce";
import { inventoryAPI } from "../../services/api";
import { useInternalUse } from "../../hooks/useInternalUse";
import { useStockAdjustments } from "../../hooks/useStockAdjustments"; 
import appTheme from "../../styles/Theme"

const IMSContainer = styled.div`
  padding: 1.5rem 2rem;
  background: ${(props) => props.theme.colors.background};
  min-height: 100vh;
  transition: all 0.3s ease;

  @media (max-width: 1200px) {
    padding: 1rem 1.5rem;
  }
  @media (max-width: 768px) {
    padding: 1rem;
  }
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 2.5rem;
  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;
const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding-bottom: 0.75rem;
  }
`;
const HeaderInfo = styled.div`
  flex: 1;
  min-width: 200px;
  @media (max-width: 480px) {
    min-width: unset;
  }
`;
const HeaderTitle = styled.h1`
  font-size: 2.2rem;
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
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0.5rem 0 0 0;
  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
`;
const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch;
    button {
      flex-grow: 1;
    }
  }
`;
const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textSecondary};
  padding: 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s ease-in-out;
  &:hover { 
    background: ${(props) => props.theme.colors.surfaceLight}; 
    color: ${(props) => props.theme.colors.text};
  }
  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background-color: ${(props) => props.theme.colors.error};
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${(props) => props.theme.colors.surface};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.25rem;
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const StatCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
  background: ${(props) => props.theme.colors.surface};

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${(props) => props.theme.shadows.md};
  }
  &.active {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.primary}30, ${(props) => props.theme.shadows.md};
    animation: ${keyframes`
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(64, 145, 108, 0.4); }
      70% { transform: scale(1.01); box-shadow: 0 0 0 8px rgba(64, 145, 108, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(64, 145, 108, 0); }
    `} 1s infinite alternate;
  }

  @media (max-width: 480px) {
    min-height: 100px;
    padding: 1.25rem;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;
const StatHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: row-reverse;
    align-items: center;
    flex-grow: 1;
    justify-content: flex-end;
    gap: 1rem;
    margin-bottom: 0;
  }
`;
const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  background: ${(props) => props.iconColor};
  box-shadow: ${(props) => props.theme.shadows.sm};

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
`;
const StatContent = styled.div`
  text-align: left;
`;
const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
  white-space: nowrap;

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
  font-size: 0.8rem;
  text-transform: uppercase;
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    margin-top: 0;
  }
`;
const StatFooter = styled.div`
  font-size: 0.85rem;
  color: ${(props) => props.theme.colors.textLight};
  margin-top: 0.75rem;

  @media (max-width: 480px) {
    display: none;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-top: 2rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
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
  gap: 0.75rem;
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
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 480px) {
    padding: 0.25rem;
    border-radius: ${(props) => props.theme.borderRadius.md};
    margin-bottom: 1rem;
  }
`;
const Tab = styled.button`
  flex: 1;
  min-width: 130px;
  padding: 0.85rem 1.2rem;
  border: none;
  background: ${(props) => (props.active ? props.theme.colors.primary : "transparent")};
  color: ${(props) => (props.active ? "white" : props.theme.colors.textSecondary)};
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  white-space: nowrap;
  &:hover:not(:disabled):not(.active) {
    background: ${(props) => props.theme.colors.surfaceLight};
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
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  box-shadow: ${(props) => props.theme.shadows.lg};
  border: 1px solid ${(props) => props.theme.colors.border};
  overflow: hidden;

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
  background-color: ${(props) => props.theme.colors.info}10;
  color: ${(props) => props.theme.colors.info};
  border: 1px solid ${(props) => props.theme.colors.info}30;
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
        stockAdjustment: false,
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
    const { totalImpactStats: stockAdjustmentSummary } = useStockAdjustments({}); 

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
        stockAdjustment: false,
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

    const handleRecordStockAdjustment = (item = null) => {
        setSelectedItem(item);
        handleModal('stockAdjustment');
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
                            onAdjustStock={handleRecordStockAdjustment}
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
                        setOpenModalInitially={setOpenExpenseModalOnTabLoad} 
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
            case "stock-adjustment-history": 
                return (
                    <StockAdjustmentHistory
                        onAction={refreshData} 
                        openModalInitially={isModalOpen.stockAdjustment} 
                        setOpenModalInitially={() => setIsModalOpen(prev => ({...prev, stockAdjustment: false}))}
                    />
                );
            case "reports": 
                return <ReportsPage setActiveTab={setActiveTab} />; 
            case "circular-economy": 
                return <CircularEconomyReport />;
            case "daily-stock-report": 
                return <DailyStockReport inventoryItems={inventory} />;
            case "profit-loss": 
                return <ProfitLossReport />;
            default: return null;
        }
    };

    if (inventoryError) return <IMSContainer>Error: {inventoryError}. <Button onClick={refreshData}>Retry</Button></IMSContainer>;

    return (
        <ThemeProvider theme={appTheme}> {/* Corrected: Use 'appTheme' here */}
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
                    <StatCard className={activeTab === 'stock-adjustment-history' ? 'active' : ''} onClick={() => setActiveTab('stock-adjustment-history')}>
                        <StatHeader>
                            <StatContent><StatValue>{formatCurrency(stockAdjustmentSummary.totalCostImpact)}</StatValue><StatLabel>Total Cost Adjusted</StatLabel></StatContent>
                            <StatIcon iconColor="#ed8936"><FaExchangeAlt /></StatIcon>
                        </StatHeader>
                        <StatFooter>Loss due to damage, expiry, etc.</StatFooter>
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
                    <Button variant="danger" onClick={() => handleRecordStockAdjustment()}><FaExchangeAlt /> Adjust Stock</Button>
                </ActionButtons>
            </ActionBar>

            <TabContainer>
                <Tab active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}><FaBoxes /> Inventory</Tab>
                <Tab active={activeTab === "purchase-orders"} onClick={() => setActiveTab("purchase-orders")}><FaTruck /> Purchase Orders</Tab>
                <Tab active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")}><FaUsers /> Suppliers</Tab>
                <Tab active={activeTab === "sales"} onClick={() => setActiveTab("sales")}><FaFileInvoiceDollar /> Sales</Tab>
                <Tab active={activeTab === "expenses"} onClick={() => setActiveTab("expenses")}><FaMoneyBillWave /> Expenses</Tab>
                <Tab active={activeTab === "internal-use-history"} onClick={() => setActiveTab("internal-use-history")}><FaClipboardList /> Internal Use History</Tab>
                <Tab active={activeTab === "stock-adjustment-history"} onClick={() => setActiveTab("stock-adjustment-history")}><FaExchangeAlt /> Stock Adjustment History</Tab>
                <Tab active={activeTab === "reports"} onClick={() => setActiveTab("reports")}><FaChartLine /> Reports</Tab>
                <Tab active={activeTab === "circular-economy"} onClick={() => setActiveTab("circular-economy")}><FaLeaf /> Circular Economy</Tab>
                <Tab active={activeTab === "daily-stock-report"} onClick={() => setActiveTab("daily-stock-report")}><FaBoxes /> Daily Stock</Tab>
                <Tab active={activeTab === "profit-loss"} onClick={() => setActiveTab("profit-loss")}><FaBalanceScale /> P&L</Tab>
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
                    setOpenModalInitially={setOpenExpenseModalOnTabLoad} 
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

            {isModalOpen.stockAdjustment && (
                <StockAdjustmentModal 
                    item={selectedItem}
                    inventoryItems={inventory}
                    onClose={closeAllModals} 
                    onSave={refreshData}
                    loading={inventoryLoading}
                />
            )}
        </IMSContainer>
        </ThemeProvider>
  
    );
};

export default IMS;