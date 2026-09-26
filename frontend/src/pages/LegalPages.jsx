import React, { useEffect } from 'react';

export default function LegalPages() {
  
  // Handle scrolling to anchor on load or hash change
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    
    // Add small delay to let DOM render completely
    const timer = setTimeout(handleHashScroll, 150);
    window.addEventListener('hashchange', handleHashScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, []);

  const handleAnchorClick = (e, anchor) => {
    e.preventDefault();
    window.location.hash = anchor;
  };

  return (
    <div className="container legal-layout-split" style={{ padding: '40px 20px 80px 20px', fontFamily: 'var(--font-body)', display: 'flex', gap: '30px' }}>
      
      {/* 1. Left Sticky Navigation Menu */}
      <nav className="glass-panel sticky-nav" style={{
        flex: '0 0 250px',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        height: 'fit-content',
        position: 'sticky',
        top: '100px'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jump To Section</h4>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
          <li><a href="#about" onClick={(e) => handleAnchorClick(e, 'about')} className="legal-nav-link">About Us</a></li>
          <li><a href="#refund" onClick={(e) => handleAnchorClick(e, 'refund')} className="legal-nav-link">Returns & Exchanges</a></li>
          <li><a href="#shipping" onClick={(e) => handleAnchorClick(e, 'shipping')} className="legal-nav-link">Shipping Policy</a></li>
          <li><a href="#contact" onClick={(e) => handleAnchorClick(e, 'contact')} className="legal-nav-link">Contact Us</a></li>
          <li><a href="#privacy" onClick={(e) => handleAnchorClick(e, 'privacy')} className="legal-nav-link">Privacy Policy</a></li>
          <li><a href="#terms" onClick={(e) => handleAnchorClick(e, 'terms')} className="legal-nav-link">Terms & Conditions</a></li>
        </ul>
      </nav>

      {/* 2. Right Content Scroll Sections */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '50px' }}>
        
        {/* Section: About Us */}
        <section id="about" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>About Mindfuels</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            Welcome to Mindfuels! We are a leading children's educational book publisher and distributor based in Delhi NCR. For over two decades, our mission has been to craft enriching, interactive, and beautifully illustrated books that spark curiosity, build foundational skills, and make every young child's reading journey joyful.
          </p>
          <p style={{ color: 'var(--dark-light)' }}>
            We collaborate closely with childhood developmental specialists, preschool educators, and school boards to create curriculum-aligned workbooks, phonics kits, cursive handwriting collections, and value-based moral stories. At Mindfuels, we champion screen-free, hands-on cognitive enrichment for children from Playgroup to Middle School.
          </p>
        </section>

        {/* Section: Returns & Exchanges */}
        <section id="refund" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Returns & Exchanges</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            We want you and your child to love our books. If you receive a damaged, defective, or incorrect print copy, you are eligible for an immediate replacement or full refund under our 7-Day Hassle-Free Policy.
          </p>
          <h4 style={{ margin: '14px 0 6px', fontWeight: 'bold' }}>Key Policies:</h4>
          <ul style={{ paddingLeft: '20px', color: 'var(--dark-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Requests for returns or replacements must be raised within 7 calendar days of delivery.</li>
            <li>Books should be in their original, unused condition.</li>
            <li>In case of physical transit damage, please notify our support team via WhatsApp or email with photos of the package.</li>
          </ul>
        </section>

        {/* Section: Shipping Policy */}
        <section id="shipping" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Shipping Policy</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            We are proud to offer <strong>FREE SHIPPING</strong> across all serviceable pin codes in Delhi NCR and throughout India. We partner with India's leading logistics carriers (Delhivery, BlueDart, Xpressbees, etc.) via Fship to guarantee swift, dependable delivery to your doorstep.
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--dark-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Orders are processed and dispatched within 24–48 hours of order confirmation.</li>
            <li>Estimated delivery times: 2–4 business days for Delhi NCR and metro hubs; 4–7 business days for other regional areas.</li>
            <li>Upon dispatch, a live tracking link with an AWB waybill number is sent to your email and accessible in your customer profile.</li>
          </ul>
        </section>

        {/* Section: Contact Us */}
        <section id="contact" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Contact Us</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            Need assistance with an order, tracking, or school bulk distribution in Delhi NCR or Pan-India? Get in touch with our team:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--dark-light)', marginTop: '12px' }}>
            <div><strong>Email Support:</strong> mindfuelspublisher@gmail.com</div>
            <div><strong>Support & WhatsApp Helpline:</strong> +91 98999 23670 (Mon-Sat, 9:30 AM - 6:30 PM IST)</div>
            <div><strong>Registered Office / Hub:</strong> Mindfuels Publisher & Distributors, Nai Sarak / Daryaganj Commercial Area, Delhi - 110006, India</div>
          </div>
        </section>

        {/* Section: Privacy Policy */}
        <section id="privacy" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Privacy Policy</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            Your privacy and data security are our top priorities. This policy documents how we collect, store, and utilize details regarding your customer account, shipping destinations, and transactions.
          </p>
          <p style={{ color: 'var(--dark-light)' }}>
            We do not store credit card credentials, bank passwords, or UPI PINs on our servers; all payments are processed securely via PCI-DSS compliant Razorpay. Shipping details are transmitted securely via API to Fship logistics to facilitate order fulfillment.
          </p>
        </section>

        {/* Section: Terms & Conditions */}
        <section id="terms" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Terms & Conditions</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            By accessing or purchasing from the Mindfuels platform, you agree to comply with and be bound by these Terms of Service.
          </p>
          <p style={{ color: 'var(--dark-light)' }}>
            All content published in our books, worksheets, activity collections, and web media is the intellectual property of Mindfuels Publisher & Distributors. Commercial reproduction or unauthorized redistribution of our content without written consent is strictly prohibited.
          </p>
        </section>

      </div>

      <style>{`
        .legal-nav-link {
          display: block;
          padding: 8px 12px;
          border-radius: 8px;
          color: var(--dark-light);
          transition: background 0.2s, color 0.2s;
        }
        .legal-nav-link:hover {
          background: var(--light);
          color: var(--primary);
        }
        .legal-content-card h2 {
          font-family: var(--font-display);
        }
        
        @media (max-width: 768px) {
          .legal-layout-split {
            flex-direction: column !important;
          }
          .sticky-nav {
            position: relative !important;
            top: 0 !important;
            flex: 1 1 auto !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
