import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../data/productStore';
import { useAuth } from '../contexts/AuthContext';
import type { CraftCategory } from '../types';

interface GalleryNavProps {
  viewMode: '3d' | '2d';
  onToggleViewMode: () => void;
  activeSection: 'collection' | 'stories' | 'making' | 'about';
  onSelectSection: (section: 'collection' | 'stories' | 'making' | 'about') => void;
  selectedCategory: CraftCategory;
  onSelectCategory: (category: CraftCategory) => void;
  onResetCamera?: () => void;
  hasIntroDismissed?: boolean;
  onReturnToIntro?: () => void;
  totalCount?: number;
}

export const GalleryNav = ({
  viewMode,
  onToggleViewMode,
  activeSection,
  onSelectSection,
  selectedCategory,
  onSelectCategory,
  onResetCamera,
  totalCount,
}: GalleryNavProps) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const totalWishlist = wishlist.length;
  const { user, isLoggedIn, isArtisan, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <header className="gallery-header" role="banner">
      <div className="gallery-header__inner">
        {/* Brand Identity */}
        <div className="gallery-header__brand">
          <Link to="/shop" className="brand-back-home" title="Explore Curatorial Catalogue">
            ← Catalogue
          </Link>
          <button
            onClick={() => {
              onSelectSection('collection');
              if (onResetCamera) onResetCamera();
            }}
            className="brand-link"
            aria-label="Kaarigar Home"
          >
            <span className="brand-logo-text">KAARIGAR</span>
            <span className="brand-badge">ARCHIVE</span>
          </button>
        </div>

        {/* Minimal Curatorial Navigation */}
        <nav className="gallery-header__nav" aria-label="Curatorial sections">
          <button
            onClick={() => {
              onSelectSection('collection');
              if (onResetCamera) onResetCamera();
            }}
            className={`nav-link ${activeSection === 'collection' ? 'nav-link--active' : ''}`}
          >
            COLLECTION
          </button>
          <button
            onClick={() => onSelectSection('stories')}
            className={`nav-link ${activeSection === 'stories' ? 'nav-link--active' : ''}`}
          >
            STORIES
          </button>
          <button
            onClick={() => onSelectSection('making')}
            className={`nav-link ${activeSection === 'making' ? 'nav-link--active' : ''}`}
          >
            MAKING OF
          </button>
          <button
            onClick={() => onSelectSection('about')}
            className={`nav-link ${activeSection === 'about' ? 'nav-link--active' : ''}`}
          >
            ABOUT
          </button>
          <button
            onClick={onToggleViewMode}
            className="nav-link"
            style={{ opacity: 0.75 }}
            title={viewMode === '3d' ? 'Switch to 2D Curatorial Catalog' : 'Enter 3D Spatial Gallery'}
          >
            {viewMode === '3d' ? '2D CATALOG' : '3D GALLERY'}
          </button>
        </nav>

        {/* Action Icons matching SiteHeader: Search, Wishlist, Bag, Sign In */}
        <div className="site-header__actions">
          {/* Search Icon */}
          <Link
            to="/shop"
            className="site-header__action-btn"
            aria-label="Search craft archive"
            title="Search crafts"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          {/* Wishlist Heart Icon */}
          <Link
            to="/wishlist"
            className="site-header__action-btn site-header__wishlist-btn"
            aria-label={`Wishlist (${totalWishlist} saved)`}
            title="View Wishlist"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {totalWishlist > 0 && <span className="site-badge">{totalWishlist}</span>}
          </Link>

          {/* Shopping Bag Icon */}
          <button
            type="button"
            className="site-header__action-btn site-header__cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Shopping bag containing ${totalItems} items`}
            title="Shopping Bag"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && <span className="site-badge">{totalItems}</span>}
          </button>

          {/* Auth: User Pill or Sign In Button */}
          {isLoggedIn ? (
            <div className="site-header__user-menu-wrap" style={{ position: 'relative' }}>
              <button
                type="button"
                className="site-header__seller-cta"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User account menu"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>{user?.name?.split(' ')[0] || 'Account'}</span>
                <svg
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
                <div
                  className="user-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#FDFBF7',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    minWidth: '180px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1C1C1A' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#7A7570', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {isArtisan ? 'Master Artisan' : 'Art Collector'}
                    </div>
                  </div>
                  {isArtisan && (
                    <Link
                      to="/dashboard"
                      style={{
                        display: 'block',
                        padding: '0.65rem 1rem',
                        fontSize: '0.84rem',
                        color: '#2C2C2A',
                        textDecoration: 'none',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                      }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Seller Atelier
                    </Link>
                  )}
                  <Link
                    to="/wishlist"
                    style={{
                      display: 'block',
                      padding: '0.65rem 1rem',
                      fontSize: '0.84rem',
                      color: '#2C2C2A',
                      textDecoration: 'none',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Wishlist {totalWishlist > 0 && `(${totalWishlist})`}
                  </Link>
                  <Link
                    to="/settings"
                    style={{
                      display: 'block',
                      padding: '0.65rem 1rem',
                      fontSize: '0.84rem',
                      color: '#2C2C2A',
                      textDecoration: 'none',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.65rem 1rem',
                      fontSize: '0.84rem',
                      color: '#C0392B',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="site-header__seller-cta" title="Sign In / Register">
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Subtle Category Filter Strip for Collection View */}
      {activeSection === 'collection' && (
        <div className="category-filter-strip">
          <div className="filter-inner">
            {(
              [
                { id: 'all', label: `All Works (${totalCount ?? 6})` },
                { id: 'paintings', label: 'Pahari Painting' },
                { id: 'ceramics', label: 'Blue Pottery' },
                { id: 'textiles', label: 'Handwoven Textile' },
                { id: 'metalcraft', label: 'Dhokra Brass' },
                { id: 'woodcraft', label: 'Turned Wood' },
                { id: 'jewellery', label: 'Kundan Jewellery' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id as CraftCategory)}
                className={`category-chip ${selectedCategory === cat.id ? 'chip--active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
