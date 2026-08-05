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
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              Publishing educational, activity, coloring, and storybooks that inspire creativity, encourage learning, and make every child's reading journey enjoyable. Thankyou for Joining our Community
            </p>
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

          {/* Column 4: Social Connect Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Connect with Us</h4>

            {/* Instagram */}
            <a href="https://www.instagram.com/mindfuels_publisher/" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>Instagram</span>
            </a>

            {/* Email */}
            <a href="mailto:mindfuelspubliher@gmail.com" className="footer-social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>mindfuelspublisher@gmail.com</span>
            </a>

            {/* Phone */}
            <a href="tel:+919899923670" className="footer-social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.49 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>+91 98999 23670</span>
            </a>

            {/* WhatsApp */}
            <a href="https://wa.me/919899923670?text=Hi%2C%20i%20have%20an%20enquiry%20about%20a%20book" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              <span>WhatsApp Us</span>
            </a>
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
          © {new Date().getFullYear()} Mindfuels Publisher & Distributors. All rights reserved.
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
        .footer-social-link {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94A3B8;
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .footer-social-link:hover {
          color: #ffffff;
          transform: translateX(4px);
        }
        .footer-social-link svg {
          flex-shrink: 0;
          opacity: 0.75;
          transition: opacity 0.2s ease;
        }
        .footer-social-link:hover svg {
          opacity: 1;
        }
        @media (max-width: 768px) {
          footer {
            padding-top: 40px !important;
            padding-bottom: 80px !important; /* Space for mobile bottom nav */
          }
        }
      `}</style>
    </footer>
  );
}
