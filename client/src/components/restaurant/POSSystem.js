// client/src/components/restaurant/POSSystem.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  FaTable, FaUtensils, FaShoppingCart, FaStickyNote, FaPlus, FaMinus, FaTrash,
  FaCreditCard, FaMoneyBillAlt, FaClock, FaUser, FaCheckCircle, FaSpinner,FaTimes
} from 'react-icons/fa'; // Added FaCheckCircle, FaSpinner
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

// Modals
import POSPaymentModal from './modals/POSPaymentModal'; // Will create this next
import OrderNotesModal from './modals/OrderNotesModal'; // Small modal for item/order notes

const POSContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr; /* Tables | Menu | Order Summary */
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  min-height: calc(100vh - 200px); /* Adjust based on header/footer height */

  @media (max-width: ${(props) => props.theme.breakpoints?.xl || "1200px"}) {
    grid-template-columns: 1fr 1.5fr; /* Tables & Menu | Order Summary */
    grid-template-areas:
      "tables menu"
      "order-summary order-summary";
  }

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "992px"}) {
    grid-template-columns: 1fr; /* Stack all columns */
    grid-template-areas:
      "tables"
      "menu"
      "order-summary";
  }
`;

const SectionCard = styled(Card)`
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const TableGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  max-height: 80vh; /* Make tables scrollable if too many */
  overflow-y: auto;
  padding-right: 5px; /* For scrollbar */

  @media (max-width: ${(props) => props.theme.breakpoints?.xl || "1200px"}) {
    grid-area: tables;
  }
`;

const TableButton = styled(Button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  height: 80px;
  background: ${props => {
    switch (props.$status) {
      case 'occupied': return props.theme.colors?.danger;
      case 'reserved': return props.theme.colors?.warning;
      case 'ordering': return props.theme.colors?.info;
      case 'waiting_bill': return props.theme.colors?.tertiary; // New status for waiting bill
      case 'cleaning': return props.theme.colors?.primaryLight;
      case 'selected': return props.theme.colors?.primaryDark; // For selected table
      default: return props.theme.colors?.success; // vacant
    }
  }};
  color: white;
  border: 2px solid ${props => props.$status === 'selected' ? props.theme.colors?.accent : 'transparent'};
  box-shadow: ${props => props.$status === 'selected' ? `0 0 0 3px ${props.theme.colors?.accent}` : 'none'};
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
  }
`;

const MenuCategoryTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const MenuCategoryButton = styled(Button)`
  flex-grow: 1;
  background: ${props => props.$active ? props.theme.colors?.primary : props.theme.colors?.surface};
  color: ${props => props.$active ? 'white' : props.theme.colors?.text};
  &:hover {
    background: ${props => props.$active ? props.theme.colors?.primaryDark : props.theme.colors?.surfaceDark};
    color: ${props => props.$active ? 'white' : props.theme.colors?.text};
  }
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  flex-grow: 1; /* Allow menu to grow */
  max-height: 80vh; /* Make menu scrollable */
  overflow-y: auto;
  padding-right: 5px; /* For scrollbar */

  @media (max-width: ${(props) => props.theme.breakpoints?.xl || "1200px"}) {
    grid-area: menu;
  }
`;

const MenuItemButton = styled(Button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 120px;
  padding: 0.5rem;
  background: ${props => props.$inOrder ? props.theme.colors?.infoLight : props.theme.colors?.surface};
  color: ${props => props.$inOrder ? props.theme.colors?.infoDark : props.theme.colors?.text};
  border: 2px solid ${props => props.$inOrder ? props.theme.colors?.info : props.theme.colors?.borderLight};
  
  img {
    max-width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: ${(props) => props.theme.borderRadius?.sm};
    margin-bottom: 0.25rem;
  }
  .item-name {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold};
    font-size: ${(props) => props.theme.typography?.fontSize?.sm};
    line-height: 1.2;
    margin: 0;
  }
  .item-price {
    font-size: ${(props) => props.theme.typography?.fontSize?.xs};
    color: ${(props) => props.theme.colors?.textSecondary};
    margin-top: 0.25rem;
  }

  &:hover {
    filter: brightness(1.05);
    transform: translateY(-2px);
  }
`;

const OrderSummaryArea = styled.div`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.colors?.background};
  border-radius: ${(props) => props.theme.borderRadius?.lg};
  box-shadow: ${(props) => props.theme.shadows?.md};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.xl || "1200px"}) {
    grid-area: order-summary;
  }
`;

const OrderDetailsList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  max-height: 40vh; /* Allow order list to scroll */
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  padding-right: 5px; /* For scrollbar */
`;

const OrderItem = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 3fr 1fr 1fr 0.5fr; /* Qty | Name/Notes | Price | Actions | Trash */
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  align-items: center;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
  border-bottom: 1px dashed ${(props) => props.theme.colors?.borderLight};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm};

  .item-name {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.medium};
  }
  .item-notes {
    font-size: ${(props) => props.theme.typography?.fontSize?.xs};
    color: ${(props) => props.theme.colors?.textSecondary};
    font-style: italic;
  }
  .qty-controls {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    button {
      padding: 0.1rem 0.3rem;
      min-width: 25px;
      height: 25px;
      font-size: ${(props) => props.theme.typography?.fontSize?.xs};
    }
  }
`;

const OrderSummaryFooter = styled.div`
  padding-top: ${(props) => props.theme.spacing?.md || "1rem"};
  border-top: 2px solid ${(props) => props.theme.colors?.border};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};

  .summary-line {
    display: flex;
    justify-content: space-between;
    font-size: ${(props) => props.theme.typography?.fontSize?.md};
  }
  .total-line {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${(props) => props.theme.colors?.heading};
  }
`;

const POSActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  margin-top: ${(props) => props.theme.spacing?.md || "1rem"};

  button {
    flex-grow: 1;
    min-width: 120px;
    font-size: ${(props) => props.theme.typography?.fontSize?.md};
  }
`;


const POSSystem = ({ restaurantId }) => {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState({ items: [], notes: '', customerName: '', customerPhone: '', orderId: null });
  const [activeCategory, setActiveCategory] = useState('All');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingOrderItemIndex, setEditingOrderItemIndex] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);


  const fetchPOSData = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesRes, menuRes] = await Promise.all([
        restaurantAPI.getTables(restaurantId),
        restaurantAPI.getMenuItems(restaurantId, { isActive: true })
      ]);

      if (tablesRes?.success) {
        setTables(tablesRes.data);
      } else {
        throw new Error(tablesRes?.message || 'Failed to fetch tables.');
      }

      if (menuRes?.success) {
        setMenuItems(menuRes.data);
      } else {
        throw new Error(menuRes?.message || 'Failed to fetch menu items.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching POS data.');
      toast.error(err.message || 'An error occurred fetching POS data.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchPOSData();
  }, [fetchPOSData]);

  const uniqueCategories = useMemo(() => {
    const categories = ['All', ...new Set(menuItems.map(item => item.category))];
    return categories.filter(Boolean); // Filter out any null/undefined
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (activeCategory === 'All') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  // --- Order Management Functions ---
  const handleTableSelect = (table) => {
    setSelectedTable(table);
    // Here you would typically load an existing order for this table if one exists
    // For now, we'll reset to a new empty order if a new table is selected
    setCurrentOrder({ items: [], notes: '', customerName: '', customerPhone: '' });
    toast.success(`Table ${table.tableNumber} selected. Starting new order.`);
  };

  const handleAddItemToOrder = (menuItem) => {
    if (!selectedTable) {
      toast.error('Please select a table first.');
      return;
    }

    setCurrentOrder(prevOrder => {
      const existingItemIndex = prevOrder.items.findIndex(item => item.menuItem._id === menuItem._id);
      if (existingItemIndex > -1) {
        return {
          ...prevOrder,
          items: prevOrder.items.map((item, index) =>
            index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return {
        ...prevOrder,
        items: [...prevOrder.items, {
          menuItem: menuItem,
          quantity: 1,
          price: menuItem.price, // Store current price
          notes: ''
        }],
      };
    });
    toast.success(`${menuItem.name} added to order!`);
  };

  const updateOrderItemQuantity = (menuItemId, delta) => {
    setCurrentOrder(prevOrder => {
      const updatedItems = prevOrder.items.map(item =>
        item.menuItem._id === menuItemId ? { ...item, quantity: item.quantity + delta } : item
      ).filter(item => item.quantity > 0);
      return { ...prevOrder, items: updatedItems };
    });
  };

  const removeOrderItem = (menuItemId) => {
    setCurrentOrder(prevOrder => ({
      ...prevOrder,
      items: prevOrder.items.filter(item => item.menuItem._id !== menuItemId),
    }));
    toast.success('Item removed from order.');
  };

  const handleOpenNotesModal = (index) => {
    setEditingOrderItemIndex(index);
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = (notes) => {
    setCurrentOrder(prevOrder => ({
      ...prevOrder,
      items: prevOrder.items.map((item, index) =>
        index === editingOrderItemIndex ? { ...item, notes: notes } : item
      ),
    }));
    setIsNotesModalOpen(false);
    setEditingOrderItemIndex(null);
    toast.success('Notes updated!');
  };

  const calculateSubtotal = useMemo(() => {
    return currentOrder.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [currentOrder.items]);

  const calculateTax = useMemo(() => {
    // Assuming a simple 18% VAT for Rwanda, adjust as needed
    return calculateSubtotal * 0.18;
  }, [calculateSubtotal]);

  const calculateTotal = useMemo(() => {
    return calculateSubtotal + calculateTax;
  }, [calculateSubtotal, calculateTax]);

  const handlePlaceOrder = async (orderType = 'dine_in') => {
    if (!selectedTable) {
      toast.error('Please select a table first.');
      return;
    }
    if (currentOrder.items.length === 0) {
      toast.error('Order cannot be empty. Please add items.');
      return;
    }

    const validItems = currentOrder.items.every(item => item.quantity > 0 && item.price > 0);
    if (!validItems) {
      toast.error('Order contains invalid items. Please review.');
      return;
    }

    setPaymentProcessing(true);
    try {
      const payload = {
        table: selectedTable._id,
        items: currentOrder.items.map(item => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
          notes: item.notes,
          price: item.price,
        })),
        notes: currentOrder.notes,
        orderType: orderType,
        customerName: currentOrder.customerName || '',
        customerPhone: currentOrder.customerPhone || '',
      };

      const response = await restaurantAPI.createOrder(restaurantId, payload);
      if (response?.success) {
        const orderId = response.data._id;
        toast.success(`Order #${orderId.slice(-6)} placed for Table ${selectedTable.tableNumber}!`);
        
        setCurrentOrder(prev => ({ ...prev, orderId }));
        setOrderHistory(prev => [response.data, ...prev]);
        
        await restaurantAPI.updateTable(restaurantId, selectedTable._id, { status: 'occupied' });
        
        setActiveCategory('All');
        setTimeout(() => fetchPOSData(), 500);
      } else {
        throw new Error(response?.message || 'Failed to place order.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred placing the order.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCheckout = () => {
    if (currentOrder.items.length === 0) {
      toast.error('Order is empty. Cannot checkout.');
      return;
    }
    if (!selectedTable) {
      toast.error('No table selected for checkout.');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    if (!selectedTable || !currentOrder.orderId) { // currentOrder.orderId would be set after initial order placement
      toast.error('No active order to process payment.');
      return;
    }
    
    setPaymentProcessing(true);
    try {
      // This assumes handlePlaceOrder already created the order in the backend
      // and returned an orderId which is stored in currentOrder.orderId.
      // If payment is done simultaneously with order creation, adjust handlePlaceOrder
      // For now, we'll assume a separate payment step after an order is 'placed' (sent to kitchen)
      const response = await restaurantAPI.processPayment(restaurantId, currentOrder.orderId, paymentData);
      if (response?.success) {
        toast.success('Payment processed successfully!');
        // Update table status to 'vacant' or 'cleaning'
        await restaurantAPI.updateTable(restaurantId, selectedTable._id, { status: 'vacant' });
        fetchPOSData(); // Re-fetch to update table status
        setSelectedTable(null);
        setCurrentOrder({ items: [], notes: '', customerName: '', customerPhone: '' });
        setIsPaymentModalOpen(false);
      } else {
        throw new Error(response?.message || 'Failed to process payment.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred processing payment.');
    } finally {
      setPaymentProcessing(false);
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;
  }

  return (
    <POSContainer>
      {/* Table Selection Section */}
      <SectionCard>
        <h3><FaTable /> Tables</h3>
        <TableGrid>
          {tables.length > 0 ? (
            tables.map(table => (
              <TableButton
                key={table._id}
                $status={selectedTable?._id === table._id ? 'selected' : table.status}
                onClick={() => handleTableSelect(table)}
                size="lg"
                variant="neutral" // Neutral base variant
              >
                <strong>{table.tableNumber}</strong>
                <small>{table.status.replace('_', ' ')}</small>
                <small>({table.capacity} pax)</small>
              </TableButton>
            ))
          ) : (
            <p>No tables configured.</p>
          )}
        </TableGrid>
      </SectionCard>

      {/* Menu Item Section */}
      <SectionCard style={{gridArea: 'menu'}}>
        <h3><FaUtensils /> Menu</h3>
        <MenuCategoryTabs>
          {uniqueCategories.map(category => (
            <MenuCategoryButton
              key={category}
              $active={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              size="sm"
            >
              {category}
            </MenuCategoryButton>
          ))}
        </MenuCategoryTabs>
        <MenuGrid>
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map(item => (
              <MenuItemButton
                key={item._id}
                onClick={() => handleAddItemToOrder(item)}
                $inOrder={currentOrder.items.some(orderItem => orderItem.menuItem._id === item._id)}
              >
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
                <p className="item-name">{item.name}</p>
                <p className="item-price">Rwf {item.price.toFixed(2)}</p>
              </MenuItemButton>
            ))
          ) : (
            <p>No menu items available in this category.</p>
          )}
        </MenuGrid>
      </SectionCard>

      {/* Order Summary & Actions Section */}
      <OrderSummaryArea style={{gridArea: 'order-summary'}}>
        <h3><FaShoppingCart /> Current Order {selectedTable ? `(Table ${selectedTable.tableNumber})` : ''}</h3>
        {currentOrder.items.length > 0 ? (
          <OrderDetailsList>
            {currentOrder.items.map((item, index) => (
              <OrderItem key={item.menuItem._id}>
                <div className="qty-controls">
                  <Button size="xs" variant="tertiary" onClick={() => updateOrderItemQuantity(item.menuItem._id, -1)}><FaMinus /></Button>
                  <span>{item.quantity}</span>
                  <Button size="xs" variant="tertiary" onClick={() => updateOrderItemQuantity(item.menuItem._id, 1)}><FaPlus /></Button>
                </div>
                <div>
                    <span className="item-name">{item.menuItem.name}</span>
                    {item.notes && <p className="item-notes">{item.notes}</p>}
                </div>
                <span>Rwf {(item.quantity * item.price).toFixed(2)}</span>
                <Button size="xs" variant="info" onClick={() => handleOpenNotesModal(index)}><FaStickyNote /></Button> {/* Edit notes */}
                <Button size="xs" variant="danger" onClick={() => removeOrderItem(item.menuItem._id)}><FaTrash /></Button>
              </OrderItem>
            ))}
          </OrderDetailsList>
        ) : (
          <p>Select items from the menu to start an order.</p>
        )}

        <OrderSummaryFooter>
          <div className="summary-line">
            <span>Subtotal:</span>
            <span>Rwf {calculateSubtotal.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Tax (18%):</span>
            <span>Rwf {calculateTax.toFixed(2)}</span>
          </div>
          <div className="total-line summary-line">
            <span>Total:</span>
            <span>Rwf {calculateTotal.toFixed(2)}</span>
          </div>
        </OrderSummaryFooter>

        <POSActions>
          <Button
            variant="primary"
            onClick={() => handlePlaceOrder('dine_in')} // Place order, send to kitchen
            disabled={!selectedTable || currentOrder.items.length === 0 || paymentProcessing}
          >
            {paymentProcessing ? <><FaSpinner className="spin" /> Placing...</> : <><FaCheckCircle /> Place Order</>}
          </Button>
          <Button
            variant="success"
            onClick={handleCheckout} // Open payment modal
            disabled={!selectedTable || currentOrder.items.length === 0 || paymentProcessing}
          >
            <FaCreditCard /> Checkout
          </Button>
          <Button
            variant="danger"
            onClick={() => { if (window.confirm('Clear current order?')) setCurrentOrder({ items: [], notes: '', customerName: '', customerPhone: '' }); }}
            disabled={currentOrder.items.length === 0 || paymentProcessing}
          >
            <FaTimes /> Clear Order
          </Button>
        </POSActions>
      </OrderSummaryArea>

      {/* Modals */}
      {isPaymentModalOpen && (
        <POSPaymentModal
          totalAmount={calculateTotal}
          orderId={currentOrder.orderId} // This needs to be set after handlePlaceOrder
          restaurantId={restaurantId}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {isNotesModalOpen && (
        <OrderNotesModal
          initialNotes={currentOrder.items[editingOrderItemIndex]?.notes || ''}
          onSave={handleSaveNotes}
          onClose={() => setIsNotesModalOpen(false)}
        />
      )}
    </POSContainer>
  );
};

export default POSSystem;