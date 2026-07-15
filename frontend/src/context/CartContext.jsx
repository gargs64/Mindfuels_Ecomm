import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Load cart on startup or when auth status changes
  useEffect(() => {
    if (isAuthenticated) {
      syncAndFetchDBCart();
    } else {
      // Load guest cart
      const guestCart = JSON.parse(localStorage.getItem('mindfuels_guest_cart') || '[]');
      setCartItems(guestCart);
    }
  }, [isAuthenticated, user]);

  // Sync guest cart to DB upon login and retrieve updated cart
  const syncAndFetchDBCart = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const guestCart = JSON.parse(localStorage.getItem('mindfuels_guest_cart') || '[]');

      if (guestCart.length > 0) {
        console.log('Merging guest cart into database...');
        // Merge guest cart to DB
        await fetch(`${API_URL}/api/cart/merge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: guestCart })
        });
        // Clear local guest cart
        localStorage.removeItem('mindfuels_guest_cart');
      }

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
      // Fallback: load guest cart if request fails
      const guestCart = JSON.parse(localStorage.getItem('mindfuels_guest_cart') || '[]');
      setCartItems(guestCart);
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
    if (isAuthenticated) {
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
          throw new Error(errData.error || 'Failed to add item to database cart');
        }

        await fetchDBCart(token);
      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    } else {
      // Guest local storage logic
      const guestCart = JSON.parse(localStorage.getItem('mindfuels_guest_cart') || '[]');
      const existingItemIndex = guestCart.findIndex(item => item.product_id === product.product_id);

      if (existingItemIndex > -1) {
        const newQty = guestCart[existingItemIndex].quantity + quantity;
        if (newQty > product.stock_qty) {
          alert(`Cannot add requested quantity. Available stock: ${product.stock_qty}.`);
          return;
        }
        guestCart[existingItemIndex].quantity = newQty;
      } else {
        if (quantity > product.stock_qty) {
          alert(`Cannot add requested quantity. Available stock: ${product.stock_qty}.`);
          return;
        }
        guestCart.push({
          product_id: product.product_id,
          quantity,
          title: product.title,
          sp: product.sp,
          mrp: product.mrp,
          stock_qty: product.stock_qty,
          image1: product.image1,
          weight: product.weight,
          length: product.length,
          width: product.width,
          height: product.height
        });
      }

      localStorage.setItem('mindfuels_guest_cart', JSON.stringify(guestCart));
      setCartItems([...guestCart]);
    }
  };

  const updateQuantity = async (productId, newQty) => {
    if (newQty <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (isAuthenticated) {
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
    } else {
      // Guest local storage update
      const guestCart = JSON.parse(localStorage.getItem('mindfuels_guest_cart') || '[]');
      const itemIndex = guestCart.findIndex(item => item.product_id === productId);

      if (itemIndex > -1) {
        if (newQty > guestCart[itemIndex].stock_qty) {
          alert(`Cannot update quantity. Available stock: ${guestCart[itemIndex].stock_qty}.`);
          return;
        }
        guestCart[itemIndex].quantity = newQty;
        localStorage.setItem('mindfuels_guest_cart', JSON.stringify(guestCart));
        setCartItems([...guestCart]);
      }
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
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
    } else {
      const guestCart = JSON.parse(localStorage.getItem('mindfuels_guest_cart') || '[]');
      const filteredCart = guestCart.filter(item => item.product_id !== productId);
      localStorage.setItem('mindfuels_guest_cart', JSON.stringify(filteredCart));
      setCartItems(filteredCart);
    }
  };

  const clearLocalCartOnly = () => {
    localStorage.removeItem('mindfuels_guest_cart');
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
