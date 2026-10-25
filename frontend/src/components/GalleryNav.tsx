import { Link } from 'react-router-dom';
import type { CraftCategory } from '../types';

interface GalleryNavProps {
  activeSection: 'collection' | 'stories' | 'making' | 'about';
  onSelectSection: (section: 'collection' | 'stories' | 'making' | 'about') => void;
  selectedCategory: CraftCategory;
  onSelectCategory: (category: CraftCategory) => void;
  totalCount?: number;
}

export const GalleryNav = ({
  activeSection,
  onSelectSection,
  selectedCategory,
  onSelectCategory,
  totalCount,
}: GalleryNavProps) => {
  return (
    <div className="gallery-header" role="region" aria-label="Curatorial Exhibition Bar">
      <div className="gallery-header__inner">
        {/* Breadcrumb & Dossier Identity */}
        <div className="gallery-header__brand">
          <Link to="/gallery" className="brand-back-home" title="Return to Catalogue Storefront">
            ← Catalogue Storefront
          </Link>
          <div className="gallery-header__dossier-meta">
            <span className="brand-badge">ARCHIVAL EXHIBITION</span>
            <span className="gallery-count-badge">
              {totalCount ?? 6} Registered Plates
            </span>
          </div>
        </div>

        {/* Curatorial Section Navigation */}
        <nav className="gallery-header__nav" aria-label="Curatorial sections">
          <button
            type="button"
            onClick={() => onSelectSection('collection')}
            className={`nav-link ${activeSection === 'collection' ? 'nav-link--active' : ''}`}
          >
            COLLECTION PLATES
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('stories')}
            className={`nav-link ${activeSection === 'stories' ? 'nav-link--active' : ''}`}
          >
            MONOGRAPHS & STORIES
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('making')}
            className={`nav-link ${activeSection === 'making' ? 'nav-link--active' : ''}`}
          >
            MAKING JOURNEY
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('about')}
            className={`nav-link ${activeSection === 'about' ? 'nav-link--active' : ''}`}
          >
            CURATORIAL COVENANT
          </button>
        </nav>
      </div>

      {/* Category Filter Strip for Collection View */}
      {activeSection === 'collection' && (
        <div className="category-filter-strip">
          <div className="filter-inner">
            {(
              [
                { id: 'all', label: `All Masterworks (${totalCount ?? 6})` },
                { id: 'paintings', label: 'Pahari & Tanjore' },
                { id: 'ceramics', label: 'Blue Quartz Pottery' },
                { id: 'textiles', label: 'Handwoven Silks' },
                { id: 'metalcraft', label: 'Lost-Wax Bronze' },
                { id: 'woodcraft', label: 'Lacquer Wood' },
                { id: 'jewellery', label: 'Kundan & Enamel' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id as CraftCategory)}
                className={`category-chip ${selectedCategory === cat.id ? 'chip--active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
