import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../data/productStore';
import { useAuth } from '../contexts/AuthContext';
import { changeLanguage, ALL_INDIAN_LANGUAGES } from '../i18n';

export function SiteHeader() {
  const { t, i18n } = useTranslation();
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlist } = useWishlist();
  const { user, isLoggedIn, isArtisan, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  // Dismiss dropdown on outside click or escape key
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <>
      <header className={`site-header ${isScrolled || !isHomepage ? 'site-header--scrolled' : 'site-header--transparent'}`} role="banner">
        <div className="site-header__inner">
          {/* Mobile hamburger */}
          <button type="button" className="site-header__menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation menu" aria-expanded={mobileMenuOpen}>
            <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
          </button>

          {/* Brand */}
          <Link to="/" className="site-header__brand" aria-label="KAARIGAR Home">
            <span className="site-header__brand-title">{t('nav.brand_title')}</span>
            <span className="site-header__brand-tagline">{t('nav.brand_tagline')}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="site-header__nav" aria-label="Main Navigation">
            <NavLink to="/gallery" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>{t('nav.gallery', 'Catalogue')}</NavLink>
            <NavLink to="/commissions" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>{t('nav.commissions', 'Commissions')}</NavLink>
            <Link to="/#artisans" className="site-nav-link">{t('nav.artisans', 'Artisans')}</Link>
            <Link to="/#process" className="site-nav-link">{t('nav.process', 'Craft Journey')}</Link>
            {isArtisan && (
              <NavLink to="/dashboard" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>{t('nav.dashboard')}</NavLink>
            )}
          </nav>

          {/* Action Icons */}
          <div className="site-header__actions">
            {/* Choose your language dropdown */}
            <div className="site-header__lang-picker">
              <label htmlFor="header-language-select" className="site-header__lang-label">

              </label>
              <div className="site-header__lang-select-wrap">
                <select
                  id="header-language-select"
                  className="site-header__lang-select"
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  aria-label="Choose your language"
                >
                  {ALL_INDIAN_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
                <span className="site-header__lang-select-arrow" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Search */}
            <button type="button" className="site-header__action-btn" onClick={() => setSearchOpen(true)} aria-label="Search craft archive" title="Search crafts">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="site-header__action-btn site-header__wishlist-btn" aria-label={`Wishlist (${totalWishlist} saved)`} title="View Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {totalWishlist > 0 && <span className="site-badge">{totalWishlist}</span>}
            </Link>

            {/* Cart */}
            <button type="button" className="site-header__action-btn site-header__cart-btn" onClick={() => setIsCartOpen(true)} aria-label={`Shopping bag containing ${totalItems} items`} title="Shopping Bag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && <span className="site-badge">{totalItems}</span>}
            </button>

            {/* Auth / User menu */}
            {isLoggedIn ? (
              <div className="site-header__user-menu-wrap" ref={userMenuRef}>
                <button
                  id="user-account-menu-btn"
                  type="button"
                  className="site-header__seller-cta"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="User account menu"
                  aria-expanded={showUserMenu}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <span>{user?.name?.split(' ')[0] || 'Account'}</span>
                  <svg
                    style={{
                      transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="user-dropdown" role="menu">
                    <div className="user-dropdown__header">
                      <div className="user-dropdown__name">{user?.name || (isArtisan ? 'Master Artisan' : 'Art Connoisseur')}</div>
                      <div className="user-dropdown__role">
                        {isArtisan ? '✦ Master Artisan & Atelier' : '✦ Verified Art Collector'}
                      </div>
                    </div>
                    {isArtisan && (
                      <Link to="/dashboard" className="user-dropdown__link" onClick={() => setShowUserMenu(false)}>
                        <span className="user-dropdown__link-text">
                          <span className="user-dropdown__link-icon">🏛</span>
                          <span>{t('nav.dashboard')}</span>
                        </span>
                        <span className="user-dropdown__arrow">→</span>
                      </Link>
                    )}
                    <Link to="/wishlist" className="user-dropdown__link" onClick={() => setShowUserMenu(false)}>
                      <span className="user-dropdown__link-text">
                        <span className="user-dropdown__link-icon">♡</span>
                        <span>{t('nav.wishlist')}</span>
                      </span>
                      {totalWishlist > 0 && <span className="site-badge" style={{ position: 'static' }}>{totalWishlist}</span>}
                    </Link>
                    <Link to="/settings" className="user-dropdown__link" onClick={() => setShowUserMenu(false)}>
                      <span className="user-dropdown__link-text">
                        <span className="user-dropdown__link-icon">⚙</span>
                        <span>{t('nav.account')}</span>
                      </span>
                    </Link>
                    <button type="button" className="user-dropdown__btn" onClick={handleLogout}>
                      <span className="user-dropdown__link-icon">⎋</span>
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="site-header__seller-cta" title="Login">
                <span>{t('nav.login')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search the archive">
            <div className="search-modal__header">
              <span className="search-modal__eyebrow">CURATORIAL SEARCH</span>
              <button type="button" className="search-modal__close" onClick={() => setSearchOpen(false)} aria-label="Close search">✕</button>
            </div>
            <form onSubmit={handleSearchSubmit} className="search-modal__form">
              <input type="search" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('nav.search_placeholder')} className="search-modal__input" />
              <button type="submit" className="search-modal__submit">Search</button>
            </form>
            <div className="search-modal__quick-tags">
              <span>Suggested:</span>
              <button type="button" onClick={() => { navigate('/gallery?q=Pahari'); setSearchOpen(false); }}>Pahari Miniature</button>
              <button type="button" onClick={() => { navigate('/gallery?q=Dhokra'); setSearchOpen(false); }}>Bastar Dhokra</button>
              <button type="button" onClick={() => { navigate('/gallery?q=Chanderi'); setSearchOpen(false); }}>Chanderi Silk</button>
              <button type="button" onClick={() => { navigate('/gallery?q=Blue+Pottery'); setSearchOpen(false); }}>Jaipur Faience</button>
              <button type="button" onClick={() => { navigate('/gallery?q=Kundan'); setSearchOpen(false); }}>Kundan Meenakari</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer__top">
              <span className="site-header__brand-title">{t('nav.brand_title')}</span>
              <button type="button" className="mobile-drawer__close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">✕</button>
            </div>
            <nav className="mobile-drawer__nav">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home Archive</Link>
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>{t('nav.gallery', 'Craft Catalogue')}</Link>
              <Link to="/archive" onClick={() => setMobileMenuOpen(false)}>Living Archive</Link>
              <Link to="/commissions" onClick={() => setMobileMenuOpen(false)}>{t('nav.commissions', 'Custom Commissions')}</Link>
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)}>{t('nav.wishlist', 'Wishlist')} {totalWishlist > 0 && `(${totalWishlist})`}</Link>
              {isLoggedIn && isArtisan && <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>{t('nav.dashboard', 'Artisan Atelier')}</Link>}
              {isLoggedIn && <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>{t('nav.account', 'Settings')}</Link>}
              {isLoggedIn
                ? <button type="button" onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }} style={{ background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer', color: '#C0392B', padding: 0 }}>{t('nav.logout')}</button>
                : <Link to="/login" onClick={() => setMobileMenuOpen(false)}>{t('nav.login')}</Link>
              }
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>{t('nav.cart')} ({totalItems})</Link>
            </nav>
            <div className="mobile-drawer__lang-wrap" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-light, #E8DFD3)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label htmlFor="mobile-language-select" style={{ fontSize: '0.78rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Choose your language
              </label>
              <div className="site-header__lang-select-wrap" style={{ width: '100%' }}>
                <select
                  id="mobile-language-select"
                  className="site-header__lang-select"
                  style={{ width: '100%', padding: '0.55rem 2rem 0.55rem 0.85rem' }}
                  value={i18n.language}
                  onChange={(e) => {
                    changeLanguage(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  aria-label="Choose your language"
                >
                  {ALL_INDIAN_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
                <span className="site-header__lang-select-arrow" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="mobile-drawer__bottom">
              <p>Authentic Handcrafts Direct from Indigenous Artisans.</p>
              <span>Authenticity & Provenance Seal Included</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
