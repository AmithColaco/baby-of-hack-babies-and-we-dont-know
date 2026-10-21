import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../data/productStore';

export function SiteHeader() {
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlist } = useWishlist();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isHomepage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`site-header ${isScrolled || !isHomepage ? 'site-header--scrolled' : 'site-header--transparent'}`}
        role="banner"
      >
        <div className="site-header__inner">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="site-header__menu-btn md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>

          {/* Brand Logo / Wordmark */}
          <Link to="/" className="site-header__brand" aria-label="KAARIGAR Home">
            <span className="site-header__brand-sub">कारिगर · EST. 2026</span>
            <span className="site-header__brand-title">KAARIGAR</span>
            <span className="site-header__brand-tagline">Archive of Living Craft</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="site-header__nav" aria-label="Main Navigation">
            <NavLink to="/shop" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>
              Collection
            </NavLink>
            <NavLink to="/gallery" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>
              3D Spatial Gallery
            </NavLink>
            <a href="/#artisans" className="site-nav-link">
              Artisans
            </a>
            <a href="/#process" className="site-nav-link">
              Craft Journey
            </a>
            <NavLink to="/dashboard" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>
              Seller Atelier
            </NavLink>
          </nav>

          {/* Action Icons */}
          <div className="site-header__actions">
            {/* Search Button */}
            <button
              type="button"
              className="site-header__action-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search craft archive"
              title="Search crafts"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Wishlist Button */}
            <Link
              to="/shop?filter=wishlist"
              className="site-header__action-btn site-header__wishlist-btn"
              aria-label={`Wishlist (${totalWishlist} saved)`}
              title="View Wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {totalWishlist > 0 && <span className="site-badge">{totalWishlist}</span>}
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              className="site-header__action-btn site-header__cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Shopping bag containing ${totalItems} items`}
              title="Shopping Bag"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && <span className="site-badge">{totalItems}</span>}
            </button>

            {/* Seller / Onboarding CTA */}
            <Link to="/login" className="site-header__seller-cta" title="Artisan Atelier Login">
              <span>Artisan Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Overlay Modal */}
      {searchOpen && (
        <div className="search-modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search the archive">
            <div className="search-modal__header">
              <span className="search-modal__eyebrow">CURATORIAL SEARCH</span>
              <button
                type="button"
                className="search-modal__close"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="search-modal__form">
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by craft, mineral, master artisan, or region…"
                className="search-modal__input"
              />
              <button type="submit" className="search-modal__submit">
                Search
              </button>
            </form>
            <div className="search-modal__quick-tags">
              <span>Suggested:</span>
              <button type="button" onClick={() => { setSearchQuery('Pahari Miniature'); navigate('/shop?q=Pahari'); setSearchOpen(false); }}>Pahari Miniature</button>
              <button type="button" onClick={() => { setSearchQuery('Dhokra'); navigate('/shop?q=Dhokra'); setSearchOpen(false); }}>Bastar Dhokra</button>
              <button type="button" onClick={() => { setSearchQuery('Chanderi'); navigate('/shop?q=Chanderi'); setSearchOpen(false); }}>Chanderi Silk</button>
              <button type="button" onClick={() => { setSearchQuery('Blue Pottery'); navigate('/shop?q=Blue+Pottery'); setSearchOpen(false); }}>Jaipur Faience</button>
              <button type="button" onClick={() => { setSearchQuery('Kundan'); navigate('/shop?q=Kundan'); setSearchOpen(false); }}>Kundan Meenakari</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer__top">
              <span className="site-header__brand-title">KAARIGAR</span>
              <button
                type="button"
                className="mobile-drawer__close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="mobile-drawer__nav">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home Archive</Link>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Curated Collection</Link>
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>3D Spatial Exhibition</Link>
              <a href="/#artisans" onClick={() => setMobileMenuOpen(false)}>Meet Master Artisans</a>
              <a href="/#process" onClick={() => setMobileMenuOpen(false)}>Materials & Journey</a>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Artisan Dashboard</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Artisan Sign In / Onboarding</Link>
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>Shopping Bag ({totalItems})</Link>
            </nav>
            <div className="mobile-drawer__bottom">
              <p>85%+ Direct Payout Guaranteed to Indigenous Makers.</p>
              <span>Authenticity & Provenance Seal Included</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
