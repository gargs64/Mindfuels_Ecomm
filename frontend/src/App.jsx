import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';

// Components
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProductDetailModal from './components/ProductDetailModal.jsx';

// Pages
import AllProducts from './pages/AllProducts.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import LegalPages from './pages/LegalPages.jsx';
import Admin from './pages/Admin.jsx';

// Home Elements
import Hero from './components/Hero.jsx';
import TrustedFavorites from './components/TrustedFavorites.jsx';
import ShopByAge from './components/ShopByAge.jsx';
import CategoryCarousel from './components/CategoryCarousel.jsx';
import Testimonials from './components/Testimonials.jsx';
import DelhiPublishingInfo from './components/DelhiPublishingInfo.jsx';

import { updatePageSEO } from './utils/seo.js';

function MainApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeProductId, setActiveProductId] = useState(null);
  
  // Track URL updates (for back/forward buttons and navigate triggers)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      
      // Parse product ID from query parameter for direct modal loading (?product=id)
      const params = new URLSearchParams(window.location.search);
      const productParam = params.get('product');
      if (productParam) {
        setActiveProductId(productParam);
      } else {
        setActiveProductId(null);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    // Run initially
    handleLocationChange();

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Dynamic Page Title & Meta Description SEO update
  useEffect(() => {
    switch (currentPath) {
      case '/products':
        updatePageSEO({
          title: "Buy Children's Educational Books & Activity Workbooks | Mindfuels Delhi",
          description: "Browse curriculum-aligned preschool, kindergarten, and primary school workbooks, phonics, mathematics, and moral storybooks from Mindfuels Delhi with free express shipping.",
          canonicalUrl: `https://mindfuelspublisher.com/products${window.location.search}`
        });
        break;
      case '/cart':
        updatePageSEO({
          title: "My Shopping Cart | Mindfuels Children's Books",
          description: "Review your selected preschool workbooks, activity collections, and storybooks. Secure checkout with free delivery across India.",
          canonicalUrl: "https://mindfuelspublisher.com/cart"
        });
        break;
      case '/profile':
        updatePageSEO({
          title: 'My Profile & Order History | Mindfuels Publisher',
          description: 'Track your book shipment deliveries, view past orders, and manage your shipping address.',
          canonicalUrl: "https://mindfuelspublisher.com/profile"
        });
        break;
      case '/legal_pages':
        updatePageSEO({
          title: 'About Mindfuels Publisher Delhi — Policies, Shipping & Contact',
          description: 'Learn about Mindfuels 20-year legacy in children education publishing in Delhi NCR, our 100% replacement guarantee, and fast shipping policies.',
          canonicalUrl: "https://mindfuelspublisher.com/legal_pages"
        });
        break;
      case '/admin':
        updatePageSEO({
          title: 'Admin Dashboard | Mindfuels Publisher'
        });
        break;
      case '/':
      default:
        updatePageSEO({
          title: "Mindfuels | Children's Books & Preschool Activity Workbooks Publisher in Delhi, India",
          description: "Mindfuels is a trusted children's educational book publisher in Delhi NCR. Buy nursery & preschool workbooks, LKG UKG books, phonics, cursive writing, mental maths, and moral storybooks.",
          canonicalUrl: "https://mindfuelspublisher.com/"
        });
        break;
    }
  }, [currentPath]);

  // Helper function to navigate Programmatically without page reloads
  const navigate = (path, search = '') => {
    const targetUrl = path + (search ? `?${search}` : '');
    window.history.pushState({}, '', targetUrl);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleCloseProductModal = () => {
    // Remove product parameter from URL query string
    const params = new URLSearchParams(window.location.search);
    params.delete('product');
    const searchString = params.toString();
    const newUrl = window.location.pathname + (searchString ? `?${searchString}` : '');
    
    window.history.pushState({}, '', newUrl);
    setActiveProductId(null);
  };

  const handleOpenProductModal = (productId) => {
    const params = new URLSearchParams(window.location.search);
    params.set('product', productId);
    const newUrl = window.location.pathname + `?${params.toString()}`;
    
    window.history.pushState({}, '', newUrl);
    setActiveProductId(productId);
  };

  // Render page content based on custom router path state
  const renderPage = () => {
    switch (currentPath) {
      case '/products':
        return <AllProducts onProductClick={handleOpenProductModal} navigate={navigate} />;
      case '/cart':
        return <Cart navigate={navigate} />;
      case '/profile':
        return <Profile navigate={navigate} />;
      case '/legal_pages':
        return <LegalPages />;
      case '/admin':
        return <Admin navigate={navigate} />;
      case '/':
      default:
        return (
          <div className="fade-in">
            <Hero navigate={navigate} />
            <TrustedFavorites onProductClick={handleOpenProductModal} />
            <ShopByAge navigate={navigate} />
            <CategoryCarousel navigate={navigate} />
            <Testimonials />
            <DelhiPublishingInfo navigate={navigate} />
          </div>
        );
    }
  };

  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentPath={currentPath} navigate={navigate} />
      
      <main style={{ flex: '1 0 auto', paddingTop: '60px' }}>
        {renderPage()}
      </main>

      <Footer navigate={navigate} />

      {activeProductId && (
        <ProductDetailModal 
          productId={activeProductId} 
          onClose={handleCloseProductModal} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <MainApp />
      </WishlistProvider>
    </CartProvider>
  );
}
