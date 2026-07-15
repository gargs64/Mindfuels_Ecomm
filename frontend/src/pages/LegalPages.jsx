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
    <div className="container" style={{ padding: '40px 20px 80px 20px', fontFamily: 'var(--font-body)', display: 'flex', gap: '30px' }} className="legal-layout-split">
      
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
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>About Us</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            [PLACEHOLDER ABOUT COPY] Welcome to Mindfuels! We are a premier children's book publisher trusted by schools, educators, and parents. For over two decades, our mission has been to craft enriching, interactive, and beautifully illustrated books that stimulate curiosity and facilitate core academic and mental growth in children.
          </p>
          <p style={{ color: 'var(--dark-light)' }}>
            We work closely with childhood developmental specialists and school boards to create curriculum-aligned workbooks, spelling activities, calligraphy guides, and interactive moral story books. At Mindfuels, we believe in screen-free, hands-on cognitive enrichment.
          </p>
        </section>

        {/* Section: Returns & Exchanges */}
        <section id="refund" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Returns & Exchanges</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            [PLACEHOLDER REFUND POLICY] We want you and your child to love our books. If you receive a damaged, defective, or incorrect print run, you are eligible for a replacement or full refund.
          </p>
          <h4 style={{ margin: '14px 0 6px', fontWeight: 'bold' }}>Key Policies:</h4>
          <ul style={{ paddingLeft: '20px', color: 'var(--dark-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Requests for returns or replacements must be raised within 7 calendar days of delivery.</li>
            <li>Books must be in their original, unused, and pristine packaging condition.</li>
            <li>In cases of physical transport damage, please email support with video/photo evidence of the unboxing.</li>
          </ul>
        </section>

        {/* Section: Shipping Policy */}
        <section id="shipping" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Shipping Policy</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            [PLACEHOLDER SHIPPING POLICY] We are proud to offer **FREE SHIPPING** across all serviceable pin codes in India. We aggregate our deliveries via Fship using leading shipping partners (Delhivery, BlueDart, Xpressbees, etc.) to guarantee swift delivery to your doorstep.
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--dark-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Orders are processed and dispatched within 24–48 hours of successful payment signature verification.</li>
            <li>Estimated delivery times: 2–5 business days for metro areas; 4–7 business days for regional areas.</li>
            <li>Upon dispatch, a live tracking link along with an AWB waybill code is updated on your customer profile and sent via email.</li>
          </ul>
        </section>

        {/* Section: Contact Us */}
        <section id="contact" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Contact Us</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            [PLACEHOLDER CONTACT DETAILS] Need assistance with an order, school bulk subscription, or shipping tracking? Get in touch with our operations support:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--dark-light)', marginTop: '12px' }}>
            <div><strong>Email Support:</strong> help@mindfuels.com</div>
            <div><strong>Support Hotline:</strong> +91 98765 43210 (Mon-Sat, 9:00 AM - 6:00 PM IST)</div>
            <div><strong>Headquarters Address:</strong> Mindfuels Publishing Private Limited, DLF Phase 3, Gurgaon, Haryana, India - 122001</div>
          </div>
        </section>

        {/* Section: Privacy Policy */}
        <section id="privacy" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Privacy Policy</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            [PLACEHOLDER PRIVACY POLICY] Your privacy and security are paramount. This policy documents how we collect, store, and utilize details regarding your Auth0 registrations, shipping destinations, and transactions.
          </p>
          <p style={{ color: 'var(--dark-light)' }}>
            We do not store credit card credentials, bank detail statements, or PIN codes on our host servers; all payments are processed securely via PCI-DSS compliant Razorpay. Shipping details are transmitted securely via API to Fship logistics to facilitate order deliveries.
          </p>
        </section>

        {/* Section: Terms & Conditions */}
        <section id="terms" className="glass-panel legal-content-card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', width: 'fit-content' }}>Terms & Conditions</h2>
          <p style={{ color: 'var(--dark)', marginBottom: '12px' }}>
            [PLACEHOLDER TERMS AND CONDITIONS] By accessing or purchasing from the Mindfuels e-commerce site, you agree to comply with and be bound by these Terms of Service.
          </p>
          <p style={{ color: 'var(--dark-light)' }}>
            All content published in our books, worksheets, activity collections, and web media is the exclusive intellectual property of Mindfuels. Any commercial reproduction, resale, or unauthorized sharing of printable files without written consent is strictly prohibited.
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
