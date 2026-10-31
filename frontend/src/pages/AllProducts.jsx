import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, m } from 'motion/react';
import ProductCard from '../components/ProductCard.jsx';
import { getApiUrl, resilientFetch } from '../utils/api.js';
import { updatePageSEO } from '../utils/seo.js';
import { backdropMotion, dialogMotion } from '../utils/motionPresets.js';

// Grid entrance: cards rise in one after another, reusing the shared dialog spring
const gridMotion = {
  initial: 'hidden',
  animate: 'show',
  variants: { show: { transition: { staggerChildren: 0.045 } } }
};
const gridItemVariants = { hidden: dialogMotion.initial, show: dialogMotion.animate };
const buttonTap = { scale: 0.96 };
const chipMotion = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.12 } }
};

const PAGE_SIZE = 12;

const CheckIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

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

const classLabel = (value) => (classesList.find(c => c.value === value) || {}).label || value;

// Page buttons to show: first, last, current ± siblings, with '…' for skipped runs.
// A gap of exactly one page shows that page instead of an ellipsis.
const getPageItems = (current, total, siblings) => {
  const pages = new Set([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) items.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) items.push(`gap-${prev}`);
    items.push(p);
  });
  return items;
};

export default function AllProducts({ onProductClick, navigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Local filter states
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [searchWord, setSearchWord] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Narrow phones get a shorter page-number row (1 … 5 … 17)
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia('(max-width: 480px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)');
    const handleChange = (e) => setIsNarrow(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Only the newest request may update the grid (fast taps can finish out of order)
  const requestIdRef = useRef(0);
  const resultsTopRef = useRef(null);

  const API_URL = getApiUrl();

  const activeFilterCount = selectedClasses.length + selectedInterests.length + selectedSubjects.length;
  const hasAnyFilter = activeFilterCount > 0 || Boolean(searchWord);

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

  // Filter drawer (phones): Escape closes it and the page behind stops scrolling
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  // Update dynamic SEO based on active filters
  useEffect(() => {
    let title = "Buy Children's Educational Books & Activity Workbooks | Mindfuels Delhi";
    let desc = "Browse curriculum-aligned preschool, kindergarten, and primary school workbooks, phonics, mathematics, and moral storybooks from Mindfuels Delhi.";

    if (searchWord) {
      title = `"${searchWord}" - Search Children's Books | Mindfuels`;
      desc = `Search results for "${searchWord}" in Mindfuels children's book publishing catalog.`;
    } else if (selectedClasses.length > 0) {
      title = `${selectedClasses.join(', ')} Books & Workbooks | Mindfuels Delhi`;
      desc = `Explore top-rated educational workbooks and activity books for ${selectedClasses.join(', ')} by Mindfuels Delhi. Free shipping across India.`;
    } else if (selectedInterests.length > 0) {
      title = `${selectedInterests.join(', ')} for Children | Mindfuels Publisher Delhi`;
      desc = `Discover engaging ${selectedInterests.join(', ')} designed for hands-on learning, cognitive development, and fun reading from Mindfuels.`;
    } else if (selectedSubjects.length > 0) {
      title = `${selectedSubjects.join(', ')} Activity Books & Worksheets | Mindfuels`;
      desc = `Shop comprehensive ${selectedSubjects.join(', ')} books and workbooks for preschool, kindergarten, and primary students.`;
    }

    updatePageSEO({
      title,
      description: desc,
      canonicalUrl: `https://mindfuelspublisher.com/products${window.location.search}`
    });
  }, [selectedClasses, selectedInterests, selectedSubjects, searchWord]);

  // Fetch products whenever filters or page changes
  useEffect(() => {
    fetchFilteredProducts();
  }, [selectedClasses, selectedInterests, selectedSubjects, searchWord, currentPage, retryCount]);

  const fetchFilteredProducts = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams();
      if (selectedClasses.length > 0) params.set('class', selectedClasses.join(','));
      if (selectedInterests.length > 0) params.set('interest', selectedInterests.join(','));
      if (selectedSubjects.length > 0) params.set('subject', selectedSubjects.join(','));
      if (searchWord) params.set('search', searchWord);
      params.set('page', currentPage);
      params.set('limit', PAGE_SIZE);

      const response = await resilientFetch(`${API_URL}/api/products?${params.toString()}`);
      if (requestId !== requestIdRef.current) return;
      if (response.ok) {
        const data = await response.json();
        if (requestId !== requestIdRef.current) return;
        setProducts(data.products || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.totalItems || 0);
      } else {
        setFetchError(true);
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error loading catalog products:', error);
      setFetchError(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  // Bring the top of the results into view (only if the user has scrolled past it)
  const scrollToResults = () => {
    const el = resultsTopRef.current;
    if (!el) return;
    const isPhone = window.matchMedia('(max-width: 768px)').matches;
    const offset = isPhone ? 132 : 84; // fixed navbar (+ sticky filter bar on phones)
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    if (window.scrollY > top) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
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

  const applyFilters = (classes, interests, subjects, search) => {
    setSelectedClasses(classes);
    setSelectedInterests(interests);
    setSelectedSubjects(subjects);
    setSearchWord(search);
    setCurrentPage(1);
    updateUrlParams(classes, interests, subjects, search, 1);
  };

  const handleFilterToggle = (category, value) => {
    // One choice per group (class / interest / subject); groups combine, e.g. Class 5 + Mathematics.
    // Tapping the selected option again removes it.
    const toggle = (current) => (current.includes(value) ? [] : [value]);

    applyFilters(
      category === 'class' ? toggle(selectedClasses) : selectedClasses,
      category === 'interest' ? toggle(selectedInterests) : selectedInterests,
      category === 'subject' ? toggle(selectedSubjects) : selectedSubjects,
      searchWord
    );

    // Show the results straight away: close the phone drawer and jump to the grid
    setSidebarOpen(false);
    scrollToResults();
  };

  const clearAllFilters = () => {
    applyFilters([], [], [], '');
    setSidebarOpen(false);
    scrollToResults();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      updateUrlParams(selectedClasses, selectedInterests, selectedSubjects, searchWord, newPage);
      scrollToResults();
    }
  };

  // Removable chips for everything currently narrowing the list
  const activeChips = [
    ...(searchWord ? [{ key: 'search', label: `“${searchWord}”`, onRemove: () => applyFilters(selectedClasses, selectedInterests, selectedSubjects, '') }] : []),
    ...selectedClasses.map(v => ({ key: `class-${v}`, label: classLabel(v), onRemove: () => handleFilterToggle('class', v) })),
    ...selectedSubjects.map(v => ({ key: `subject-${v}`, label: v, onRemove: () => handleFilterToggle('subject', v) })),
    ...selectedInterests.map(v => ({ key: `interest-${v}`, label: v, onRemove: () => handleFilterToggle('interest', v) }))
  ];

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min((currentPage - 1) * PAGE_SIZE + products.length, totalItems);

  const renderFilterGroup = (title, category, items, selected) => (
    <section className="mf-filter-group">
      <h4 className="mf-filter-title">{title}</h4>
      <div className={`mf-filter-list ${category === 'interest' ? 'mf-filter-list--scroll' : ''}`}>
        {items.map(item => {
          const value = typeof item === 'string' ? item : item.value;
          const label = typeof item === 'string' ? item : item.label;
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleFilterToggle(category, value)}
              className={`mf-filter-option ${isSelected ? 'is-selected' : ''}`}
              aria-pressed={isSelected}
            >
              <span>{label}</span>
              {isSelected && <CheckIcon />}
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="container">
    <div className="mf-catalog-page">
      {/* Phone filter bar — stays under the navbar while scrolling */}
      <div className="mf-filter-bar">
        <m.button
          onClick={() => setSidebarOpen(true)}
          className="mf-filter-trigger"
          whileTap={buttonTap}
          aria-haspopup="dialog"
          aria-expanded={sidebarOpen}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span>Filter by class, subject & more</span>
          {activeFilterCount > 0 && (
            <span className="mf-filter-count" aria-label={`${activeFilterCount} active`}>{activeFilterCount}</span>
          )}
        </m.button>
      </div>

      {/* Result count + active filter chips */}
      <div className="mf-catalog-head" ref={resultsTopRef}>
        <p className="mf-catalog-count" aria-live="polite">
          {loading && products.length === 0
            ? 'Finding books…'
            : totalItems === 0
              ? 'No books found'
              : <>Showing <strong>{rangeStart}–{rangeEnd}</strong> of <strong>{totalItems}</strong> {totalItems === 1 ? 'book' : 'books'}</>}
        </p>

        {activeChips.length > 0 && (
          <div className="mf-active-chips">
            <AnimatePresence initial={false}>
              {activeChips.map(chip => (
                <m.button
                  key={chip.key}
                  type="button"
                  className="mf-active-chip"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter ${chip.label}`}
                  whileTap={buttonTap}
                  {...chipMotion}
                >
                  <span>{chip.label}</span>
                  <CloseIcon size={14} />
                </m.button>
              ))}
            </AnimatePresence>
            {activeChips.length > 1 && (
              <button type="button" className="mf-clear-link" onClick={clearAllFilters}>
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mf-catalog-layout">

        {/* 1. Left Sidebar Filter Panel (drawer on phones) */}
        <aside className={`filter-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Filters">
          {/* Mobile Sidebar Header */}
          <div className="sidebar-mobile-header">
            <h3 style={{ fontSize: '1.2rem' }}>Filters</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {hasAnyFilter && (
                <button type="button" className="mf-clear-link" onClick={clearAllFilters}>
                  Clear all
                </button>
              )}
              <button onClick={() => setSidebarOpen(false)} className="mf-icon-btn" aria-label="Close filters">
                <CloseIcon size={22} />
              </button>
            </div>
          </div>

          {/* Search Term Tag */}
          {searchWord && (
            <div className="mf-search-chip">
              <div style={{ minWidth: 0 }}>
                <div className="mf-search-chip-label">Active Search</div>
                <div className="mf-search-chip-term">"{searchWord}"</div>
              </div>
              <button onClick={() => applyFilters(selectedClasses, selectedInterests, selectedSubjects, '')} className="mf-icon-btn" aria-label="Clear search">
                <CloseIcon />
              </button>
            </div>
          )}

          {renderFilterGroup('Shop by Class', 'class', classesList, selectedClasses)}
          {renderFilterGroup('Shop by Subject', 'subject', subjectsList, selectedSubjects)}
          {renderFilterGroup('Shop by Interest', 'interest', interestsList, selectedInterests)}
        </aside>

        {/* Backdrop for mobile drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <m.div
              key="filter-backdrop"
              className="mf-filter-backdrop"
              onClick={() => setSidebarOpen(false)}
              {...backdropMotion}
            />
          )}
        </AnimatePresence>

        {/* 2. Right Side: Product Catalog Grid */}
        <div className="mf-catalog-main">

          {/* Seamless loading bar — shown at top of grid while fetching */}
          {loading && <div className="mf-loadbar" aria-hidden="true" />}

          {/* Grid, error or empty state */}
          <div style={{ position: 'relative' }}>
            {loading ? (
              <div className="catalog-grid" aria-hidden="true">
                {Array(8).fill(null).map((_, idx) => (
                  <div key={idx} className="mf-skel-card">
                    <div className="mf-skel-media skeleton-pulse"></div>
                    <div className="mf-skel-body">
                      <div className="mf-skel-line skeleton-pulse" style={{ width: '40%', height: '18px', borderRadius: '999px' }}></div>
                      <div className="mf-skel-line skeleton-pulse" style={{ width: '90%' }}></div>
                      <div className="mf-skel-line skeleton-pulse" style={{ width: '65%' }}></div>
                      <div className="mf-skel-line skeleton-pulse" style={{ width: '35%', height: '20px', marginTop: '6px' }}></div>
                      <div className="mf-skel-line skeleton-pulse" style={{ width: '100%', height: '40px', borderRadius: '12px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : fetchError ? (
              <div className="mf-empty" role="alert">
                <div className="mf-empty-icon" aria-hidden="true">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <h3>Couldn't load the books</h3>
                <p>Please check your internet connection and try again.</p>
                <m.button type="button" className="btn btn-primary mf-empty-action" onClick={() => setRetryCount(c => c + 1)} whileTap={buttonTap}>
                  Try again
                </m.button>
              </div>
            ) : products.length === 0 ? (
              <div className="mf-empty">
                <div className="mf-empty-icon" aria-hidden="true">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <h3>No books match these filters</h3>
                <p>{activeChips.length > 1 ? 'Try removing one of the filters above.' : 'Try a different class, subject or search word.'}</p>
                {hasAnyFilter && (
                  <m.button type="button" className="btn btn-primary mf-empty-action" onClick={clearAllFilters} whileTap={buttonTap}>
                    Show all books
                  </m.button>
                )}
              </div>
            ) : (
              <>
                {/* Responsive Grid */}
                <m.div className="catalog-grid" {...gridMotion}>
                  {products.map(product => (
                    <m.div key={product.product_id} className="catalog-grid-item" variants={gridItemVariants}>
                      <ProductCard
                        product={product}
                        onClick={onProductClick}
                      />
                    </m.div>
                  ))}
                </m.div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <nav className="mf-pagination" aria-label="Pagination">
                    <m.button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="mf-page-btn"
                      whileTap={currentPage === 1 ? undefined : buttonTap}
                      aria-label="Previous page"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                      <span className="mf-page-btn-text">Prev</span>
                    </m.button>

                    {/* Numbered pages, shortened with … so the row always fits */}
                    <div className="mf-page-numbers">
                      {getPageItems(currentPage, totalPages, isNarrow ? 0 : 1).map(pageNum => typeof pageNum === 'string' ? (
                        <span key={pageNum} className="mf-page-gap" aria-hidden="true">…</span>
                      ) : (
                        <m.button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`mf-page-num ${pageNum === currentPage ? 'is-current' : ''}`}
                          aria-label={`Page ${pageNum}`}
                          aria-current={pageNum === currentPage ? 'page' : undefined}
                          whileTap={pageNum === currentPage ? undefined : buttonTap}
                        >
                          {pageNum}
                        </m.button>
                      ))}
                    </div>

                    <m.button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="mf-page-btn"
                      whileTap={currentPage === totalPages ? undefined : buttonTap}
                      aria-label="Next page"
                    >
                      <span className="mf-page-btn-text">Next</span>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </m.button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .mf-catalog-page {
          padding-top: 32px;
          padding-bottom: 80px;
          font-family: var(--font-body);
        }
        .mf-catalog-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 10px 12px;
          margin-bottom: 20px;
          scroll-margin-top: 140px;
        }
        .mf-catalog-count {
          color: var(--dark-light);
          font-size: 0.95rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        .mf-catalog-count strong {
          color: var(--dark);
          font-weight: 700;
        }

        /* Active filter chips */
        .mf-active-chips {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .mf-active-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 100%;
          min-height: 36px;
          padding: 6px 10px 6px 14px;
          border-radius: 999px;
          background: #FFF1EC;
          border: 1px solid rgba(255, 90, 54, 0.3);
          color: #C2410C;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.2;
          text-align: left;
          transition: background-color 0.15s ease;
        }
        .mf-active-chip span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mf-active-chip svg {
          flex-shrink: 0;
        }
        .mf-active-chip:hover {
          background: #FFE4D9;
        }
        .mf-clear-link {
          min-height: 36px;
          padding: 6px 10px;
          border-radius: 8px;
          color: var(--dark-light);
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .mf-clear-link:hover {
          color: var(--dark);
        }

        .mf-catalog-layout {
          display: flex;
          align-items: flex-start;
          gap: 32px;
          position: relative;
        }
        .mf-catalog-main {
          flex: 1;
          min-width: 0;
          position: relative;
        }

        /* Filter sidebar */
        .filter-sidebar {
          flex: 0 0 264px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 84px;
          /* Tall filter list scrolls on its own instead of running off-screen */
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }
        .sidebar-mobile-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }
        .mf-filter-group {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px 12px 12px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .mf-filter-title {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--dark-light);
          margin: 0 4px 10px;
        }
        .mf-filter-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mf-filter-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          min-height: 40px;
          padding: 8px 12px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          color: var(--dark-light);
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.35;
          text-align: left;
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .mf-filter-option:hover {
          background: var(--light);
          color: var(--dark);
        }
        .mf-filter-option.is-selected {
          background: #FFF1EC;
          border-color: rgba(255, 90, 54, 0.28);
          color: #C2410C;
          font-weight: 600;
        }
        .mf-filter-option svg {
          flex-shrink: 0;
        }
        .mf-filter-option:focus-visible,
        .mf-icon-btn:focus-visible,
        .mf-page-btn:focus-visible,
        .mf-page-num:focus-visible,
        .mf-filter-trigger:focus-visible,
        .mf-active-chip:focus-visible,
        .mf-clear-link:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        /* Active search chip */
        .mf-search-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 6px 10px 14px;
          background: #FFF1EC;
          border: 1px solid rgba(255, 90, 54, 0.25);
          border-radius: 14px;
        }
        .mf-search-chip-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #C2410C;
        }
        .mf-search-chip-term {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--dark);
          overflow-wrap: anywhere;
        }
        .mf-icon-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          color: var(--dark-light);
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .mf-icon-btn:hover {
          background: rgba(15, 23, 42, 0.06);
          color: var(--dark);
        }

        /* Phone filter bar + trigger */
        .mf-filter-bar {
          display: none;
        }
        .mf-filter-trigger {
          width: 100%;
          min-height: 48px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--white);
          color: var(--dark);
          border: 1px solid var(--border);
          border-radius: 14px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.95rem;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.05);
        }
        .mf-filter-trigger svg {
          color: var(--primary);
          flex-shrink: 0;
        }
        .mf-filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 999px;
          background: var(--primary);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .mf-filter-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          z-index: 1050;
        }

        /* Loading bar */
        .mf-loadbar {
          position: absolute;
          top: -12px;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 2px;
          overflow: hidden;
          background: rgba(255, 90, 54, 0.12);
          z-index: 10;
        }
        .mf-loadbar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--primary);
          animation: loadBar 1.2s ease-in-out infinite;
        }

        /* Empty / error state */
        .mf-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 48px 20px;
          text-align: center;
          background: var(--white);
          border: 1px dashed #CBD5E1;
          border-radius: 20px;
        }
        .mf-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          margin-bottom: 8px;
          border-radius: 16px;
          background: #FFF1EC;
          color: var(--primary);
        }
        .mf-empty h3 {
          font-size: 1.2rem;
        }
        .mf-empty p {
          max-width: 36ch;
          color: var(--dark-light);
          font-size: 0.95rem;
        }
        .mf-empty-action {
          margin-top: 12px;
          min-height: 44px;
          padding: 10px 24px;
        }

        /* Pagination */
        .mf-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 36px;
        }
        .mf-page-numbers {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .mf-page-gap {
          min-width: 16px;
          text-align: center;
          color: var(--dark-light);
          font-weight: 600;
        }
        .mf-page-btn,
        .mf-page-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 44px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--dark);
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.9rem;
          font-variant-numeric: tabular-nums;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
        }
        .mf-page-btn {
          padding: 0 16px;
        }
        .mf-page-num {
          min-width: 44px;
          padding: 0 6px;
        }
        .mf-page-num.is-current {
          background: var(--dark);
          border-color: var(--dark);
          color: #fff;
          cursor: default;
        }
        .mf-page-btn:hover:not(:disabled),
        .mf-page-num:not(.is-current):hover {
          border-color: var(--primary);
          color: #C2410C;
        }
        .mf-page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
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
          .mf-catalog-page {
            padding-top: 0;
            padding-bottom: 96px; /* clear the bottom nav bar */
          }
          /* Sticky under the 60px navbar so filters are one tap away while browsing */
          .mf-filter-bar {
            display: block;
            position: sticky;
            top: 60px;
            z-index: 30;
            margin: 0 -14px 12px;
            padding: 10px 14px;
            background: rgba(248, 250, 252, 0.96);
            border-bottom: 1px solid rgba(226, 232, 240, 0.7);
          }
          .mf-catalog-head {
            margin-bottom: 14px;
            scroll-margin-top: 132px;
          }
          .mf-catalog-count {
            font-size: 0.875rem;
          }
          .filter-sidebar {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(340px, 88vw);
            max-height: none;
            background: #ffffff;
            z-index: 1060;
            box-shadow: var(--shadow-premium);
            padding: 16px 16px calc(24px + env(safe-area-inset-bottom, 0px));
            overflow-y: auto;
            overscroll-behavior: contain;
            transform: translateX(105%);
            visibility: hidden;
            transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), visibility 0s linear 0.32s;
          }
          .sidebar-open {
            transform: translateX(0);
            visibility: visible;
            transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), visibility 0s;
          }
          .sidebar-mobile-header {
            display: flex;
            position: sticky;
            top: 0;
            z-index: 1;
            margin: -16px -16px 0;
            padding: 16px 12px 12px 16px;
            background: #ffffff;
          }
          .mf-filter-group {
            box-shadow: none;
          }
          .mf-filter-option {
            min-height: 44px;
          }
          .mf-pagination {
            gap: 6px;
            margin-top: 28px;
          }
          .mf-page-btn {
            padding: 0 12px;
          }
        }
        /* Drawer lists show in full; only the desktop interest list is capped */
        @media (min-width: 769px) {
          .mf-filter-list--scroll {
            max-height: 220px;
            overflow-y: auto;
            overscroll-behavior: contain;
          }
        }
        /* Phones: icon-only Prev/Next so 1 … 5 … 17 fits on a 360px screen */
        @media (max-width: 480px) {
          .mf-page-btn-text {
            display: none;
          }
          .mf-page-btn {
            min-width: 44px;
            padding: 0;
          }
          .mf-page-numbers {
            gap: 4px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .filter-sidebar,
          .sidebar-open {
            transition: none;
          }
          .skeleton-pulse,
          .mf-loadbar::after {
            animation: none;
          }
        }
        @keyframes loadBar {
          0%   { transform: translateX(-100%); opacity: 1; }
          50%  { transform: translateX(0%);    opacity: 1; }
          100% { transform: translateX(100%);  opacity: 0; }
        }
      `}</style>
    </div>
    </div>
  );
}
