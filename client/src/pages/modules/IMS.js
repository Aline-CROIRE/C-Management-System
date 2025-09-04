"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import {
  FaBoxes, FaPlus, FaSearch, FaFilter, FaDownload, FaExclamationTriangle, FaFileCsv, FaFileCode,
  FaChartLine, FaTruck, FaUsers, FaDollarSign, FaSync, FaTimes, FaFileInvoiceDollar, FaUndo, FaBell,
  FaMoneyBillWave, FaBalanceScale, FaHandshake, FaUserTie
} from "react-icons/fa";

// Component Imports
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import InventoryTable from "../../components/inventory/InventoryTable";
import AddItemModal from "../../components/inventory/AddItemModal";
import ViewItemModal from "../../components/inventory/ViewItemModal";
import FilterPanel from "../../components/inventory/FilterPanel";
import PurchaseOrders from "../../components/inventory/PurchaseOrders";
import SupplierManagement from "../../components/inventory/SupplierManagement";
import Sales from "../../components/inventory/Sales";
import ReportsAnalytics from "../../components/inventory/ReportsAnalytics";
import NotificationPanel from "../../components/inventory/NotificationPanel";

// Hook Imports
import { useInventory } from "../../hooks/useInventory";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useCustomers } from "../../hooks/useCustomers";
import { useNotifications } from "../../contexts/NotificationContext";
import { useDebounce } from "../../hooks/useDebounce";
import { inventoryAPI } from "../../services/api";

const IMSContainer = styled.div`
  padding: 1.5rem 2rem; /* Desktop default */
  background: #f8f9fa;
  min-height: 100vh;
  transition: padding 0.3s ease; /* Smooth padding changes */

  @media (max-width: 1200px) { /* Larger tablets/small laptops */
    padding: 1rem 1.5rem;
  }
  @media (max-width: 768px) { /* Tablets */
    padding: 1rem;
  }
  @media (max-width: 480px) { /* Mobile phones */
    padding: 0.5rem;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 2rem;
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;
const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  @media (max-width: 480px) {
    gap: 1rem;
  }
`;
const HeaderInfo = styled.div`
  flex: 1;
  min-width: 150px; /* Ensure title has space even on small screens */
`;
const HeaderTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #1a202c;
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;
const HeaderSubtitle = styled.p`
  font-size: 1rem;
  color: #718096;
  margin: 0.25rem 0 0 0;
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;
const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;
const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;
  color: #718096;
  &:hover { color: #1a202c; }
  .badge {
    position: absolute;
    top: -6px;
    right: -9px;
    background-color: #e53e3e;
    color: white;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); /* More adaptive min-width */
  gap: 1.5rem;
  margin-top: 2rem;
  @media (max-width: 768px) {
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr; /* Stack on very small screens */
    gap: 0.75rem;
  }
`;
const StatCard = styled(Card)`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 110px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${(props) => props.theme.shadows.lg};
  }
  &.active {
    border-color: ${(props) => props.theme.colors.primary};
    transform: translateY(-4px);
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.primary}30;
  }
  @media (max-width: 480px) {
    min-height: 90px; /* Shorter on mobile */
    padding: 1rem;
    flex-direction: row; /* Layout horizontally on mobile */
    align-items: center;
    justify-content: space-between;
  }
`;
const StatHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  @media (max-width: 480px) {
    flex-direction: row-reverse; /* Put icon first on mobile */
    align-items: center;
    flex-grow: 1;
    justify-content: flex-end; /* Align content to the left of icon */
    gap: 1rem;
  }
`;
const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  background: ${(props) => props.iconColor};
  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;
const StatContent = styled.div`
  text-align: left;
  @media (max-width: 480px) {
    text-align: left;
  }
`;
const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;
const StatLabel = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #718096;
  font-weight: 600;
  letter-spacing: 0.5px;
  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
`;
const StatFooter = styled.div`
  font-size: 0.8rem;
  color: #4a5568;
  margin-top: 0.5rem;
  @media (max-width: 480px) {
    display: none; /* Hide footer on very small screens */
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  @media (max-width: 768px) {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }
  @media (max-width: 480px) {
    flex-direction: column; /* Stack search and buttons */
    align-items: stretch;
  }
`;
const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px; /* Reduced min-width */
  max-width: 400px;
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
  color: #a0aec0;
  z-index: 2;
  pointer-events: none;
`;
const SearchInput = styled(Input)`
  padding-left: 2.75rem;
  @media (max-width: 480px) {
    padding: 0.75rem 1rem; /* Adjust padding for mobile */
    padding-left: 2.5rem;
  }
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch; /* Stretch buttons to fill width */
    button {
      flex-grow: 1; /* Allow buttons to expand */
    }
  }
`;
const DropdownMenu = styled.div`
  position: absolute;
  top: 110%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
  text-align: left;
  cursor: pointer;
  &:hover { background: #f8f9fa; }
`;
const TabContainer = styled.div`
  display: flex;
  background: #fff;
  border-radius: 0.75rem;
  padding: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch; /* Enable smooth scrolling on iOS */

  @media (max-width: 480px) {
    padding: 0.25rem;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
  }
`;
const Tab = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border: none;
  background: ${(props) => (props.active ? props.theme.colors.primary : "transparent")};
  color: ${(props) => (props.active ? "white" : props.theme.colors.textSecondary)};
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  white-space: nowrap;
  &:hover:not(:disabled):not(.active) {
    background: #e9ecef;
    color: #343a40;
  }
  @media (max-width: 480px) {
    min-width: 90px; /* Smaller tabs on mobile */
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }
`;
const ContentArea = styled.div`
  min-height: 600px;
  @media (max-width: 768px) {
    min-height: 400px;
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
  background-color: #e6f7ff;
  color: #005f99;
  border: 1px solid #91d5ff;
  border-radius: 0.75rem;
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
    const [isModalOpen, setIsModalOpen] = useState({ add: false, edit: false, view: false, filter: false, notifications: false, export: false });
    const [selectedItem, setSelectedItem] = useState(null);
    const { unreadCount } = useNotifications();
    
    const {
        inventory, loading: inventoryLoading, stats, error: inventoryError,
        categories, locations, units, pagination, refreshData,
        updateFilters, changePage, filters = {},
        addItem, updateItem, deleteItem, createCategory, createLocation, createUnit,
    } = useInventory();
    
    const { suppliers, loading: suppliersLoading, createSupplier } = useSuppliers();
    const { customers, loading: customersLoading, createCustomer } = useCustomers();

    useEffect(() => {
        if (debouncedSearchQuery !== (filters.search || '')) {
            updateFilters({ search: debouncedSearchQuery });
        }
    }, [debouncedSearchQuery, filters, updateFilters]);

    const handleModal = (modal, item = null) => {
        setSelectedItem(item);
        setIsModalOpen(prev => ({...Object.fromEntries(Object.keys(prev).map(k => [k, false])), [modal]: !prev[modal]}));
    };
    const closeAllModals = () => setIsModalOpen({ add: false, edit: false, view: false, filter: false, notifications: false, export: false });

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
        if (window.confirm("Are you sure?")) deleteItem(itemId);
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
        } catch (err) { /* Interceptor handles the toast */ }
        setIsModalOpen(prev => ({...prev, export: false}));
    };

    const activeFilterName = useMemo(() => {
        const activeFilters = Object.keys(filters).filter(key => filters[key] && !['search', 'page', 'limit'].includes(key));
        if (activeFilters.length === 0) return null;
        return activeFilters.map(key => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${filters[key]}`).join(', ');
    }, [filters]);

    const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString()}`;
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
                        <InventoryTable data={inventory} loading={inventoryLoading} pagination={pagination} onPageChange={changePage} onEdit={(item) => handleModal('edit', item)} onDelete={handleDeleteItem} onView={(item) => handleModal('view', item)} />
                    </>
                );
            case "purchase-orders":
                return <PurchaseOrders inventoryData={inventory} suppliersData={suppliers} categoriesData={categories} isDataLoading={isDataLoading} createSupplier={createSupplier} createCategory={createCategory} onAction={refreshData} />;
            case "sales":
                return <Sales inventoryData={inventory} isDataLoading={inventoryLoading} onAction={refreshData} />;
            case "suppliers":
                return <SupplierManagement />;
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
                            <StatContent><StatValue>{formatNumber(suppliers.length)}</StatValue><StatLabel>Total Suppliers</StatLabel></StatContent>
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
                </ActionButtons>
            </ActionBar>

            <TabContainer>
                <Tab active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}><FaBoxes /> Inventory</Tab>
                <Tab active={activeTab === "purchase-orders"} onClick={() => setActiveTab("purchase-orders")}><FaTruck /> Purchase Orders</Tab>
                <Tab active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")}><FaUsers /> Suppliers</Tab>
                <Tab active={activeTab === "sales"} onClick={() => setActiveTab("sales")}><FaFileInvoiceDollar /> Sales</Tab>
                <Tab active={activeTab === "reports"} onClick={() => setActiveTab("reports")}><FaChartLine /> Reports</Tab>
            </TabContainer>
            <ContentArea>{renderContent()}</ContentArea>

            {isModalOpen.add && <AddItemModal onClose={closeAllModals} onSave={handleAddItem} categories={categories} locations={locations} units={units} suppliers={suppliers} createCategory={createCategory} createLocation={createLocation} createUnit={createUnit} createSupplier={createSupplier} loading={inventoryLoading || suppliersLoading} />}
            {isModalOpen.edit && selectedItem && <AddItemModal itemToEdit={selectedItem} onClose={closeAllModals} onSave={(payload) => handleUpdateItem(payload)} categories={categories} locations={locations} units={units} suppliers={suppliers} createCategory={createCategory} createLocation={createLocation} createUnit={createUnit} createSupplier={createSupplier} loading={inventoryLoading || suppliersLoading} />}
            {isModalOpen.view && selectedItem && <ViewItemModal item={selectedItem} onClose={closeAllModals} />}
            {isModalOpen.filter && <FilterPanel onClose={closeAllModals} onApply={handleApplyFilters} onClear={handleClearFilters} categories={categories} locations={locations} initialFilters={filters} />}
            {isModalOpen.notifications && <NotificationPanel onClose={closeAllModals} />}
        </IMSContainer>
    );
};

export default IMS;
