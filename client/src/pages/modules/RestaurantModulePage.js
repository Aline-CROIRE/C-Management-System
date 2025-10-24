// client/src/pages/modules/RestaurantModulePage.js
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaUtensils, FaTable, FaUser, FaStickyNote, FaPhone, FaEnvelope } from 'react-icons/fa';

import RestaurantManagementDashboard from './RestaurantManagementDashboard';

const ModuleContainer = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: calc(100vh - 80px);

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.md || "1rem"};
  }
`;

const PageTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  text-align: center;
`;

const AlertCardStyled = styled(Card)`
  background: ${props => props.theme.colors?.warningLight || '#fff3cd'};
  border: 1px solid ${props => props.theme.colors?.warning || '#ffeeba'};
  color: ${props => props.theme.colors?.warningDark || '#664d03'};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  margin: ${(props) => props.theme.spacing?.xl || "2rem"} auto;
  max-width: 600px;
  text-align: center;
  font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const PublicHeader = styled.div`
  background: ${(props) => props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  color: white;
  padding: ${(props) => props.theme.spacing?.xl || "2rem"} ${(props) => props.theme.spacing?.lg || "1.5rem"};
  text-align: center;
  border-radius: 0 0 ${(props) => props.theme.borderRadius?.xl || "1rem"} ${(props) => props.theme.borderRadius?.xl || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(0, 0, 0, 0.1)"};

  h1 {
    font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "2rem"};
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.extrabold || "800"};
  }
  p {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .header-icon {
      margin-right: 0.3rem;
  }
`;

const PublicOrderLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr; /* Menu takes 2/3, Order Summary takes 1/3 */
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    grid-template-columns: 1fr; /* Stack columns on smaller screens */
  }
`;

const MenuSection = styled.div`
  padding-right: ${(props) => props.theme.spacing?.md || "1rem"}; // Visual separation
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    padding-right: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  color: ${(props) => props.theme.colors?.heading || "#2d3748"};
  margin-top: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  padding-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
  border-bottom: 2px solid ${(props) => props.theme.colors?.borderLight};
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const MenuItemCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  cursor: pointer;
  border: 2px solid ${props => props.$isSelected ? props.theme.colors.accent : props.theme.colors.borderLight};
  transition: all 0.2s ease-in-out;
  box-shadow: ${props => props.$isSelected ? props.theme.shadows?.md : 'none'};
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
  }

  img {
    max-width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    filter: ${props => props.$isSelected ? 'brightness(0.9)' : 'none'};
    transition: filter 0.2s ease-in-out;
  }
  h3 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    color: ${(props) => props.theme.colors?.heading};
  }
  p {
    flex-grow: 1; // Allows description to take available space
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#666"};
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  }
  .price {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
    color: ${(props) => props.theme.colors?.primary || "#1b4332"};
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    margin-top: auto; // Pushes price to the bottom
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const AddToCartButton = styled(Button)`
    margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: ${props => props.$isInCart ? props.theme.colors.accent : props.theme.colors.primary};
    color: white;

    &:hover {
        background: ${props => props.$isInCart ? props.theme.colors.accentDark : props.theme.colors.primaryDark};
    }
`;


const OrderSummaryCard = styled(Card)`
  position: sticky;
  top: ${(props) => props.theme.spacing?.xl || "2rem"}; /* Position sticky */
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  background: ${(props) => props.theme.colors?.background || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
  height: fit-content; /* Ensure it doesn't take full height if content is short */

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    position: relative; // No sticky on small screens, or consider a fixed bottom bar
    top: auto;
    width: 100%;
    margin-top: ${(props) => props.theme.spacing?.xl || "2rem"};
  }

  h3 {
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
    font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
    color: ${(props) => props.theme.colors?.heading || "#2d3748"};
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    border-bottom: 1px dashed ${(props) => props.theme.colors?.borderLight};
    &:last-of-type {
        border-bottom: none;
        margin-bottom: 0;
    }
    span:first-child {
        flex-grow: 1;
        max-width: 60%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
  }
  .quantity-control {
    display: flex;
    align-items: center;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    button {
        background: ${props => props.theme.colors.primaryLight};
        color: ${props => props.theme.colors.primaryDark};
        border: none;
        border-radius: ${props => props.theme.borderRadius.sm};
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
        min-width: 30px; // Ensure consistent button size
        &:hover {
            background: ${props => props.theme.colors.primary};
            color: white;
        }
    }
  }
  .total {
    border-top: 2px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
    padding-top: ${(props) => props.theme.spacing?.md || "1rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.extrabold || "800"};
    font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
    color: ${(props) => props.theme.colors?.heading};
    display: flex;
    justify-content: space-between;
  }
  .customer-details-section {
    margin-top: ${(props) => props.theme.spacing?.xl || "2rem"};
    padding-top: ${(props) => props.theme.spacing?.md || "1rem"};
    border-top: 1px dashed ${(props) => props.theme.colors?.borderLight};
    h4 {
        font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
        margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
        color: ${(props) => props.theme.colors?.heading};
    }
  }
  ${Input} { // Style inputs directly within this component scope
    margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const EmptyState = styled.p`
    text-align: center;
    color: ${(props) => props.theme.colors?.textSecondary};
    font-style: italic;
    padding: ${(props) => props.theme.spacing?.md || "1rem"};
    background: ${(props) => props.theme.colors?.surface || "#fcfcfc"};
    border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
    margin-top: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;


const RestaurantModulePage = ({ isPublicQrOrderPage = false }) => {
  const { user, loading: authLoading, verifyAuth, setUser } = useAuth();
  const { restaurantId: urlRestaurantId, tableId } = useParams();

  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [order, setOrder] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const fetchRestaurantData = useCallback(async (id) => {
    try {
      const response = await restaurantAPI.getRestaurantById(id);
      if (response?.success) {
        setSelectedRestaurant(response.data);
        return response.data;
      } else {
        setError(response?.message || 'Failed to fetch restaurant data.');
        toast.error(response?.message || 'Failed to fetch restaurant data.');
        return null;
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return null;
    }
  }, []);

  const fetchTables = useCallback(async (rId) => {
    try {
      const response = await restaurantAPI.getTables(rId);
      if (response?.success) {
        if (tableId) {
          const foundTable = response.data.find(t => t._id === tableId);
          setSelectedTable(foundTable);
          if (!foundTable) throw new Error("Table not found for this restaurant.");
        } else if (response.data.length > 0) {
          if (!selectedTable || selectedTable.restaurantId !== rId) {
            setSelectedTable(response.data[0]);
          }
        }
      } else {
        throw new Error(response?.message || 'Failed to fetch tables.');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  }, [tableId, selectedTable]);


  const handleAutoCreateRestaurant = useCallback(async () => {
    setLoadingContent(true);
    try {
      const response = await restaurantAPI.autoCreateMyRestaurant();
      if (response?.success) {
        toast.success(response.message);
        if (response.user) {
          setUser({ ...response.user });
        } else {
          await verifyAuth();
        }
      } else {
        toast.error(response?.message || 'Failed to auto-create restaurant.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred during auto-creation.');
    } finally {
      setLoadingContent(false);
    }
  }, [verifyAuth, setUser]);


  const loadPublicQrOrderMenu = useCallback(async (idToLoad) => {
    setLoadingContent(true);
    setError(null);
    try {
      const restaurantDetails = await fetchRestaurantData(idToLoad);
      if (!restaurantDetails) {
        setLoadingContent(false);
        return;
      }
      await fetchTables(idToLoad);

      const menuResponse = await restaurantAPI.getPublicMenuItems(idToLoad, tableId);

      if (menuResponse?.success) {
        setMenuItems(menuResponse.data);
      } else {
        setError(menuResponse?.message || 'Failed to fetch menu items.');
        toast.error(menuResponse?.message || 'Failed to fetch menu items.');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoadingContent(false);
    }
  }, [tableId, fetchRestaurantData, fetchTables]);

  useEffect(() => {
    if (authLoading) {
      setLoadingContent(true);
      return;
    }

    if (isPublicQrOrderPage) {
      const currentRestaurantId = urlRestaurantId;
      if (!currentRestaurantId) {
        setError("Restaurant ID is missing from QR link. Cannot load menu.");
        setLoadingContent(false);
        return;
      }
      loadPublicQrOrderMenu(currentRestaurantId);
    } else {
      if (user && user.restaurantId) {
        setLoadingContent(false);
      } else if (user) {
        handleAutoCreateRestaurant();
      } else {
        setError("Authentication required to access this module.");
        setLoadingContent(false);
      }
    }
  }, [user, authLoading, isPublicQrOrderPage, urlRestaurantId, handleAutoCreateRestaurant, loadPublicQrOrderMenu]);


  const handleAddToCart = (menuItem) => {
    setOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex((item) => item.menuItem === menuItem._id);
      if (existingItemIndex > -1) {
        return prevOrder.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevOrder, { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1, notes: '' }];
    });
    toast.success(`${menuItem.name} added to cart!`);
  };

  const updateOrderQuantity = (menuItemId, delta) => {
    setOrder((prevOrder) => {
      const updatedOrder = prevOrder.map((item) =>
        item.menuItem === menuItemId ? { ...item, quantity: item.quantity + delta } : item
      ).filter(item => item.quantity > 0);
      return updatedOrder;
    });
  };

  const calculateTotal = () => {
    return order.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (order.length === 0) {
      toast.error('Your order is empty.');
      return;
    }

    if (!isPublicQrOrderPage && !selectedRestaurant?._id) {
      toast.error('No restaurant selected.');
      return;
    }

    if (isPublicQrOrderPage && (!customerName || !customerPhone)) {
      toast.error('Please provide your name and phone number for the order.');
      return;
    }

    setLoadingContent(true);
    try {
      const orderPayload = {
        items: order.map(item => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes,
          price: item.price,
        })),
        customerName: isPublicQrOrderPage ? customerName : (user?.firstName + ' ' + user?.lastName),
        customerPhone: isPublicQrOrderPage ? customerPhone : user?.profile?.phone,
        customerEmail: isPublicQrOrderPage ? customerEmail : user?.email,
        notes: notes,
        orderType: isPublicQrOrderPage ? 'qr_code' : 'dine_in',
        table: isPublicQrOrderPage ? tableId : selectedTable?._id,
      };

      const currentRestaurantId = isPublicQrOrderPage ? urlRestaurantId : user.restaurantId;

      let response;
      if (isPublicQrOrderPage) {
        response = await restaurantAPI.createQrOrder(currentRestaurantId, tableId, orderPayload);
      } else {
        response = await restaurantAPI.createOrder(currentRestaurantId, orderPayload);
      }

      if (response?.success) {
        toast.success('Order placed successfully! We will process your order shortly.');
        setOrder([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setNotes('');
      } else {
        toast.error(response?.message || 'Failed to place order.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred while placing the order.');
    } finally {
      setLoadingContent(false);
    }
  };


  if (authLoading || loadingContent) {
    return (
      <ModuleContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner size="50px" />
      </ModuleContainer>
    );
  }

  if (error) {
    return (
      <ModuleContainer>
        <AlertCardStyled type="error">
          <p>Error: {error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
        </AlertCardStyled>
      </ModuleContainer>
    );
  }

  if (isPublicQrOrderPage) {
    return (
      <ModuleContainer>
        {selectedRestaurant && selectedTable ? (
          <PublicHeader>
            <FaUtensils className="header-icon" size="2em" />
            <h1>{selectedRestaurant.name}</h1>
            <p><FaTable className="header-icon" /> Table: {selectedTable.tableNumber}</p>
            <p>Scan the menu and order directly!</p>
          </PublicHeader>
        ) : (
          <AlertCardStyled type="warning">
              <p>Restaurant or table information is missing or could not be loaded.</p>
              <Button onClick={() => window.location.reload()} variant="primary">Reload Page</Button>
          </AlertCardStyled>
        )}

        {selectedRestaurant && selectedTable && (
            <PublicOrderLayout>
                <MenuSection>
                    <SectionTitle>Our Menu</SectionTitle>
                    <MenuGrid>
                        {menuItems.length > 0 ? (
                            menuItems.map((item) => {
                                const itemInCart = order.find(o => o.menuItem === item._id);
                                const isInCart = !!itemInCart;
                                return (
                                    <MenuItemCard key={item._id} $isSelected={isInCart}>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} />
                                        ) : (
                                            <img src="https://via.placeholder.com/150x150?text=No+Image" alt="No image available" />
                                        )}
                                        <h3>{item.name}</h3>
                                        <p>{item.description || "No description available."}</p>
                                        <div className="price">${item.price.toFixed(2)}</div>
                                        <AddToCartButton
                                            $isInCart={isInCart}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(item);
                                            }}
                                        >
                                            <FaShoppingCart /> {isInCart ? `Add More (${itemInCart.quantity})` : 'Add to Cart'}
                                        </AddToCartButton>
                                    </MenuItemCard>
                                );
                            })
                        ) : (
                            <EmptyState>No menu items available at this time.</EmptyState>
                        )}
                    </MenuGrid>
                </MenuSection>

                <OrderSummaryCard>
                    <h3><FaShoppingCart /> Your Order</h3>
                    {order.length === 0 ? (
                        <EmptyState>Your cart is empty. Add some delicious items!</EmptyState>
                    ) : (
                        <>
                            {order.map((item) => (
                                <div key={item.menuItem} className="order-item">
                                    <span>{item.name}</span>
                                    <div className="quantity-control">
                                        <button onClick={() => updateOrderQuantity(item.menuItem, -1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateOrderQuantity(item.menuItem, 1)}>+</button>
                                    </div>
                                    <span>${(item.quantity * item.price).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="total">
                                <span>Total:</span>
                                <span>${calculateTotal()}</span>
                            </div>
                        </>
                    )}

                    <div className="customer-details-section">
                        <h4>Your Details</h4>
                        <Input
                            label={<><FaUser /> Your Name</>}
                            placeholder="John Doe"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                        />
                        <Input
                            label={<><FaPhone /> Phone Number</>}
                            placeholder="+1 (123) 456-7890"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                        />
                        <Input
                            label={<><FaEnvelope /> Email (Optional)</>}
                            placeholder="john.doe@example.com"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            type="email"
                        />
                        <Input
                            label={<><FaStickyNote /> Special Notes (e.g., allergies)</>}
                            placeholder="No nuts, extra spicy"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            textArea
                        />
                    </div>

                    <Button
                        fullWidth
                        onClick={handlePlaceOrder}
                        disabled={order.length === 0 || loadingContent || !customerName || !customerPhone}
                        style={{ marginTop: '1.5rem' }}
                    >
                        {loadingContent ? 'Placing Order...' : 'Place Order'}
                    </Button>
                </OrderSummaryCard>
            </PublicOrderLayout>
        )}
      </ModuleContainer>
    );
  }

  if (user && user.restaurantId) {
    return <RestaurantManagementDashboard restaurantId={user.restaurantId} />;
  }

  return (
    <ModuleContainer>
      <PageTitle>Access Denied or Not Configured</PageTitle>
      <AlertCardStyled type="error">
        <p>It seems you're trying to access a restricted area or your restaurant profile is not set up.</p>
        <p>Please ensure you are logged in as a restaurant owner/manager.</p>
        {!user && <Button onClick={() => window.location.href = '/login'} variant="primary" style={{ marginTop: '1rem' }}>Login</Button>}
        {user && !user.restaurantId && <Button onClick={() => window.location.reload()} variant="primary" style={{ marginTop: '1rem' }}>Reload (Attempt auto-create)</Button>}
      </AlertCardStyled>
    </ModuleContainer>
  );
};

export default RestaurantModulePage;
