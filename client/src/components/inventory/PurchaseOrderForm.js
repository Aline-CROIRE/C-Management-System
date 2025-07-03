"use client"

import { useState } from "react"
import styled from "styled-components"
import { FaPlus, FaTrash, FaCalendar, FaUser, FaSave, FaTimes } from "react-icons/fa"
import Card from "../common/Card"
import Button from "../common/Button"
import Input from "../common/Input"

const FormContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const FormHeader = styled.div`
  background: ${(props) => props.theme.gradients?.primary || "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)"};
  color: white;
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const FormTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const FormSubtitle = styled.p`
  opacity: 0.9;
  margin: 0;
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    grid-template-columns: 1fr;
  }
`

const FormSection = styled(Card)`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const SectionTitle = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const ItemsSection = styled(Card)`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const TableHeader = styled.thead`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

const TableHeaderCell = styled.th`
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  text-align: left;
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const TableBody = styled.tbody``

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const TableCell = styled.td`
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  vertical-align: top;
`

const RemoveButton = styled.button`
  background: ${(props) => props.theme.colors?.error || "#c53030"};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.error || "#c53030"}dd;
    transform: scale(1.05);
  }
`

const TotalSection = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  border-left: 4px solid ${(props) => props.theme.colors?.primary || "#1b4332"};
`

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};

  &:last-child {
    margin-bottom: 0;
    padding-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    border-top: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    button {
      flex: 1;
    }
  }
`

const PurchaseOrderForm = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    poNumber: `PO-${Date.now()}`,
    supplier: "",
    supplierEmail: "",
    supplierPhone: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    notes: "",
  })

  const [items, setItems] = useState([
    {
      id: 1,
      name: "",
      sku: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items]
    updatedItems[index][field] = value

    // Calculate total for this item
    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }

    setItems(updatedItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        name: "",
        sku: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.1 // 10% tax
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSave = () => {
    const purchaseOrder = {
      ...formData,
      items,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
    }

    if (onSave) {
      onSave(purchaseOrder)
    }

    alert("Purchase Order saved successfully!")
  }

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>Create Purchase Order</FormTitle>
        <FormSubtitle>Generate a new purchase order for your suppliers</FormSubtitle>
      </FormHeader>

      <FormGrid>
        <FormSection>
          <SectionTitle>
            <FaUser /> Supplier Information
          </SectionTitle>
          <Input
            label="Supplier Name"
            name="supplier"
            value={formData.supplier}
            onChange={handleInputChange}
            placeholder="Enter supplier name"
            required
          />
          <Input
            label="Supplier Email"
            name="supplierEmail"
            type="email"
            value={formData.supplierEmail}
            onChange={handleInputChange}
            placeholder="supplier@example.com"
          />
          <Input
            label="Supplier Phone"
            name="supplierPhone"
            value={formData.supplierPhone}
            onChange={handleInputChange}
            placeholder="+1 (555) 123-4567"
          />
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FaCalendar /> Order Details
          </SectionTitle>
          <Input label="PO Number" name="poNumber" value={formData.poNumber} onChange={handleInputChange} required />
          <Input
            label="Order Date"
            name="orderDate"
            type="date"
            value={formData.orderDate}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Expected Delivery Date"
            name="expectedDate"
            type="date"
            value={formData.expectedDate}
            onChange={handleInputChange}
          />
        </FormSection>
      </FormGrid>

      <ItemsSection>
        <SectionTitle>Order Items</SectionTitle>

        <ItemsTable>
          <TableHeader>
            <tr>
              <TableHeaderCell>Item Name</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell>Quantity</TableHeaderCell>
              <TableHeaderCell>Unit Price</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    value={item.name}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                    placeholder="Item name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.sku}
                    onChange={(e) => handleItemChange(index, "sku", e.target.value)}
                    placeholder="SKU"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                    min="1"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <strong>${item.total.toFixed(2)}</strong>
                </TableCell>
                <TableCell>
                  <RemoveButton onClick={() => removeItem(index)}>
                    <FaTrash />
                  </RemoveButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ItemsTable>

        <Button variant="outline" onClick={addItem}>
          <FaPlus /> Add Item
        </Button>

        <TotalSection>
          <TotalRow>
            <span>Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </TotalRow>
          <TotalRow>
            <span>Tax (10%):</span>
            <span>${calculateTax().toFixed(2)}</span>
          </TotalRow>
          <TotalRow>
            <span>Total Amount:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </TotalRow>
        </TotalSection>
      </ItemsSection>

      <Input
        label="Notes"
        name="notes"
        value={formData.notes}
        onChange={handleInputChange}
        placeholder="Additional notes or special instructions..."
        style={{ marginBottom: "2rem" }}
      />

      <ActionButtons>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <FaTimes /> Cancel
          </Button>
        )}
        <Button variant="primary" onClick={handleSave}>
          <FaSave /> Save Purchase Order
        </Button>
      </ActionButtons>
    </FormContainer>
  )
}

export default PurchaseOrderForm
