"use client";

import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from "styled-components";
import { FaPlus, FaTrash, FaSave, FaTimes, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideIn = keyframes`from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1001; padding: 1rem; backdrop-filter: blur(5px); animation: ${fadeIn} 0.3s;`;
const ModalContent = styled.div` background: ${(props) => props.theme.colors.surface}; border-radius: ${(props) => props.theme.borderRadius.xl}; width: 100%; max-width: 1100px; max-height: 95vh; display: flex; flex-direction: column; box-shadow: ${(props) => props.theme.shadows.xl}; animation: ${slideIn} 0.3s;`;
const ModalHeader = styled.div` padding: 1rem 1.5rem; border-bottom: 1px solid ${(props) => props.theme.colors.border}; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; `;
const ModalTitle = styled.h2` font-size: 1.25rem; font-weight: 700; margin: 0; `;
const ModalBody = styled.div` padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; flex-grow: 1; overflow-y: auto; `;
const ModalFooter = styled.div` padding: 1rem 1.5rem; border-top: 1px solid ${(props) => props.theme.colors.border}; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; background: ${(props) => props.theme.colors.surfaceLight};`;
const FormGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; align-items: flex-end; `;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; `;
const Label = styled.label` font-weight: 600; font-size: 0.875rem; color: ${(props) => props.theme.colors.textSecondary};`;
const SubHeading = styled.h4` font-weight: 600; margin: 1rem 0; color: ${(props) => props.theme.colors.text}; border-bottom: 1px solid ${(props) => props.theme.colors.border}; padding-bottom: 0.75rem;`;
const GrandTotalDisplay = styled.div` text-align: right; `;
const GrandTotalLabel = styled.span` color: ${(props) => props.theme.colors.textSecondary}; font-weight: 600; margin-right: 1rem; `;
const GrandTotalAmount = styled.span` font-size: 1.5rem; font-weight: 700; color: ${(props) => props.theme.colors.primary}; `;
const Section = styled.section` padding: 1.5rem; border: 1px solid ${(props) => props.theme.colors.border}; border-radius: ${(props) => props.theme.borderRadius.lg}; `;
const ItemListContainer = styled.div` max-height: 350px; overflow-y: auto; `;
const TotalsGrid = styled.div` display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1rem; @media(max-width: 768px) { grid-template-columns: 1fr; }`;
const NotesSection = styled.div``;
const FinancialsSection = styled.div` background: ${(props) => props.theme.colors.surfaceLight}; border-radius: ${(props) => props.theme.borderRadius.md}; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; `;
const FinancialRow = styled.div` display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: ${(props) => props.theme.colors.text}; &.total { font-weight: 700; font-size: 1.1rem; color: ${(props) => props.theme.colors.heading}; border-top: 1px solid ${(props) => props.theme.colors.border}; padding-top: 1rem; margin-top: 0.5rem; } `;
const SupplierDetails = styled(Section)` background: ${(props) => props.theme.colors.surfaceLight}; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; p { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: ${(props) => props.theme.colors.text}; svg { color: ${(props) => props.theme.colors.textSecondary}; } } @media(max-width: 768px) { grid-template-columns: 1fr; }`;
const NewSupplierForm = styled.div` display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; padding: 1rem; background-color: ${(props) => props.theme.colors.surfaceLight}; border-radius: ${(props) => props.theme.borderRadius.md};`;
const CustomItemForm = styled.div` margin-top: 1rem; padding: 1.5rem; background: ${(props) => props.theme.colors.surfaceLight}; border-radius: ${(props) => props.theme.borderRadius.lg}; display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr auto; gap: 1rem; align-items: flex-end; @media(max-width: 1024px) { grid-template-columns: 1fr; }`;
const StyledItemTable = styled.table` width: 100%; border-collapse: collapse; th, td { padding: 0.75rem; text-align: left; vertical-align: middle; } thead th { background: ${(props) => props.theme.colors.surfaceLight}; font-weight: 600; font-size: 0.875rem; position: sticky; top: 0; z-index: 1; } tbody tr { border-bottom: 1px solid ${(props) => props.theme.colors.border}; }`;

const PurchaseOrderForm = ({ inventoryItems, suppliers, categories, createSupplier, createCategory, onClose, onSave, loading }) => {
    const [supplierId, setSupplierId] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [poItems, setPoItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('net30');
    const [taxRate, setTaxRate] = useState(0);
    const [shippingCost, setShippingCost] = useState(0);
    const [orderDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCustomItemForm, setShowCustomItemForm] = useState(false);
    const [customItem, setCustomItem] = useState({ name: '', sku: '', unitPrice: '', category: '' });
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSupplierFields, setNewSupplierFields] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        if (supplierId && supplierId !== '_add_new_') {
            setSelectedSupplier(suppliers.find(s => s._id === supplierId));
        } else {
            setSelectedSupplier(null);
        }
    }, [supplierId, suppliers]);

    const subtotal = useMemo(() => poItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0), [poItems]);
    const taxAmount = useMemo(() => subtotal * (Number(taxRate) / 100), [subtotal, taxRate]);
    const grandTotal = useMemo(() => subtotal + taxAmount + Number(shippingCost), [subtotal, taxAmount, shippingCost]);

    const handleNewSupplierChange = (e) => setNewSupplierFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSaveNewSupplier = async () => {
        const { name, email } = newSupplierFields;
        if (!name.trim() || !email.trim()) return alert("Supplier Name and Email are required.");
        
        const newSupplier = await createSupplier(newSupplierFields);
        if (newSupplier && newSupplier._id) {
            setSupplierId(newSupplier._id);
        }
    };
    
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...poItems];
        updatedItems[index][field] = value;
        setPoItems(updatedItems);
    };
    const removeItem = (index) => setPoItems(poItems.filter((_, i) => i !== index));
    
    const handleAddItemFromInventory = (itemId) => {
        if (!itemId) return;
        const item = inventoryItems.find(i => i._id === itemId);
        if (item) {
            setPoItems(prev => [...prev, {
                item: item._id, name: item.name, sku: item.sku, quantity: 1, unitPrice: item.price || 0, isNew: false, category: item.category?._id
            }]);
        }
    };

    const handleAddCustomItem = async () => {
        if (!customItem.name || !customItem.sku) return alert("Custom item name and SKU are required.");
        
        let finalCategoryId = customItem.category;
        if (customItem.category === '_add_new_') {
            if (!newCategoryName.trim()) return alert("Please enter a name for the new category.");
            const newCat = await createCategory({ name: newCategoryName.trim() });
            finalCategoryId = newCat._id;
        }

        if (!finalCategoryId) return alert("Please select or create a category for the new item.");
        if (poItems.some(i => i.sku.toLowerCase() === customItem.sku.toLowerCase()) || inventoryItems.some(i => i.sku.toLowerCase() === customItem.sku.toLowerCase())) {
            return alert("An item with this SKU already exists.");
        }
        
        setPoItems(prev => [...prev, {
            item: null, name: customItem.name, sku: customItem.sku, quantity: 1, unitPrice: Number(customItem.unitPrice) || 0, isNew: true, category: finalCategoryId
        }]);
        setCustomItem({ name: '', sku: '', unitPrice: '', category: '' });
        setNewCategoryName('');
        setShowCustomItemForm(false);
    };

    const handleSave = () => {
        if (!supplierId || supplierId === '_add_new_') return alert("Please select a supplier.");
        if (poItems.length === 0) return alert("Please add at least one item to the order.");

        const payload = {
            supplier: supplierId,
            items: poItems.filter(i => !i.isNew).map(i => ({ item: i.item, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) || 0 })),
            newItems: poItems.filter(i => i.isNew).map(i => ({ name: i.name, sku: i.sku, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) || 0, category: i.category })),
            notes, expectedDate: expectedDate || null, orderDate, paymentTerms,
            subtotal, taxAmount, shippingCost: Number(shippingCost) || 0, totalAmount: grandTotal,
        };
        onSave(payload);
    };

    const formModalJsx = (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>Create New Purchase Order</ModalTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}><FaTimes /></Button>
                </ModalHeader>
                <ModalBody>
                    <Section>
                        <SubHeading>Order Details</SubHeading>
                        <FormGrid>
                           <FormGroup>
                                <Label>Supplier *</Label>
                                <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                                    <option value="" disabled>Select a supplier...</option>
                                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    <option value="_add_new_">-- Add New Supplier --</option>
                                </Select>
                                {supplierId === '_add_new_' && (
                                    <NewSupplierForm>
                                        <Input name="name" value={newSupplierFields.name} onChange={handleNewSupplierChange} placeholder="New Supplier Name*" />
                                        <Input name="email" type="email" value={newSupplierFields.email} onChange={handleNewSupplierChange} placeholder="Supplier Email*" />
                                        <Input name="phone" value={newSupplierFields.phone} onChange={handleNewSupplierChange} placeholder="Supplier Phone" />
                                        <Button size="sm" onClick={handleSaveNewSupplier} disabled={loading}><FaSave /> Save Supplier</Button>
                                    </NewSupplierForm>
                                )}
                            </FormGroup>
                            <FormGroup><Label>Order Date</Label><Input type="date" value={orderDate} readOnly disabled /></FormGroup>
                            <FormGroup><Label>Expected Delivery Date</Label><Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} /></FormGroup>
                            <FormGroup><Label>Payment Terms</Label><Select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}><option value="net15">Net 15</option><option value="net30">Net 30</option><option value="net60">Net 60</option><option value="due_on_receipt">Due on Receipt</option></Select></FormGroup>
                        </FormGrid>
                        {selectedSupplier && (
                            <SupplierDetails>
                                <p><FaBuilding /> <strong>{selectedSupplier.name}</strong></p>
                                <p><FaEnvelope /> {selectedSupplier.email || 'N/A'}</p>
                                <p><FaPhone /> {selectedSupplier.phone || 'N/A'}</p>
                                <p><FaMapMarkerAlt /> {selectedSupplier.address || 'No address on file'}</p>
                            </SupplierDetails>
                        )}
                    </Section>
                    <Section>
                        <SubHeading>Order Items</SubHeading>
                        <ItemListContainer>
                            <StyledItemTable><thead><tr><th>Item</th><th>SKU</th><th>Quantity</th><th>Unit Price (RWF)</th><th>Subtotal</th><th></th></tr></thead><tbody>{poItems.map((item, index) => (<tr key={index}><td>{item.name}</td><td>{item.sku}</td><td><Input type="number" style={{width: '80px'}} value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} min="1" /></td><td><Input type="number" style={{width: '120px'}} value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} min="0" step="0.01" /></td><td>RWF {(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString()}</td><td><Button variant="danger-ghost" size="sm" iconOnly onClick={() => removeItem(index)}><FaTrash /></Button></td></tr>))}</tbody></StyledItemTable>
                            {poItems.length === 0 && <p style={{textAlign: 'center', padding: '1rem'}}>No items added yet.</p>}
                        </ItemListContainer>
                        <FormGrid style={{marginTop: '1rem', gridTemplateColumns: '1fr auto'}}>
                            <FormGroup>
                                <Label>Add Existing Item</Label>
                                <Select defaultValue="" onChange={(e) => { handleAddItemFromInventory(e.target.value); e.target.value = ""; }}>
                                    <option value="" disabled>Select an item...</option>
                                    {inventoryItems.map(item => <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>)}
                                </Select>
                            </FormGroup>
                            <Button type="button" variant="outline" onClick={() => setShowCustomItemForm(p => !p)}><FaPlus/> {showCustomItemForm ? 'Cancel Custom Item' : 'Add Custom Item'}</Button>
                        </FormGrid>
                        {showCustomItemForm && (
                            <CustomItemForm>
                                <FormGroup><Label>Name *</Label><Input value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} /></FormGroup>
                                <FormGroup><Label>SKU *</Label><Input value={customItem.sku} onChange={e => setCustomItem({...customItem, sku: e.target.value})} /></FormGroup>
                                <FormGroup><Label>Unit Price *</Label><Input type="number" value={customItem.unitPrice} onChange={e => setCustomItem({...customItem, unitPrice: e.target.value})} /></FormGroup>
                                <FormGroup><Label>Category *</Label>
                                    <Select value={customItem.category} onChange={e => {setCustomItem({...customItem, category: e.target.value}); if (e.target.value !== '_add_new_') setNewCategoryName('');}}>
                                        <option value="">Select...</option>
                                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        <option value="_add_new_">-- Add New Category --</option>
                                    </Select>
                                    {customItem.category === '_add_new_' && (<Input type="text" placeholder="New category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{marginTop: '0.5rem'}} autoFocus />)}
                                </FormGroup>
                                <Button size="sm" onClick={handleAddCustomItem}><FaPlus /> Add Item</Button>
                            </CustomItemForm>
                        )}
                    </Section>
                    <TotalsGrid>
                        <NotesSection><Label>Notes / Memo</Label><Input as="textarea" value={notes} onChange={e => setNotes(e.target.value)} rows="4" placeholder="Optional notes for the supplier or internal records..." /></NotesSection>
                        <FinancialsSection>
                            <FinancialRow><span>Subtotal</span><span>RWF {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></FinancialRow>
                            <FinancialRow><Label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>Tax (%) <Input type="number" style={{width: '60px'}} value={taxRate} onChange={e => setTaxRate(e.target.value)} /></Label><span>RWF {taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></FinancialRow>
                            <FinancialRow><Label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>Shipping <Input type="number" style={{width: '100px'}} value={shippingCost} onChange={e => setShippingCost(e.target.value)} /></Label><span>RWF {Number(shippingCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></FinancialRow>
                            <FinancialRow className="total"><span>Grand Total</span><span>RWF {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></FinancialRow>
                        </FinancialsSection>
                    </TotalsGrid>
                </ModalBody>
                <ModalFooter>
                  <GrandTotalDisplay><GrandTotalLabel>Grand Total:</GrandTotalLabel><GrandTotalAmount>RWF {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</GrandTotalAmount></GrandTotalDisplay>
                  <div>
                    <Button variant="secondary" onClick={onClose} style={{marginRight: '1rem'}}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={loading || poItems.length === 0}><FaSave /> Create Purchase Order</Button>
                  </div>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );

    return ReactDOM.createPortal(formModalJsx, document.body);
};

export default PurchaseOrderForm;