// client/src/components/construction/task-management/TaskTable.js
"use client";

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaClipboardList, FaEdit, FaEye, FaTrash,
  FaSort, FaSortUp, FaSortDown, FaCalendarAlt,
  FaChevronLeft, FaChevronRight, FaInfoCircle, FaStar, FaUserPlus, FaSitemap, FaCheckCircle, FaExclamationTriangle, FaClock,
  FaTimes, FaUsers, FaTools
} from "react-icons/fa";
import Button from "../../common/Button";
import LoadingSpinner from "../../common/LoadingSpinner";
import moment from "moment";

const TableWrapper = styled.div`
  background: ${(props) => props.theme?.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme?.shadows?.lg || "0 4px 6px rgba(0, 0, 0, 0.1)"};
  overflow: hidden;
  border: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme?.colors?.border || "#cbd5e0"};
    border-radius: 10px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1400px; /* Keep this, as it allows horizontal scroll if needed */

  @media (max-width: 1024px) { /* hide-on-tablet breakpoint */
    min-width: 1000px;
  }
  @media (max-width: 768px) { /* hide-on-mobile breakpoint */
    min-width: 700px;
  }
  @media (max-width: 480px) { /* Further reduced */
    min-width: 500px;
  }
`;

const TableHeader = styled.thead`
  background: ${(props) => props.theme?.colors?.surfaceLight || "#f7fafc"};
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: clamp(0.7rem, 1.5vw, 0.75rem);
  font-weight: 600;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  cursor: ${(props) => (props.$sortable ? "pointer" : "default")};
  user-select: none;
  white-space: nowrap;

  &:hover .sort-icon {
    opacity: 1;
  }

  .sort-icon {
    margin-left: 0.5rem;
    opacity: ${(props) => (props.$sorted ? 1 : 0.3)};
    transition: opacity 0.2s ease;
  }

  &.hide-on-tablet {
    @media (max-width: 1024px) {
      display: none;
    }
  }
  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme?.colors?.border || "#e2e8f0"};
  &:hover {
    background: ${(props) => props.theme?.colors?.surfaceLight || "#edf2f7"};
  }
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: ${(props) => props.theme?.colors?.text || "#2d3748"};
  vertical-align: middle;
  white-space: nowrap; /* Default, but TaskInfo can wrap name */
  
  &.hide-on-tablet {
    @media (max-width: 1024px) {
      display: none;
    }
  }
  &.hide-on-mobile {
    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const TaskInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 120px; /* Ensure task name column has a minimum width before wrapping */
`;

const TaskName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme?.colors?.heading || "#1a202c"};
  white-space: normal; /* Allow task name to wrap */
  word-break: break-word;
`;

const TaskMeta = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  white-space: normal; /* Allow meta info to wrap if needed */
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: clamp(0.7rem, 1.5vw, 0.75rem);
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;

  ${({ status, theme }) => {
    switch (status) {
      case "To Do": return `background: ${theme?.colors?.info || "#2196F3"}20; color: ${theme?.colors?.info || "#2196F3"};`;
      case "In Progress": return `background: ${theme?.colors?.primary || "#1b4332"}20; color: ${theme?.colors?.primary || "#1b4332"};`;
      case "Blocked": return `background: ${theme?.colors?.error || "#F44336"}20; color: ${theme?.colors?.error || "#F44336"};`;
      case "Completed": return `background: ${theme?.colors?.success || "#4CAF50"}20; color: ${theme?.colors?.success || "#4CAF50"};`;
      case "Cancelled": return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
      default: return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const PriorityBadge = styled(StatusBadge)`
  ${({ priority, theme }) => {
    switch (priority) {
      case "Low": return `background: ${theme?.colors?.info || "#2196F3"}20; color: ${theme?.colors?.info || "#2196F3"};`;
      case "Medium": return `background: ${theme?.colors?.primary || "#1b4332"}20; color: ${theme?.colors?.primary || "#1b4332"};`;
      case "High": return `background: ${theme?.colors?.warning || "#FFC107"}20; color: ${theme?.colors?.warning || "#FFC107"};`;
      case "Critical": return `background: ${theme?.colors?.error || "#F44336"}20; color: ${theme?.colors?.error || "#F44336"};`;
      default: return `background: ${theme?.colors?.textSecondary || "#9E9E9E"}20; color: ${theme?.colors?.textSecondary || "#9E9E9E"};`;
    }
  }}
`;

const ActionButtonGroup = styled.div` display: flex; align-items: center; gap: 0.25rem; `;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};
  .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  h3 { color: ${(props) => props.theme?.colors?.text || "#2d3748"}; margin-bottom: 0.5rem; }
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  font-size: clamp(0.8rem, 2vw, 0.875rem);
  color: ${(props) => props.theme?.colors?.textSecondary || "#718096"};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PaginationControls = styled.div` display: flex; gap: 0.5rem; `;

const TaskTable = ({
  tasks = [],
  loading = false,
  pagination = { page: 1, total: 0, limit: 10, totalPages: 1 },
  onEdit,
  onDelete,
  onView,
  onPageChange,
  hideSiteColumn = false,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "dueDate", direction: "asc" });

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'site') {
            aValue = a[sortConfig.key]?.name || '';
            bValue = b[sortConfig.key]?.name || '';
        }
        if (sortConfig.key === 'assignedTo') { // Sort by first assigned worker
            aValue = a.assignedTo && a.assignedTo.length > 0 ? a.assignedTo[0].fullName : '';
            bValue = b.assignedTo && b.assignedTo.length > 0 ? b.assignedTo[0].fullName : '';
        }
        if (sortConfig.key === 'progress') {
            aValue = parseFloat(aValue || 0);
            bValue = parseFloat(bValue || 0);
        }
        if (['startDate', 'dueDate', 'actualCompletionDate'].includes(sortConfig.key)) {
            aValue = moment(aValue).valueOf();
            bValue = moment(bValue).valueOf();
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [tasks, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === "asc" ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "To Do": return <FaInfoCircle />;
      case "In Progress": return <FaClock />;
      case "Blocked": return <FaExclamationTriangle />;
      case "Completed": return <FaCheckCircle />;
      case "Cancelled": return <FaTimes />;
      default: return <FaInfoCircle />;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <TableWrapper style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </TableWrapper>
    );
  }

  if (!loading && tasks.length === 0) {
    return (
      <TableWrapper>
        <EmptyState>
          <FaClipboardList className="icon" />
          <h3>No Tasks Found</h3>
          <p>This site does not have any tasks yet. Click "Add Task" to get started.</p>
        </EmptyState>
      </TableWrapper>
    );
  }
  
  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.page || 1;
  const totalItems = pagination.total || 0;

  return (
    <TableWrapper>
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell $sortable $sorted={sortConfig.key === "name"} onClick={() => handleSort("name")}>Task Name {getSortIcon("name")}</TableHeaderCell>
              {!hideSiteColumn && (
                <TableHeaderCell className="hide-on-mobile" $sortable $sorted={sortConfig.key === "site"} onClick={() => handleSort("site")}>Site {getSortIcon("site")}</TableHeaderCell>
              )}
              <TableHeaderCell className="hide-on-tablet" $sortable $sorted={sortConfig.key === "assignedTo"} onClick={() => handleSort("assignedTo")}>Assigned To {getSortIcon("assignedTo")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-tablet">Allocated Resources</TableHeaderCell>
              <TableHeaderCell $sortable $sorted={sortConfig.key === "status"} onClick={() => handleSort("status")}>Status {getSortIcon("status")}</TableHeaderCell>
              <TableHeaderCell className="hide-on-mobile" $sortable $sorted={sortConfig.key === "priority"} onClick={() => handleSort("priority")}>Priority {getSortIcon("priority")}</TableHeaderCell>
              <TableHeaderCell $sortable $sorted={sortConfig.key === "startDate"} onClick={() => handleSort("startDate")}>Start Date {getSortIcon("startDate")}</TableHeaderCell>
              <TableHeaderCell $sortable $sorted={sortConfig.key === "dueDate"} onClick={() => handleSort("dueDate")}>Due Date {getSortIcon("dueDate")}</TableHeaderCell>
              <TableHeaderCell $sortable $sorted={sortConfig.key === "progress"} onClick={() => handleSort("progress")}>Progress {getSortIcon("progress")}</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => (
              <TableRow key={task._id}>
                <TableCell>
                  <TaskInfo>
                    <TaskName>{task.name}</TaskName>
                    {task.parentTask?.name && <TaskMeta><FaSitemap size={10} /> Sub-task of: {task.parentTask.name}</TaskMeta>}
                  </TaskInfo>
                </TableCell>
                {!hideSiteColumn && (
                  <TableCell className="hide-on-mobile">{task.site?.name || 'N/A'}</TableCell>
                )}
                <TableCell className="hide-on-tablet">
                    {task.assignedTo && task.assignedTo.length > 0
                        ? task.assignedTo.map(worker => worker.fullName).join(', ')
                        : 'Unassigned'}
                </TableCell>
                <TableCell className="hide-on-tablet">
                    <TaskMeta>
                        {task.allocatedWorkers && task.allocatedWorkers.length > 0 && <span><FaUsers size={10} /> {task.allocatedWorkers.length} workers</span>}
                        {task.allocatedEquipment && task.allocatedEquipment.length > 0 && <span><FaTools size={10} style={{marginLeft: task.allocatedWorkers.length > 0 ? '0.5rem' : '0'}}/> {task.allocatedEquipment.length} equipment</span>}
                        {(task.allocatedWorkers.length === 0 && task.allocatedEquipment.length === 0) && 'None'}
                    </TaskMeta>
                </TableCell>
                <TableCell><StatusBadge status={task.status}>{getStatusIcon(task.status)} {task.status}</StatusBadge></TableCell>
                <TableCell className="hide-on-mobile"><PriorityBadge priority={task.priority}><FaStar /> {task.priority}</PriorityBadge></TableCell>
                <TableCell>{moment(task.startDate).format('MMM Do, YYYY')}</TableCell>
                <TableCell>{moment(task.dueDate).format('MMM Do, YYYY')}</TableCell>
                <TableCell>{task.progress}%</TableCell>
                <TableCell>
                  <ActionButtonGroup>
                    <Button size="sm" variant="ghost" iconOnly title="View Details" onClick={() => onView(task)}><FaEye /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Edit Task" onClick={() => onEdit(task)}><FaEdit /></Button>
                    <Button size="sm" variant="ghost" iconOnly title="Delete Task" onClick={() => onDelete(task._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                  </ActionButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TableFooter>
        <span>Page {currentPage} of {totalPages} ({totalItems.toLocaleString()} tasks)</span>
        <PaginationControls>
          <Button size="sm" variant="secondary" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}><FaChevronLeft /> Prev</Button>
          <Button size="sm" variant="secondary" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Next <FaChevronRight /></Button>
        </PaginationControls>
      </TableFooter>
    </TableWrapper>
  );
};

export default TaskTable;