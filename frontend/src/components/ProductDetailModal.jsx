import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function ProductDetailModal({ productId, onClose }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Fetch product detail on mount
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          setActiveImage(data.image1 || '/photos/1-story-book.jpeg');
          setQuantity(1); // Reset qty
        } else {
          onClose();
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Handle Escape Key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (loading) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // Gather all valid, non-null product images (image1 through image7)
  const images = [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
    product.image5,
    product.image6,
    product.image7
  ].filter(Boolean);

  const isWish = isInWishlist(product.product_id);
  const isOutOfStock = parseInt(product.stock_qty, 10) <= 0;
  const isDiscounted = parseFloat(product.mrp) > parseFloat(product.sp);
  const discountPercent = isDiscounted 
    ? Math.round(((parseFloat(product.mrp) - parseFloat(product.sp)) / parseFloat(product.mrp)) * 100)
    : 0;

  const handleIncrement = () => {
    if (quantity < product.stock_qty) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setQuantity(Math.min(val, product.stock_qty));
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    const currentIndex = images.indexOf(activeImage);
    if (currentIndex > -1) {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      setActiveImage(images[prevIndex]);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    const currentIndex = images.indexOf(activeImage);
    if (currentIndex > -1) {
      const nextIndex = (currentIndex + 1) % images.length;
      setActiveImage(images[nextIndex]);
    }
  };

  const handleAddToCartClick = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card fade-in glass-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Modal Control Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
          ✕
        </button>

        <div className="modal-content-grid">
          {/* Left Side: Photo Gallery Column */}
          <div className="gallery-section">
            <div className="main-preview-container">
              {images.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="gallery-nav-btn" style={{ left: '12px' }} aria-label="Previous image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                  </button>
                  <button onClick={handleNextImage} className="gallery-nav-btn" style={{ right: '12px' }} aria-label="Next image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </>
              )}
              <img src={activeImage} alt={product.title} style={{ userSelect: 'none' }} />
            </div>
            
            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="thumbnail-row">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`thumb-container ${activeImage === img ? 'active-thumb' : ''}`}
                  >
                    <img src={img} alt={`Preview ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Product Details Column */}
          <div className="details-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.25 }}>{product.title}</h2>
              </div>
              
              {/* Wishlist Heart Action inside details */}
              <button onClick={() => toggleWishlist(product)} style={{
                color: isWish ? 'var(--error)' : 'var(--dark-light)',
                padding: '6px'
              }} aria-label="Wishlist">
                <svg width="26" height="26" fill={isWish ? "var(--error)" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            {/* Price section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{product.sp}</span>
              {isDiscounted && (
                <>
                  <span style={{ fontSize: '1.2rem', color: 'var(--dark-light)', textDecoration: 'line-through' }}>₹{product.mrp}</span>
                  <span className="badge badge-discount">{discountPercent}% OFF</span>
                </>
              )}
            </div>

            {/* Description */}
            <div style={{ padding: '16px 0', flexGrow: 1, maxHeight: '200px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--dark-light)', marginBottom: '6px' }}>Description</h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--dark)', whiteSpace: 'pre-line' }}>{product.description}</p>
            </div>



            {/* Cart Booking Action Area */}
            {isOutOfStock ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '14px', borderRadius: '8px',
                textAlign: 'center', fontWeight: 'bold'
              }}>
                Temporarily Out of Stock
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                
                {/* Quantity Counter */}
                <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border)', borderRadius: '50px', background: '#fff' }}>
                  <button onClick={handleDecrement} style={{ width: '40px', height: '40px', fontSize: '1.2rem', fontWeight: 'bold' }}>−</button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityInputChange}
                    style={{ width: '50px', textAlign: 'center', border: 'none', fontWeight: 'bold', fontSize: '1rem' }}
                  />
                  <button onClick={handleIncrement} style={{ width: '40px', height: '40px', fontSize: '1.2rem', fontWeight: 'bold' }}>+</button>
                </div>

                {/* Add to Cart button */}
                <button onClick={handleAddToCartClick} className="btn btn-primary" style={{ flexGrow: 1, padding: '14px 20px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: #ffffff;
          width: 100%;
          max-width: 900px;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          z-index: 2010;
          transition: background 0.2s;
        }
        .modal-close-btn:hover {
          background: var(--border);
        }
        .modal-content-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          height: 100%;
          overflow-y: auto;
        }
        .gallery-section {
          padding: 24px;
          background: #fafafa;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: center;
        }
        .main-preview-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1/1.25;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 12px;
          background: #fff;
          border: 1px solid var(--border);
        }
        .gallery-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid var(--dark);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--dark);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: background 0.2s, transform 0.2s, opacity 0.2s;
          z-index: 10;
        }
        .gallery-nav-btn:hover {
          background: #ffffff;
          transform: translateY(-50%) scale(1.1);
        }
        .gallery-nav-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        .main-preview-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .thumbnail-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .thumb-container {
          flex: 0 0 60px;
          height: 75px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thumb-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .active-thumb {
          border-color: var(--primary);
        }
        .details-section {
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        /* Hide arrows for quantity input number */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }

        @media (max-width: 768px) {
          .modal-content-grid {
            grid-template-columns: 1fr;
          }
          .gallery-section {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .details-section {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
