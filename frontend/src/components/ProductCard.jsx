import React from 'react';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function ProductCard({ product, onClick }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.product_id);
  const isDiscounted = parseFloat(product.mrp) > parseFloat(product.sp);
  const discountPercent = isDiscounted 
    ? Math.round(((parseFloat(product.mrp) - parseFloat(product.sp)) / parseFloat(product.mrp)) * 100)
    : 0;

  const handleWishlistClick = (e) => {
    e.stopPropagation(); // Avoid triggering details modal open
    toggleWishlist(product);
  };

  const isOutOfStock = parseInt(product.stock_qty, 10) <= 0;

  return (
    <div className="product-card" onClick={() => onClick(product.product_id)} style={{
      background: 'var(--white)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Wishlist Icon Button */}
      <button onClick={handleWishlistClick} style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10,
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
        color: isWishlisted ? 'var(--error)' : 'var(--dark-light)',
        transition: 'transform 0.2s'
      }} className="wishlist-btn-hover" aria-label="Toggle Wishlist">
        <svg width="20" height="20" fill={isWishlisted ? "var(--error)" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      {/* Discount Badge */}
      {isDiscounted && !isOutOfStock && (
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          background: 'var(--primary)',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '50px',
          fontFamily: 'var(--font-display)'
        }}>
          {discountPercent}% OFF
        </span>
      )}

      {/* Out of Stock Label overlay */}
      {isOutOfStock && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.65)',
          zIndex: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            background: 'var(--dark)',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: '50px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Out of Stock
          </span>
        </div>
      )}

      {/* Cover Image */}
      <div className="aspect-ratio-box">
        <img src={product.image1 || '/photos/1-story-book.jpeg'} alt={product.title} loading="lazy" />
      </div>

      {/* Book Metadata details */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {product.tag1 && <span className="badge badge-stock" style={{ fontSize: '0.65rem' }}>{product.tag1}</span>}
          {product.tag2 && <span className="badge badge-stock" style={{ fontSize: '0.65rem' }}>{product.tag2}</span>}
        </div>

        <h4 style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          lineHeight: '1.3',
          height: '2.6em',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          color: 'var(--dark)'
        }}>
          {product.title}
        </h4>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{product.sp}</span>
          {isDiscounted && (
            <span style={{ fontSize: '0.9rem', color: 'var(--dark-light)', textDecoration: 'line-through' }}>₹{product.mrp}</span>
          )}
        </div>
      </div>

      <style>{`
        .product-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }
        .product-card:hover .aspect-ratio-box img {
          transform: scale(1.05);
        }
        .wishlist-btn-hover:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
