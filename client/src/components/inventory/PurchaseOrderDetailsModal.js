"use client"

import { useState } from "react"
import styled from "styled-components"
import {
  FaTimes,
  FaEdit,
  FaPrint,
  FaDownload,
  FaCheck,
  FaShippingFast,
  FaCalendar,
  FaUser,
  FaFileInvoiceDollar,
  FaBox,
  FaClipboardList,
} from "react-icons/fa"
import Button from "../common/Button"
import { purchaseOrdersAPI } from "../../services/api"
import { useNotifications } from "../../contexts/NotificationContext"

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`

const ModalContent = styled.div`
  background: white;
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows?.xl || "0 25px 50px -12px rgba(0, 0, 0, 0.25)"};
`

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const HeaderInfo = styled.div`
  flex: 1;
`

const OrderNumber = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0 0 0.5rem 0;
`

const OrderStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    switch (props.status) {
      case "draft":
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
      case "pending":
        return `
          background: ${props.theme.colors?.warning || "#ed8936"}20;
          color: ${props.theme.colors?.warning || "#ed8936"};
        `
      case "approved":
        return `
          background: ${props.theme.colors?.primary || "#1b4332"}20;
          color: ${props.theme.colors?.primary || "#1b4332"};
        `
      case "ordered":
        return `
          background: #667eea20;
          color: #667eea;
        `
      case "received":
        return `
          background: ${props.theme.colors?.success || "#2d5016"}20;
          color: ${props.theme.colors?.success || "#2d5016"};
        `
      case "cancelled":
        return `
          background: ${props.theme.colors?.error || "#c53030"}20;
          color: ${props.theme.colors?.error || "#c53030"};
        `
      default:
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
    }
  }}
`

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }
`

const ModalBody = styled.div`
  padding: 2rem;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`

const InfoCard = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: 1.5rem;
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const InfoTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const InfoItem = styled.div`
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin-bottom: 0.25rem;
`

const InfoValue = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
`

const ItemsSection = styled.div`
  margin-bottom: 2rem;
`

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const TableHeader = styled.thead`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const TableBody = styled.tbody``

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};

  &:last-child {
    border-bottom: none;
  }
`

const TableCell = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
`

const TotalSection = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: 1.5rem;
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  margin-bottom: 2rem;
`

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;

  &:last-child {
    margin-bottom: 0;
    font-size: 1.125rem;
    font-weight: 700;
    padding-top: 0.5rem;
    border-top: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const PurchaseOrderDetailsModal = ({ order, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotifications()

  const handleApprove = async () => {
    try {
      setLoading(true)
      await purchaseOrdersAPI.approve(order.id)

      addNotification({
        type: "success",
        title: "Order Approved",
        message: `Purchase order ${order.orderNumber} has been approved`,
      })

      onUpdate()
      onClose()
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error Approving Order",
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReceive = async () => {
    try {
      setLoading(true)
      // In a real app, this would open a receive items modal
      await purchaseOrdersAPI.receive(order.id, order.items)

      addNotification({
        type: "success",
        title: "Order Received",
        message: `Purchase order ${order.orderNumber} has been marked as received`,
      })

      onUpdate()
      onClose()
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error Receiving Order",
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    try {
      const response = await purchaseOrdersAPI.generatePDF(order.id)

      if (response.downloadUrl) {
        const link = document.createElement("a")
        link.href = response.downloadUrl
        link.download = `PO-${order.orderNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      addNotification({
        type: "success",
        title: "PDF Generated",
        message: "Purchase order PDF has been downloaded",
      })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error Generating PDF",
        message: error.message,
      })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "draft":
        return <FaEdit />
      case "pending":
        return <FaCalendar />
      case "approved":
        return <FaCheck />
      case "ordered":
        return <FaShippingFast />
      case "received":
        return <FaBox />
      case "cancelled":
        return <FaTimes />
      default:
        return <FaFileInvoiceDollar />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderInfo>
            <OrderNumber>{order.orderNumber}</OrderNumber>
            <OrderStatus status={order.status}>
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </OrderStatus>
          </HeaderInfo>
          <HeaderActions>
            <CloseButton onClick={onClose}>
              <FaTimes />
            </CloseButton>
          </HeaderActions>
        </ModalHeader>

        <ModalBody>
          {/* Order Information */}
          <InfoGrid>
            <InfoCard>
              <InfoTitle>
                <FaUser /> Supplier Information
              </InfoTitle>
              <InfoItem>
                <InfoLabel>Supplier Name</InfoLabel>
                <InfoValue>{order.supplier}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Contact Person</InfoLabel>
                <InfoValue>{order.contactPerson || "N/A"}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{order.supplierEmail || "N/A"}</InfoValue>
              </InfoItem>
            </InfoCard>

            <InfoCard>
              <InfoTitle>
                <FaCalendar /> Order Dates
              </InfoTitle>
              <InfoItem>
                <InfoLabel>Order Date</InfoLabel>
                <InfoValue>{formatDate(order.orderDate)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Expected Delivery</InfoLabel>
                <InfoValue>{order.expectedDate ? formatDate(order.expectedDate) : "Not specified"}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Last Updated</InfoLabel>
                <InfoValue>{formatDate(order.lastUpdated || order.orderDate)}</InfoValue>
              </InfoItem>
            </InfoCard>

            <InfoCard>
              <InfoTitle>
                <FaFileInvoiceDollar /> Order Summary
              </InfoTitle>
              <InfoItem>
                <InfoLabel>Total Items</InfoLabel>
                <InfoValue>{order.items?.length || order.itemCount || 0}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Subtotal</InfoLabel>
                <InfoValue>${order.subtotal?.toLocaleString() || "0.00"}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Total Amount</InfoLabel>
                <InfoValue>${order.totalAmount?.toLocaleString() || "0.00"}</InfoValue>
              </InfoItem>
            </InfoCard>
          </InfoGrid>

          {/* Order Items */}
          <ItemsSection>
            <SectionTitle>
              <FaClipboardList /> Order Items
            </SectionTitle>

            {order.items && order.items.length > 0 ? (
              <ItemsTable>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>SKU</TableHeaderCell>
                    <TableHeaderCell>Quantity</TableHeaderCell>
                    <TableHeaderCell>Unit Price</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div style={{ fontWeight: "600" }}>{item.name}</div>
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: "600" }}>
                          ${item.total?.toFixed(2) || (item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ItemsTable>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#718096",
                  background: "#f7fafc",
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                No items found for this order
              </div>
            )}
          </ItemsSection>

          {/* Order Total */}
          <TotalSection>
            <TotalRow>
              <span>Subtotal:</span>
              <span>${order.subtotal?.toFixed(2) || "0.00"}</span>
            </TotalRow>
            <TotalRow>
              <span>Tax:</span>
              <span>${order.tax?.toFixed(2) || "0.00"}</span>
            </TotalRow>
            <TotalRow>
              <span>Shipping:</span>
              <span>${order.shipping?.toFixed(2) || "0.00"}</span>
            </TotalRow>
            <TotalRow>
              <span>Total:</span>
              <span>${order.totalAmount?.toFixed(2) || "0.00"}</span>
            </TotalRow>
          </TotalSection>

          {/* Notes */}
          {order.notes && (
            <InfoCard style={{ marginBottom: "2rem" }}>
              <InfoTitle>Notes</InfoTitle>
              <InfoValue style={{ whiteSpace: "pre-wrap" }}>{order.notes}</InfoValue>
            </InfoCard>
          )}

          {/* Action Buttons */}
          <ActionButtons>
            <Button variant="outline" onClick={handlePrint}>
              <FaPrint /> Print PDF
            </Button>

            <Button variant="outline">
              <FaDownload /> Export
            </Button>

            {order.status === "pending" && (
              <Button variant="primary" onClick={handleApprove} disabled={loading}>
                <FaCheck /> Approve Order
              </Button>
            )}

            {order.status === "approved" && (
              <Button variant="success" onClick={handleReceive} disabled={loading}>
                <FaBox /> Mark as Received
              </Button>
            )}

            <Button variant="outline">
              <FaEdit /> Edit Order
            </Button>
          </ActionButtons>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  )
}

export default PurchaseOrderDetailsModal
