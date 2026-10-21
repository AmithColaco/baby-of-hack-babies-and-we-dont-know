import { useState, useMemo } from 'react';
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
            <span className="stat-pill"><strong>{products.length}</strong> Masterworks</span>
            <span className="stat-pill"><strong>85%+</strong> Direct to Makers</span>
            <span className="stat-pill"><strong>6</strong> Heritage Centers</span>
            <span className="stat-pill"><strong>100%</strong> GI Provenance</span>
            <span className="stat-pill"><strong>Insured</strong> White-Glove Transit</span>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/gallery"
              className="hero-btn hero-btn--outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>✦ Experience All Masterworks in 3D Spatial Gallery</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Search Toolbar */}
      <section className="shop-toolbar">
        <div className="shop-toolbar__inner">
          {/* Category Tabs */}
          <div className="shop-category-tabs" role="tablist">
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

            <button
              type="button"
              className={`category-tab wishlist-tab ${onlyWishlist ? 'active' : ''}`}
              onClick={() => setOnlyWishlist(!onlyWishlist)}
            >
              ♥ Wishlist ({wishlist.length})
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="shop-controls-row">
            <div className="shop-search-box">
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by craft, artisan, region, or mineral…"
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
                >
                  ✕
                </button>
              )}
            </div>

            <div className="shop-sort-box">
              <label htmlFor="shop-sort-select">Sort By:</label>
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="shop-sort-select"
              >
                <option value="curated">Curated Lineage</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="payout">Highest Direct Artisan Payout</option>
              </select>
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
                      <Link
                        to={`/gallery?focus=${prod.id}`}
                        className="card-3d-badge"
                        title={`Inspect ${prod.title} in 3D Exhibition`}
                      >
                        ✦ 3D View
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
                          <span className="val">{prod.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <Link
                          to={`/shop/${prod.id}`}
                          className="card-btn-story"
                        >
                          <span>Discover Story</span>
                          <span className="arrow">→</span>
                        </Link>

                        <Link
                          to={`/gallery?focus=${prod.id}`}
                          className="card-btn-3d"
                          title="View 3D Model in Exhibition"
                        >
                          ✦ 3D
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
