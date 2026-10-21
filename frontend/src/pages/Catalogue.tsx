import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts, useWishlist } from '../data/productStore';
import { useCart } from '../contexts/CartContext';
import type { CraftCategory } from '../types';

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  const categoryParam = (searchParams.get('category') as CraftCategory) || 'all';
  const queryParam = searchParams.get('q') || '';
  const filterParam = searchParams.get('filter') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<CraftCategory>(categoryParam);
  const [sortBy, setSortBy] = useState<'curated' | 'price-asc' | 'price-desc' | 'payout'>('curated');
  const [onlyWishlist, setOnlyWishlist] = useState<boolean>(filterParam === 'wishlist');

  // Reactively synchronize internal state when URL searchParams change
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setOnlyWishlist(filterParam === 'wishlist');
  }, [filterParam]);

  // Handle category change
  const handleCategoryChange = (cat: CraftCategory) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('q', val);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Wishlist filter
      if (onlyWishlist && !wishlist.includes(item.id)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchTradition = item.craftTradition.toLowerCase().includes(q);
        const matchArtisan = item.artisan.toLowerCase().includes(q);
        const matchRegion = item.region.toLowerCase().includes(q);
        const matchMaterials = item.materials?.some((m) => m.toLowerCase().includes(q));
        if (!matchTitle && !matchTradition && !matchArtisan && !matchRegion && !matchMaterials) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'payout') return (b.directArtisanSharePercent || 85) - (a.directArtisanSharePercent || 85);
      return 0; // curated order
    });
  }, [products, selectedCategory, searchQuery, onlyWishlist, wishlist, sortBy]);

  const CATEGORIES: Array<{ key: CraftCategory; label: string }> = [
    { key: 'all', label: 'All Disciplines' },
    { key: 'paintings', label: 'Paintings & Wasli' },
    { key: 'ceramics', label: 'Quartz Blue Pottery' },
    { key: 'textiles', label: 'Handwoven Silks' },
    { key: 'metalcraft', label: 'Dhokra & Bidri' },
    { key: 'woodcraft', label: 'Lathe Woodcraft' },
    { key: 'jewellery', label: 'Kundan Meenakari' },
  ];

  return (
    <main className="shop-page" role="main" aria-label="Curated Craft Collection">
      {/* Header Banner */}
      <section className="shop-header">
        <div className="shop-header__inner">
          <span className="section-eyebrow">✦ KAARIGAR CULTURAL ARCHIVE · LIVING INDIGENOUS HERITAGE ✦</span>
          <h1 className="shop-header__title">Curated Collection of Indian Masterworks</h1>
          <span className="shop-header__vernacular">भारतीय हस्तशिल्प एवं अमूर्त सांस्कृतिक धरोहर</span>
          <p className="shop-header__desc">
            Discover rare, museum-grade creations acquired directly from master ateliers across the subcontinent. 
            Each piece is authenticated with certified GI provenance, ethically compensated with 85%+ direct capital flow to artisans, and preserved with archival care.
          </p>

          <div className="shop-header__stats">
            <span className="stat-pill"><strong>6</strong> Masterworks</span>
            <span className="stat-pill"><strong>85%+</strong> Direct to Makers</span>
            <span className="stat-pill"><strong>6</strong> Heritage Centers</span>
            <span className="stat-pill"><strong>100%</strong> GI Provenance</span>
            <span className="stat-pill"><strong>Insured</strong> White-Glove Transit</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Toolbar */}
      <section className="shop-toolbar" aria-label="Craft catalogue filters and search">
        <div className="shop-toolbar__inner">
          {/* Top Tier: Search Bar + Utilities (Wishlist & Sort) */}
          <div className="shop-toolbar__top">
            <div className="shop-search-bar">
              <svg className="shop-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search masterworks by craft lineage, artisan, region, or mineral…"
                className="shop-search-input"
                aria-label="Filter crafts"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="shop-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    const p = new URLSearchParams(searchParams);
                    p.delete('q');
                    setSearchParams(p);
                  }}
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="shop-toolbar__actions">
              {/* Wishlist Quick Filter */}
              <button
                type="button"
                className={`shop-util-btn wishlist-toggle ${onlyWishlist ? 'active' : ''}`}
                onClick={() => setOnlyWishlist(!onlyWishlist)}
                aria-pressed={onlyWishlist}
                title="View saved wishlist masterworks"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={onlyWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>Wishlist</span>
                <span className="util-badge">{wishlist.length}</span>
              </button>

              {/* Sort Dropdown */}
              <div className="shop-sort-wrap">
                <label htmlFor="shop-sort-select" className="sort-label">Sort:</label>
                <div className="sort-select-container">
                  <select
                    id="shop-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="shop-sort-select"
                    aria-label="Sort masterworks"
                  >
                    <option value="curated">Curated Lineage</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="payout">Highest Direct Artisan Payout</option>
                  </select>
                  <svg className="sort-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tier: Craft Heritage Disciplines */}
          <div className="shop-toolbar__disciplines">
            <span className="disciplines-label">Discipline Archive</span>
            <div className="shop-category-tabs" role="tablist" aria-label="Craft disciplines">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat.key && !onlyWishlist}
                  className={`category-tab ${selectedCategory === cat.key && !onlyWishlist ? 'active' : ''}`}
                  onClick={() => {
                    setOnlyWishlist(false);
                    handleCategoryChange(cat.key);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Active Results Summary */}
      <div className="shop-results-summary">
        <div className="shop-results-summary__inner">
          <span className="results-count">
            Showing <strong>{filteredProducts.length}</strong> masterwork{filteredProducts.length === 1 ? '' : 's'}
          </span>
          {(selectedCategory !== 'all' || searchQuery || onlyWishlist) && (
            <button
              type="button"
              className="results-reset-btn"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyWishlist(false);
                setSearchParams(new URLSearchParams());
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <section className="shop-grid-section">
        <div className="shop-grid-section__inner">
          {filteredProducts.length === 0 ? (
            <div className="shop-empty-state">
              <div className="empty-icon">✦</div>
              <h3>No crafts match your curatorial criteria</h3>
              <p>Try refining your search terms or selecting another craft discipline.</p>
              <button
                type="button"
                className="hero-btn hero-btn--primary"
                style={{ marginTop: '1.5rem' }}
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setOnlyWishlist(false);
                  setSearchParams(new URLSearchParams());
                }}
              >
                View Full Collection
              </button>
            </div>
          ) : (
            <div className="craft-grid">
              {filteredProducts.map((prod) => {
                const isSaved = isInWishlist(prod.id);
                return (
                  <article key={prod.id} className="shop-craft-card">
                    {/* Media frame */}
                    <div className="shop-craft-card__media">
                      <Link to={`/shop/${prod.id}`} className="media-link">
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="craft-card-img"
                          loading="lazy"
                        />
                      </Link>
                      <button
                        type="button"
                        className={`wishlist-heart-btn ${isSaved ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(prod.id);
                        }}
                        aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        {isSaved ? '♥' : '♡'}
                      </button>
                      <div className="craft-payout-pill">
                        <span>{prod.directArtisanSharePercent || 85}% Direct Payout</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="shop-craft-card__body">
                      <div className="card-top-meta">
                        <span className="card-tradition">{prod.craftTradition}</span>
                        <span className="card-region">{prod.region}</span>
                      </div>

                      <h3 className="card-title">
                        <Link to={`/shop/${prod.id}`}>{prod.title}</Link>
                      </h3>

                      {prod.vernacularTitle && (
                        <span className="card-vernacular">{prod.vernacularTitle}</span>
                      )}

                      <p className="card-artisan-by">
                        By <strong>{prod.artisan}</strong>
                      </p>

                      <div className="card-price-row">
                        <div className="card-price">
                          <span className="cur">₹</span>
                          <span className="val">{Math.round(prod.price * 1.05).toLocaleString('en-IN')}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#8a7a6a' }}>incl. 5% platform fee</span>
                      </div>

                      <div className="card-actions">
                        <Link
                          to={`/shop/${prod.id}`}
                          className="card-btn-story"
                        >
                          <span>Discover Story</span>
                          <span className="arrow">→</span>
                        </Link>

                        <button
                          type="button"
                          className="card-btn-cart"
                          onClick={() => addToCart(prod)}
                        >
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
