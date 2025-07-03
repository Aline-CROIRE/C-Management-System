"use client"

import { useState } from "react"
import styled from "styled-components"
import { FaTimes, FaSave, FaBarcode, FaImage } from "react-icons/fa"
import Button from "../common/Button"
import Input from "../common/Input"

// ========= STYLED COMPONENTS (Unchanged) =========
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
`

const ModalContent = styled.form`
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.xl};
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: ${(props) => props.theme.shadows.xl};
  overflow: hidden;
`

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.heading};
  margin: 0;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s ease-in-out;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    color: ${(props) => props.theme.colors.text};
  }
`

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  flex-grow: 1;
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  font-weight: 600;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const sharedInputStyles = (props) => `
  padding: 0.75rem;
  border: 1px solid ${props.theme.colors.border};
  border-radius: ${props.theme.borderRadius.md};
  background: ${props.theme.colors.surface};
  color: ${props.theme.colors.text};
  font-size: 0.9rem;
  transition: all 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props.theme.colors.primary}40;
  }

  &::placeholder {
    color: ${props.theme.colors.textSecondary};
    opacity: 0.8;
  }
`
const ThemedInput = styled(Input)`
  ${(props) => sharedInputStyles(props)}
`

const Select = styled.select`
  ${(props) => sharedInputStyles(props)}
`

const TextArea = styled.textarea`
  ${(props) => sharedInputStyles(props)}
  resize: vertical;
  min-height: 100px;
`

const ImageUpload = styled.div`
  border: 2px dashed ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background: ${(props) => props.theme.colors.surfaceLight};

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    background: ${(props) => props.theme.colors.primary}1A;
  }

  input { display: none; }
`

const ModalFooter = styled.div`
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  background-color: ${(props) => props.theme.colors.surface};
  flex-shrink: 0;
`
// --- End of Styled Components ---


const AddItemModal = ({ onClose, onSave, categories = [], locations = [], loading }) => {
  const [newCategory, setNewCategory] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const [formData, setFormData] = useState({
    name: "", sku: "", category: "", location: "", unit: "",
    quantity: "", unitPrice: "", minStock: "", supplier: "",
    notes: "", expiryDate: "", image: null,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "category" && value !== "_add_new_") setNewCategory("");
    if (name === "location" && value !== "_add_new_") setNewLocation("");
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, image: file }));
  }

  const generateSKU = () => {
    const namePart = formData.name.substring(0, 3).toUpperCase() || "NEW";
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `${namePart}-${random}` }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalCategory = newCategory.trim() || formData.category;
    const finalLocation = newLocation.trim() || formData.location;
    
    if (formData.category === "_add_new_" && !finalCategory) {
        alert("Please enter a name for the new category.");
        return;
    }
     if (formData.location === "_add_new_" && !finalLocation) {
        alert("Please enter a name for the new location.");
        return;
    }

    // This part is correct: you are building the FormData object
    // with field names that match your backend model.
    const itemFormData = new FormData();
    itemFormData.append("name", formData.name);
    itemFormData.append("sku", formData.sku);
    itemFormData.append("category", finalCategory);
    itemFormData.append("location", finalLocation);
    itemFormData.append("unit", formData.unit);
    itemFormData.append("quantity", Number(formData.quantity) || 0);
    itemFormData.append("price", Number(formData.unitPrice) || 0);
    itemFormData.append("minStockLevel", Number(formData.minStock) || 0);
    itemFormData.append("description", formData.notes);

    if (formData.supplier) itemFormData.append("supplier", formData.supplier);
    if (formData.expiryDate) itemFormData.append("expiryDate", formData.expiryDate);
    if (formData.image) itemFormData.append("image", formData.image, formData.image.name);

    // *** THE CRUCIAL FIX ***
    // Create the structured payload object that the parent component (IMS.jsx) expects.
    const payload = {
      itemData: itemFormData,
      newCategory: formData.category === "_add_new_" ? finalCategory : null,
      newLocation: formData.location === "_add_new_" ? finalLocation : null,
    };
    
    // Pass the entire payload object to the onSave function, not just the FormData.
    await onSave(payload);
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Add New Inventory Item</ModalTitle>
          <CloseButton type="button" onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGrid>
            {/* --- Core Information --- */}
            <FormGroup>
                <Label htmlFor="name">Product Name *</Label>
                <ThemedInput id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </FormGroup>
            <FormGroup>
                <Label htmlFor="sku">SKU *</Label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <ThemedInput id="sku" name="sku" value={formData.sku} onChange={handleInputChange} required />
                  <Button type="button" variant="outline" onClick={generateSKU} iconOnly aria-label="Generate SKU"><FaBarcode /></Button>
                </div>
            </FormGroup>
            
            {/* --- Creatable Category Select --- */}
            <FormGroup>
              <Label htmlFor="category">Category *</Label>
              <Select id="category" name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="">Select Category...</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                <option value="_add_new_">-- Add New Category --</option>
              </Select>
              {formData.category === "_add_new_" && (
                <ThemedInput
                  type="text"
                  placeholder="Enter new category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                  autoFocus
                />
              )}
            </FormGroup>
            
            {/* --- Stock and Pricing --- */}
            <FormGroup>
                <Label htmlFor="quantity">Quantity *</Label>
                <ThemedInput id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} min="0" required />
            </FormGroup>
            <FormGroup>
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <ThemedInput id="unitPrice" name="unitPrice" type="number" step="0.01" value={formData.unitPrice} onChange={handleInputChange} min="0" required />
            </FormGroup>

            {/* --- Free-Text Unit Input --- */}
            <FormGroup>
              <Label htmlFor="unit">Unit *</Label>
              <ThemedInput id="unit" name="unit" type="text" placeholder="e.g., kg, pcs, box" value={formData.unit} onChange={handleInputChange} required />
            </FormGroup>
            
            <FormGroup>
                <Label htmlFor="minStock">Minimum Stock Level</Label>
                <ThemedInput id="minStock" name="minStock" type="number" value={formData.minStock} onChange={handleInputChange} min="0" />
            </FormGroup>
            
            {/* --- Creatable Location Select --- */}
            <FormGroup>
              <Label htmlFor="location">Location *</Label>
              <Select id="location" name="location" value={formData.location} onChange={handleInputChange} required>
                <option value="">Select Location...</option>
                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                <option value="_add_new_">-- Add New Location --</option>
              </Select>
              {formData.location === "_add_new_" && (
                <ThemedInput
                  type="text"
                  placeholder="Enter new location name"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                  autoFocus
                />
              )}
            </FormGroup>
            
            {/* --- Other Details --- */}
            <FormGroup>
                <Label htmlFor="supplier">Supplier</Label>
                <ThemedInput id="supplier" name="supplier" value={formData.supplier} onChange={handleInputChange} />
            </FormGroup>
            <FormGroup>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <ThemedInput id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} />
            </FormGroup>
          </FormGrid>

          <FormGroup style={{ marginBottom: "1.5rem" }}>
            <Label htmlFor="notes">Notes / Description</Label>
            <TextArea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Add any relevant details..." />
          </FormGroup>
           
          <FormGroup>
            <Label>Product Image</Label>
            <ImageUpload>
              <input type="file" accept="image/*" onChange={handleImageUpload} id="image-upload" />
              <label htmlFor="image-upload" style={{ display: 'block', cursor: 'pointer' }}>
                <FaImage size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                <div>{formData.image ? formData.image.name : "Click or drag to upload"}</div>
                <div style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.7 }}>
                  Supports JPG, PNG, GIF
                </div>
              </label>
            </ImageUpload>
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading} loading={loading}>
            <FaSave style={{ marginRight: '0.5rem' }}/> {loading ? "Saving..." : "Save Item"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  )
}

export default AddItemModal