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

// Home Elements
import Hero from './components/Hero.jsx';
import TrustedFavorites from './components/TrustedFavorites.jsx';
import ShopByAge from './components/ShopByAge.jsx';
import CategoryCarousel from './components/CategoryCarousel.jsx';
import Testimonials from './components/Testimonials.jsx';

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

  // Dynamic Page Title SEO update
  useEffect(() => {
    switch (currentPath) {
      case '/products':
        document.title = 'All Products & Workbooks | Mindfuels';
        break;
      case '/cart':
        document.title = 'My Shopping Cart | Mindfuels';
        break;
      case '/profile':
        document.title = 'My Profile & Orders | Mindfuels';
        break;
      case '/legal_pages':
        document.title = 'Policies & Terms | Mindfuels';
        break;
      case '/':
      default:
        document.title = "Mindfuels | Trustworthy Children's Books & Activity Workbooks";
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
      case '/':
      default:
        return (
          <div className="fade-in">
            <Hero navigate={navigate} />
            <TrustedFavorites onProductClick={handleOpenProductModal} />
            <ShopByAge navigate={navigate} />
            <CategoryCarousel navigate={navigate} />
            <Testimonials />
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
