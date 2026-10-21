import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../data/productStore';
import { useCart } from '../../contexts/CartContext';
import type { CraftObject } from '../../types';

export function FeaturedCarousel() {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProducts = products.slice(0, 6);
  const currentProduct: CraftObject | undefined = activeProducts[selectedIndex] || activeProducts[0];

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % activeProducts.length);
  }, [activeProducts.length]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + activeProducts.length) % activeProducts.length);
  }, [activeProducts.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (el) el.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev]);

  if (!currentProduct) return null;

  return (
    <section
      id="featured-carousel"
      className="featured-carousel"
      aria-label="Featured Crafts Interactive Carousel"
      ref={containerRef}
      tabIndex={0}
    >
      <div className="featured-carousel__inner">
        {/* Section Header */}
        <div className="featured-carousel__header">
          <div className="section-eyebrow">INTERACTIVE ATELIER SHOWCASE</div>
          <h2 className="section-title">The Masterwork Carousel</h2>
          <p className="section-subtitle">
            Orbit through curated collector pieces. Select any artifact to inspect its material composition, 
            lineage, and unvarnished making story.
          </p>
        </div>

        {/* Carousel Visual Stage */}
        <div className="carousel-stage">
          {/* Controls: Prev / Next */}
          <button
            type="button"
            className="carousel-nav-btn carousel-nav-btn--prev"
            onClick={handlePrev}
            aria-label="Previous craft piece"
            id="carousel-prev"
          >
            ←
          </button>

          <button
            type="button"
            className="carousel-nav-btn carousel-nav-btn--next"
            onClick={handleNext}
            aria-label="Next craft piece"
            id="carousel-next"
          >
            →
          </button>

          {/* Cards Track */}
          <div className="carousel-track">
            {activeProducts.map((prod, idx) => {
              const diff = (idx - selectedIndex + activeProducts.length) % activeProducts.length;
              let positionClass = 'is-hidden';
              if (diff === 0) positionClass = 'is-active';
              else if (diff === 1) positionClass = 'is-next';
              else if (diff === activeProducts.length - 1) positionClass = 'is-prev';
              else if (diff === 2) positionClass = 'is-far-next';
              else if (diff === activeProducts.length - 2) positionClass = 'is-far-prev';

              return (
                <div
                  key={prod.id}
                  className={`carousel-card ${positionClass}`}
                  onClick={() => setSelectedIndex(idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${prod.title}`}
                >
                  <div className="carousel-card__image-wrap">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="carousel-card__img"
                      loading="lazy"
                    />
                    <div className="carousel-card__badge">
                      <span>{prod.romanNumeral || `0${idx + 1}`}</span>
                    </div>
                  </div>
                  <div className="carousel-card__mini-info">
                    <span className="mini-craft">{prod.craftTradition}</span>
                    <span className="mini-title">{prod.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Product Curatorial Inspection Panel */}
        <div className="carousel-inspector">
          <div className="inspector-card">
            <div className="inspector-card__top">
              <div className="inspector-card__meta">
                <span className="inspector-accession">{currentProduct.accessionNo} · {currentProduct.craftTradition}</span>
                <span className="inspector-region">{currentProduct.region}, {currentProduct.state}</span>
              </div>
              <div className="inspector-price">
                <span className="currency">₹</span>
                <span className="amount">{currentProduct.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="inspector-card__middle">
              <h3 className="inspector-title">{currentProduct.title}</h3>
              {currentProduct.vernacularTitle && (
                <span className="inspector-vernacular">{currentProduct.vernacularTitle}</span>
              )}
              <p className="inspector-summary">{currentProduct.makingStory?.summary}</p>

              <div className="inspector-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Master Artisan</span>
                  <span className="spec-val">{currentProduct.artisan}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Atelier</span>
                  <span className="spec-val">{currentProduct.atelier}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Materials</span>
                  <span className="spec-val">{currentProduct.materials?.slice(0, 3).join(', ')}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Direct Payout</span>
                  <span className="spec-val highlight-green">100% Direct to Maker</span>
                </div>
              </div>
            </div>

            <div className="inspector-card__actions">
              <Link
                to={`/shop/${currentProduct.id}`}
                className="inspector-btn inspector-btn--story"
                id="carousel-view-story"
              >
                <span>Discover Interactive Story</span>
                <span className="arrow">→</span>
              </Link>

              <button
                type="button"
                className="inspector-btn inspector-btn--cart"
                onClick={() => addToCart(currentProduct)}
                id="carousel-add-cart"
              >
                <span>Add to Shopping Bag</span>
              </button>

              <Link
                to={`/gallery?focus=${currentProduct.id}`}
                className="inspector-btn inspector-btn--3d"
                id="carousel-enter-3d"
              >
                <span>✦ Inspect in 3D Gallery</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="carousel-dots">
          {activeProducts.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`carousel-dot ${idx === selectedIndex ? 'active' : ''}`}
              onClick={() => setSelectedIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
