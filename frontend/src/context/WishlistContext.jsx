import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) {
      // Save product ID to session storage so we can optionally add it after login redirect,
      // then trigger Auth0 login redirect
      sessionStorage.setItem('pending_wishlist_product_id', product.product_id);
      loginWithRedirect();
      return;
    }

    const isFav = wishlistItems.some(item => item.product_id === product.product_id);
    try {
      const token = await getAccessTokenSilently();
      if (isFav) {
        // Remove from wishlist
        const response = await fetch(`${API_URL}/api/wishlist/${product.product_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setWishlistItems(prev => prev.filter(item => item.product_id !== product.product_id));
        }
      } else {
        // Add to wishlist
        const response = await fetch(`${API_URL}/api/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: product.product_id })
        });
        if (response.ok) {
          // Add locally to state immediately for responsiveness
          setWishlistItems(prev => [
            {
              product_id: product.product_id,
              title: product.title,
              sp: product.sp,
              mrp: product.mrp,
              stock_qty: product.stock_qty,
              image1: product.image1
            },
            ...prev
          ]);
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  // Perform any pending wishlist actions saved in session storage on startup
  useEffect(() => {
    const handlePendingWishlist = async () => {
      if (isAuthenticated) {
        const pendingPid = sessionStorage.getItem('pending_wishlist_product_id');
        if (pendingPid) {
          sessionStorage.removeItem('pending_wishlist_product_id');
          try {
            const token = await getAccessTokenSilently();
            await fetch(`${API_URL}/api/wishlist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ product_id: pendingPid })
            });
            fetchWishlist();
          } catch (err) {
            console.error('Error adding pending wishlist item:', err);
          }
        }
      }
    };
    handlePendingWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      loading,
      toggleWishlist,
      isInWishlist,
      refreshWishlist: fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
