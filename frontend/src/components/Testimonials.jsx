import React, { useState } from 'react';

export default function Testimonials() {
  const [playingVideoIdx, setPlayingVideoIdx] = useState(null);

  const testimonials = [
    { video: '/testimonial_videos/vid1.mp4', caption: '"My kids love the storybooks and moral lessons!"', author: 'Aditi S., Parent of 5yo' },
    { video: '/testimonial_videos/vid2.mp4', caption: '"The worksheets keep my daughter engaged for hours!"', author: 'Rajesh K., Parent of 7yo' },
    { video: '/testimonial_videos/vid3.mp4', caption: '"Highly recommended by our elementary school teachers."', author: 'Principal, Oakridge International' },
    { video: '/testimonial_videos/vid4.mp4', caption: '"Phonetics exercises are extremely clear and helpful."', author: 'Meera J., Parent of 4yo' },
    { video: '/testimonial_videos/vid5.mp4', caption: '"Mindfuels GK books helped my son build a strong foundation."', author: 'Devendra V., Parent of 8yo' },
    { video: '/testimonial_videos/vid6.mp4', caption: '"Creative illustrations make reading so much fun."', author: 'Sneha P., Parent of 6yo' },
    { video: '/testimonial_videos/vid7.mp4', caption: '"Activity books are the best screen-free alternative!"', author: 'Vikram A., Parent of 9yo' },
    { video: '/testimonial_videos/vid8.mp4', caption: '"Perfect gift for young readers. Excellent book quality."', author: 'Pooja T., Parent of 10yo' },
    { video: '/testimonial_videos/vid9.mp4', caption: '"Highly interactive and curriculum-focused content."', author: 'Ananya S., Primary School Teacher' },
    { video: '/testimonial_videos/vid10.mp4', caption: '"The cursive writing worksheets helped improve handwriting fast."', author: 'Harish M., Parent of 7yo' },
    { video: '/testimonial_videos/vid11.mp4', caption: '"Super fast delivery and great customer support!"', author: 'Neha R., Teacher at Sunshine Academy' }
  ];

  return (
    <section style={{ background: '#FFFDF9', padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <span className="badge badge-discount" style={{ background: 'rgba(255, 90, 54, 0.1)', color: 'var(--primary)', marginBottom: '8px' }}>
            User Reviews
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Loved by Parents & Teachers</h2>
          <p style={{ color: 'var(--dark-light)', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0' }}>
            Hear directly from the educators and parents who trust Mindfuels books to power children's early educational journeys.
          </p>
        </div>

        {/* Grid of 11 Testimonials */}
        <div className="testimonials-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {testimonials.map((t, idx) => {
            const isPlaying = playingVideoIdx === idx;
            
            return (
              <div key={idx} className="glass-panel" style={{
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border)'
              }}>
                
                {/* Video / Thumbnail Container */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isPlaying ? (
                    <video
                      src={t.video}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    // Lazy-loading video thumbnail overlay
                    <div
                      onClick={() => setPlayingVideoIdx(idx)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.9) 0%, rgba(74, 144, 226, 0.9) 100%)',
                        color: '#ffffff',
                        transition: 'opacity 0.3s'
                      }}
                      className="thumbnail-overlay"
                    >
                      {/* Play Button Icon */}
                      <div className="flex-center play-button-hover" style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: 'var(--primary)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        marginBottom: '10px',
                        transition: 'transform 0.2s'
                      }}>
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"></path>
                        </svg>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Click to Play Review
                      </span>
                    </div>
                  )}
                </div>

                {/* Caption / Author info */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'center' }}>
                  <p style={{
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    lineHeight: '1.4',
                    color: 'var(--dark)'
                  }}>
                    {t.caption}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    alignSelf: 'flex-end',
                    marginTop: 'auto'
                  }}>
                    — {t.author}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .thumbnail-overlay:hover {
          opacity: 0.95;
        }
        .thumbnail-overlay:hover .play-button-hover {
          transform: scale(1.15);
        }
      `}</style>
    </section>
  );
}
