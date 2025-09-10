import React, { useState } from 'react';
import styled from 'styled-components';
import { FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import Table from '../../common/Table';
import Button from '../../common/Button';
import SearchInput from '../../common/SearchInput';

const TableContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TableActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors?.border};
`;

const MaterialInventoryTable = ({ loading, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    { header: 'Material ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Unit', accessor: 'unit' },
    { header: 'Last Updated', accessor: 'lastUpdated' },
    {
      header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="icon" onClick={() => onEdit(row.original.id)}>
            <FaEdit />
          </Button>
          <Button variant="icon" color="danger" onClick={() => onDelete(row.original.id)}>
            <FaTrash />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <TableContainer>
      <TableActions>
        <SearchInput
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<FaSearch />}
        />
      </TableActions>
      <Table
        columns={columns}
        data={[]} // This will be populated from props
        loading={loading}
        pagination
        searchTerm={searchTerm}
      />
    </TableContainer>
  );
};

export default MaterialInventoryTable;