"use client";

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  FaTimes, FaEdit, FaPrint, FaCheck, FaShippingFast, FaCalendar, FaUser, FaFileInvoiceDollar,
  FaBox, FaClipboardList, FaSpinner, FaRedo, FaTrash
} from "react-icons/fa";
import Button from "../common/Button";
import { poAPI } from "../../services/api";
import toast from "react-hot-toast";

const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(5px); `;
const ModalContent = styled.div` background: white; border-radius: 1rem; width: 100%; max-width: 900px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); `;
const ModalHeader = styled.div` padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; `;
const HeaderInfo = styled.div``;
const OrderNumber = styled.h2` font-size: 1.5rem; font-weight: 700; color: #2d3748; margin: 0 0 0.5rem 0; `;
const OrderStatus = styled.div` display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
  ${(props) => {
    switch (props.status?.toLowerCase()) {
      case "pending": return `background: #fefcbf; color: #d69e2e;`;
      case "ordered": return `background: #ebf4ff; color: #3182ce;`;
      case "shipped": return `background: #e6fffa; color: #319795;`;
      case "completed": return `background: #c6f6d5; color: #2f855a;`;
      case "cancelled": return `background: #fed7d7; color: #c53030;`;
      default: return `background: #e2e8f0; color: #718096;`;
    }
  }}
`;
const HeaderActions = styled.div` display: flex; gap: 0.5rem; align-items: flex-start; `;
const ModalBody = styled.div` padding: 2rem; overflow-y: auto; `;
const InfoGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; `;
const InfoCard = styled.div` background: #f7fafc; border-radius: 0.75rem; padding: 1.5rem; border: 1px solid #e2e8f0; `;
const InfoTitle = styled.h3` font-size: 1rem; font-weight: 600; color: #2d3748; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.75rem; `;
const InfoItem = styled.div` &:not(:last-child) { margin-bottom: 0.75rem; } `;
const InfoLabel = styled.div` font-size: 0.8rem; color: #718096; margin-bottom: 0.25rem; text-transform: uppercase; `;
const InfoValue = styled.div` font-size: 0.9rem; font-weight: 500; color: #2d3748; `;
const ItemsSection = styled.div` margin-bottom: 2rem; `;
const SectionTitle = styled.h3` font-size: 1.25rem; font-weight: 700; color: #2d3748; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.75rem; `;
const ItemsTable = styled.table` width: 100%; border-collapse: collapse; `;
const TableHeader = styled.thead` background: #f7fafc; `;
const TableCell = styled.td` padding: 1rem; font-size: 0.875rem; color: #2d3748; border-bottom: 1px solid #e2e8f0; `;
const TotalSection = styled.div` display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; @media(max-width: 768px) { grid-template-columns: 1fr; } `;
const TotalBreakdown = styled.div` background: #f7fafc; border-radius: 0.75rem; padding: 1.5rem; border: 1px solid #e2e8f0; margin-top: auto;`;
const TotalRow = styled.div` display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; &:not(:last-child) { margin-bottom: 0.75rem; } strong { font-weight: 600; color: #718096; } span { font-weight: 500; color: #2d3748; } &.grand-total { font-size: 1.25rem; font-weight: 700; padding-top: 1rem; border-top: 2px solid #e2e8f0; strong, span { color: #1a202c; } } `;
const ActionButtons = styled.div` display: flex; gap: 1rem; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0; background: #f7fafc; `;
const MainActions = styled.div` display: flex; gap: 1rem; flex-wrap: wrap; justify-content: flex-end; `;
const Spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const Spinner = styled(FaSpinner)` animation: ${Spin} 1s linear infinite; `;

const PurchaseOrderDetailsModal = ({ order, onClose, onReceive, onCancel, onMarkAsOrdered, onReorder, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const handleUpdateStatus = async (newStatus) => {
    setLoading(true);
    try {
      await onCancel(order._id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setPrintLoading(true);
    toast.loading('Generating PDF...');
    try {
        const responseBlob = await poAPI.generatePDF(order._id);
        const url = window.URL.createObjectURL(new Blob([responseBlob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PO-${order.orderNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('PDF Downloaded!');
    } catch (error) {
        toast.dismiss();
        toast.error(error.message || 'Failed to generate PDF.');
    } finally {
        setPrintLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return <FaCalendar />;
      case "ordered": return <FaShippingFast />;
      case "shipped": return <FaShippingFast />;
      case "completed": return <FaCheck />;
      case "cancelled": return <FaTimes />;
      default: return <FaFileInvoiceDollar />;
    }
  };

  if (!order) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderInfo>
            <OrderNumber>{order.orderNumber}</OrderNumber>
            <OrderStatus status={order.status}>{getStatusIcon(order.status)} {order.status}</OrderStatus>
          </HeaderInfo>
          <HeaderActions>
            <Button variant="ghost" iconOnly onClick={onClose}><FaTimes size={20}/></Button>
          </HeaderActions>
        </ModalHeader>
        <ModalBody>
            <InfoGrid>
              <InfoCard>
                <InfoTitle><FaUser /> Supplier Information</InfoTitle>
                <InfoItem><InfoLabel>Supplier Name</InfoLabel><InfoValue>{order.supplier?.name || "N/A"}</InfoValue></InfoItem>
                <InfoItem><InfoLabel>Email</InfoLabel><InfoValue>{order.supplier?.email || "N/A"}</InfoValue></InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoTitle><FaCalendar /> Order Dates</InfoTitle>
                <InfoItem><InfoLabel>Order Date</InfoLabel><InfoValue>{formatDate(order.orderDate)}</InfoValue></InfoItem>
                <InfoItem><InfoLabel>Expected Delivery</InfoLabel><InfoValue>{formatDate(order.expectedDate)}</InfoValue></InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoTitle><FaFileInvoiceDollar /> Financials</InfoTitle>
                <InfoItem><InfoLabel>Payment Terms</InfoLabel><InfoValue>{order.paymentTerms || "N/A"}</InfoValue></InfoItem>
                <InfoItem><InfoLabel>Total Amount</InfoLabel><InfoValue>Rwf {order.totalAmount?.toLocaleString() || "0.00"}</InfoValue></InfoItem>
              </InfoCard>
            </InfoGrid>
            <ItemsSection>
              <SectionTitle><FaClipboardList /> Order Items ({order.items?.length || 0})</SectionTitle>
              <ItemsTable>
                <TableHeader>
                  <tr>
                    <TableCell as="th">Item</TableCell>
                    <TableCell as="th" style={{textAlign: 'right'}}>Qty</TableCell>
                    <TableCell as="th" style={{textAlign: 'right'}}>Unit Price</TableCell>
                    <TableCell as="th" style={{textAlign: 'right'}}>Total</TableCell>
                  </tr>
                </TableHeader>
                <tbody>
                  {order.items?.map((item, index) => (
                    <tr key={item._id || index}>
                      <TableCell>
                        <div style={{ fontWeight: "600" }}>{item.item?.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#718096' }}>SKU: {item.item?.sku || 'N/A'}</div>
                      </TableCell>
                      <TableCell style={{textAlign: 'right'}}>{item.quantity}</TableCell>
                      <TableCell style={{textAlign: 'right'}}>Rwf {item.unitPrice?.toLocaleString()}</TableCell>
                      <TableCell style={{textAlign: 'right', fontWeight: '600'}}>
                        Rwf {(item.quantity * item.unitPrice).toLocaleString()}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </ItemsTable>
            </ItemsSection>
            <TotalSection>
              <div/>
              <TotalBreakdown>
                <TotalRow><strong>Subtotal:</strong> <span>Rwf {order.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></TotalRow>
                <TotalRow><strong>Tax:</strong> <span>Rwf {order.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></TotalRow>
                <TotalRow><strong>Shipping:</strong> <span>Rwf {order.shippingCost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></TotalRow>
                <TotalRow className="grand-total"><strong>Grand Total:</strong> <span>Rwf {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></TotalRow>
              </TotalBreakdown>
            </TotalSection>
            {order.notes && (
              <InfoCard>
                <InfoTitle>Notes</InfoTitle>
                <InfoValue style={{ whiteSpace: "pre-wrap" }}>{order.notes}</InfoValue>
              </InfoCard>
            )}
        </ModalBody>
        <ActionButtons>
          <div>
            <Button variant="danger-outline" onClick={() => onDelete(order._id)} disabled={loading}>
              <FaTrash /> Delete
            </Button>
          </div>
          <MainActions>
            <Button variant="outline" onClick={handlePrint} disabled={printLoading}>{printLoading ? <Spinner/> : <FaPrint />} Print PDF</Button>
            <Button variant="secondary" onClick={() => onReorder(order)} disabled={loading}><FaRedo /> Re-order</Button>
            {order.status === "Pending" && (
              <Button variant="primary" onClick={() => onMarkAsOrdered(order._id)} disabled={loading}>{loading ? <Spinner/> : <FaShippingFast />} Mark as Ordered</Button>
            )}
            {["Ordered", "Shipped"].includes(order.status) && (
              <Button variant="success" onClick={onReceive} disabled={loading}><FaCheck /> Receive Items</Button>
            )}
            {!["Completed", "Cancelled"].includes(order.status) && (
              <Button variant="outline" disabled={loading}><FaEdit /> Edit Order</Button>
            )}
          </MainActions>
        </ActionButtons>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PurchaseOrderDetailsModal;