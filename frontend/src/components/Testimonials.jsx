import React, { useState, useRef, useEffect } from 'react';

function TestimonialCard({ videoSrc, isActive, onToggleActive }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(err => {
        console.log('Play failed/blocked:', err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <div 
      className="glass-panel testimonial-card" 
      style={{
        flex: '0 0 240px',
        height: '426px',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        background: '#000',
        cursor: 'pointer'
      }} 
      onClick={onToggleActive}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        preload="metadata"
        playsInline
        loop
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      
      {!isActive && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }} className="play-overlay">
          <div className="play-circle" style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            color: 'var(--primary)',
            transition: 'all 0.2s ease'
          }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '2px' }}>
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Testimonials() {
  const [activeIdx, setActiveIdx] = useState(null);
  const scrollRef = useRef(null);

  const testimonials = [
    { video: '/testimonial_videos/vid1.mp4' },
    { video: '/testimonial_videos/vid2.mp4' },
    { video: '/testimonial_videos/vid3.mp4' },
    { video: '/testimonial_videos/vid4.mp4' },
    { video: '/testimonial_videos/vid5.mp4' },
    { video: '/testimonial_videos/vid6.mp4' },
    { video: '/testimonial_videos/vid7.mp4' },
    { video: '/testimonial_videos/vid8.mp4' },
    { video: '/testimonial_videos/vid9.mp4' },
    { video: '/testimonial_videos/vid10.mp4' },
    { video: '/testimonial_videos/vid11.mp4' }
  ];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollAmount = 260; // card width (240) + gap (20)
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleToggle = (idx) => {
    if (activeIdx === idx) {
      setActiveIdx(null); // Pause if clicked again
    } else {
      setActiveIdx(idx); // Play clicked, pauses any other active video
    }
  };

  return (
    <section style={{ background: '#FFFDF9', padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Loved by Parents & Teachers</h2>
          <p style={{ color: 'var(--dark-light)', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0' }}>
            Hear directly from the educators and parents who trust Mindfuels books to power children's early educational journeys.
          </p>
        </div>

        {/* Carousel Wrapper */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          {/* Left Button */}
          <button 
            onClick={() => scroll('left')} 
            className="carousel-btn" 
            style={{ left: '-22px' }}
            aria-label="Previous testimonials"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* Horizontal Scroll Row */}
          <div 
            ref={scrollRef} 
            className="testimonials-scroll-row" 
            style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              width: '100%',
              padding: '10px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {testimonials.map((t, idx) => (
              <TestimonialCard
                key={idx}
                videoSrc={t.video}
                isActive={activeIdx === idx}
                onToggleActive={() => handleToggle(idx)}
              />
            ))}
          </div>

          {/* Right Button */}
          <button 
            onClick={() => scroll('right')} 
            className="carousel-btn" 
            style={{ right: '-22px' }}
            aria-label="Next testimonials"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .testimonials-scroll-row::-webkit-scrollbar {
          display: none;
        }
        .carousel-btn {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid var(--border);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          color: var(--dark);
          transition: all 0.2s;
        }
        .carousel-btn:hover {
          background: var(--light);
          transform: scale(1.05);
          color: var(--primary);
        }
        .testimonial-card:hover .play-circle {
          transform: scale(1.1);
        }
      `}</style>
    </section>
  );
}
