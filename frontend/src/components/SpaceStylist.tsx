// KAARIGAR — "Craft in Your Space" AI Space Stylist Component
// A floating premium chatbot that analyzes a user's interior photograph
// and recommends matching products from the KAARIGAR catalogue.

import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../data/productStore';
import { useCart } from '../contexts/CartContext';
import type { CraftObject } from '../types';
import {
  analyzeSpaceWithBackend,
  type ProductRecommendation,
  type SpaceAnalysis,
} from '../api/geminiStylist';

type AssistantState =
  | 'welcome'
  | 'upload'
  | 'ready'
  | 'analyzing'
  | 'results'
  | 'unsuitable'
  | 'error'
  | 'no-match';

const MAX_FILE_SIZE_MB = 8;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function MatchScorePill({ score }: { score: number }) {
  const color = score >= 85 ? '#2D6A4F' : score >= 75 ? '#B5602A' : '#5C4B3B';
  return (
    <span
      className="stylist-match-pill"
      style={{ background: color }}
      title={`${score}% aesthetic match`}
    >
      {score}% match
    </span>
  );
}

function ProductRecommendationCard({
  rec,
  onAddToCart,
}: {
  rec: ProductRecommendation;
  onAddToCart: (product: CraftObject) => void;
}) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    onAddToCart(rec.product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article className="stylist-rec-card">
      <div className="stylist-rec-card__img-wrap">
        <img
          src={rec.product.image}
          alt={rec.product.title}
          className="stylist-rec-card__img"
          loading="lazy"
        />
        <MatchScorePill score={rec.matchScore} />
      </div>
      <div className="stylist-rec-card__body">
        <p className="stylist-rec-card__tradition">{rec.product.craftTradition}</p>
        <h4 className="stylist-rec-card__title">{rec.product.title}</h4>
        <p className="stylist-rec-card__artisan">by {rec.product.artisan}</p>
        <p className="stylist-rec-card__price">{formatINR(rec.product.price)}</p>
        <p className="stylist-rec-card__reason">{rec.reason}</p>
        <div className="stylist-rec-card__actions">
          <Link
            to={`/shop/${rec.product.id}`}
            className="stylist-rec-card__btn stylist-rec-card__btn--outline"
            title="View full product story"
          >
            View Story
          </Link>
          <button
            type="button"
            className={`stylist-rec-card__btn stylist-rec-card__btn--primary${added ? ' stylist-rec-card__btn--added' : ''}`}
            onClick={handleAdd}
            disabled={added}
          >
            {added ? '✓ Added' : '+ Add to Bag'}
          </button>
        </div>
      </div>
    </article>
  );
}

function SpaceAnalysisBadge({ analysis }: { analysis: SpaceAnalysis }) {
  return (
    <div className="stylist-analysis-badge">
      <div className="stylist-analysis-badge__row">
        <span className="stylist-analysis-badge__label">Interior Style</span>
        <span className="stylist-analysis-badge__value">{analysis.interiorStyle}</span>
      </div>
      <div className="stylist-analysis-badge__row">
        <span className="stylist-analysis-badge__label">Space Mood</span>
        <span className="stylist-analysis-badge__value">{analysis.spaceMood}</span>
      </div>
      {analysis.suggestedPlacements && analysis.suggestedPlacements.length > 0 && (
        <div className="stylist-analysis-badge__row">
          <span className="stylist-analysis-badge__label">Best For</span>
          <span className="stylist-analysis-badge__value">
            {analysis.suggestedPlacements.join(' · ')}
          </span>
        </div>
      )}
      {analysis.dominantColors && analysis.dominantColors.length > 0 && (
        <div className="stylist-analysis-badge__colors">
          {analysis.dominantColors.map((c, i) => (
            <span key={i} className="stylist-color-chip" title={c}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SpaceStylist() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<AssistantState>('welcome');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [userPreference, setUserPreference] = useState('');
  const [analysis, setAnalysis] = useState<SpaceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();
  const { addToCart } = useCart();

  const handleOpen = () => {
    setIsOpen(true);
    setState('welcome');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  };

  const handleReset = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setUserPreference('');
    setAnalysis(null);
    setRecommendations([]);
    setErrorMessage('');
    setState('upload');
  };

  const validateAndSetImage = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage('Please upload a JPEG, PNG, or WebP image of your space.');
      setState('error');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(
        `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${MAX_FILE_SIZE_MB} MB.`
      );
      setState('error');
      return;
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(url);
    // Invalidate previous analysis to prevent stale results
    setAnalysis(null);
    setRecommendations([]);
    setErrorMessage('');
    setState('ready');
  }, [imagePreviewUrl]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setState('analyzing');
    setErrorMessage('');
    setAnalysis(null);
    setRecommendations([]);

    try {
      const result = await analyzeSpaceWithBackend(imageFile, userPreference);
      setAnalysis(result.analysis);

      // Check if image is unsuitable (e.g. face portrait, pet, food, non-interior)
      if (result.analysis.isSuitable === false) {
        setRecommendations([]);
        setState('unsuitable');
        return;
      }

      if (!result.recommendations || result.recommendations.length === 0) {
        setRecommendations([]);
        setState('no-match');
      } else {
        setRecommendations(result.recommendations);
        setState('results');
      }
    } catch (err: any) {
      console.error('Space analysis error:', err);
      const detail = err.response?.data?.detail;
      const msg = detail || err.message || 'Space analysis failed. Please verify your network and Gemini API configuration.';
      setErrorMessage(msg);
      setState('error');
    }
  };

  const handleAddToCart = (product: CraftObject) => {
    addToCart(product, 1);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="stylist-float-btn"
        onClick={handleOpen}
        aria-label="Open AI Space Stylist — Craft in Your Space"
        title="Craft in Your Space — AI styling assistant"
      >
        <span className="stylist-float-btn__icon" aria-hidden="true">✦</span>
        <span className="stylist-float-btn__label">Style My Space</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="stylist-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Main Panel */}
      <aside
        className="stylist-panel"
        role="complementary"
        aria-label="AI Space Stylist: Craft in Your Space"
      >
        {/* ── Header ── */}
        <header className="stylist-panel__header">
          <div className="stylist-panel__header-left">
            <span className="stylist-panel__icon" aria-hidden="true">✦</span>
            <div>
              <h2 className="stylist-panel__title">Craft in Your Space</h2>
              <p className="stylist-panel__subtitle">AI-Powered Artisan Curation</p>
            </div>
          </div>
          <button
            type="button"
            className="stylist-panel__close"
            onClick={handleClose}
            aria-label="Close Space Stylist"
          >
            ✕
          </button>
        </header>

        {/* ── Body ── */}
        <div className="stylist-panel__body">

          {/* ── WELCOME STATE ── */}
          {state === 'welcome' && (
            <div className="stylist-state stylist-state--welcome">
              <div className="stylist-welcome-art" aria-hidden="true">
                <div className="stylist-welcome-art__circle">
                  <span>🏠</span>
                </div>
                <div className="stylist-welcome-art__orbit" />
              </div>
              <h3 className="stylist-welcome-title">
                Discover which handcrafted masterwork belongs in your space.
              </h3>
              <p className="stylist-welcome-body">
                Upload a photograph of your room, shelf, wall, or desk — and Gemini AI will
                analyze the colors, style, and mood to recommend the perfect Indian artisan
                craft from KAARIGAR's permanent collection.
              </p>
              <ul className="stylist-welcome-features">
                <li>
                  <span>🎨</span>
                  Reads your space's color palette and interior aesthetic
                </li>
                <li>
                  <span>🏺</span>
                  Matches real products from our artisan catalogue
                </li>
                <li>
                  <span>🛍️</span>
                  Direct Add to Bag with full artisan provenance
                </li>
              </ul>

              <button
                type="button"
                className="stylist-btn stylist-btn--primary"
                onClick={() => setState('upload')}
              >
                Upload Your Space Photo →
              </button>
            </div>
          )}

          {/* ── UPLOAD / READY STATES ── */}
          {(state === 'upload' || state === 'ready') && (
            <div className="stylist-state">
              {/* Image Upload Zone */}
              {!imageFile ? (
                <div
                  className={`stylist-dropzone${isDraggingOver ? ' stylist-dropzone--active' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label="Upload a photograph of your space"
                >
                  <div className="stylist-dropzone__icon" aria-hidden="true">📸</div>
                  <p className="stylist-dropzone__primary">
                    {isDraggingOver ? 'Drop your photo here' : 'Upload your space photo'}
                  </p>
                  <p className="stylist-dropzone__secondary">
                    JPEG · PNG · WebP · Max {MAX_FILE_SIZE_MB} MB
                  </p>
                  <button
                    type="button"
                    className="stylist-btn stylist-btn--outline stylist-btn--sm"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <div className="stylist-preview">
                  <div className="stylist-preview__img-wrap">
                    <img
                      src={imagePreviewUrl!}
                      alt="Your uploaded space"
                      className="stylist-preview__img"
                    />
                    <button
                      type="button"
                      className="stylist-preview__remove"
                      onClick={() => {
                        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                        setImageFile(null);
                        setImagePreviewUrl(null);
                        setAnalysis(null);
                        setRecommendations([]);
                        setState('upload');
                      }}
                      aria-label="Remove uploaded photo"
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="stylist-preview__name">{imageFile.name}</p>
                </div>
              )}

              {/* Optional Preference Input */}
              <div className="stylist-pref-wrap">
                <label className="stylist-label" htmlFor="stylist-pref-input">
                  Style preference or budget <span style={{ opacity: 0.6 }}>(optional)</span>
                </label>
                <input
                  id="stylist-pref-input"
                  type="text"
                  value={userPreference}
                  onChange={(e) => setUserPreference(e.target.value)}
                  placeholder='e.g. "Minimalist ceramic accent, budget ₹30,000"'
                  className="stylist-pref-input"
                  maxLength={200}
                />
              </div>

              {/* Analyze Button */}
              <button
                type="button"
                className="stylist-btn stylist-btn--primary stylist-btn--full"
                onClick={handleAnalyze}
                disabled={!imageFile}
              >
                ✦ Analyze My Space with Gemini AI
              </button>

              <p className="stylist-privacy-note">
                🔒 Your space photograph is securely analyzed by KAARIGAR's server-side AI assistant.
              </p>
            </div>
          )}

          {/* ── ANALYZING STATE ── */}
          {state === 'analyzing' && (
            <div className="stylist-state stylist-state--loading">
              <div className="stylist-loader" aria-hidden="true">
                <div className="stylist-loader__ring" />
                <div className="stylist-loader__ring stylist-loader__ring--2" />
                <div className="stylist-loader__ring stylist-loader__ring--3" />
              </div>
              <h3 className="stylist-loading-title">Analyzing Your Space…</h3>
              <p className="stylist-loading-body">
                Gemini AI is examining room lighting, color harmony, and craft placement opportunities.
              </p>
              <div className="stylist-loading-steps">
                <span className="stylist-loading-step stylist-loading-step--active">Examining color palette</span>
                <span className="stylist-loading-step">Reading interior style</span>
                <span className="stylist-loading-step">Matching artisan catalogue</span>
              </div>
            </div>
          )}

          {/* ── UNSUITABLE IMAGE STATE (e.g. Person's Face, Pet, Food) ── */}
          {state === 'unsuitable' && (
            <div className="stylist-state stylist-state--empty">
              <div className="stylist-empty-icon" aria-hidden="true">🖼️</div>
              <h3 className="stylist-empty-title">Not an Interior Space</h3>
              <p className="stylist-empty-body">
                {analysis?.unsuitableMessage ||
                  'The uploaded photograph does not appear to be an interior space, room, shelf, desk, or wall. Please upload a photo of your space so we can curate suitable handcrafted Indian decor pieces.'}
              </p>
              <button
                type="button"
                className="stylist-btn stylist-btn--primary"
                onClick={() => {
                  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                  setImageFile(null);
                  setImagePreviewUrl(null);
                  setAnalysis(null);
                  setRecommendations([]);
                  setState('upload');
                }}
              >
                Upload a Room or Shelf Photo →
              </button>
              <button
                type="button"
                className="stylist-btn stylist-btn--ghost"
                onClick={handleReset}
              >
                Start Over
              </button>
            </div>
          )}

          {/* ── RESULTS STATE ── */}
          {state === 'results' && analysis && (
            <div className="stylist-state stylist-state--results">
              {/* Space Reading */}
              <div className="stylist-results-header">
                <h3 className="stylist-results-title">Space Reading Complete</h3>
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Your space"
                    className="stylist-results-thumb"
                  />
                )}
              </div>

              <p className="stylist-results-description">{analysis.spaceDescription}</p>
              <SpaceAnalysisBadge analysis={analysis} />

              {/* Recommendations */}
              <div className="stylist-results-section">
                <h4 className="stylist-results-section-title">
                  Curated Recommendations ({recommendations.length})
                </h4>
                <div className="stylist-rec-list">
                  {recommendations.map((rec) => (
                    <ProductRecommendationCard
                      key={rec.product.id}
                      rec={rec}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="stylist-btn stylist-btn--ghost stylist-btn--full"
                onClick={handleReset}
              >
                ↺ Analyze a Different Space
              </button>
            </div>
          )}

          {/* ── NO MATCH STATE ── */}
          {state === 'no-match' && (
            <div className="stylist-state stylist-state--empty">
              <div className="stylist-empty-icon" aria-hidden="true">🏺</div>
              <h3 className="stylist-empty-title">No Close Matches Found</h3>
              <p className="stylist-empty-body">
                Our current catalogue doesn't have an exact match for your space's aesthetic or
                budget. Try relaxing your preferences or explore the full collection.
              </p>
              <Link
                to="/gallery"
                className="stylist-btn stylist-btn--primary"
                onClick={handleClose}
              >
                Browse Full Collection →
              </Link>
              <button
                type="button"
                className="stylist-btn stylist-btn--ghost"
                onClick={handleReset}
              >
                Try Different Preferences
              </button>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {state === 'error' && (
            <div className="stylist-state stylist-state--error">
              <div className="stylist-error-icon" aria-hidden="true">⚠</div>
              <h3 className="stylist-error-title">Analysis Failed</h3>
              <p className="stylist-error-body">{errorMessage}</p>
              <div className="stylist-error-actions">
                <button
                  type="button"
                  className="stylist-btn stylist-btn--primary"
                  onClick={() => setState(imageFile ? 'ready' : 'upload')}
                >
                  Try Again
                </button>
                <button
                  type="button"
                  className="stylist-btn stylist-btn--ghost"
                  onClick={handleReset}
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="stylist-panel__footer">
          <p>
            Powered by <span className="stylist-footer-gem">Gemini AI</span> · Live Vision Analysis
          </p>
          <p>Recommends from {products.length} curated masterworks</p>
        </footer>
      </aside>
    </>
  );
}
