// client/src/components/construction/task-management/GanttChartDisplay.js
"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import Gantt from 'frappe-gantt';
import '../../../styles/frappe-gantt.css';
import styled from 'styled-components';
import { FaSpinner, FaChartBar, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import Card from '../../common/Card';

const GanttChartContainer = styled.div`
  background: ${(props) => props.theme?.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme?.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme?.shadows?.lg || "0 4px 6px rgba(0, 0, 0, 0.1)"};
  padding: 1rem;
  overflow: hidden; /* Ensures chart doesn't break out of container */
  min-height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .gantt-container {
    width: 100%;
    height: 100%; /* Fill parent container height */
    min-height: 400px;
    overflow-x: auto; /* Important for horizontal scrolling within the chart */
    overflow-y: hidden; /* Gantt usually handles its own vertical scroll */
    padding: 1rem 0;
  }

  .gantt {
    width: 100% !important; /* Override inline styles from Frappe Gantt */
    height: auto !important; /* Allow Frappe Gantt to determine its height based on tasks */
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 200px;
  color: ${(props) => props.theme?.colors?.textSecondary || '#718096'};
`;

const InvalidTaskItem = styled.div`
  background-color: ${(props) => props.theme?.colors?.errorLight || '#ffebee'};
  color: ${(props) => props.theme?.colors?.error || 'red'};
  padding: 0.5rem;
  border: 1px solid ${(props) => props.theme?.colors?.error || 'red'};
  border-radius: ${(props) => props.theme?.borderRadius?.md || '4px'};
  margin: 0.25rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;


const GanttChartDisplay = ({ tasks = [], loading = false, error = null }) => {
  const ganttRef = useRef(null);
  const ganttInstance = useRef(null);
  const [isGanttInitialized, setIsGanttInitialized] = useState(false);

  const { memoizedFrappeTasks, invalidTaskEntries } = useMemo(() => {
    const processedTasks = [];
    const invalidEntries = [];

    const cleanTasks = Array.isArray(tasks) ? tasks.filter(task => task && typeof task === 'object') : [];

    cleanTasks.forEach(task => {
      const id = (task._id && typeof task._id === 'string') ? task._id : `task-gen-${Math.random().toString(36).substring(7)}`;
      
      let name = (task.name && typeof task.name === 'string' && task.name.trim() !== '') ? task.name.trim() : `Unnamed Task (ID: ${id.substring(0, Math.min(8, id.length))}...)`;
      if (name.includes('Unnamed Task (ID: undefined...)') || name.trim() === '') {
          name = 'Unnamed Task';
      }

      let startDateStr = '';
      if (task.startDate) {
        try {
          const date = new Date(task.startDate);
          if (!isNaN(date.getTime())) {
            startDateStr = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn(`GanttChart: Invalid startDate for task ID: ${id}. Original value: ${task.startDate}. Error:`, e);
        }
      }

      let dueDateStr = '';
      if (task.dueDate) {
        try {
          const date = new Date(task.dueDate);
          if (!isNaN(date.getTime())) {
            dueDateStr = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn(`GanttChart: Invalid dueDate for task ID: ${id}. Original value: ${task.dueDate}. Error:`, e);
        }
      }
      
      const progress = (typeof task.progress === 'number' && task.progress >= 0 && task.progress <= 100) ? Math.round(task.progress) : 0;

      const dependencies = Array.isArray(task.dependencies)
        ? task.dependencies
            .map(dep => {
              // Handle both direct ID strings and populated objects {taskId: { _id, ... }}
              if (dep && typeof dep === 'object' && dep.taskId && typeof dep.taskId === 'object' && dep.taskId._id && typeof dep.taskId._id === 'string') return dep.taskId._id;
              if (dep && typeof dep === 'object' && dep.taskId && typeof dep.taskId === 'string') return dep.taskId; // If already an ID string
              if (typeof dep === 'string' && dep.trim() !== '') return dep.trim(); // Direct dependency ID string
              return null;
            })
            .filter(Boolean)
            .join(',')
        : '';
      
      const custom_class = (task.status && typeof task.status === 'string')
                         ? `status-${task.status.toLowerCase().replace(/\s/g, '-')}`
                         : 'status-unknown';

      if (id && startDateStr && dueDateStr) {
        processedTasks.push({
          id: id,
          name: name,
          start: startDateStr,
          end: dueDateStr,
          progress: progress,
          dependencies: dependencies,
          custom_class: custom_class,
        });
      } else {
        let reason = [];
        if (!id) reason.push('Missing ID');
        if (!startDateStr) reason.push('Missing/Invalid Start Date');
        if (!dueDateStr) reason.push('Missing/Invalid Due Date');
        if (!task.name || typeof task.name !== 'string' || task.name.trim() === '') reason.push('Original Name Missing/Invalid');


        invalidEntries.push({
          id: id,
          name: task.name || 'N/A',
          reason: reason.join(', ') || 'Unknown Issue',
        });
        console.warn(`GanttChart: Task skipped due to invalid critical data:`, task);
      }
    });

    return { memoizedFrappeTasks: processedTasks, invalidTaskEntries: invalidEntries };
  }, [tasks]);

  useEffect(() => {
    // Cleanup function for when component unmounts or dependencies change
    const cleanupGantt = () => {
      if (ganttInstance.current) {
        // No explicit destroy method for Frappe Gantt, but nulling the ref
        // and clearing the DOM element helps prevent memory leaks and conflicts
        ganttInstance.current = null;
      }
      if (ganttRef.current) {
        ganttRef.current.innerHTML = ''; // Clear the DOM element
      }
      setIsGanttInitialized(false);
    };

    if (!ganttRef.current) {
        cleanupGantt(); // If ref is somehow null, ensure cleanup
        return;
    }

    if (memoizedFrappeTasks.length > 0) {
      if (!isGanttInitialized) {
        ganttRef.current.innerHTML = ''; // Clear previous content before initializing
        
        // Deep clone to ensure Frappe Gantt doesn't mutate our memoized array
        const tasksForGantt = JSON.parse(JSON.stringify(memoizedFrappeTasks));

        try {
          ganttInstance.current = new Gantt(ganttRef.current, tasksForGantt, {
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
            bar_height: 40,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            date_format: 'YYYY-MM-DD',
            language: 'en',
            view_mode: 'Week',
            custom_popup_html: null, // Customize popup if needed, or set to null for default
          });
          setIsGanttInitialized(true);

          // Trigger a resize event after a short delay to ensure Gantt chart renders correctly
          // especially if rendered in a hidden/initially small container
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);

        } catch (err) {
            console.error("GanttChart: Error initializing Frappe Gantt instance:", err);
            cleanupGantt(); // Ensure cleanup on initialization error
        }

      } else {
        // If already initialized, just refresh with new data
        const tasksForRefresh = JSON.parse(JSON.stringify(memoizedFrappeTasks));
        ganttInstance.current.refresh(tasksForRefresh);
      }
    } else {
      // If no tasks, ensure Gantt is cleaned up
      cleanupGantt();
    }

    return cleanupGantt; // Return cleanup function for useEffect
  }, [memoizedFrappeTasks, isGanttInitialized]); // Corrected typo here

  if (loading && memoizedFrappeTasks.length === 0) {
    return (
      <GanttChartContainer>
        <LoadingOverlay>
          <FaSpinner className="spinner" size={32} />
          <p>Loading tasks for Gantt chart...</p>
        </LoadingOverlay>
      </GanttChartContainer>
    );
  }

  if (error) {
    return (
      <GanttChartContainer>
        <Card style={{ padding: '2rem', textAlign: 'center', background: '#ffebee', color: '#d32f2f' }}>
          <FaExclamationTriangle size={32} style={{ marginBottom: '1rem' }} />
          <h3>Error Loading Gantt Chart</h3>
          <p>{error.message || "An unexpected error occurred while loading the chart."}</p>
        </Card>
      </GanttChartContainer>
    );
  }

  if (memoizedFrappeTasks.length === 0 && !loading) {
    return (
      <GanttChartContainer>
        <EmptyState>
          <FaChartBar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Tasks to Display</h3>
          <p>Add some tasks to visualize your project timeline with valid names, start, and due dates.</p>
          {invalidTaskEntries.length > 0 && (
            <div style={{ marginTop: '1rem', textAlign: 'left', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <p style={{ fontWeight: 'bold' }}><FaExclamationTriangle style={{marginRight: '0.5rem', color: 'orange'}} /> The following tasks could not be fully displayed:</p>
                {invalidTaskEntries.map((entry, index) => (
                    <InvalidTaskItem key={index}>
                        <FaInfoCircle size={14} />
                        Task ID: {entry.id} (Original Name: "{entry.name}", Reason: {entry.reason})
                    </InvalidTaskItem>
                ))}
            </div>
        )}
        </EmptyState>
      </GanttChartContainer>
    );
  }

  return (
    <GanttChartContainer>
      {invalidTaskEntries.length > 0 && (
          <div style={{ color: 'red', fontStyle: 'italic', padding: '0.5rem', marginBottom: '0.5rem', width: '100%', maxWidth: '800px', margin: '0 auto 1rem auto' }}>
              <p style={{ fontWeight: 'bold' }}><FaExclamationTriangle style={{marginRight: '0.5rem', color: 'orange'}} /> Some tasks could not be fully displayed:</p>
              {invalidTaskEntries.map((entry, index) => (
                  <InvalidTaskItem key={index}>
                      <FaInfoCircle size={14} />
                      Task ID: {entry.id} (Original Name: "{entry.name}", Reason: {entry.reason})
                  </InvalidTaskItem>
              ))}
          </div>
      )}
      <div ref={ganttRef} className="gantt-container" />
    </GanttChartContainer>
  );
};

export default GanttChartDisplay;
