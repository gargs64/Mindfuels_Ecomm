import React from 'react';

export default function CategoryCarousel({ navigate }) {
  const categories = [
    {
      title: 'Story Books',
      filterType: 'interest',
      filterValue: 'Story Books',
      image: '/photos/1-story-book.jpeg',
      description: 'Moral stories and read-alongs'
    },
    {
      title: 'Activity Books',
      filterType: 'interest',
      filterValue: 'Activity Books',
      image: '/photos/2-activity-book.jpeg',
      description: 'Puzzles, mazes and brain games'
    },
    {
      title: 'All-in-One Workbooks',
      filterType: 'subject',
      filterValue: 'All-in-One',
      image: '/photos/3-subject-book.jpeg',
      description: 'Comprehensive subject guides'
    },
    {
      title: 'Calligraphy & Cursive',
      filterType: 'interest',
      filterValue: 'Calligraphy & Cursive',
      image: '/photos/4-worksheet.jpeg',
      description: 'Writing practice and lettering'
    },
    {
      title: 'Art & Creativity',
      filterType: 'interest',
      filterValue: 'Art & Creativity',
      image: '/photos/5-coloring-book.jpeg',
      description: 'Coloring, drawing and craft'
    },
    {
      title: 'Science & IT Fundamentals',
      filterType: 'subject',
      filterValue: 'Science & Computer',
      image: '/photos/6-IT-and-fundamental-book.jpeg',
      description: 'Computers, logic and basic sciences'
    }
  ];

  const handleCategoryClick = (type, value) => {
    navigate('/products', `${type}=${encodeURIComponent(value)}`);
  };

  return (
    <section className="container" style={{ padding: '60px 20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Shop by Category</h2>
      </div>

      {/* 6 Category Items Row */}
      <div className="category-scroll-row" style={{
        display: 'flex',
        gap: '20px',
        overflowX: 'auto',
        paddingBottom: '16px',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'thin'
      }}>
        {categories.map((cat, idx) => (
          <div
            key={idx}
            onClick={() => handleCategoryClick(cat.filterType, cat.filterValue)}
            className="category-card"
            style={{
              flex: '0 0 260px',
              height: '340px',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              scrollSnapAlign: 'start',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Background Image */}
            <img
              src={cat.image}
              alt={cat.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.5s'
              }}
              loading="lazy"
            />
            
            {/* Gradient Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to top, rgba(30, 41, 59, 0.9) 0%, rgba(30, 41, 59, 0.4) 50%, rgba(30, 41, 59, 0) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '20px',
              color: '#ffffff'
            }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>{cat.title}</h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: '1.2' }}>{cat.description}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .category-scroll-row::-webkit-scrollbar {
          height: 6px;
        }
        .category-scroll-row::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 10px;
        }
        .category-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: var(--secondary);
        }
        .category-card:hover img {
          transform: scale(1.08);
        }
      `}</style>
    </section>
  );
}
