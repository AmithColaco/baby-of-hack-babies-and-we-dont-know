import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { CraftObject } from '../types';
import { useCart } from '../contexts/CartContext';
import { getGuideNarration } from '../api/gallery';
import { getArtisanImage, handleImageError } from '../utils/imageFallback';

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

  // AI Gallery Guide State (AI Audio Guide)
  const [guideNarration, setGuideNarration] = useState<string | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [guideLang, setGuideLang] = useState<'en' | 'kn'>('en');

  // Cancel speech synthesis when object changes or unmounts
  useEffect(() => {
    setGuideNarration(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [object.id]);

  const handleToggleGuide = async () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      setGuideLoading(true);
      let narrationText = guideNarration;
      if (!narrationText) {
        const res = await getGuideNarration(object.id, guideLang);
        narrationText = res.narration;
        setGuideNarration(narrationText);
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = guideLang === 'kn' ? 'kn-IN' : 'en-IN';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('AI Guide narration fallback:', e);
      const fallback = `This masterwork is ${object.title} by ${object.artisan} from ${object.region}. Crafted with ${object.technique}, preserving living Indian heritage.`;
      setGuideNarration(fallback);
      const utterance = new SpeechSynthesisUtterance(fallback);
      utterance.lang = 'en-IN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } finally {
      setGuideLoading(false);
    }
  };

  const handleAcquire = () => {
    addToCart(object);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1800);
  };

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
              type="button"
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
              type="button"
              onClick={onSelectNext}
              className="panel__arrow-btn"
              title="Next Masterwork (→)"
              aria-label="Next object"
            >
              →
            </button>
          )}
          <button
            type="button"
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
                ₹ {Math.round(object.price * 1.05).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                Base price: ₹{object.price.toLocaleString('en-IN')} + 5% platform fee: ₹{Math.round(object.price * 0.05).toLocaleString('en-IN')}
              </span>
            </div>

            <span className={`panel__availability-pill ${object.availability === 'Available' ? 'avail--in-stock' : 'avail--edition'}`}>
              ● {object.availability}
            </span>
          </div>

          <div className="panel__equity-strip">
            <div className="panel__equity-bar">
              <div
                className="panel__equity-fill"
                style={{ width: '100%' }}
              />
            </div>
            <div className="panel__equity-text">
              <strong>Direct compensation of ₹{object.price.toLocaleString('en-IN')}</strong> transfers directly to {object.artisan} & the {object.atelier}.
            </div>
          </div>
        </div>

        {/* AI Gallery Guide (AI Audio Guide) */}
        <div
          style={{
            margin: '14px 0 16px 0',
            padding: '12px 14px',
            background: 'rgba(232, 213, 183, 0.25)',
            border: '1px solid rgba(205, 133, 63, 0.35)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4a3b32', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏛️</span>
              <span>AI Exhibition Guide (Gemini Narration + TTS)</span>
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setGuideLang('en')}
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  background: guideLang === 'en' ? '#8B4513' : 'transparent',
                  color: guideLang === 'en' ? '#fff' : '#4a3b32',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setGuideLang('kn')}
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  background: guideLang === 'kn' ? '#8B4513' : 'transparent',
                  color: guideLang === 'kn' ? '#fff' : '#4a3b32',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleGuide}
            disabled={guideLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: isSpeaking ? '#8B2500' : '#8B4513',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{isSpeaking ? '⏹ Stop Voice Guide' : guideLoading ? '⏳ Generating Audio Narration...' : '🎧 Listen to AI Gallery Guide'}</span>
          </button>

          {guideNarration && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#554', fontStyle: 'italic', lineHeight: 1.4 }}>
              “{guideNarration}”
            </p>
          )}
        </div>

        {/* Navigation Tabs: Provenance / Making Process / Master Artisan */}
        <div className="panel__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'provenance'}
            onClick={() => setActiveTab('provenance')}
            className={`panel__tab ${activeTab === 'provenance' ? 'tab--active' : ''}`}
          >
            Provenance & Specs
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'making'}
            onClick={() => setActiveTab('making')}
            className={`panel__tab ${activeTab === 'making' ? 'tab--active' : ''}`}
          >
            The Making Process
          </button>
          <button
            type="button"
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
                <img
                  src={object.artisanImage || getArtisanImage(object.artisan + ' ' + (object.craftTradition || ''))}
                  alt={object.artisan}
                  className="artisan-avatar-img"
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--terracotta)' }}
                  onError={(e) => handleImageError(e, '/images/artisan.jpg')}
                />
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
                  type="button"
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
          type="button"
          onClick={handleAcquire}
          className={`btn btn-primary btn-acquire ${addedAnimation ? 'btn-acquired' : ''}`}
          id="btn-acquire-object"
        >
          {addedAnimation ? (
            <span>✓ Reserved for Acquisition</span>
          ) : (
            <span>Acquire Masterwork · ₹ {Math.round(object.price * 1.05).toLocaleString('en-IN')}</span>
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
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-return"
        >
          Return to Exhibition Space
        </button>
      </div>
    </aside>
  );
};
