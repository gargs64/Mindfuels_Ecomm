import React, { useState, useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';

// Gentle lift on hover, slight press on tap. Spring keeps it interruptible.
const cardHover = { y: -4, transition: { type: 'spring', bounce: 0.2, visualDuration: 0.25 } };
const cardTap = { scale: 0.98, transition: { type: 'spring', bounce: 0, visualDuration: 0.15 } };
const iconTap = { scale: 0.88 };
const buttonTap = { scale: 0.95 };

export default function ProductCard({ product, onClick }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  // idle → adding → added (briefly) → idle
  const [cartState, setCartState] = useState('idle');
  const resetTimer = useRef(null);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const isWishlisted = isInWishlist(product.product_id);
  const isDiscounted = parseFloat(product.mrp) > parseFloat(product.sp);
  const discountPercent = isDiscounted
    ? Math.round(((parseFloat(product.mrp) - parseFloat(product.sp)) / parseFloat(product.mrp)) * 100)
    : 0;

  const handleWishlistClick = (e) => {
    e.stopPropagation(); // Avoid triggering details modal open
    toggleWishlist(product);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Add straight from the card without opening details
    if (cartState === 'adding') return;
    setCartState('adding');
    const added = await addToCart(product, 1);
    setCartState(added ? 'added' : 'idle');
    if (added) {
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCartState('idle'), 2000);
    }
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    onClick(product.product_id);
  };

  const isOutOfStock = parseInt(product.stock_qty, 10) <= 0;

  // First non-empty tag (class / subject / interest) shown as a single chip
  const tag = [product.tag1, product.tag2, product.tag3].find(t => t && t.trim());

  // Remember which URL failed so a new image1 gets a fresh attempt
  const [failedSrc, setFailedSrc] = useState(null);
  const imageSrc = product.image1 && product.image1.trim();
  const showImage = imageSrc && failedSrc !== imageSrc;

  return (
    <m.div
      className="mf-card"
      onClick={() => onClick(product.product_id)}
      onKeyDown={(e) => {
        // Only when the card itself has focus — keys on the inner buttons do their own thing
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(product.product_id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.title}`}
      whileHover={cardHover}
      whileTap={cardTap}
    >
      {/* Cover Image */}
      <div className="mf-card-media">
        {showImage ? (
          <img src={imageSrc} alt={product.title} loading="lazy" decoding="async" onError={() => setFailedSrc(imageSrc)} />
        ) : (
          /* Branded placeholder for missing or broken covers — fills the same frame, so no layout shift */
          <div className="mf-card-placeholder" role="img" aria-label={product.title}>
            <svg width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M9 7h7M9 11h5" />
            </svg>
            <span className="mf-card-placeholder-brand">Mindfuels</span>
            <span className="mf-card-placeholder-note">Cover photo coming soon</span>
          </div>
        )}

        {/* Out of Stock Label overlay */}
        {isOutOfStock && (
          <div className="mf-card-soldout">
            <span>Out of stock</span>
          </div>
        )}

        {/* Wishlist Icon Button */}
        <m.button
          onClick={handleWishlistClick}
          className={`mf-card-wish ${isWishlisted ? 'is-active' : ''}`}
          aria-label={isWishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          whileTap={iconTap}
        >
          <svg width="20" height="20" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </m.button>
      </div>

      {/* Book Metadata details */}
      <div className="mf-card-body">
        {tag && (
          <span className="mf-card-tag" title={tag}>{tag}</span>
        )}

        <h4 className="mf-card-title">
          {product.title}
        </h4>

        <div className="mf-card-price">
          <span className="mf-card-sp">₹{product.sp}</span>
          {isDiscounted && (
            <span className="mf-card-mrp">₹{product.mrp}</span>
          )}
          {isDiscounted && !isOutOfStock && (
            <span className="mf-card-off">{discountPercent}% off</span>
          )}
        </div>

        {/* Buy straight from the card, or open details with the arrow */}
        <div className="mf-card-actions">
          <m.button
            type="button"
            className={`mf-card-add ${cartState === 'added' ? 'is-added' : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartState === 'adding'}
            aria-label={isOutOfStock ? `${product.title} is out of stock` : `Add ${product.title} to cart`}
            whileTap={isOutOfStock ? undefined : buttonTap}
          >
            {isOutOfStock ? (
              'Out of stock'
            ) : cartState === 'added' ? (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Added
              </>
            ) : cartState === 'adding' ? (
              'Adding…'
            ) : (
              <>
                <svg className="mf-card-add-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Add to cart
              </>
            )}
          </m.button>
          <span className="mf-sr-only" role="status">{cartState === 'added' ? `${product.title} added to cart` : ''}</span>

          <m.button
            type="button"
            className="mf-card-details"
            onClick={handleDetailsClick}
            aria-label={`View details for ${product.title}`}
            whileTap={buttonTap}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </m.button>
        </div>
      </div>
    </m.div>
  );
}
