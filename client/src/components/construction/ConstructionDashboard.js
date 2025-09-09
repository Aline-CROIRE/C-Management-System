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
} from "react-icons/fa";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useConstructionManagement } from "../../hooks/useConstructionManagement";
import SiteTable from "./SiteTable";
import EquipmentTable from "./EquipmentTable";
import AddSiteModal from "./AddSiteModal";
import AddEquipmentModal from "./AddEquipmentModal";
import ViewSiteModal from "./ViewSiteModal";
import ViewEquipmentModal from "./ViewEquipmentModal";

import TaskTable from "./task-management/TaskTable";
import AddEditTaskModal from "./task-management/AddEditTaskModal";
import ViewTaskModal from "./task-management/ViewTaskModal";


const fluidText = (minPx, maxPx) => `clamp(${minPx / 16}rem, ${(minPx / 16)}rem + ${(maxPx - minPx) / (1920 - 320)}vw, ${maxPx / 16}rem)`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
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
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
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
  background: ${(props) => props.$background || props.theme?.colors?.primary}20;
  color: ${(props) => props.$color || props.theme?.colors?.primary};
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
  color: ${(props) => props.$color || props.theme?.colors?.primary};
  margin-top: 1rem;

  @media (max-width: 480px) {
    display: none;
  }
`;

const SectionContainer = styled.div`
  margin-bottom: 2.5rem;
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
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
    sites, equipment, tasks, stats, loading, error, refreshAllData,
    createSite, updateSite, deleteSite,
    createEquipment, updateEquipment, deleteEquipment,
    createTask, updateTask, deleteTask,
    paginationSites, changePageSites,
    paginationEquipment, changePageEquipment,
    paginationTasks, changePageTasks,
  } = useConstructionManagement();

  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isEditSiteModalOpen, setIsEditSiteModalOpen] = useState(false);
  const [isViewSiteModalOpen, setIsViewSiteModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [isEditEquipmentModalOpen, setIsEditEquipmentModalOpen] = useState(false);
  const [isViewEquipmentModalOpen, setIsViewEquipmentModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const formatCurrency = (amount) => `Rwf ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatNumber = (num) => Number(num || 0).toLocaleString();

  const handleEditSite = (site) => { setSelectedSite(site); setIsEditSiteModalOpen(true); };
  const handleViewSite = (site) => { setSelectedSite(site); setIsViewSiteModalOpen(true); };
  const handleDeleteSite = async (id) => { if (window.confirm("Are you sure you want to delete this site?")) await deleteSite(id); };

  const handleEditEquipment = (eq) => { setSelectedEquipment(eq); setIsEditEquipmentModalOpen(true); };
  const handleViewEquipment = (eq) => { setSelectedEquipment(eq); setIsViewEquipmentModalOpen(true); };
  const handleDeleteEquipment = async (id) => { if (window.confirm("Are you sure you want to delete this equipment?")) await deleteEquipment(id); };

  const handleEditTask = (task) => { setSelectedTask(task); setIsEditTaskModalOpen(true); };
  const handleViewTask = (task) => { setSelectedTask(task); setIsViewTaskModalOpen(true); };
  const handleDeleteTask = async (id) => { if (window.confirm("Are you sure you want to delete this task?")) await deleteTask(id); };

  // This loading check should ideally cover the initial state when data might not yet be fetched.
  // The `stats.sites?.total === 0` is a good safeguard, but ensures it doesn't perpetually show spinner if 0 is a valid state.
  if (loading && (!sites.length && !equipment.length && !tasks.length && stats.sites?.total === 0)) {
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
        {/* CORRECTED: Access the .message property of the error object */}
        <p>{error.message || "An unexpected error occurred while fetching data."}</p>
        <Button variant="primary" onClick={refreshAllData} style={{ marginTop: '1rem' }}>Try Again</Button>
      </Card>
    );
  }

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

      <StatsGrid>
        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats.sites.active)}</StatValue>
              <StatLabel>Active Sites</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)" $color="white">
              <FaBuilding />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#4CAF50">
            <FaChartLine /> {formatNumber(stats.sites.total)} Total Projects
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats.equipment.total)}</StatValue>
              <StatLabel>Equipment Units</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)" $color="white">
              <FaTruck />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#2196F3">
            <FaChartLine /> {formatNumber(stats.equipment.operational)} Operational
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats.tasks.total)}</StatValue>
              <StatLabel>Total Tasks</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)" $color="white">
              <FaTasks />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#FFC107">
            <FaChartBar /> {formatNumber(stats.tasks.pending)} Pending
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats.equipment.inMaintenance)}</StatValue>
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
              <StatValue>{formatCurrency(stats.sites.totalBudget)}</StatValue>
              <StatLabel>Total Budget</StatLabel>
            </div>
            <StatIconWrapper $background="linear-gradient(135deg, #673AB7 0%, #9575CD 100%)" $color="white">
              <FaDollarSign />
            </StatIconWrapper>
          </StatContentTop>
          <StatFooter $color="#673AB7">
            <FaTasks /> {formatCurrency(stats.sites.totalExpenditure)} spent
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatContentTop>
            <div>
              <StatValue>{formatNumber(stats.sites.delayed)}</StatValue>
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
      </StatsGrid>

      <SectionContainer>
        <SectionHeader>
          <SectionTitle>
            <FaBuilding /> Construction Sites
          </SectionTitle>
          <SectionActions>
            <Button variant="outline" size="sm"><FaDownload /> Export Sites</Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddSiteModalOpen(true)}><FaPlus /> Add New Site</Button>
          </SectionActions>
        </SectionHeader>

        <SiteTable
          sites={sites}
          loading={loading}
          pagination={paginationSites}
          onPageChange={changePageSites}
          onEdit={handleEditSite}
          onDelete={handleDeleteSite}
          onView={handleViewSite}
        />
      </SectionContainer>

      <SectionContainer>
        <SectionHeader>
          <SectionTitle>
            <FaTools /> Equipment Inventory
          </SectionTitle>
          <SectionActions>
            <Button variant="outline" size="sm"><FaDownload /> Export Equipment</Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddEquipmentModalOpen(true)}><FaPlus /> Add Equipment</Button>
          </SectionActions>
        </SectionHeader>

        <EquipmentTable
          equipment={equipment}
          loading={loading}
          pagination={paginationEquipment}
          onPageChange={changePageEquipment}
          onEdit={handleEditEquipment}
          onDelete={handleDeleteEquipment}
          onView={handleViewEquipment}
        />
      </SectionContainer>

      <SectionContainer>
        <SectionHeader>
          <SectionTitle>
            <FaTasks /> Project Tasks
          </SectionTitle>
          <SectionActions>
            <Button variant="outline" size="sm"><FaDownload /> Export Tasks</Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddTaskModalOpen(true)}><FaPlus /> Add Task</Button>
          </SectionActions>
        </SectionHeader>

        <TaskTable
          tasks={tasks}
          loading={loading}
          pagination={paginationTasks}
          onPageChange={changePageTasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onView={handleViewTask}
        />
      </SectionContainer>


      {/* Modals */}
      {isAddSiteModalOpen && <AddSiteModal onClose={() => setIsAddSiteModalOpen(false)} onSave={createSite} loading={loading} />}
      {isEditSiteModalOpen && selectedSite && <AddSiteModal onClose={() => setIsEditSiteModalOpen(false)} onSave={updateSite} loading={loading} siteToEdit={selectedSite} />}
      {isViewSiteModalOpen && selectedSite && <ViewSiteModal onClose={() => setIsViewSiteModalOpen(false)} site={selectedSite} />}

      {isAddEquipmentModalOpen && <AddEquipmentModal onClose={() => setIsAddEquipmentModalOpen(false)} onSave={createEquipment} loading={loading} sites={sites} />}
      {isEditEquipmentModalOpen && selectedEquipment && <AddEquipmentModal onClose={() => setIsEditEquipmentModalOpen(false)} onSave={updateEquipment} loading={loading} equipmentToEdit={selectedEquipment} sites={sites} />}
      {isViewEquipmentModalOpen && selectedEquipment && <ViewEquipmentModal onClose={() => setIsViewEquipmentModalOpen(false)} equipment={selectedEquipment} />}

      {isAddTaskModalOpen && (
          <AddEditTaskModal
              onClose={() => setIsAddTaskModalOpen(false)}
              onSave={createTask}
              loading={loading}
              sites={sites}
              allTasks={tasks}
          />
      )}
      {isEditTaskModalOpen && selectedTask && (
          <AddEditTaskModal
              onClose={() => setIsEditTaskModalOpen(false)}
              onSave={updateTask}
              loading={loading}
              taskToEdit={selectedTask}
              sites={sites}
              allTasks={tasks}
          />
      )}
      {isViewTaskModalOpen && selectedTask && (
          <ViewTaskModal
              onClose={() => setIsViewTaskModalOpen(false)}
              task={selectedTask}
          />
      )}
    </>
  );
};

export default ConstructionDashboard;