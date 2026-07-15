import React from 'react';

export default function Hero({ navigate }) {
  const trustItems = [
    "Schools Trusted",
    "Young Readers Collection",
    "Quality You Can Trust",
    "20 Years of Trust",
    "Schools Trusted",
    "Young Readers Collection",
    "Quality You Can Trust",
    "20 Years of Trust"
  ];

  return (
    <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Primary Banner Image Area */}
      <div className="hero-banner" style={{
        position: 'relative',
        width: '100%',
        minHeight: '480px',
        maxHeight: '620px',
        aspectRatio: '16/7',
        backgroundImage: 'linear-gradient(to right, rgba(30, 41, 59, 0.6), rgba(30, 41, 59, 0.15)), url("/photos/hero-image.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        padding: '0 5%'
      }}>
        {/* Banner CTA Text Overlay */}
        <div style={{ maxWidth: '520px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', lineHeight: 1.15 }}>
            Sparking Curiosity <br/>
            <span style={{ color: 'var(--accent)' }}>One Page at a Time</span>
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '24px', opacity: 0.95, fontWeight: 500, fontFamily: 'var(--font-body)' }}>
            Empower young minds with school-trusted activity books, phonetics workbooks, and storybooks crafted by leading educators.
          </p>
          <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
            Explore All Collections
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Infinite scrolling Trust Bar Marquee */}
      <div className="trust-bar" style={{
        background: 'var(--primary)',
        color: '#ffffff',
        padding: '14px 0',
        display: 'flex',
        alignItems: 'center',
        borderTop: '2px solid rgba(255,255,255,0.1)',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <div className="marquee-container">
          <div className="marquee-content">
            {trustItems.map((text, idx) => (
              <div key={idx} className="marquee-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '50px',
                background: 'rgba(255, 255, 255, 0.15)',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase'
              }}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
                {text}
              </div>
            ))}
          </div>
          {/* Double content for seamless looping */}
          <div className="marquee-content" aria-hidden="true">
            {trustItems.map((text, idx) => (
              <div key={`dup-${idx}`} className="marquee-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '50px',
                background: 'rgba(255, 255, 255, 0.15)',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase'
              }}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
