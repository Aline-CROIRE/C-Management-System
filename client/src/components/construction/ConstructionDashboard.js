// client/src/components/construction/ConstructionDashboard.js
"use client";

import React, { useState } from "react";
import styled from "styled-components";
import {
  FaTruck,
  FaWrench,
  FaChartLine,
  FaPlus,
  FaDownload,
  FaExclamationTriangle,
  FaClock,
  FaTools,
  FaBuilding,
  FaDollarSign,
  FaChartBar,
  FaTasks,
  FaProjectDiagram,
  FaUsersCog,
  FaClipboardList,
  FaFileInvoiceDollar,
  FaHardHat,
} from "react-icons/fa";

import Card from "../common/Card";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import { useConstructionManagement } from "../../hooks/useConstructionManagement";
import SiteTable from "./SiteTable";
import EquipmentTable from "./EquipmentTable";

// Add/Edit/View Modals for Core Entities
import AddSiteModal from "./AddSiteModal";
import AddEquipmentModal from "./AddEquipmentModal";
import AddEditWorkerModal from "./worker-management/AddEditWorkerModal";
import AddEditTaskModal from "./task-management/AddEditTaskModal";

import ViewSiteModal from "./ViewSiteModal";
import ViewEquipmentModal from "./ViewEquipmentModal";
import ViewWorkerModal from "./worker-management/ViewWorkerModal";
import ViewTaskModal from "./task-management/ViewTaskModal";

// Task Management Tab Components
import TaskTable from "./task-management/TaskTable";
import GanttChartDisplay from "./task-management/GanttChartDisplay";

// Worker Management Tab Components
import WorkerAssignmentTable from "./worker-management/WorkerAssignmentTable";

const fluidText = (minPx, maxPx) => `clamp(${minPx / 16}rem, ${(minPx / 16)}rem + ${(maxPx - minPx) / (1920 - 320)}vw, ${maxPx / 16}rem)`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
  border-radius: 1rem;
  padding: 2.5rem 3rem;
  margin-bottom: 2rem;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 250px;
    height: 250px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }

  @media (max-width: 768px) {
    padding: 1.5rem 2rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 480px) {
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    border-radius: 0.75rem;
    &::before {
      width: 150px;
      height: 150px;
      transform: translate(50%, -50%);
    }
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
`;

const HeaderTitle = styled.h1`
  font-size: ${fluidText(28, 36)};
  font-weight: 700;
  margin-bottom: 0.5rem;
  @media (max-width: 480px) {
    font-size: ${fluidText(24, 28)};
  }
`;

const HeaderSubtitle = styled.p`
  font-size: ${fluidText(16, 18)};
  opacity: 0.9;
  margin: 0;
  @media (max-width: 480px) {
    font-size: ${fluidText(14, 16)};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const StatCard = styled(Card)`
  background: ${(props) => props.theme?.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const StatContentTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  @media (max-width: 480px) {
    margin-bottom: 0;
    gap: 1rem;
  }
`;

const StatIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: ${(props) => props.$background || (props.theme?.colors?.primary ? `${props.theme.colors.primary}20` : '#007bff20')};
  color: ${(props) => props.$color || props.theme?.colors?.primary || '#007bff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
`;

const StatValue = styled.div`
  color: ${(props) => props.theme?.colors?.text || "#2d3748"};
  font-size: ${fluidText(24, 30)};
  font-weight: 700;
  margin-bottom: 0.25rem;
  @media (max-width: 480px) {
    font-size: ${fluidText(20, 24)};
  }
`;

const StatLabel = styled.div`
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  font-size: ${fluidText(12, 14)};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  @media (max-width: 480px) {
    font-size: ${fluidText(10, 12)};
  }
`;

const StatFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${fluidText(12, 14)};
  font-weight: 600;
  color: ${(props) => props.$color || props.theme?.colors?.primary || '#007bff'};
  margin-top: 1rem;

  @media (max-width: 480px) {
    display: none;
  }
`;

const TabContainer = styled.div`
  background: ${(props) => props.theme?.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme?.shadows?.lg || "0 4px 6px rgba(0, 0, 0, 0.1)"};
  overflow: hidden;
  border: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  margin-bottom: 2.5rem;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const TabButton = styled.button`
  padding: 1rem 1.5rem;
  font-size: ${fluidText(14, 16)};
  font-weight: 600;
  color: ${(props) => props.active ? (props.theme?.colors?.primary || '#007bff') : (props.theme?.colors?.textSecondary || '#718096')};
  background: ${(props) => props.active ? (props.theme?.colors?.surfaceLight || '#f7fafc') : 'transparent'};
  border: none;
  border-bottom: 2px solid ${(props) => props.active ? (props.theme?.colors?.primary || '#007bff') : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    color: ${(props) => props.theme?.colors?.primary || '#007bff'};
    background: ${(props) => props.theme?.colors?.surfaceLight || '#f7fafc'};
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: ${fluidText(12, 14)};
  }
`;

const TabContent = styled.div`
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const SectionTitle = styled.h2`
  color: ${(props) => props.theme?.colors?.text || "#2d3748"};
  font-size: ${fluidText(20, 24)};
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 480px) {
    font-size: ${fluidText(18, 20)};
  }
`;

const SectionActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch;
    button {
      flex-grow: 1;
      font-size: 0.85rem;
      padding: 0.75rem;
    }
  }
`;

const ConstructionDashboard = () => {
  const {
    sites, equipment, tasks, workers, stats, loading, error, refreshAllData,
    createSite, updateSite, deleteSite,
    createEquipment, updateEquipment, deleteEquipment,
    createTask, updateTask, deleteTask,
    createWorker, updateWorker, deleteWorker,
    paginationSites, changePageSites,
    paginationEquipment, changePageEquipment,
    paginationTasks, changePageTasks,
    paginationWorkers, changePageWorkers,

    // NEW STATES AND CRUD FUNCTIONS FROM HOOK
    siteMaterialInventory, createSiteMaterial, updateSiteMaterial, deleteSiteMaterial,
    siteMaterialRequests, createMaterialRequest, updateMaterialRequestStatus, deleteMaterialRequest,
    sitePaymentRequests, createPaymentRequest, updatePaymentRequestStatus, deletePaymentRequest,
    siteChangeOrders, createChangeOrder, updateChangeOrder, deleteChangeOrder,
    siteSafetyIncidents, createSafetyIncident, updateSafetyIncident, deleteSafetyIncident,
  } = useConstructionManagement();

  const [activeTab, setActiveTab] = useState('overview');
  const [taskViewMode, setTaskViewMode] = useState('table');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const handleExport = (type) => { console.log(`Exporting as ${type}`); setShowExportModal(false); };

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatNumber = (num) => Number(num || 0).toLocaleString();

  const handleAddNew = (type) => {
    setModalType(type);
    setSelectedItem(null);
    setShowAddModal(true);
  };

  const handleEdit = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleView = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      return;
    }
    try {
      switch (type) {
        case 'site': await deleteSite(id); break;
        case 'equipment': await deleteEquipment(id); break;
        case 'task': await deleteTask(id); break;
        case 'worker': await deleteWorker(id); break;
        case 'material_request':
            const req = siteMaterialRequests.find(r => r._id === id);
            if (req && req.site) await deleteMaterialRequest(req.site, id);
            else console.error("Could not find site ID for material request deletion.");
            break;
        case 'payment_request':
            const payReq = sitePaymentRequests.find(r => r._id === id);
            if (payReq && payReq.site) await deletePaymentRequest(payReq.site, id);
            else console.error("Could not find site ID for payment request deletion.");
            break;
        case 'change_order':
            const co = siteChangeOrders.find(r => r._id === id);
            if (co && co.site) await deleteChangeOrder(co.site, id);
            else console.error("Could not find site ID for change order deletion.");
            break;
        case 'safety_incident':
            const si = siteSafetyIncidents.find(r => r._id === id);
            if (si && si.site) await deleteSafetyIncident(si.site, id);
            else console.error("Could not find site ID for safety incident deletion.");
            break;
        default: console.error("Unknown type for deletion:", type); break;
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    }
  };

  const areAllDataArraysEmpty = (sites?.length === 0) && (equipment?.length === 0) && (tasks?.length === 0) && (workers?.length === 0);
  const areStatsInitiallyEmpty = (!stats || (stats?.sites?.total === undefined && stats?.equipment?.total === undefined && stats?.tasks?.total === undefined));
  const shouldShowLoading = loading && areAllDataArraysEmpty && areStatsInitiallyEmpty;

  if (shouldShowLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
        <LoadingSpinner /><p style={{ marginTop: '1rem', fontSize: '1rem', color: '#718096' }}>Loading construction data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center', background: '#ffebee', color: '#d32f2f' }}>
        <FaExclamationTriangle size={32} style={{ marginBottom: '1rem' }} />
        <h3>Error Loading Construction Data</h3>
        <p>{error.message || "An unexpected error occurred while fetching data."}</p>
        <Button variant="primary" onClick={refreshAllData} style={{ marginTop: '1rem' }}>Try Again</Button>
      </Card>
    );
  }

  const renderOverviewTab = () => (
    <TabContent>
      <StatsGrid>
        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.sites?.active)}</StatValue>
              <StatLabel>Active Sites</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)" $color="white">
              <FaBuilding />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#4CAF50">
            <FaChartLine /> {formatNumber(stats?.sites?.total)} Total Projects
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.equipment?.total)}</StatValue>
              <StatLabel>Equipment Units</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)" $color="white">
              <FaTruck />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#2196F3">
            <FaChartLine /> {formatNumber(stats?.equipment?.operational)} Operational
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.tasks?.total)}</StatValue>
              <StatLabel>Total Tasks</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)" $color="white">
              <FaTasks />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#FFC107">
            <FaChartBar /> {formatNumber(stats?.tasks?.pending)} Pending
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.equipment?.inMaintenance)}</StatValue>
              <StatLabel>Maintenance Due</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #F44336 0%, #EF5350 100%)" $color="white">
              <FaWrench />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#F44336">
            <FaExclamationTriangle /> Critical attention
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatCurrency(stats?.sites?.totalBudget)}</StatValue>
              <StatLabel>Total Budget</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #673AB7 0%, #9575CD 100%)" $color="white">
              <FaDollarSign />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#673AB7">
            <FaTasks /> {formatCurrency(stats?.sites?.totalExpenditure)} spent
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.sites?.delayed)}</StatValue>
              <StatLabel>Delayed Sites</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)" $color="white">
              <FaClock />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#FF9800">
            <FaExclamationTriangle /> Requires review
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.financials?.pendingPaymentRequests)}</StatValue>
              <StatLabel>Pending Payments</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #FF5722 0%, #FFAB91 100%)" $color="white">
              <FaFileInvoiceDollar />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#FF5722">
            <FaChartBar /> Needs Approval
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.financials?.pendingMaterialRequests)}</StatValue>
              <StatLabel>Material Requests</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #00BCD4 0%, #80DEEA 100%)" $color="white">
              <FaClipboardList />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#00BCD4">
            <FaChartBar /> Awaiting Order
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.financials?.pendingChangeOrders)}</StatValue>
              <StatLabel>Change Orders</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #795548 0%, #A1887F 100%)" $color="white">
              <FaProjectDiagram />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#795548">
            <FaExclamationTriangle /> Review Required
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats?.workers?.total)}</StatValue>
              <StatLabel>Total Workers</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #3F51B5 0%, #7986CB 100%)" $color="white">
              <FaUsersCog />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#3F51B5">
            <FaChartLine /> {formatNumber(stats?.workers?.active)} Active
          </StatFooter>
        </StatCard>
      </StatsGrid>
    </TabContent>
  );

  const renderSitesTab = () => (
    <TabContent>
      <SectionHeader>
        <SectionTitle>
          <FaBuilding /> Construction Sites
        </SectionTitle>
        <SectionActions>
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} disabled={loading}><FaDownload /> Export Sites</Button>
          <Button variant="primary" size="sm" onClick={() => handleAddNew('site')} disabled={loading}><FaPlus /> Add New Site</Button>
        </SectionActions>
      </SectionHeader>
      <SiteTable
        sites={sites}
        loading={loading}
        pagination={paginationSites}
        onPageChange={changePageSites}
        onEdit={(site) => handleEdit('site', site)}
        onDelete={(id) => handleDelete('site', id)}
        onView={(site) => handleView('site', site)}
      />
    </TabContent>
  );

  const renderMaterialsTab = () => (
    <TabContent>
      <SectionHeader>
        <SectionTitle><FaClipboardList /> Site Materials Overview</SectionTitle>
        <SectionActions>
          <Button variant="outline" size="sm" disabled><FaDownload /> Export Materials</Button>
        </SectionActions>
      </SectionHeader>
      <p style={{ textAlign: 'center', color: '#718096', fontStyle: 'italic' }}>Material overview coming soon...</p>
    </TabContent>
  );

  const renderFinancialsTab = () => (
    <TabContent>
      <SectionHeader>
        <SectionTitle><FaFileInvoiceDollar /> Financial Overview</SectionTitle>
        <SectionActions>
          <Button variant="outline" size="sm" disabled><FaDownload /> Export Financials</Button>
        </SectionActions>
      </SectionHeader>
      <p style={{ textAlign: 'center', color: '#718096', fontStyle: 'italic' }}>Financial data and requests coming soon...</p>
    </TabContent>
  );

  const renderSafetyTab = () => (
    <TabContent>
      <SectionHeader>
        <SectionTitle><FaHardHat /> Safety & Incidents</SectionTitle>
        <SectionActions>
          <Button variant="outline" size="sm" disabled><FaDownload /> Export Incidents</Button>
        </SectionActions>
      </SectionHeader>
      <p style={{ textAlign: 'center', color: '#718096', fontStyle: 'italic' }}>Safety incidents management coming soon...</p>
    </TabContent>
  );

  return (
    <>
      <HeaderSection>
        <HeaderContent>
          <HeaderTitle>Construction Site Management</HeaderTitle>
          <HeaderSubtitle>
            Comprehensive management of construction projects, equipment, and resources
          </HeaderSubtitle>
        </HeaderContent>
      </HeaderSection>

      <TabContainer>
        <Tabs>
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
          <TabButton active={activeTab === 'sites'} onClick={() => setActiveTab('sites')}>Sites</TabButton>
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>Tasks</TabButton>
          <TabButton active={activeTab === 'equipment'} onClick={() => setActiveTab('equipment')}>Equipment</TabButton>
          <TabButton active={activeTab === 'workers'} onClick={() => setActiveTab('workers')}>Workers</TabButton>
          <TabButton active={activeTab === 'materials'} onClick={() => setActiveTab('materials')}>Materials</TabButton>
          <TabButton active={activeTab === 'financials'} onClick={() => setActiveTab('financials')}>Financials</TabButton>
          <TabButton active={activeTab === 'safety'} onClick={() => setActiveTab('safety')}>Safety</TabButton>
        </Tabs>

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'sites' && renderSitesTab()}
        {activeTab === 'tasks' && (
          <TabContent>
            <SectionHeader>
              <SectionTitle><FaTasks /> Project Tasks</SectionTitle>
              <SectionActions>
                <Button
                  variant={taskViewMode === 'table' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTaskViewMode('table')}
                  disabled={loading}
                >
                  <FaTasks /> Table View
                </Button>
                <Button
                  variant={taskViewMode === 'gantt' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTaskViewMode('gantt')}
                  disabled={loading}
                >
                  <FaProjectDiagram /> Gantt Chart
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} disabled={loading}><FaDownload /> Export Tasks</Button>
                <Button variant="primary" size="sm" onClick={() => handleAddNew('task')} disabled={loading}><FaPlus /> Add Task</Button>
              </SectionActions>
            </SectionHeader>

            {taskViewMode === 'table' ? (
              <TaskTable
                tasks={tasks}
                loading={loading}
                pagination={paginationTasks}
                onPageChange={changePageTasks}
                onEdit={(task) => handleEdit('task', task)}
                onDelete={(id) => handleDelete('task', id)}
                onView={(task) => handleView('task', task)}
              />
            ) : (
              <GanttChartDisplay
                tasks={tasks}
                loading={loading}
                error={error}
              />
            )}
          </TabContent>
        )}
        {activeTab === 'equipment' && (
          <TabContent>
            <SectionHeader>
              <SectionTitle><FaTools /> Equipment Inventory</SectionTitle>
              <SectionActions>
                <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} disabled={loading}><FaDownload /> Export Equipment</Button>
                <Button variant="primary" size="sm" onClick={() => handleAddNew('equipment')} disabled={loading}><FaPlus /> Add Equipment</Button>
              </SectionActions>
            </SectionHeader>
            <EquipmentTable
              equipment={equipment}
              loading={loading}
              pagination={paginationEquipment}
              onPageChange={changePageEquipment}
              onEdit={(eq) => handleEdit('equipment', eq)}
              onDelete={(id) => handleDelete('equipment', id)}
              onView={(eq) => handleView('equipment', eq)}
            />
          </TabContent>
        )}
        {activeTab === 'workers' && (
          <TabContent>
            <SectionHeader>
              <SectionTitle><FaUsersCog /> Worker Management</SectionTitle>
              <SectionActions>
                <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} disabled={loading}><FaDownload /> Export Workers</Button>
                <Button variant="primary" size="sm" onClick={() => handleAddNew('worker')} disabled={loading}><FaPlus /> Add Worker</Button>
              </SectionActions>
            </SectionHeader>
            <WorkerAssignmentTable
              workers={workers}
              loading={loading}
              pagination={paginationWorkers} 
              onPageChange={changePageWorkers}
              onEdit={(worker) => handleEdit('worker', worker)}
              onDelete={(id) => handleDelete('worker', id)}
              onView={(worker) => handleView('worker', worker)}
            />
          </TabContent>
        )}
        {activeTab === 'materials' && renderMaterialsTab()}
        {activeTab === 'financials' && renderFinancialsTab()}
        {activeTab === 'safety' && renderSafetyTab()}
      </TabContainer>

      {/* Add Modals */}
      {showAddModal && modalType === 'site' && (
        <AddSiteModal onClose={() => setShowAddModal(false)} onSave={createSite} loading={loading} />
      )}
      {showAddModal && modalType === 'equipment' && (
        <AddEquipmentModal onClose={() => setShowAddModal(false)} onSave={createEquipment} loading={loading} sites={sites} />
      )}
      {showAddModal && modalType === 'task' && (
        <AddEditTaskModal
          onClose={() => setShowAddModal(false)}
          onSave={createTask}
          loading={loading}
          sites={sites}
          allTasks={tasks}
          workers={workers}
        />
      )}
      {showAddModal && modalType === 'worker' && (
        <AddEditWorkerModal onClose={() => setShowAddModal(false)} onSave={createWorker} loading={loading} />
      )}

      {/* Edit Modals */}
      {showEditModal && modalType === 'site' && selectedItem && (
        <AddSiteModal onClose={() => setShowEditModal(false)} onSave={updateSite} loading={loading} siteToEdit={selectedItem} />
      )}
      {showEditModal && modalType === 'equipment' && selectedItem && (
        <AddEquipmentModal onClose={() => setShowEditModal(false)} onSave={updateEquipment} loading={loading} equipmentToEdit={selectedItem} sites={sites} />
      )}
      {showEditModal && modalType === 'task' && selectedItem && (
        <AddEditTaskModal
          onClose={() => setShowEditModal(false)}
          onSave={updateTask}
          loading={loading}
          taskToEdit={selectedItem}
          sites={sites}
          allTasks={tasks}
          workers={workers}
        />
      )}
      {showEditModal && modalType === 'worker' && selectedItem && (
        <AddEditWorkerModal onClose={() => setShowEditModal(false)} onSave={updateWorker} loading={loading} workerToEdit={selectedItem} />
      )}

      {/* View Modals */}
      {showViewModal && modalType === 'site' && selectedItem && (
        <ViewSiteModal onClose={() => setShowViewModal(false)} site={selectedItem} />
      )}
      {showViewModal && modalType === 'equipment' && selectedItem && (
        <ViewEquipmentModal onClose={() => setShowViewModal(false)} equipment={selectedItem} />
      )}
      {showViewModal && modalType === 'task' && selectedItem && (
        <ViewTaskModal onClose={() => setShowViewModal(false)} task={selectedItem} />
      )}
      {showViewModal && modalType === 'worker' && selectedItem && (
        <ViewWorkerModal onClose={() => setShowViewModal(false)} worker={selectedItem} />
      )}

      {showExportModal && (
        <Card style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, padding: '2rem' }}>
          <h3>Export Options</h3>
          <p>Choose export type:</p>
          <Button onClick={() => handleExport('pdf')} disabled={loading}>PDF</Button>
          <Button onClick={() => handleExport('excel')} style={{ marginLeft: '1rem' }} disabled={loading}>Excel</Button>
          <Button onClick={() => handleExport('csv')} style={{ marginLeft: '1rem' }} disabled={loading}>CSV</Button>
          <Button variant="secondary" onClick={() => setShowExportModal(false)} style={{ marginTop: '1rem', width: '100%' }} disabled={loading}>Cancel</Button>
        </Card>
      )}
    </>
  );
};

export default ConstructionDashboard;
