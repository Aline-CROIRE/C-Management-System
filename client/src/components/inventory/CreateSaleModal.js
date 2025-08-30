"use client";
import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaTimes, FaTrash, FaSearch, FaBarcode } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import toast from 'react-hot-toast';
import BarcodeScannerModal from './BarcodeScannerModal';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1010;
  display: flex; align-items: center; justify-content: center; animation: ${fadeIn} 0.3s;
`;
const ModalContent = styled.div`
  background: white; border-radius: 1rem; width: 90%; max-width: 800px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: ${slideUp} 0.3s;
  max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  h2 { margin: 0; font-size: 1.5rem; }
`;
const ModalBody = styled.div`
  padding: 2rem; flex-grow: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 2rem;
`;
const ModalFooter = styled.div`
  padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  background: #f7fafc; border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem;
`;
const TotalSection = styled.div``;
const TotalLabel = styled.span`font-size: 1rem; color: #718096;`;
const TotalAmount = styled.span`font-size: 1.75rem; font-weight: 700; color: #1a202c; margin-left: 1rem;`;
const FormGroup = styled.div``;
const FormGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;`;
const Label = styled.label`font-weight: 600; font-size: 0.875rem; color: #4a5568; margin-bottom: 0.5rem; display: block;`;
const SearchContainer = styled.div`display: flex; gap: 0.5rem;`;
const SearchWrapper = styled.div`position: relative; flex-grow: 1;`;
const SearchResults = styled.div`
  position: absolute; top: 100%; left: 0; right: 0;
  background: white; border: 1px solid #e2e8f0;
  border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  max-height: 200px; overflow-y: auto; z-index: 1020;
`;
const SearchResultItem = styled.div`
  padding: 0.75rem 1rem; cursor: pointer;
  &:hover { background: #f7fafc; }
`;
const ItemsTable = styled.table`width: 100%; border-collapse: collapse;`;
const Th = styled.th`text-align: left; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #718096;`;
const Td = styled.td`padding: 1rem 0.5rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle;`;
const NewCustomerForm = styled.div` display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; padding: 1rem; background-color: ${(props) => props.theme.colors.surfaceLight}; border-radius: ${(props) => props.theme.borderRadius.md};`;

const CreateSaleModal = ({ inventoryItems, customers, createCustomer, saleToDuplicate, onClose, onSave, loading }) => {
    const [customerId, setCustomerId] = useState('');
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [newCustomerFields, setNewCustomerFields] = useState({ name: '', email: '', phone: '' });
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (saleToDuplicate) {
            setCustomerId(saleToDuplicate.customer?._id || '');
            const duplicatedItems = saleToDuplicate.items.map(soldItem => {
                const inventoryItem = inventoryItems.find(i => i._id === soldItem.item._id);
                if (!inventoryItem || inventoryItem.quantity < soldItem.quantity) {
                    toast.error(`Could not duplicate "${soldItem.item.name}" due to insufficient stock.`);
                    return null;
                }
                return {
                    item: inventoryItem._id, name: inventoryItem.name, sku: inventoryItem.sku,
                    quantity: soldItem.quantity, price: soldItem.price, originalPrice: inventoryItem.price,
                    maxQuantity: inventoryItem.quantity,
                };
            }).filter(Boolean);
            setItems(duplicatedItems);
        }
    }, [saleToDuplicate, inventoryItems]);

    const availableItems = useMemo(() => {
        const addedItemIds = new Set(items.map(i => i.item));
        return inventoryItems.filter(item => !addedItemIds.has(item._id) && item.quantity > 0);
    }, [items, inventoryItems]);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return availableItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, availableItems]);

    const handleAddItem = (item) => {
        setItems(prev => [...prev, {
            item: item._id, name: item.name, sku: item.sku,
            quantity: 1, price: item.price, originalPrice: item.price,
            maxQuantity: item.quantity,
        }]);
        setSearchTerm('');
    };
    
    const handleScanSuccess = (sku) => {
        const scannedItem = availableItems.find(item => item.sku === sku);
        if(scannedItem) {
            handleAddItem(scannedItem);
            toast.success(`Added ${scannedItem.name}`);
        } else {
            toast.error(`Product with SKU "${sku}" not found or already in cart.`);
        }
    };

    const handleUpdateItem = (itemId, field, value) => {
        const numValue = value === '' ? 0 : (field === 'price' ? parseFloat(value) : parseInt(value, 10));
        setItems(prev => prev.map(item => {
            if (item.item === itemId) {
                const newItem = { ...item, [field]: isNaN(numValue) ? item[field] : numValue };
                if (field === 'price' && newItem.price < item.originalPrice) {
                    toast.error(`Price cannot be lower than the minimum of Rwf ${item.originalPrice.toLocaleString()}`);
                    newItem.price = item.originalPrice;
                }
                if (field === 'quantity') {
                    newItem.quantity = Math.max(1, Math.min(newItem.quantity, item.maxQuantity));
                }
                return newItem;
            }
            return item;
        }));
    };
    
    const handleRemoveItem = (itemId) => {
        setItems(prev => prev.filter(item => item.item !== itemId));
    };

    const handleSaveNewCustomer = async () => {
        if (!newCustomerFields.name) return toast.error("Customer name is required.");
        const newCustomer = await createCustomer(newCustomerFields);
        if (newCustomer) {
            setCustomerId(newCustomer._id);
            setNewCustomerFields({ name: '', email: '', phone: '' });
        }
    };
    
    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }, [items]);

    const handleSave = () => {
        if (items.length === 0) return toast.error("Please add at least one item to the sale.");
        onSave({
            customer: customerId === '_add_new_' || !customerId ? null : customerId,
            items: items.map(({ item, quantity, price }) => ({ item, quantity, price })),
            totalAmount,
            subtotal: totalAmount,
            paymentMethod,
        });
    };

    return (
        <>
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        <h2>{saleToDuplicate ? `Duplicate Sale` : 'Record New Sale'}</h2>
                        <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                    </ModalHeader>
                    <ModalBody>
                        <FormGrid>
                            <FormGroup>
                                <Label htmlFor="customer">Customer</Label>
                                <Select id="customer" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                                    <option value="">Walk-in Customer</option>
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    <option value="_add_new_">-- Add New Customer --</option>
                                </Select>
                                {customerId === '_add_new_' && (
                                    <NewCustomerForm>
                                        <Input name="name" value={newCustomerFields.name} onChange={(e) => setNewCustomerFields(p => ({...p, name: e.target.value}))} placeholder="New Customer Name*" />
                                        <Input name="email" type="email" value={newCustomerFields.email} onChange={(e) => setNewCustomerFields(p => ({...p, email: e.target.value}))} placeholder="Customer Email" />
                                        <Button size="sm" onClick={handleSaveNewCustomer}>Save Customer</Button>
                                    </NewCustomerForm>
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option>Cash</option>
                                    <option>Credit Card</option>
                                    <option>Mobile Money</option>
                                    <option>Bank Transfer</option>
                                </Select>
                            </FormGroup>
                        </FormGrid>
                        
                        <FormGroup>
                            <Label>Add Products</Label>
                            <SearchContainer>
                                <SearchWrapper>
                                    <Input
                                        type="text"
                                        placeholder="Search by name or SKU..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchResults.length > 0 && (
                                        <SearchResults>
                                            {searchResults.map(item => (
                                                <SearchResultItem key={item._id} onClick={() => handleAddItem(item)}>
                                                    {item.name} ({item.sku}) - In Stock: {item.quantity}
                                                </SearchResultItem>
                                            ))}
                                        </SearchResults>
                                    )}
                                </SearchWrapper>
                                <Button variant="outline" onClick={() => setIsScanning(true)}><FaBarcode/> Scan</Button>
                            </SearchContainer>
                        </FormGroup>
                        
                        <ItemsTable>
                            <thead><tr><Th style={{width: '40%'}}>Product</Th><Th>Price</Th><Th>Quantity</Th><Th>Subtotal</Th><Th></Th></tr></thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.item}>
                                        <Td>{item.name}<br/><small style={{color: '#718096'}}>SKU: {item.sku}</small></Td>
                                        <Td>
                                            <Input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => handleUpdateItem(item.item, 'price', e.target.value)}
                                                min={item.originalPrice}
                                                style={{width: '100px'}}
                                            />
                                        </Td>
                                        <Td>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateItem(item.item, 'quantity', e.target.value)}
                                                min="1"
                                                max={item.maxQuantity}
                                                style={{width: '70px'}}
                                            />
                                        </Td>
                                        <Td>Rwf {(item.quantity * item.price).toLocaleString()}</Td>
                                        <Td><Button variant="danger-ghost" size="sm" iconOnly onClick={() => handleRemoveItem(item.item)}><FaTrash /></Button></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </ItemsTable>
                        {items.length === 0 && <p style={{textAlign:'center', color: '#718096'}}>No items added yet.</p>}
                    </ModalBody>
                    <ModalFooter>
                        <TotalSection>
                            <TotalLabel>Total:</TotalLabel>
                            <TotalAmount>Rwf {totalAmount.toLocaleString()}</TotalAmount>
                        </TotalSection>
                        <div>
                            <Button variant="secondary" onClick={onClose} disabled={loading} style={{marginRight: '1rem'}}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave} loading={loading} disabled={items.length === 0}>
                                {saleToDuplicate ? 'Create Duplicate Sale' : 'Save Sale'}
                            </Button>
                        </div>
                    </ModalFooter>
                </ModalContent>
            </ModalOverlay>
            
            {isScanning && <BarcodeScannerModal onClose={() => setIsScanning(false)} onScanSuccess={handleScanSuccess} />}
        </>
    );
};

export default CreateSaleModal;