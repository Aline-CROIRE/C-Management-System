import React from 'react';
import styled from 'styled-components';
import { FaTimes, FaRedo } from 'react-icons/fa';
import Button from '../common/Button';

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1001; padding: 1rem; backdrop-filter: blur(5px); animation: fadeIn 0.3s;`;
const ModalContent = styled.div` background: ${(props) => props.theme.colors.surface}; border-radius: ${(props) => props.theme.borderRadius.xl}; width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: ${(props) => props.theme.shadows.xl}; animation: slideIn 0.3s;`;
const ModalHeader = styled.div` padding: 1rem 1.5rem; border-bottom: 1px solid ${(props) => props.theme.colors.border}; display: flex; justify-content: space-between; align-items: center;`;
const ModalTitle = styled.h2` font-size: 1.25rem; font-weight: 700; margin: 0; `;
const ModalBody = styled.div` padding: 1.5rem; flex-grow: 1; overflow-y: auto;`;
const ModalFooter = styled.div` padding: 1rem 1.5rem; border-top: 1px solid ${(props) => props.theme.colors.border}; display: flex; justify-content: flex-end; align-items: center; gap: 1rem; background: ${(props) => props.theme.colors.surfaceLight};`;
const DetailGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;`;
const DetailItem = styled.div` display: flex; flex-direction: column;`;
const DetailLabel = styled.span` font-size: 0.875rem; color: ${(props) => props.theme.colors.textSecondary}; margin-bottom: 0.25rem;`;
const DetailValue = styled.span` font-weight: 600; font-size: 1rem;`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
  }
  thead th { background: ${(props) => props.theme.colors.surfaceLight}; }
`;

const ViewPOModal = ({ po, onClose, onReorder, onUpdateStatus }) => {
  if (!po) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Purchase Order Details: #{po.orderNumber}</ModalTitle>
          <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
        </ModalHeader>
        <ModalBody>
          <DetailGrid>
            <DetailItem><DetailLabel>Supplier</DetailLabel><DetailValue>{po.supplier.name}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Status</DetailLabel><DetailValue>{po.status}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Order Date</DetailLabel><DetailValue>{new Date(po.createdAt).toLocaleDateString()}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Expected Date</DetailLabel><DetailValue>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'N/A'}</DetailValue></DetailItem>
          </DetailGrid>

          <h4>Items Ordered</h4>
          <ItemTable>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>RWF {item.unitPrice.toLocaleString()}</td>
                  <td>RWF {(item.quantity * item.unitPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </ItemTable>
          
          <div style={{textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1rem'}}>
            Grand Total: RWF {po.totalAmount.toLocaleString()}
          </div>

          {po.notes && (
            <div style={{marginTop: '2rem'}}>
              <h4>Notes:</h4>
              <p style={{fontStyle: 'italic', background: '#f8f9fa', padding: '1rem', borderRadius: '8px'}}>{po.notes}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => onReorder(po)}><FaRedo /> Re-order</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ViewPOModal;