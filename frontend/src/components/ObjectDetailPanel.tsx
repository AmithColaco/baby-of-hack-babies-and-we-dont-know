import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CraftObject } from '../types';
import { useCart } from '../contexts/CartContext';

interface ObjectDetailPanelProps {
  object: CraftObject;
  onClose: () => void;
  onSelectNext?: () => void;
  onSelectPrev?: () => void;
  onOpenStory?: (artisanId: string) => void;
}

export const ObjectDetailPanel = ({
  object,
  onClose,
  onSelectNext,
  onSelectPrev,
  onOpenStory,
}: ObjectDetailPanelProps) => {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<'provenance' | 'making' | 'artisan'>('provenance');
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAcquire = () => {
    addToCart(object);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1800);
  };

  const directShareAmount = Math.round((object.price * object.directArtisanSharePercent) / 100);

  return (
    <aside
      className="object-detail-panel"
      role="dialog"
      aria-labelledby="object-title"
      aria-modal="true"
    >
      {/* Top Bar with Navigation Controls & Close */}
      <div className="panel__header">
        <div className="panel__accession">
          <span className="panel__accession-num">{object.accessionNo}</span>
          <span className="panel__accession-sep">/</span>
          <span className="panel__accession-roman">PLATE {object.romanNumeral}</span>
        </div>

        <div className="panel__nav-controls">
          {onSelectPrev && (
            <button
              onClick={onSelectPrev}
              className="panel__arrow-btn"
              title="Previous Masterwork (←)"
              aria-label="Previous object"
            >
              ←
            </button>
          )}
          {onSelectNext && (
            <button
              onClick={onSelectNext}
              className="panel__arrow-btn"
              title="Next Masterwork (→)"
              aria-label="Next object"
            >
              →
            </button>
          )}
          <button
            onClick={onClose}
            className="panel__close-btn"
            title="Return to Collection (Esc)"
            aria-label="Close detail panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="panel__content-scroll">
        {/* Craft Tradition & Title */}
        <div className="panel__headline">
          <div className="panel__tradition-tag">
            <span>{object.craftTradition}</span>
            <span className="panel__region-badge">· {object.state}</span>
          </div>

          <h2 id="object-title" className="panel__title">
            {object.title}
          </h2>

          {object.vernacularTitle && (
            <div className="panel__vernacular-title">
              {object.vernacularTitle}
            </div>
          )}
        </div>

        {/* Pricing & Direct Artisan Economics */}
        <div className="panel__pricing-card">
          <div className="panel__price-row">
            <div>
              <span className="panel__price-label">Curatorial Acquisition Price</span>
              <div className="panel__price-value">
                ₹ {object.price.toLocaleString('en-IN')}
              </div>
            </div>

            <span className={`panel__availability-pill ${object.availability === 'Available' ? 'avail--in-stock' : 'avail--edition'}`}>
              ● {object.availability}
            </span>
          </div>

          <div className="panel__equity-strip">
            <div className="panel__equity-bar">
              <div
                className="panel__equity-fill"
                style={{ width: `${object.directArtisanSharePercent}%` }}
              />
            </div>
            <div className="panel__equity-text">
              <strong>{object.directArtisanSharePercent}% (₹{directShareAmount.toLocaleString('en-IN')})</strong> proceeds transfer directly to {object.artisan} & the {object.atelier}.
            </div>
          </div>
        </div>

        {/* Navigation Tabs: Provenance / Making Process / Master Artisan */}
        <div className="panel__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'provenance'}
            onClick={() => setActiveTab('provenance')}
            className={`panel__tab ${activeTab === 'provenance' ? 'tab--active' : ''}`}
          >
            Provenance & Specs
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'making'}
            onClick={() => setActiveTab('making')}
            className={`panel__tab ${activeTab === 'making' ? 'tab--active' : ''}`}
          >
            The Making Process
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'artisan'}
            onClick={() => setActiveTab('artisan')}
            className={`panel__tab ${activeTab === 'artisan' ? 'tab--active' : ''}`}
          >
            Master Artisan
          </button>
        </div>

        {/* Tab 1: Provenance & Technical Specifications */}
        {activeTab === 'provenance' && (
          <div className="panel__tab-body">
            <div className="panel__story-summary">
              {object.makingStory.summary}
            </div>

            <div className="panel__specs-grid">
              <div className="spec-item">
                <span className="spec-label">Artisan Master</span>
                <span className="spec-value">{object.artisan}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Guild / Atelier</span>
                <span className="spec-value">{object.atelier}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Place of Origin</span>
                <span className="spec-value">{object.region}, {object.state}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Lineage & Era</span>
                <span className="spec-value">{object.period}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Dimensions</span>
                <span className="spec-value">{object.dimensions}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Weight</span>
                <span className="spec-value">{object.weight}</span>
              </div>
            </div>

            {/* Materials List */}
            <div className="panel__materials-section">
              <h4 className="panel__section-title">Verified Rare Materials</h4>
              <ul className="panel__materials-list">
                {object.materials.map((mat: string, i: number) => (
                  <li key={i} className="material-chip">
                    <span className="chip-bullet">✦</span>
                    <span>{mat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: The Making Process */}
        {activeTab === 'making' && (
          <div className="panel__tab-body">
            <div className="panel__technique-pill">
              <span className="technique-label">PRIMARY TECHNIQUE</span>
              <p className="technique-text">{object.technique}</p>
            </div>

            <div className="making-timeline">
              {object.makingStory.stages.map((stage: { step: string; title: string; description: string }) => (
                <div key={stage.step} className="timeline-stage">
                  <div className="stage-marker">
                    <span className="stage-num">{stage.step}</span>
                    <div className="stage-line" />
                  </div>
                  <div className="stage-content">
                    <h5 className="stage-title">{stage.title}</h5>
                    <p className="stage-desc">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Master Artisan Profile */}
        {activeTab === 'artisan' && (
          <div className="panel__tab-body">
            <div className="artisan-profile-card">
              <div className="artisan-header">
                <div className="artisan-avatar-placeholder">
                  {object.artisan.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h4 className="artisan-name">{object.artisan}</h4>
                  <div className="artisan-title">{object.artisanTitle}</div>
                  <div className="artisan-loc">{object.region}, {object.state}</div>
                </div>
              </div>

              <blockquote className="artisan-quote">
                “{object.artisanQuote}”
              </blockquote>

              <p className="artisan-bio">
                {object.artisanBio}
              </p>

              {onOpenStory && (
                <button
                  onClick={() => onOpenStory(object.id)}
                  className="btn btn-outline btn-sm artisan-explore-btn"
                >
                  Read Editorial Atelier Monograph →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="panel__footer">
        <button
          onClick={handleAcquire}
          className={`btn btn-primary btn-acquire ${addedAnimation ? 'btn-acquired' : ''}`}
          id="btn-acquire-object"
        >
          {addedAnimation ? (
            <span>✓ Reserved for Acquisition</span>
          ) : (
            <span>Acquire Masterwork · ₹ {object.price.toLocaleString('en-IN')}</span>
          )}
        </button>

        <Link
          to={`/shop/${object.id}`}
          className="btn btn-outline"
          style={{
            textAlign: 'center',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.82rem',
            letterSpacing: '0.04em',
          }}
        >
          <span>Explore Full Storyboard & Acquisition →</span>
        </Link>

        <button
          onClick={onClose}
          className="btn btn-ghost btn-return"
        >
          Return to Exhibition Space
        </button>
      </div>
    </aside>
  );
};
