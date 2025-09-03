"use client"

import { useRef } from "react"
import styled from "styled-components"
import { FaPrint, FaDownload, FaReceipt, FaUser } from "react-icons/fa"
import Button from "../common/Button"
import Card from "../common/Card"

const ReceiptContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const ReceiptCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  box-shadow: ${(props) => props.theme.shadows?.xl || "0 20px 25px -5px rgba(27, 67, 50, 0.1)"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const ReceiptHeader = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing?.["2xl"] || "3rem"} 0;
  border-bottom: 2px solid ${(props) => props.theme.colors?.primary || "#1b4332"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: ${(props) => props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
    border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  }
`

const CompanyLogo = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  background: ${(props) => props.theme.gradients?.primary || "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  margin: 0 auto ${(props) => props.theme.spacing?.lg || "1.5rem"};
  box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(64, 145, 108, 0.3)"};
`

const CompanyName = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const CompanyAddress = styled.p`
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  line-height: ${(props) => props.theme.typography?.lineHeight?.relaxed || "1.625"};
  margin: 0;
`

const ReceiptInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    grid-template-columns: 1fr;
    gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  }
`

const InfoSection = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  border-left: 4px solid ${(props) => props.theme.colors?.primary || "#1b4332"};
`

const InfoTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const InfoContent = styled.div`
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  line-height: ${(props) => props.theme.typography?.lineHeight?.relaxed || "1.625"};

  p {
    margin: 0 0 ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
  }

  strong {
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }
`

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const TableHeader = styled.thead`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

const TableHeaderCell = styled.th`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  text-align: left;
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const TableBody = styled.tbody``

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};

  &:last-child {
    border-bottom: none;
  }
`

const TableCell = styled.td`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
`

const TotalSection = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  border: 2px solid ${(props) => props.theme.colors?.primary || "#1b4332"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};

  &:last-child {
    margin-bottom: 0;
    padding-top: ${(props) => props.theme.spacing?.md || "1rem"};
    border-top: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }
`

const Footer = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing?.xl || "2rem"} 0;
  border-top: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
`

const ActionButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  justify-content: center;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  flex-wrap: wrap;

  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    button {
      flex: 1;
    }
  }
`

const ReceiptGenerator = ({ receiptData, onClose }) => {
  const receiptRef = useRef()

  // Sample receipt data
  const defaultReceiptData = {
    receiptNumber: "RCP-2024-001",
    date: new Date().toLocaleDateString(),
    customer: {
      name: "Green Valley Construction",
      address: "123 Main Street, City, State 12345",
      phone: "+1 (555) 123-4567",
      email: "contact@greenvalley.com",
    },
    items: [
      {
        id: 1,
        name: "Construction Steel Bars",
        sku: "CSB-001",
        quantity: 50,
        unit: "pieces",
        unitPrice: 125.0,
        total: 6250.0,
      },
      {
        id: 2,
        name: "Industrial Cement",
        sku: "IC-003",
        quantity: 25,
        unit: "bags",
        unitPrice: 15.75,
        total: 393.75,
      },
      {
        id: 3,
        name: "Construction Tools Set",
        sku: "CTS-005",
        quantity: 3,
        unit: "sets",
        unitPrice: 450.0,
        total: 1350.0,
      },
    ],
    subtotal: 7993.75,
    tax: 799.38,
    discount: 200.0,
    total: 8593.13,
  }

  const receipt = receiptData || defaultReceiptData

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    alert("PDF download functionality would be implemented here")
  }

  return (
    <ReceiptContainer>
      <ActionButtons>
        <Button variant="outline" onClick={handlePrint}>
          <FaPrint /> Print Receipt
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <FaDownload /> Download PDF
        </Button>
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </ActionButtons>

      <ReceiptCard ref={receiptRef}>
        <ReceiptHeader>
          <CompanyLogo>
            <FaReceipt />
          </CompanyLogo>
          <CompanyName>Comprehensive Management System</CompanyName>
          <CompanyAddress>
            123 Business Avenue, Suite 100
            <br />
            Business City, State 12345
            <br />
            Phone: +1 (555) 123-4567 | Email: info@cms.com
          </CompanyAddress>
        </ReceiptHeader>

        <ReceiptInfo>
          <InfoSection>
            <InfoTitle>
              <FaReceipt /> Receipt Information
            </InfoTitle>
            <InfoContent>
              <p>
                <strong>Receipt #:</strong> {receipt.receiptNumber}
              </p>
              <p>
                <strong>Date:</strong> {receipt.date}
              </p>
              <p>
                <strong>Time:</strong> {new Date().toLocaleTimeString()}
              </p>
            </InfoContent>
          </InfoSection>

          <InfoSection>
            <InfoTitle>
              <FaUser /> Customer Information
            </InfoTitle>
            <InfoContent>
              <p>
                <strong>Name:</strong> {receipt.customer.name}
              </p>
              <p>
                <strong>Address:</strong> {receipt.customer.address}
              </p>
              <p>
                <strong>Phone:</strong> {receipt.customer.phone}
              </p>
              <p>
                <strong>Email:</strong> {receipt.customer.email}
              </p>
            </InfoContent>
          </InfoSection>
        </ReceiptInfo>

        <ItemsTable>
          <TableHeader>
            <tr>
              <TableHeaderCell>Item</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Unit Price</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {receipt.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <strong>{item.name}</strong>
                </TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell>
                  <strong>${item.total.toFixed(2)}</strong>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ItemsTable>

        <TotalSection>
          <TotalRow>
            <span>Subtotal:</span>
            <span>${receipt.subtotal.toFixed(2)}</span>
          </TotalRow>
          <TotalRow>
            <span>Tax (10%):</span>
            <span>${receipt.tax.toFixed(2)}</span>
          </TotalRow>
          <TotalRow>
            <span>Discount:</span>
            <span>-${receipt.discount.toFixed(2)}</span>
          </TotalRow>
          <TotalRow>
            <span>Total Amount:</span>
            <span>${receipt.total.toFixed(2)}</span>
          </TotalRow>
        </TotalSection>

        <Footer>
          <p>
            <strong>Thank you for your business!</strong>
          </p>
          <p>This receipt was generated by the Comprehensive Management System</p>
          <p>For support, contact us at support@cms.com or +1 (555) 123-4567</p>
        </Footer>
      </ReceiptCard>
    </ReceiptContainer>
  )
}

export default ReceiptGenerator
