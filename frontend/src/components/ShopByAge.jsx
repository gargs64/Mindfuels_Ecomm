import React from 'react';

export default function ShopByAge({ navigate }) {
  const ageTiles = [
    {
      label: '2-4 YRS',
      sublabel: 'Early Foundation',
      classParam: 'Early Foundation (Pre Nursery & Nursery)',
      image: '/photos/2-4 kid.jpg'
    },
    {
      label: '4-6 YRS',
      sublabel: 'Kindergarten',
      classParam: 'Kindergarten Years (U.K.G & L.K.G)',
      image: '/photos/4-6 kid.jpg'
    },
    {
      label: '6-8 YRS',
      sublabel: 'Lower Primary',
      classParam: 'Lower Primary (Class 1 & 2)',
      image: '/photos/6-8 kid.jpg'
    },
    {
      label: '8-10 YRS',
      sublabel: 'Upper Primary',
      classParam: 'Upper Primary (Class 3 & 4)',
      image: '/photos/8-10 kid.jpg'
    },
    {
      label: '10-12 YRS',
      sublabel: 'Middle School',
      classParam: 'Middle School (Class 5 & 6)',
      image: '/photos/10-12 kid.jpg'
    }
  ];

  const handleTileClick = (param) => {
    navigate('/products', `class=${encodeURIComponent(param)}`);
  };

  return (
    <section className="shop-by-age-section" style={{ background: '#FFFDF9', padding: '60px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Shop by Age Group</h2>
          <p style={{ color: 'var(--dark-light)', marginTop: '8px', maxWidth: '600px' }}>
            Find curriculum-aligned worksheets and activity books tailored exactly to your child's age and grade level.
          </p>
        </div>

        {/* 5 Circular Tiles */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '30px',
          width: '100%'
        }}>
          {ageTiles.map((tile, idx) => (
            <div
              key={idx}
              onClick={() => handleTileClick(tile.classParam)}
              className="age-tile-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                width: '160px',
                textAlign: 'center'
              }}
            >
              {/* Circular Image Container */}
              <div className="circle-image-wrapper" style={{
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #ffffff',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '14px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <img
                  src={tile.image}
                  alt={tile.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s'
                  }}
                  loading="lazy"
                />
              </div>
              
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)' }}>{tile.label}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--dark-light)', fontWeight: 600 }}>{tile.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .age-tile-card:hover .circle-image-wrapper {
          transform: translateY(-8px) scale(1.05);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }
        .age-tile-card:hover img {
          transform: scale(1.1);
        }
        @media (max-width: 768px) {
          .shop-by-age-section {
            padding: 28px 0 32px 0 !important;
          }
          .shop-by-age-section h2 {
            font-size: 1.5rem !important;
          }
          .shop-by-age-section p {
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </section>
  );
}
