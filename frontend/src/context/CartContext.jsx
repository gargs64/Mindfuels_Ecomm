import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, user } = useAuth0();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Load cart on startup or when auth status changes
  useEffect(() => {
    if (isAuthenticated) {
      syncAndFetchDBCart();
    } else {
      // Clear cart for non-logged-in users — no guest cart
      setCartItems([]);
    }
  }, [isAuthenticated, user]);

  // Sync profile and fetch DB cart on login
  const syncAndFetchDBCart = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();

      // Synchronize Auth0 profile details with DB users table
      if (user) {
        await fetch(`${API_URL}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: user.name || user.nickname,
            email: user.email,
            phone: user.phone_number || ''
          })
        });
      }

      // Fetch DB cart items
      await fetchDBCart(token);
    } catch (error) {
      console.error('Error synchronizing database cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDBCart = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch DB cart:', error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      // Redirect to login — no guest cart
      loginWithRedirect();
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.product_id, quantity })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add item to cart');
      }

      await fetchDBCart(token);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const updateQuantity = async (productId, newQty) => {
    if (newQty <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (!isAuthenticated) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/api/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQty })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update quantity');
      }

      await fetchDBCart(token);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/api/cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchDBCart(token);
      }
    } catch (error) {
      console.error('Failed to delete item from DB cart:', error);
    }
  };

  const clearLocalCartOnly = () => {
    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.sp) * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearLocalCartOnly,
      totalItems,
      totalAmount,
      refreshCart: syncAndFetchDBCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
