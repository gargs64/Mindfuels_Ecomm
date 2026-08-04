import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function Navbar({ currentPath, navigate }) {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const { totalItems, addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [wishlistMenuOpen, setWishlistMenuOpen] = useState(false);
  
  const searchInputRef = useRef(null);

  // Focus search input on open
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/products', `search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleDropdownNavigate = (type, value) => {
    navigate('/products', `${type}=${encodeURIComponent(value)}`);
    setMobileMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user) return 'M';
    const name = user.name || user.email || 'M';
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <nav className="glass-navbar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1000,
        fontFamily: 'var(--font-display)'
      }}>
        {/* Brand Logo */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <img src="/photos/logo.png" alt="Mindfuels Logo" style={{ height: '36px', objectFit: 'contain' }} />
        </div>

        {/* Center Links (Desktop only) */}
        <div className="nav-center-links" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span onClick={() => navigate('/products')} style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--dark)' }}>All Products</span>
          
          {/* Class Dropdown */}
          <div className="nav-dropdown-wrapper">
            <span className="dropdown-trigger">Class ▾</span>
            <div className="dropdown-menu">
              <div onClick={() => handleDropdownNavigate('class', 'Early Foundation (Pre Nursery & Nursery)')}>2-4 YRS (Early Foundation)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Kindergarten Years (U.K.G & L.K.G)')}>4-6 YRS (Kindergarten)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Lower Primary (Class 1 & 2)')}>6-8 YRS (Lower Primary)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Upper Primary (Class 3 & 4)')}>8-10 YRS (Upper Primary)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Middle School (Class 5 & 6)')}>10-12 YRS (Middle School)</div>
            </div>
          </div>

          {/* Interest Dropdown */}
          <div className="nav-dropdown-wrapper">
            <span className="dropdown-trigger">Interest ▾</span>
            <div className="dropdown-menu">
              <div onClick={() => handleDropdownNavigate('interest', 'Story Books')}>Story Books</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Rhymes & Poems')}>Rhymes & Poems</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Activity Books')}>Activity Books</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Calligraphy & Cursive')}>Calligraphy & Cursive</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Art & Creativity')}>Art & Creativity</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Phonetics')}>Phonetics</div>
              <div onClick={() => handleDropdownNavigate('interest', 'All-Subject Activity Books')}>All-Subject Activity Books</div>
            </div>
          </div>

          {/* Subject Dropdown */}
          <div className="nav-dropdown-wrapper">
            <span className="dropdown-trigger">Subject ▾</span>
            <div className="dropdown-menu">
              <div onClick={() => handleDropdownNavigate('subject', 'English')}>English</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Hindi')}>Hindi</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Mathematics')}>Mathematics</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Science & Computer')}>Science & Computer</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Mental Ability & GK')}>Mental Ability & GK</div>
              <div onClick={() => handleDropdownNavigate('subject', 'All-in-One')}>All-in-One</div>
            </div>
          </div>
        </div>

        {/* Right Actions (Search, Cart, Wishlist, Profile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          
          {/* Search Icon Trigger */}
          <button onClick={() => setSearchOpen(true)} className="nav-action-btn" aria-label="Search">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {/* Wishlist Dropdown Icon */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setWishlistMenuOpen(!wishlistMenuOpen)} className="nav-action-btn" aria-label="Wishlist">
              <svg width="22" height="22" fill={wishlistItems.length > 0 ? "var(--error)" : "none"} stroke={wishlistItems.length > 0 ? "var(--error)" : "currentColor"} strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {wishlistItems.length > 0 && (
                <span className="badge-count" style={{
                  position: 'absolute', top: '-6px', right: '-8px', background: 'var(--error)', color: '#fff', fontSize: '0.65rem',
                  borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>{wishlistItems.length}</span>
              )}
            </button>
            
            {/* Wishlist Preview Dropdown */}
            {wishlistMenuOpen && (
              <div className="wishlist-popup glass-panel" style={{
                position: 'absolute', right: 0, top: '45px', width: '320px', padding: '16px', borderRadius: '12px', zIndex: 1010
              }}>
                <h4 style={{ marginBottom: '12px', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>My Wishlist</h4>
                {wishlistItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--dark-light)" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <p style={{ fontSize: '0.85rem', color: 'var(--dark-light)', margin: 0 }}>Your Wishlist is Empty</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
                    {wishlistItems.map(item => (
                      <div key={item.product_id} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
                        <img src={item.image1} alt={item.title} style={{ width: '40px', height: '52px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                          <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{item.sp}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => addToCart(item, 1)} className="btn-icon" style={{ color: 'var(--secondary)' }} title="Add to Cart">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                          </button>
                          <button onClick={() => toggleWishlist(item)} className="btn-icon" style={{ color: 'var(--error)' }} title="Remove">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon */}
          <button onClick={() => navigate('/cart')} className="nav-action-btn" style={{ position: 'relative' }} aria-label="Shopping Cart">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {totalItems > 0 && (
              <span className="badge-count" style={{
                position: 'absolute', top: '-6px', right: '-8px', background: 'var(--primary)', color: '#fff', fontSize: '0.65rem',
                borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
              }}>{totalItems}</span>
            )}
          </button>

          {/* Account Profile / Login */}
          <div style={{ position: 'relative' }}>
            {isAuthenticated ? (
              <button onClick={() => setAccountMenuOpen(!accountMenuOpen)} style={{
                width: '38px', height: '38px', borderRadius: '50%', background: '#F0AA8D', color: '#fff', fontSize: '1rem',
                fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.8)'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>
            ) : (
              <button onClick={() => loginWithRedirect()} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Login
              </button>
            )}

            {/* Account Context Dropdown Menu */}
            {accountMenuOpen && isAuthenticated && (
              <div className="account-popup glass-panel" style={{
                position: 'absolute', right: 0, top: '45px', width: '200px', borderRadius: '12px', overflow: 'hidden', zIndex: 1010
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  <div style={{ color: 'var(--dark-light)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                </div>
                <div className="account-menu-link" onClick={() => { navigate('/profile'); setAccountMenuOpen(false); }}>Order History</div>
                <div className="account-menu-link" onClick={() => { navigate('/profile'); setAccountMenuOpen(false); }}>Addresses</div>
                <div className="account-menu-link" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ color: 'var(--error)' }}>Logout</div>
              </div>
            )}
          </div>

          {/* Hamburger Mobile Menu Toggle */}
          <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none' }} aria-label="Menu">
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </nav>

      {/* Slide-In Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer glass-panel" style={{
          position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)',
          padding: '24px', zIndex: 999, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          <div onClick={() => { navigate('/products'); setMobileMenuOpen(false); }} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>All Products</div>
          
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <h5 style={{ color: 'var(--dark-light)', marginBottom: '8px' }}>Class / Age</h5>
            <div className="mobile-sublinks">
              <div onClick={() => handleDropdownNavigate('class', 'Early Foundation (Pre Nursery & Nursery)')}>2-4 YRS (Early Foundation)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Kindergarten Years (U.K.G & L.K.G)')}>4-6 YRS (Kindergarten)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Lower Primary (Class 1 & 2)')}>6-8 YRS (Lower Primary)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Upper Primary (Class 3 & 4)')}>8-10 YRS (Upper Primary)</div>
              <div onClick={() => handleDropdownNavigate('class', 'Middle School (Class 5 & 6)')}>10-12 YRS (Middle School)</div>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <h5 style={{ color: 'var(--dark-light)', marginBottom: '8px' }}>Shop by Interest</h5>
            <div className="mobile-sublinks">
              <div onClick={() => handleDropdownNavigate('interest', 'Story Books')}>Story Books</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Rhymes & Poems')}>Rhymes & Poems</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Activity Books')}>Activity Books</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Calligraphy & Cursive')}>Calligraphy & Cursive</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Art & Creativity')}>Art & Creativity</div>
              <div onClick={() => handleDropdownNavigate('interest', 'Phonetics')}>Phonetics</div>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <h5 style={{ color: 'var(--dark-light)', marginBottom: '8px' }}>Shop by Subject</h5>
            <div className="mobile-sublinks">
              <div onClick={() => handleDropdownNavigate('subject', 'English')}>English</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Hindi')}>Hindi</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Mathematics')}>Mathematics</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Science & Computer')}>Science & Computer</div>
              <div onClick={() => handleDropdownNavigate('subject', 'Mental Ability & GK')}>Mental Ability & GK</div>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Overlay Modal */}
      {searchOpen && (
        <div className="search-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '24px', borderRadius: '16px', position: 'relative' }}>
            <button onClick={() => setSearchOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.2rem', color: 'var(--dark-light)' }}>
              ✕
            </button>
            <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)' }}>Search Product Titles</h3>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type books, worksheets, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: '50px', border: '1px solid var(--border)', fontSize: '1rem',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '14px 28px' }}>
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Nav Dropdowns CSS Styles */}
      <style>{`
        .nav-dropdown-wrapper {
          position: relative;
          display: inline-block;
        }
        .dropdown-trigger {
          cursor: pointer;
          font-weight: 600;
          color: var(--dark-light);
          padding: 8px 0;
          transition: color 0.2s;
        }
        .dropdown-trigger:hover {
          color: var(--primary);
        }
        .dropdown-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          width: 250px;
          background: #ffffff;
          box-shadow: var(--shadow-lg);
          border-radius: 8px;
          overflow: hidden;
          z-index: 1001;
          border: 1px solid var(--border);
          margin-top: 4px;
        }
        .dropdown-menu div {
          padding: 10px 16px;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--dark);
          transition: background 0.2s, color 0.2s;
        }
        .dropdown-menu div:hover {
          background: var(--light);
          color: var(--primary);
        }
        .nav-dropdown-wrapper:hover .dropdown-menu {
          display: block;
        }
        .nav-action-btn {
          color: var(--dark);
          transition: color 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-action-btn:hover {
          color: var(--primary);
          transform: scale(1.05);
        }
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          background: var(--light);
          transition: background 0.2s, transform 0.2s;
        }
        .btn-icon:hover {
          background: var(--border);
          transform: scale(1.05);
        }
        .account-menu-link {
          padding: 12px 16px;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--dark);
          transition: background 0.2s;
        }
        .account-menu-link:hover {
          background: var(--light);
        }
        .mobile-sublinks div {
          padding: 8px 12px;
          font-size: 0.95rem;
          color: var(--dark-light);
          cursor: pointer;
        }
        .mobile-sublinks div:hover {
          color: var(--primary);
        }
        
        @media (max-width: 768px) {
          .nav-center-links {
            display: none !important;
          }
          .mobile-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
