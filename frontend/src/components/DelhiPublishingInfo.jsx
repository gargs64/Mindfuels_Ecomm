import React, { useState } from 'react';

export default function DelhiPublishingInfo({ navigate }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const pillars = [
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      ),
      title: '20+ Years Educational Legacy',
      desc: 'Originating in the historic publishing hub of Delhi, we have supplied premier preschools and schools for over two decades.'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      title: 'Curriculum-Aligned Learning',
      desc: 'Expertly designed for CBSE, ICSE, and Montessori early-childhood frameworks from Nursery to Class 8.'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      ),
      title: 'Delhi NCR Express Dispatch',
      desc: 'Dispatched within 24-48 hours across South Delhi, Rohini, Dwarka, Noida, Gurgaon, Ghaziabad & all of India.'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      title: 'School & Bulk Supplies',
      desc: 'Direct publisher rates, academic session syllabus kits, and institutional packages for preschool chains.'
    }
  ];

  const faqs = [
    {
      q: "What age groups are Mindfuels children's books designed for?",
      a: "Mindfuels publishes age-appropriate educational materials starting from Early Foundation (Pre-Nursery & Nursery, 2-4 Yrs), Kindergarten (LKG & UKG, 4-6 Yrs), Lower Primary (Classes 1 & 2, 6-8 Yrs), Upper Primary (Classes 3 & 4, 8-10 Yrs), up to Middle School (Classes 5 & 6, 10-12 Yrs)."
    },
    {
      q: "How fast is delivery to Delhi, Gurgaon, Noida, and NCR regions?",
      a: "Orders placed on Mindfuels are processed and dispatched within 24 to 48 hours. Most customers in Delhi NCR receive their packages within 2 to 4 business days with complimentary free shipping and live SMS/email tracking."
    },
    {
      q: "Can preschools and educators in Delhi order books in bulk?",
      a: "Yes! We work directly with preschool chains, private schools, tuition academies, and daycare centers across Delhi NCR and India. You can connect with our support team via WhatsApp or email for institutional pricing and customized book sets."
    },
    {
      q: "Why are screen-free activity workbooks important for early child development?",
      a: "Our workbooks emphasize fine motor skills, pencil grip control, handwriting precision, cognitive logic, and spatial recognition. They provide a joyful, tangible learning experience that reduces screen dependency and enhances focus."
    }
  ];

  return (
    <section className="delhi-seo-section" style={{
      background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)',
      padding: '70px 20px',
      borderTop: '1px solid var(--border)',
      fontFamily: 'var(--font-body)'
    }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: '50px',
            background: 'rgba(255, 90, 54, 0.1)',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px',
            fontFamily: 'var(--font-display)'
          }}>
            Publisher Direct in Delhi NCR & Pan-India
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--dark)', lineHeight: '1.25' }}>
            Empowering Young Minds With Meaningful, Screen-Free Learning
          </h2>
          <p style={{ color: 'var(--dark-light)', fontSize: '1rem', marginTop: '12px', lineHeight: '1.6' }}>
            Rooted in Delhi’s prestigious publishing heritage, Mindfuels creates curriculum-aligned workbooks, phonics kits, and moral stories trusted by leading schools, educators, and thousands of mindful parents.
          </p>
        </div>

        {/* 4 Feature Pillars Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}>
          {pillars.map((item, idx) => (
            <div key={idx} className="glass-panel" style={{
              padding: '28px 22px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(255, 90, 54, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', margin: 0 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--dark-light)', margin: 0, lineHeight: '1.5' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Informational Callout Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF3EE 0%, #FEE8DF 100%)',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid rgba(255, 90, 54, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ maxWidth: '650px' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '8px' }}>
              Are You a School Principal, Teacher, or Daycare Director?
            </h4>
            <p style={{ color: 'var(--dark-light)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
              We offer personalized curriculum counseling, bulk order discounts, and customized school book sets across Delhi, Noida, Gurgaon, and Pan-India.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/919899923670?text=Hi%20Mindfuels%2C%20I%20am%20interested%20in%20School%2FBulk%20Book%20Supply"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '50px', textDecoration: 'none' }}
            >
              Enquire for Bulk Supply
            </a>
            <button
              onClick={() => navigate('/products')}
              className="btn btn-outline"
              style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '50px', background: '#fff' }}
            >
              Browse All Books
            </button>
          </div>
        </div>

        {/* Interactive FAQ Section for Parents & Search Snippets */}
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark)' }}>
              Frequently Asked Questions
            </h3>
            <p style={{ color: 'var(--dark-light)', fontSize: '0.9rem', marginTop: '6px' }}>
              Everything you need to know about our books, shipping, and school partnerships.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      color: isOpen ? 'var(--primary)' : 'var(--dark)',
                      fontFamily: 'var(--font-body)'
                    }}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        marginLeft: '12px'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 18px 20px',
                      fontSize: '0.88rem',
                      color: 'var(--dark-light)',
                      lineHeight: '1.6',
                      borderTop: '1px solid rgba(0,0,0,0.04)'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
