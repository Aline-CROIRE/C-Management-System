// src/components/reports/DailyStockReport.js
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaBoxes, FaCalendarAlt, FaRedo, FaFilter, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from 'date-fns/locale';
import moment from 'moment';
import { useDailyStockSnapshots } from '../../hooks/useDailyStockSnapshots'; // NEW Hook
// import { useInventory } from '../../hooks/useInventory'; // Not using directly, passing inventoryItems from IMS
import toast from 'react-hot-toast';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const ReportContainer = styled.div`
  padding: 2rem;
  background-color: ${(props) => props.theme.colors.background};
  min-height: calc(100vh - 80px);
  animation: ${fadeIn} 0.5s ease-out;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const DateRangePickerContainer = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
`;

const FiltersCard = styled(Card)`
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
const FilterWrapper = styled.div`
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const DailyStockReport = ({ inventoryItems }) => { // Receives inventoryItems as prop
    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            startDate: moment().subtract(7, 'days').toDate(),
            endDate: moment().toDate(),
            key: 'selection'
        }
    ]);
    const [currentFilters, setCurrentFilters] = useState({});

    const { snapshots, loading, error, pagination, setFilters, refetch, generateSingleSnapshot } = useDailyStockSnapshots(currentFilters);

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            startDate: dateRange[0].startDate,
            endDate: dateRange[0].endDate,
        }));
    }, [dateRange, setFilters]);

    const handleDateRangeSelect = (ranges) => {
        setDateRange([ranges.selection]);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1,
        }));
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1,
        }));
    };

    const handleClearFilters = () => {
        setCurrentFilters({});
        setFilters({});
        setDateRange([
            {
                startDate: moment().subtract(7, 'days').toDate(),
                endDate: moment().toDate(),
                key: 'selection'
            }
        ]);
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleGenerateSnapshot = async (item) => {
        if (window.confirm(`Generate snapshot for ${item.name} (${item.sku}) for today? This is for testing only.`)) {
            const success = await generateSingleSnapshot(new Date(), item._id);
            if(success) toast.success(`Snapshot for ${item.name} generated for today.`);
        }
    };


    if (loading) {
        return (
            <ReportContainer>
                <LoadingSpinner message="Loading Daily Stock Report..." />
            </ReportContainer>
        );
    }

    if (error) {
        return (
            <ReportContainer>
                <Card><p style={{color: 'red'}}>Error: {error}</p></Card>
            </ReportContainer>
        );
    }

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) || 1 : 1;

    return (
        <ReportContainer>
            <ReportHeader>
                <Title><FaBoxes /> Daily Stock Report</Title>
                <FilterSection>
                    <FilterWrapper>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                            icon={<FaCalendarAlt />}
                        >
                            {moment(dateRange[0].startDate).format('MMM D, YYYY')} - {moment(dateRange[0].endDate).format('MMM D, YYYY')}
                        </Button>
                        {showDateRangePicker && (
                            <DateRangePickerContainer>
                                <DateRange
                                    ranges={dateRange}
                                    onChange={handleDateRangeSelect}
                                    moveRangeOnFirstSelection={false}
                                    months={2}
                                    direction="horizontal"
                                    locale={enUS}
                                />
                            </DateRangePickerContainer>
                        )}
                    </FilterWrapper>
                    <Button variant="outline" onClick={refetch} icon={<FaRedo />}>
                        Refresh
                    </Button>
                </FilterSection>
            </ReportHeader>

            <FiltersCard>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaFilter /> Filter Snapshots</h3>
                <FilterGrid>
                    <FormGroup>
                        <Label htmlFor="itemFilter">Item</Label>
                        <Select
                            id="itemFilter"
                            name="itemId"
                            value={currentFilters.itemId || ''}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Items</option>
                            {inventoryItems.map(item => (
                                <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                            ))}
                        </Select>
                    </FormGroup>
                    <Button variant="secondary" onClick={handleClearFilters}>Clear Filters</Button>
                </FilterGrid>
            </FiltersCard>

            {snapshots.length === 0 ? (
                <EmptyState>
                    <div className="icon"><FaBoxes /></div>
                    <h3>No Daily Stock Snapshots Found</h3>
                    <p>Snapshots are usually generated automatically overnight. If this is a new system or item, manual generation might be needed for testing (admin functionality).</p>
                    <p style={{marginTop: '1rem'}}>
                       **Note:** If you want to test the generation of a snapshot for a specific item for today, select an item and click "Generate Test Snapshot". (This is a simplified manual trigger for demonstration).
                    </p>
                    {currentFilters.itemId && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                const selectedItem = inventoryItems.find(i => i._id === currentFilters.itemId);
                                if (selectedItem) handleGenerateSnapshot(selectedItem);
                                else toast.error("Please select an item to generate a snapshot.");
                            }}
                            style={{marginTop: '1rem'}}
                        >
                            <FaPlus style={{marginRight: '0.5rem'}}/> Generate Test Snapshot for Selected Item
                        </Button>
                    )}
                </EmptyState>
            ) : (
                <TableWrapper>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Date</Th>
                                <Th>Product Name</Th>
                                <Th>SKU</Th>
                                <Th>Opening Qty</Th>
                                <Th>Closing Qty</Th>
                                <Th>Net Change</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {snapshots.map(snapshot => (
                                <tr key={snapshot._id}>
                                    <Td>{moment(snapshot.date).format('YYYY-MM-DD')}</Td>
                                    <Td>{snapshot.item?.name || 'N/A'}</Td>
                                    <Td>{snapshot.item?.sku || 'N/A'}</Td>
                                    <Td>{snapshot.openingQuantity?.toLocaleString()} {snapshot.item?.unit || ''}</Td>
                                    <Td>{snapshot.closingQuantity?.toLocaleString()} {snapshot.item?.unit || ''}</Td>
                                    <Td>
                                        {(snapshot.closingQuantity - snapshot.openingQuantity) > 0 ? `+${(snapshot.closingQuantity - snapshot.openingQuantity).toLocaleString()}` : (snapshot.closingQuantity - snapshot.openingQuantity).toLocaleString()}
                                        {snapshot.item?.unit || ''}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {pagination && (
                        <TableFooter>
                            <span>Page {pagination.page} of {totalPages} ({pagination.total.toLocaleString()} records)</span>
                            <PaginationControls>
                                <Button size="sm" variant="secondary" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}><FaChevronLeft /> Prev</Button>
                                <Button size="sm" variant="secondary" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}>Next <FaChevronRight /></Button>
                            </PaginationControls>
                        </TableFooter>
                    )}
                </TableWrapper>
            )}
        </ReportContainer>
    );
};

export default DailyStockReport;