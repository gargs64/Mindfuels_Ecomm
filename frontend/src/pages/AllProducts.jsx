import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard.jsx';

export default function AllProducts({ onProductClick, navigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Local filter states
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [searchWord, setSearchWord] = useState('');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

  // Constants
  const classesList = [
    { label: '2-4 Yrs (Early Foundation)', value: 'Early Foundation (Pre Nursery & Nursery)' },
    { label: '4-6 Yrs (Kindergarten)', value: 'Kindergarten Years (U.K.G & L.K.G)' },
    { label: '6-8 Yrs (Lower Primary)', value: 'Lower Primary (Class 1 & 2)' },
    { label: '8-10 Yrs (Upper Primary)', value: 'Upper Primary (Class 3 & 4)' },
    { label: '10-12 Yrs (Middle School)', value: 'Middle School (Class 5 & 6)' }
  ];

  const interestsList = [
    'Story Books', 'Rhymes & Poems', 'Activity Books', 
    'Calligraphy & Cursive', 'Art & Creativity', 'Phonetics', 
    'All-Subject Activity Books'
  ];

  const subjectsList = [
    'English', 'Hindi', 'Mathematics', 'Science & Computer', 
    'Mental Ability & GK', 'All-in-One'
  ];

  // Parse URL query string on mount and on popstate navigation events
  const syncFiltersFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    
    const classParam = params.get('class');
    const interestParam = params.get('interest');
    const subjectParam = params.get('subject');
    const searchParam = params.get('search') || '';
    const pageParam = parseInt(params.get('page'), 10) || 1;

    setSelectedClasses(classParam ? classParam.split(',') : []);
    setSelectedInterests(interestParam ? interestParam.split(',') : []);
    setSelectedSubjects(subjectParam ? subjectParam.split(',') : []);
    setSearchWord(searchParam);
    setCurrentPage(pageParam);
  };

  useEffect(() => {
    syncFiltersFromUrl();

    const handlePopState = () => {
      syncFiltersFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch products whenever filters or page changes
  useEffect(() => {
    fetchFilteredProducts();
  }, [selectedClasses, selectedInterests, selectedSubjects, searchWord, currentPage]);

  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClasses.length > 0) params.set('class', selectedClasses.join(','));
      if (selectedInterests.length > 0) params.set('interest', selectedInterests.join(','));
      if (selectedSubjects.length > 0) params.set('subject', selectedSubjects.join(','));
      if (searchWord) params.set('search', searchWord);
      params.set('page', currentPage);
      params.set('limit', 12);

      const response = await fetch(`${API_URL}/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading catalog products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync state filter updates to the URL query string
  const updateUrlParams = (classes, interests, subjects, search, pageNum) => {
    const params = new URLSearchParams();
    if (classes.length > 0) params.set('class', classes.join(','));
    if (interests.length > 0) params.set('interest', interests.join(','));
    if (subjects.length > 0) params.set('subject', subjects.join(','));
    if (search) params.set('search', search);
    if (pageNum > 1) params.set('page', pageNum);
    
    // Check if the product detail ID is open and preserve it
    const currentQuery = new URLSearchParams(window.location.search);
    const productParam = currentQuery.get('product');
    if (productParam) params.set('product', productParam);

    navigate('/products', params.toString());
  };

  const handleFilterToggle = (category, value) => {
    // One-at-a-time across ALL categories: selecting any filter clears all others
    let updatedClasses = [];
    let updatedInterests = [];
    let updatedSubjects = [];

    if (category === 'class') {
      // Toggle off if same is clicked, else select new one
      if (!selectedClasses.includes(value)) updatedClasses = [value];
    } else if (category === 'interest') {
      if (!selectedInterests.includes(value)) updatedInterests = [value];
    } else if (category === 'subject') {
      if (!selectedSubjects.includes(value)) updatedSubjects = [value];
    }

    setSelectedClasses(updatedClasses);
    setSelectedInterests(updatedInterests);
    setSelectedSubjects(updatedSubjects);
    setSearchWord('');
    setCurrentPage(1);

    updateUrlParams(updatedClasses, updatedInterests, updatedSubjects, '', 1);
  };

  const clearAllFilters = () => {
    setSelectedClasses([]);
    setSelectedInterests([]);
    setSelectedSubjects([]);
    setSearchWord('');
    setCurrentPage(1);
    updateUrlParams([], [], [], '', 1);
    setSidebarOpen(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      updateUrlParams(selectedClasses, selectedInterests, selectedSubjects, searchWord, newPage);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px 80px 20px', fontFamily: 'var(--font-body)' }}>
      {/* Search Result Banner / Headline */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--dark-light)', fontSize: '0.95rem', fontWeight: 600 }}>Showing {products.length} of {totalItems} books found</p>
        </div>
        
        {/* Mobile Filter Toggle */}
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="btn btn-secondary mobile-filter-btn" 
          style={{ display: 'none', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Filters ⚙
        </button>
      </div>

      <div style={{ display: 'flex', gap: '30px', position: 'relative' }}>
        
        {/* 1. Left Sidebar Filter Panel */}
        <aside className={`filter-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
          flex: '0 0 280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'sticky',
          top: '100px',
          height: 'fit-content'
        }}>
          {/* Mobile Sidebar Header */}
          <div className="sidebar-mobile-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Filters</h3>
            <button onClick={() => setSidebarOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>✕</button>
          </div>

          {/* Search Term Tag */}
          {searchWord && (
            <div style={{ background: 'rgba(255, 90, 54, 0.08)', border: '1px solid rgba(255, 90, 54, 0.2)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>Active Search</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>"{searchWord}"</span>
                <button onClick={() => { setSearchWord(''); updateUrlParams(selectedClasses, selectedInterests, selectedSubjects, '', 1); }} style={{ color: 'var(--error)', fontWeight: 'bold' }}>✕</button>
              </div>
            </div>
          )}

          {/* Filter Group: Shop by Class */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Shop by Class</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {classesList.map(item => {
                const isSelected = selectedClasses.includes(item.value);
                return (
                  <div
                    key={item.value}
                    onClick={() => handleFilterToggle('class', item.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 90, 54, 0.08)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--dark-light)',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '1px solid rgba(255, 90, 54, 0.2)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    className="filter-option-item"
                  >
                    <span>{item.label}</span>
                    {isSelected && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Group: Shop by Interest */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Shop by Interest</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {interestsList.map(item => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => handleFilterToggle('interest', item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 90, 54, 0.08)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--dark-light)',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '1px solid rgba(255, 90, 54, 0.2)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    className="filter-option-item"
                  >
                    <span>{item}</span>
                    {isSelected && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Group: Shop by Subject */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Shop by Subject</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subjectsList.map(item => {
                const isSelected = selectedSubjects.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => handleFilterToggle('subject', item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 90, 54, 0.08)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--dark-light)',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '1px solid rgba(255, 90, 54, 0.2)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    className="filter-option-item"
                  >
                    <span>{item}</span>
                    {isSelected && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1050
          }} />
        )}

        {/* 2. Right Side: Product Catalog Grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px', position: 'relative' }}>
          
          {/* Seamless loading bar — shown at top of grid while fetching */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              borderRadius: '2px',
              background: 'var(--primary)',
              animation: 'loadBar 1.2s ease-in-out infinite',
              zIndex: 10
            }} />
          )}

          {/* Grid or empty state */}
          <div style={{ position: 'relative', opacity: 1, transition: 'opacity 0.25s ease' }}>
            {loading ? (
              <div className="product-grid">
                {Array(8).fill(null).map((_, idx) => (
                  <div key={idx} className="product-card" style={{
                    background: 'var(--white)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}>
                    <div className="aspect-ratio-box skeleton-pulse" style={{ background: '#E2E8F0' }}></div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '12px' }}>
                      <div className="skeleton-pulse" style={{ height: '16px', width: '85%', borderRadius: '4px', background: '#E2E8F0' }}></div>
                      <div className="skeleton-pulse" style={{ height: '16px', width: '60%', borderRadius: '4px', background: '#E2E8F0' }}></div>
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                        <div className="skeleton-pulse" style={{ height: '24px', width: '60px', borderRadius: '4px', background: '#E2E8F0' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No books matching your criteria</h3>
                <p style={{ color: 'var(--dark-light)', fontSize: '0.95rem' }}>Try selecting a different filter or removing your search.</p>
              </div>
            ) : (
              <>
                {/* Responsive Grid */}
                <div className="product-grid">
                  {products.map(product => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      onClick={onProductClick}
                    />
                  ))}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`btn btn-secondary ${currentPage === 1 ? 'btn-disabled' : ''}`}
                      style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                    >
                      ◀ Prev
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--dark-light)' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`btn btn-secondary ${currentPage === totalPages ? 'btn-disabled' : ''}`}
                      style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                    >
                      Next ▶
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .filter-option-item {
          transition: all 0.2s ease-in-out;
        }
        .filter-option-item:hover {
          background: rgba(255, 90, 54, 0.04) !important;
          color: var(--primary) !important;
        }
        .skeleton-pulse {
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        @keyframes skeletonPulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        @media (max-width: 768px) {
          .filter-sidebar {
            position: fixed !important;
            top: 0 !important;
            right: -320px;
            bottom: 0;
            width: 300px;
            background: #ffffff;
            z-index: 1060;
            box-shadow: var(--shadow-premium);
            padding: 24px;
            overflow-y: auto;
            transition: right 0.3s ease;
          }
          .sidebar-open {
            right: 0 !important;
          }
          .sidebar-mobile-header {
            display: flex !important;
          }
          .mobile-filter-btn {
            display: inline-flex !important;
          }
        }
        @keyframes loadBar {
          0%   { transform: translateX(-100%); opacity: 1; }
          50%  { transform: translateX(0%);    opacity: 1; }
          100% { transform: translateX(100%);  opacity: 0; }
        }
      `}</style>
    </div>
  );
}
