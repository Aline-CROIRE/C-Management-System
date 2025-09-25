// src/components/expenses/ExpenseManagement.js
"use client";
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaMoneyBillWave, FaFilter, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select'; // Assuming a common Select component
import LoadingSpinner from '../common/LoadingSpinner';
import { useExpenses } from '../../hooks/useExpenses';
import ExpenseModal from './ExpenseModal';
import Card from '../common/Card'; // Assuming you have a Card component

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const ExpenseContainer = styled.div`
  padding: 1.5rem;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const ExpenseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  color: ${(props) => props.theme.colors.heading};
`;

const FiltersSection = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const TableWrapper = styled.div`
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

const Th = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  border-bottom: 2px solid #e2e8f0;
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  color: #2d3748;
  vertical-align: middle;
  border-bottom: 1px solid #e2e8f0;
  &:last-child { border-bottom: none; }
`;

const EmptyState = styled.div`
  padding: 4rem;
  text-align: center;
  color: #718096;
  .icon { font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; }
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
`;
const PaginationControls = styled.div` display: flex; gap: 0.5rem; `;


const ExpenseManagement = ({ onAction, expenseToEdit = null }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [currentFilters, setCurrentFilters] = useState({});

    const { expenses, loading, error, createExpense, updateExpense, deleteExpense, pagination, setFilters, refetch } = useExpenses(currentFilters);

    // Categories for filter (same as in ExpenseModal, could be fetched from API)
    const expenseCategories = [
        "All Categories", "Rent", "Utilities", "Salaries", "Marketing", "Office Supplies",
        "Maintenance", "Software Subscriptions", "Travel", "Transportation", "Other"
    ];

    const handleSaveExpense = async (expenseData) => {
        let success;
        if (editingExpense) {
            success = await updateExpense(editingExpense._id, expenseData);
        } else {
            success = await createExpense(expenseData);
        }
        if (success) {
            setIsModalOpen(false);
            setEditingExpense(null);
            if(onAction) onAction(); // Notify parent for IMS refresh (e.g., dashboard stats)
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
            await deleteExpense(id);
            if(onAction) onAction(); // Notify parent for IMS refresh
        }
    };

    const openEditModal = (expense = null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentFilters(prev => ({
            ...prev,
            [name]: value === "All Categories" ? "" : value,
            page: 1, // Reset to first page on filter change
        }));
    };

    const handleClearFilters = () => {
      setCurrentFilters({});
      setFilters({}); // Also clear filters in the hook
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    if (error) return <ExpenseContainer>Error: {error}</ExpenseContainer>;

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) || 1 : 1;

    return (
        <ExpenseContainer>
            <ExpenseHeader>
                <PageTitle>Expense Management</PageTitle>
                <Button variant="primary" onClick={() => openEditModal()} disabled={loading}>
                    <FaPlus style={{marginRight: '0.5rem'}} /> Record New Expense
                </Button>
            </ExpenseHeader>
            
            <FiltersSection>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaFilter /> Filter Expenses</h3>
                <FilterGrid>
                    <FormGroup>
                        <Label htmlFor="search">Search</Label>
                        <Input
                            id="search"
                            name="search"
                            type="text"
                            placeholder="Description, payee, category..."
                            value={currentFilters.search || ''}
                            onChange={handleFilterChange}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="categoryFilter">Category</Label>
                        <Select
                            id="categoryFilter"
                            name="category"
                            value={currentFilters.category || 'All Categories'}
                            onChange={handleFilterChange}
                        >
                            {expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Select>
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="startDate">From Date</Label>
                        <Input
                            id="startDate"
                            name="startDate"
                            type="date"
                            value={currentFilters.startDate ? new Date(currentFilters.startDate).toISOString().split('T')[0] : ''}
                            onChange={handleFilterChange}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="endDate">To Date</Label>
                        <Input
                            id="endDate"
                            name="endDate"
                            type="date"
                            value={currentFilters.endDate ? new Date(currentFilters.endDate).toISOString().split('T')[0] : ''}
                            onChange={handleFilterChange}
                        />
                    </FormGroup>
                    <Button variant="secondary" onClick={handleClearFilters} style={{ gridColumn: 'span 2', maxWidth: '200px' }}>Clear Filters</Button>
                </FilterGrid>
            </FiltersSection>


            {loading && expenses.length === 0 ? (
                <div style={{padding: '4rem', textAlign: 'center'}}><LoadingSpinner /></div>
            ) : expenses.length === 0 ? (
                <EmptyState>
                    <div className="icon"><FaMoneyBillWave /></div>
                    <h3>No Expenses Recorded Yet</h3>
                    <p>Click 'Record New Expense' to get started or adjust your filters.</p>
                </EmptyState>
            ) : (
                <TableWrapper>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Date <FaCalendarAlt style={{marginLeft: '0.5rem'}}/></Th>
                                <Th>Category</Th>
                                <Th>Description</Th>
                                <Th>Payee</Th>
                                <Th style={{textAlign: 'right'}}>Amount (RWF)</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense._id}>
                                    <Td>{new Date(expense.date).toLocaleDateString()}</Td>
                                    <Td>{expense.category || 'N/A'}</Td>
                                    <Td>{expense.description}</Td>
                                    <Td>{expense.payee || 'N/A'}</Td>
                                    <Td style={{textAlign: 'right'}}>{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>
                                    <Td style={{display: 'flex', gap: '0.5rem'}}>
                                        <Button size="sm" variant="ghost" iconOnly title="Edit Expense" onClick={() => openEditModal(expense)}><FaEdit /></Button>
                                        <Button size="sm" variant="ghost" iconOnly title="Delete Expense" onClick={() => handleDeleteExpense(expense._id)}><FaTrash style={{color: '#c53030'}}/></Button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {pagination && (
                      <TableFooter>
                          <span>Page {pagination.page} of {totalPages} ({pagination.total.toLocaleString()} expenses)</span>
                          <PaginationControls>
                              <Button size="sm" variant="secondary" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}><FaChevronLeft /> Prev</Button>
                              <Button size="sm" variant="secondary" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}>Next <FaChevronRight /></Button>
                          </PaginationControls>
                      </TableFooter>
                    )}
                </TableWrapper>
            )}

            {isModalOpen && (
                <ExpenseModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveExpense}
                    loading={loading}
                    expenseToEdit={editingExpense}
                />
            )}
        </ExpenseContainer>
    );
};

export default ExpenseManagement;