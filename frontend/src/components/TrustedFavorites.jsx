import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard.jsx';

export default function TrustedFavorites({ onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read toggle flags from Vite environment configuration
  // Fallback to true if not defined or set to anything except 'false'
  const showTeachersRec = import.meta.env.VITE_SHOW_TEACHERS_RECOMMENDATION !== 'false';
  const showParentsChoice = import.meta.env.VITE_SHOW_PARENTS_FIRST_CHOICE !== 'false';

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products?limit=20`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to load featured products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // If both are toggled off, render nothing
  if (!showTeachersRec && !showParentsChoice) return null;

  // Slice first 10 for Teacher's Recommendation, next 10 for Parent's First Choice
  const teachersRecProducts = products.slice(0, 10);
  const parentsChoiceProducts = products.slice(10, 20);

  return (
    <section className="container" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', gap: '50px' }}>
      
      {/* 1. Teacher's Recommendation Carousel */}
      {showTeachersRec && teachersRecProducts.length > 0 && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-discount" style={{ background: 'rgba(255, 90, 54, 0.1)', color: 'var(--primary)', marginBottom: '8px' }}>
                Curriculum Approved
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Teacher's Recommendation</h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Swipe for More ➔</span>
          </div>

          {/* Horizontal Scroll Carousel */}
          <div className="carousel-row" style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            paddingBottom: '16px',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin'
          }}>
            {teachersRecProducts.map(product => (
              <div key={`teach-${product.product_id}`} className="carousel-item" style={{
                flex: '0 0 280px',
                scrollSnapAlign: 'start'
              }}>
                <ProductCard product={product} onClick={onProductClick} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Parent's First Choice Carousel */}
      {showParentsChoice && parentsChoiceProducts.length > 0 && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-discount" style={{ background: 'rgba(74, 144, 226, 0.1)', color: 'var(--secondary)', marginBottom: '8px' }}>
                Bestsellers
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Parent's First Choice</h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>Swipe for More ➔</span>
          </div>

          {/* Horizontal Scroll Carousel */}
          <div className="carousel-row" style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            paddingBottom: '16px',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin'
          }}>
            {parentsChoiceProducts.map(product => (
              <div key={`parent-${product.product_id}`} className="carousel-item" style={{
                flex: '0 0 280px',
                scrollSnapAlign: 'start'
              }}>
                <ProductCard product={product} onClick={onProductClick} />
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .carousel-row::-webkit-scrollbar {
          height: 6px;
        }
        .carousel-row::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 10px;
        }
        .carousel-row::-webkit-scrollbar-thumb:hover {
          background-color: #cbd5e1;
        }
      `}</style>
    </section>
  );
}
