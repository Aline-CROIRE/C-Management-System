"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import {
  FaBoxes, FaPlus, FaSearch, FaFilter, FaDownload, FaBarcode, FaExclamationTriangle,
  FaChartLine, FaWarehouse, FaTruck, FaUsers, FaDollarSign, FaBell, FaSync,
} from "react-icons/fa"

import Card from "../../components/common/Card"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import InventoryTable from "../../components/inventory/InventoryTable"
import AddItemModal from "../../components/inventory/AddItemModal"
import { useInventory } from "../../hooks/useInventory"
import { useNotifications } from "../../contexts/NotificationContext"
// import BarcodeScanner from "../../components/inventory/BarcodeScanner"
// import AlertsPanel from "../../components/inventory/AlertsPanel"
// import EditItemModal from "../../components/inventory/EditItemModal";
// import FilterPanel from "../../components/inventory/FilterPanel";

// --- STYLED COMPONENTS (Restored) ---
// The missing style definitions are now included, fixing the errors.
const IMSContainer = styled.div`
  padding: 2rem;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  background: ${(props) => props.theme.gradients?.primary || "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)"};
  border-radius: 1rem;
  padding: 3rem;
  margin-bottom: 3rem;
  color: white;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const HeaderTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 1.125rem;
  opacity: 0.9;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`;

const StatCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-8px);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StatIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  background: ${(props) => props.iconColor || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
`;

const StatValue = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  text-transform: uppercase;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled(Input)`
  padding-left: 3rem;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const TabContainer = styled.div`
  display: flex;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: 0.75rem;
  padding: 0.25rem;
  margin-bottom: 2rem;
  overflow-x: auto;
`;

const Tab = styled.button`
  flex: 1;
  min-width: 150px;
  padding: 1rem 1.5rem;
  border: none;
  background: ${(props) => (props.active ? "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)" : "transparent")};
  color: ${(props) => (props.active ? "white" : props.theme.colors?.textSecondary || "#718096")};
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  &:hover {
    background: ${(props) => (props.active ? "" : props.theme.colors?.surfaceLight || "#f7fafc")};
    color: ${(props) => (props.active ? "" : props.theme.colors?.text || "#2d3748")};
  }
`;

const ContentArea = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: 1rem;
  min-height: 600px;
  overflow: hidden;
`;

const IMS = () => {
  const [activeTab, setActiveTab] = useState("inventory")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    inventory, loading, stats, error, categories, locations, pagination,
    addItem, updateItem, deleteItem, refreshData, createCategory, createLocation,
    updateFilters, changePage,
  } = useInventory()

  const { notifications } = useNotifications()

  useEffect(() => {
    const handler = setTimeout(() => {
      updateFilters({ search: searchQuery });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, updateFilters]);

  const handleAddItem = async (payload) => {
    setIsSaving(true);
    try {
      const { itemData, newCategory, newLocation } = payload;
      if (newCategory) await createCategory(newCategory);
      if (newLocation) await createLocation(newLocation);
      await addItem(itemData);
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add item:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async (itemId, itemData) => {
    setIsSaving(true);
    try {
      await updateItem(itemId, itemData);
      setShowEditModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Failed to update item:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };
  
  const handleDeleteItem = (itemId) => {
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      deleteItem(itemId);
    }
  };

  const handleViewItem = (item) => {
    console.log("Viewing item details:", item);
  };

  const handleApplyFilters = (appliedFilters) => {
    updateFilters(appliedFilters);
    setShowFilterPanel(false);
  };

  if (error) {
    return <IMSContainer><div>Error fetching data: {error}. <Button onClick={refreshData}>Try Again</Button></div></IMSContainer>
  }
  
  return (
    <IMSContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderInfo>
            <HeaderTitle>Inventory Management System</HeaderTitle>
            <HeaderSubtitle>Real-time inventory control and comprehensive reporting.</HeaderSubtitle>
          </HeaderInfo>
          <HeaderActions>
            <NotificationBadge>
              <FaBell size={24} />
            </NotificationBadge>
            <Button variant="outline" onClick={refreshData} disabled={loading && !isSaving}>
              <FaSync /> {loading && !isSaving ? 'Syncing...' : 'Sync'}
            </Button>
            <Button variant="outline">
              <FaBarcode /> Scan
            </Button>
          </HeaderActions>
        </HeaderContent>
      </HeaderSection>
      
      <StatsGrid>
        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{pagination.total?.toLocaleString() || "0"}</StatValue>
              <StatLabel>Total Items</StatLabel>
            </div>
            <StatIcon><FaBoxes /></StatIcon>
          </StatHeader>
        </StatCard>
        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{stats.lowStockItems?.length || "0"}</StatValue>
              <StatLabel>Low Stock</StatLabel>
            </div>
            <StatIcon iconColor="linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)"><FaExclamationTriangle /></StatIcon>
          </StatHeader>
        </StatCard>
        <StatCard>
          <StatHeader>
            <div>
              <StatValue>${stats.totalValue?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</StatValue>
              <StatLabel>Total Value</StatLabel>
            </div>
            <StatIcon><FaDollarSign /></StatIcon>
          </StatHeader>
        </StatCard>
        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{stats.totalLocations || "0"}</StatValue>
              <StatLabel>Locations</StatLabel>
            </div>
            <StatIcon iconColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"><FaWarehouse /></StatIcon>
          </StatHeader>
        </StatCard>
      </StatsGrid>
      
      <ActionBar>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput 
            type="text" 
            placeholder="Search by name, SKU, or category..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <ActionButtons>
          <Button variant="outline" onClick={() => setShowFilterPanel(true)}><FaFilter /> Filter</Button>
          <Button variant="outline"><FaDownload /> Export</Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}><FaPlus /> Add Item</Button>
        </ActionButtons>
      </ActionBar>

      <TabContainer>
        <Tab active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}><FaBoxes /> Inventory</Tab>
        <Tab active={activeTab === "purchase-orders"} onClick={() => setActiveTab("purchase-orders")}><FaTruck /> Purchase Orders</Tab>
        <Tab active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")}><FaUsers /> Suppliers</Tab>
        <Tab active={activeTab === "reports"} onClick={() => setActiveTab("reports")}><FaChartLine /> Reports</Tab>
      </TabContainer>
      
      <ContentArea>
        {activeTab === "inventory" && (
          <InventoryTable
            data={inventory}
            loading={loading}
            pagination={pagination}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onView={handleViewItem}
            onPageChange={changePage}
          />
        )}
      </ContentArea>
      
      {showAddModal && (
        <AddItemModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddItem}
          categories={categories}
          locations={locations}
          loading={isSaving}
        />
      )}
    </IMSContainer>
  )
}

export default IMS;