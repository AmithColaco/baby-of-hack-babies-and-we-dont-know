import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import type { CraftCategory } from '../types';

interface GalleryNavProps {
  viewMode: '3d' | '2d';
  onToggleViewMode: () => void;
  activeSection: 'collection' | 'stories' | 'making' | 'about';
  onSelectSection: (section: 'collection' | 'stories' | 'making' | 'about') => void;
  selectedCategory: CraftCategory;
  onSelectCategory: (category: CraftCategory) => void;
  onResetCamera?: () => void;
  hasIntroDismissed: boolean;
  onReturnToIntro: () => void;
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
  hasIntroDismissed,
  onReturnToIntro,
  totalCount,
}: GalleryNavProps) => {
  const { totalItems, setIsCartOpen } = useCart();

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
        </nav>

        {/* Actions: View Switcher (3D/2D) & Curatorial Bag */}
        <div className="gallery-header__actions">
          {/* Spatial 3D / 2D Archive Switcher */}
          <button
            onClick={onToggleViewMode}
            className="btn btn-mode-toggle"
            title={viewMode === '3d' ? 'Switch to 2D Curatorial Catalog' : 'Enter 3D Spatial Gallery'}
            aria-label="Toggle exhibition view mode"
          >
            <span className="mode-icon">✦</span>
            <span className="mode-label">{viewMode === '3d' ? '3D Gallery' : '2D Archive'}</span>
          </button>

          {/* Bag / Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn btn-cart-trigger"
            aria-label={`Open curatorial bag with ${totalItems} items`}
            id="nav-cart-trigger"
          >
            <span className="cart-label">BAG</span>
            <span className="cart-count-badge">{totalItems}</span>
          </button>

          {hasIntroDismissed && (
            <button
              onClick={onReturnToIntro}
              className="btn btn-ghost btn-intro-back"
              title="Return to Intro"
            >
              Intro
            </button>
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
