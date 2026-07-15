import React from 'react';

export default function Footer({ navigate }) {
  const handleLegalClick = (anchor) => {
    navigate('/legal_pages', '', anchor); // navigates and scrolls to anchor
    window.location.hash = anchor;
  };

  const handleCategoryClick = (type, val) => {
    navigate('/products', `${type}=${encodeURIComponent(val)}`);
  };

  return (
    <footer style={{ background: 'var(--dark)', color: '#94A3B8', paddingTop: '60px', paddingBottom: '30px', fontFamily: 'var(--font-body)' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Footer Top Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '30px'
        }}>
          {/* Column 1: Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/photos/logo.png" alt="Mindfuels" style={{ height: '40px', filter: 'brightness(1.5)' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>Mindfuels</span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              Publishing highly interactive, school-trusted worksheets and activities designed to inspire a lifelong love for learning in children.
            </p>
            {/* Trust badge icons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <span className="badge badge-stock" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.65rem' }}>ISO 9001:2015</span>
              <span className="badge badge-stock" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.65rem' }}>100% Safe Paper</span>
            </div>
          </div>

          {/* Column 2: Quick Shop Categories */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Explore Books</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <li onClick={() => handleCategoryClick('interest', 'Story Books')} style={{ cursor: 'pointer' }} className="footer-link-hover">Story Books</li>
              <li onClick={() => handleCategoryClick('interest', 'Activity Books')} style={{ cursor: 'pointer' }} className="footer-link-hover">Activity Books</li>
              <li onClick={() => handleCategoryClick('subject', 'English')} style={{ cursor: 'pointer' }} className="footer-link-hover">English Grammar</li>
              <li onClick={() => handleCategoryClick('subject', 'Mathematics')} style={{ cursor: 'pointer' }} className="footer-link-hover">Mental Maths</li>
              <li onClick={() => handleCategoryClick('subject', 'Science & Computer')} style={{ cursor: 'pointer' }} className="footer-link-hover">Computer Science</li>
            </ul>
          </div>

          {/* Column 3: Legal & Support Pages */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Policy & Support</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <li onClick={() => handleLegalClick('about')} style={{ cursor: 'pointer' }} className="footer-link-hover">About Us</li>
              <li onClick={() => handleLegalClick('refund')} style={{ cursor: 'pointer' }} className="footer-link-hover">Returns & Refund Policy</li>
              <li onClick={() => handleLegalClick('shipping')} style={{ cursor: 'pointer' }} className="footer-link-hover">Shipping Details</li>
              <li onClick={() => handleLegalClick('privacy')} style={{ cursor: 'pointer' }} className="footer-link-hover">Privacy Policy</li>
              <li onClick={() => handleLegalClick('terms')} style={{ cursor: 'pointer' }} className="footer-link-hover">Terms & Conditions</li>
              <li onClick={() => handleLegalClick('contact')} style={{ cursor: 'pointer' }} className="footer-link-hover">Contact Support</li>
            </ul>
          </div>

          {/* Column 4: Newsletter Sign-up */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Stay Updated</h4>
            <p style={{ fontSize: '0.8rem' }}>Get updates on new releases, worksheets and discounts.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <input
                type="email"
                placeholder="Your Email"
                required
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '50px', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8rem'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '50px', fontSize: '0.8rem' }}>
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom Banner line */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.8rem'
        }}>
          <div>
            © {new Date().getFullYear()} Mindfuels Book Publishers. All rights reserved.
          </div>
          
          {/* Payment gateway trust logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ opacity: 0.5 }}>Secured by Razorpay</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.65rem' }}>UPI</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.65rem' }}>Cards</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.65rem' }}>Netbanking</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link-hover:hover {
          color: var(--primary);
          transform: translateX(4px);
        }
      `}</style>
    </footer>
  );
}
