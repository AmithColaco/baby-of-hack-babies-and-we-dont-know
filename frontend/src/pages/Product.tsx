import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts, useWishlist, listingToCraftObject } from '../data/productStore';
import { getListingById } from '../api/listings';
import { useCart } from '../contexts/CartContext';
import { handleImageError, getFallbackForCraft, getArtisanImage } from '../utils/imageFallback';
import type { CraftObject } from '../types';
import { ProvenanceTagModal } from '../components/ProvenanceTagModal';

export default function Product() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeChapter, setActiveChapter] = useState(0);
  const [viewMode, setViewMode] = useState<'story' | 'specs'>('story');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [asyncProduct, setAsyncProduct] = useState<CraftObject | null>(null);
  const [isLoadingAsync, setIsLoadingAsync] = useState(false);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState(false);

  // Find product from store or async backend
  const localProduct = products.find((p) => p.id === id);
  const product: CraftObject | undefined = localProduct || asyncProduct || (id ? undefined : products[0]);

  useEffect(() => {
    if (id && !localProduct) {
      let isMounted = true;
      setIsLoadingAsync(true);
      getListingById(id)
        .then((record) => {
          if (isMounted) setAsyncProduct(listingToCraftObject(record));
        })
        .catch(() => {
          // not found on backend either
        })
        .finally(() => {
          if (isMounted) setIsLoadingAsync(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [id, localProduct]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveChapter(0);
  }, [id]);

  // Keyboard navigation across chapters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'story') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          setActiveChapter((prev) => Math.min(prev + 1, 5));
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          setActiveChapter((prev) => Math.max(prev - 1, 0));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  if (isLoadingAsync) {
    return (
      <main className="storyboard-page">
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <h2>Retrieving Craft Piece Archive...</h2>
          <p style={{ color: 'var(--graphite)', marginTop: '0.5rem' }}>Loading authentic provenance documentation...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="storyboard-page">
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <h2>Craft piece not found</h2>
          <Link to="/gallery" className="hero-btn hero-btn--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Return to Collection
          </Link>
        </div>
      </main>
    );
  }

  const isFavorited = isInWishlist(product.id);
  // For items, strictly keep similar items only (matching craft category or tradition)
  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.craftTradition.toLowerCase().includes(product.category.toLowerCase())))
    .slice(0, 3);

  // Rate calculation: Actual Price + 5% platform fee + 5% tax (GST)
  const actualPrice = product.price;
  const platformFee = Math.round(actualPrice * 0.05);
  const tax = Math.round(actualPrice * 0.05);
  const clientPrice = actualPrice + platformFee + tax;

  const totalActualPrice = actualPrice * quantity;
  const totalPlatformFee = platformFee * quantity;
  const totalTax = tax * quantity;
  const totalClientPrice = clientPrice * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const CHAPTERS = [
    { title: 'The Object', subtitle: 'Sacred Lineage & Materiality' },
    { title: 'The Maker', subtitle: 'Atelier & Generational Hands' },
    { title: 'Raw Alchemy', subtitle: 'Earth, Minerals & Resins' },
    { title: 'The Making', subtitle: 'Step-by-Step Transformation' },
    { title: 'Dimensions', subtitle: 'Archival Specifications' },
    { title: 'Acquisition', subtitle: 'Collector Reserve & Provenance' },
  ];

  return (
    <main className="storyboard-page" role="main" aria-label={`Storyboard for ${product.title}`}>
      {/* Top Breadcrumb & View Mode Bar */}
      <div className="storyboard-topbar">
        <div className="storyboard-topbar__inner">
          <div className="storyboard-breadcrumbs">
            <Link to="/gallery">← Collection</Link>
            <span className="sep">/</span>
            <span className="current">{product.craftTradition}</span>
            <span className="sep">/</span>
            <span className="accession">{product.accessionNo}</span>
            <span className="sep">/</span>
            <Link to={`/archive?focus=${product.id}`} className="storyboard-3d-crumb" title="Inspect in Curatorial Gallery Dossier">
              ✦ View in Gallery
            </Link>
          </div>

          <div className="storyboard-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'story' ? 'active' : ''}`}
              onClick={() => setViewMode('story')}
            >
              Interactive Story
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'specs' ? 'active' : ''}`}
              onClick={() => setViewMode('specs')}
            >
              Archival Specs
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'story' ? (
        /* IMMERSIVE STORYBOARD EXPERIENCE */
        <div className="storyboard-viewport">
          {/* Chapter Progression Tracker */}
          <div className="chapter-tracker" aria-label="Story chapters navigation">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={ch.title}
                type="button"
                className={`chapter-step ${idx === activeChapter ? 'active' : ''} ${idx < activeChapter ? 'completed' : ''}`}
                onClick={() => setActiveChapter(idx)}
                aria-label={`Jump to chapter ${idx + 1}: ${ch.title}`}
              >
                <span className="chapter-step__num">0{idx + 1}</span>
                <span className="chapter-step__title">{ch.title}</span>
              </button>
            ))}
          </div>

          {/* Chapter 01: Meet the Object */}
          {activeChapter === 0 && (
            <div className="storyboard-scene scene-object">
              <div className="scene-object__grid">
                <div className="scene-object__media">
                  <div className="product-image-frame" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light, #E8DFD3)', background: '#F8F5EE', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                    <img
                      src={product.image}
                      alt={product.title}
                      className="product-masterwork-img"
                      style={{ width: '100%', height: '460px', objectFit: 'contain', padding: '1.5rem', display: 'block' }}
                      onError={(e) => handleImageError(e, getFallbackForCraft(product.craftTradition || product.category))}
                    />
                    <div className="media-provenance-tag" style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(28,28,26,0.75)', color: '#FDFBF7', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                      <span>PLATE {product.romanNumeral} · {product.accessionNo}</span>
                    </div>
                  </div>
                </div>

                <div className="scene-object__narrative">
                  <span className="scene-eyebrow">SCENE 01 · MEET THE MASTERWORK</span>
                  <h1 className="scene-title">{product.title}</h1>
                  {product.vernacularTitle && (
                    <span className="scene-vernacular">{product.vernacularTitle}</span>
                  )}
                  <div className="scene-meta-row">
                    <span className="meta-tag">{product.craftTradition}</span>
                    <span className="meta-tag">{product.region}, {product.state}</span>
                    <span className="meta-tag highlight">{product.period || 'Living Traditional Practice'}</span>
                  </div>

                  <p className="scene-summary">{product.makingStory?.summary}</p>

                  <div className="scene-price-block">
                    <div className="price-item">
                      <span className="price-label">Actual Price</span>
                      <span className="price-val">₹{actualPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">Platform Fee (5%)</span>
                      <span className="price-val">₹{platformFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">Tax (5% GST)</span>
                      <span className="price-val">₹{tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="price-item total-item">
                      <span className="price-label">Total Price</span>
                      <span className="price-val total-val">₹{clientPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Prominent Purchase Section - Preserved Alongside Price & Provenance */}
                  <div className="scene-purchase-box">
                    <div className="scene-purchase-row">
                      <div className="scene-qty-picker" aria-label="Quantity selector">
                        <span className="qty-label">Quantity:</span>
                        <div className="qty-controls">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="qty-val">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => q + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`scene-wish-btn ${isFavorited ? 'active' : ''}`}
                        onClick={() => toggleWishlist(product.id)}
                        aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        {isFavorited ? '♥ Saved' : '♡ Save to Wishlist'}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="scene-main-cart-btn"
                      onClick={handleAddToCart}
                      id="primary-add-to-bag"
                    >
                      <span className="cart-btn-icon">🛍</span>
                      <span>{t('product.add_to_cart')} · ₹{(clientPrice * quantity).toLocaleString('en-IN')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsProvenanceModalOpen(true)}
                      className="scene-wish-btn"
                      style={{ width: '100%', marginTop: '0.65rem', padding: '0.65rem 1rem', background: '#F8F4EC', border: '1px solid #D6C7B2', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#8A2D19', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <span>✦</span>
                      <span>{t('product.provenance_btn')}</span>
                    </button>

                    <div className="purchase-shipping-hint">
                      <span>✓ Complimentary white-glove transit across India · Insured & certified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 02: Meet the Artisan */}
          {activeChapter === 1 && (
            <div className="storyboard-scene scene-artisan">
              <div className="scene-artisan__grid">
                <div className="scene-artisan__media">
                  <div className="artisan-media-box">
                    <img
                      src={product.artisanImage || getArtisanImage(product.artisan + ' ' + (product.craftTradition || ''))}
                      alt={product.artisan}
                      className="artisan-portrait"
                      onError={(e) => handleImageError(e, '/images/artisan.jpg')}
                    />
                    <div className="artisan-media-box__tag">
                      <span>{product.atelier}</span>
                    </div>
                  </div>
                </div>

                <div className="scene-artisan__narrative">
                  <span className="scene-eyebrow">SCENE 02 · MEET THE MASTER ARTISAN</span>
                  <h2 className="scene-artisan__name">{product.artisan}</h2>
                  <span className="scene-artisan__title">{product.artisanTitle}</span>
                  <span className="scene-artisan__location">{product.atelier} · {product.region}, {product.state}</span>

                  <blockquote className="artisan-quote-callout">
                    “{product.artisanQuote || 'When the hands move with devotion, the craft ceases to be work and becomes living memory.'}”
                  </blockquote>

                  <p className="artisan-full-bio">{product.artisanBio}</p>

                  <div className="artisan-metrics-row">
                    <div className="a-metric">
                      <span className="a-metric__num">100%</span>
                      <span className="a-metric__lbl">Direct Financial Return</span>
                    </div>
                    <div className="a-metric">
                      <span className="a-metric__num">Guaranteed</span>
                      <span className="a-metric__lbl">Fair Compensation</span>
                    </div>
                    <div className="a-metric">
                      <span className="a-metric__num">Archived</span>
                      <span className="a-metric__lbl">National Recognition</span>
                    </div>
                  </div>

                  <div className="scene-nav-controls">
                    <button type="button" className="scene-prev-btn" onClick={() => setActiveChapter(0)}>
                      ← Previous: The Object
                    </button>
                    <button type="button" className="scene-next-btn" onClick={() => setActiveChapter(2)}>
                      <span>Next: Raw Earth & Materials</span>
                      <span className="arrow">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 03: The Raw Materials */}
          {activeChapter === 2 && (
            <div className="storyboard-scene scene-materials">
              <div className="scene-materials__header">
                <span className="scene-eyebrow">SCENE 03 · THE RAW MATERIALS</span>
                <h2 className="scene-materials__title">Geological & Organic Materiality</h2>
                <p className="scene-materials__desc">
                  Authentic Indian craftsmanship rejects artificial polymers and synthetic binders. 
                  Every element is gathered from riverbeds, forest hives, and mineral quarries.
                </p>
              </div>

              <div className="materials-cards-grid">
                {product.materials.map((mat, idx) => (
                  <div key={mat} className="mat-card">
                    <span className="mat-card__num">0{idx + 1}</span>
                    <h4 className="mat-card__title">{mat}</h4>
                    <p className="mat-card__note">
                      Sustainably harvested and processed according to canonical Vedic and Persian craft treaties.
                    </p>
                  </div>
                ))}
              </div>

              <div className="scene-nav-controls" style={{ marginTop: '3rem' }}>
                <button type="button" className="scene-prev-btn" onClick={() => setActiveChapter(1)}>
                  ← Previous: The Maker
                </button>
                <button type="button" className="scene-next-btn" onClick={() => setActiveChapter(3)}>
                  <span>Next: The Making Process</span>
                  <span className="arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Chapter 04: The Making Process */}
          {activeChapter === 3 && (
            <div className="storyboard-scene scene-process">
              <div className="scene-process__header">
                <span className="scene-eyebrow">SCENE 04 · THE SACRED MAKING PROCESS</span>
                <h2 className="scene-process__title">Step-by-Step Transformation</h2>
                <p className="scene-process__desc">
                  Technique preserved through oral tradition: <em>{product.technique}</em>
                </p>
              </div>

              <div className="process-timeline">
                {product.makingStory.stages.map((stage) => (
                  <div key={stage.step} className="timeline-stage">
                    <div className="timeline-stage__indicator">
                      <span className="stage-num">{stage.step}</span>
                    </div>
                    <div className="timeline-stage__content">
                      <h3 className="stage-title">{stage.title}</h3>
                      <p className="stage-desc">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="scene-nav-controls" style={{ marginTop: '3rem' }}>
                <button type="button" className="scene-prev-btn" onClick={() => setActiveChapter(2)}>
                  ← Previous: Materials
                </button>
                <button type="button" className="scene-next-btn" onClick={() => setActiveChapter(4)}>
                  <span>Next: Dimensions & Provenance</span>
                  <span className="arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Chapter 05: Dimensions & Provenance */}
          {activeChapter === 4 && (
            <div className="storyboard-scene scene-specs">
              <div className="scene-specs__header">
                <span className="scene-eyebrow">SCENE 05 · PHYSICAL DIMENSIONS & ARCHIVAL CARE</span>
                <h2 className="scene-specs__title">Collector Specifications</h2>
              </div>

              <div className="specs-table-box">
                <div className="spec-row">
                  <span className="spec-label">Accession Number</span>
                  <span className="spec-value">{product.accessionNo}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Physical Dimensions</span>
                  <span className="spec-value">{product.dimensions}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Net Object Weight</span>
                  <span className="spec-value">{product.weight}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Primary Category</span>
                  <span className="spec-value capitalize">{product.category}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Craft Guild & Atelier</span>
                  <span className="spec-value">{product.atelier}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Geographical Indication (GI)</span>
                  <span className="spec-value">Certified Authentic Origin · {product.region}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Packaging & Mount</span>
                  <span className="spec-value">Handcrafted cedarwood archival case with natural silk lining</span>
                </div>
              </div>

              <div className="scene-nav-controls" style={{ marginTop: '3rem' }}>
                <button type="button" className="scene-prev-btn" onClick={() => setActiveChapter(3)}>
                  ← Previous: The Making
                </button>
                <button type="button" className="scene-next-btn" onClick={() => setActiveChapter(5)}>
                  <span>Next: Acquisition & Collect</span>
                  <span className="arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Chapter 06: Purchase & Acquire */}
          {activeChapter === 5 && (
            <div className="storyboard-scene scene-acquire">
              <div className="acquire-card">
                <div className="acquire-card__left">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="acquire-img"
                    onError={(e) => handleImageError(e, getFallbackForCraft(product.craftTradition || product.category))}
                  />
                </div>

                <div className="acquire-card__right">
                  <span className="scene-eyebrow">SCENE 06 · ACQUIRE FOR YOUR COLLECTION</span>
                  <h2 className="acquire-title">{product.title}</h2>
                  <span className="acquire-artisan">Crafted by {product.artisan}</span>

                  <div className="acquire-price-display">
                    {product.isWomenSHG && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '999px',
                        background: '#FAF0EB',
                        border: '1px solid #E8C8BE',
                        color: '#8A2D19',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        marginBottom: '0.85rem'
                      }}>
                        <span>✦</span> {t('women_shg.badge')} · {product.shgName || t('women_shg.kasuti_coop')}
                      </div>
                    )}

                    {/* Story-Backed Transparent Pricing Breakdown */}
                    <div style={{
                      background: '#FDFBF7',
                      border: '1px solid #E5D8C4',
                      borderRadius: '8px',
                      padding: '0.9rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A7A66', fontWeight: 700 }}>
                          ✦ {t('product.pricing_title')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#5A8A48', fontWeight: 600 }}>GI Heritage Fair-Rate</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.84rem', color: '#4A4036' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{t('product.mat_cost')}:</span>
                          <strong>₹{(product.materialCost ?? Math.round(product.price * 0.25)).toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            {t('product.labor_cost')} ({product.laborHours ?? 24} hrs × ₹{product.skillRatePerHour ?? 120}/hr):
                          </span>
                          <strong>₹{((product.laborHours ?? 24) * (product.skillRatePerHour ?? 120)).toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{t('product.heritage_val')}:</span>
                          <strong>₹{(product.heritagePremium ?? Math.round(product.price * 0.15)).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px dashed #D6C7B2', marginTop: '0.55rem', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 700, color: '#1C160E' }}>
                        <span>{t('product.total_price')}:</span>
                        <span>₹{product.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Fair-Price Comparison: Machine-Made Lookalike Counter */}
                    <div style={{
                      background: '#FFF8F5',
                      border: '1px solid #F0D5CB',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      marginBottom: '1rem',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: '#9C3826' }}>
                          {t('product.lookalike_price')} ₹{(product.machineLookalikePrice ?? Math.round(product.price * 0.15)).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#F8D7DA', color: '#721C24', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                          Industrial Imitation
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#6A5445', lineHeight: 1.45 }}>
                        <strong>{t('product.lookalike_why')}:</strong> {product.machineLookalikeNotes || 'Industrial replicas use cheap synthetic dyes and automated powerlooms with knots and plastic filler. Authentic GI pieces use 100% handspun organic materials that endure for generations.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsProvenanceModalOpen(true)}
                      className="scene-wish-btn"
                      style={{ width: '100%', marginBottom: '1rem', padding: '0.65rem 1rem', background: '#F8F4EC', border: '1px solid #D6C7B2', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#8A2D19', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <span>✦</span>
                      <span>{t('product.provenance_btn')}</span>
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#5A564F' }}>
                        <span>Actual Price:</span>
                        <span>₹{totalActualPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#5A564F' }}>
                        <span>Platform Fee (5%):</span>
                        <span>₹{totalPlatformFee.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#5A564F' }}>
                        <span>Tax (5% GST):</span>
                        <span>₹{totalTax.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.6rem' }}>
                      <span className="price-num">₹{totalClientPrice.toLocaleString('en-IN')}</span>
                      <span className="shipping-note">Complimentary insured archival transit across India</span>
                    </div>
                  </div>

                  <div className="acquire-quantity-selector">
                    <label htmlFor="prod-qty">Select Quantity:</label>
                    <div className="qty-controls">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span id="prod-qty" className="qty-val">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="acquire-buttons">
                    <button
                      type="button"
                      className="acquire-cart-btn"
                      onClick={handleAddToCart}
                    >
                      <span>Add to Shopping Bag (₹{totalClientPrice.toLocaleString('en-IN')})</span>
                    </button>

                    <button
                      type="button"
                      className={`acquire-wish-btn ${isFavorited ? 'active' : ''}`}
                      onClick={() => toggleWishlist(product.id)}
                    >
                      {isFavorited ? '♥ In Your Wishlist' : '♡ Add to Wishlist'}
                    </button>

                    <Link
                      to={`/archive?focus=${product.id}`}
                      className="acquire-3d-btn"
                      title="Inspect piece in Curatorial Gallery Dossier"
                    >
                      <span>✦ Curatorial Exhibition Dossier</span>
                    </Link>
                  </div>

                  <div className="provenance-seal-card">
                    <div className="seal-icon">✦</div>
                    <div className="seal-text">
                      <strong>KAARIGAR Provenance Covenant:</strong> Proceeds (₹{totalActualPrice.toLocaleString('en-IN')}) are transferred directly to {product.artisan}’s guild account. The 5% platform fee (₹{totalPlatformFee.toLocaleString('en-IN')}) maintains archival documentation and digital preservation.
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Collection Pieces - Strictly Similar Items Only */}
              {relatedProducts.length > 0 && (
                <div className="related-crafts-section">
                  <h3 className="related-title">Similar Works in {product.craftTradition}</h3>
                  <div className="related-grid">
                    {relatedProducts.map((rel) => (
                      <Link key={rel.id} to={`/shop/${rel.id}`} className="related-card">
                        <img
                          src={rel.image}
                          alt={rel.title}
                          className="related-card__img"
                          onError={(e) => handleImageError(e, getFallbackForCraft(rel.craftTradition || rel.category))}
                        />
                        <div className="related-card__content">
                          <span className="related-card__tradition">{rel.craftTradition}</span>
                          <h4 className="related-card__title">{rel.title}</h4>
                          <span className="related-card__price">₹{rel.price.toLocaleString('en-IN')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD TECHNICAL SPECIFICATIONS VIEW */
        <div className="storyboard-specs-view">
          <div className="container" style={{ maxWidth: '1000px', padding: '3rem 1rem' }}>
            <div className="specs-full-grid">
              <div className="specs-full-media">
                <img
                  src={product.image}
                  alt={product.title}
                  className="specs-main-img"
                  onError={(e) => handleImageError(e, getFallbackForCraft(product.craftTradition || product.category))}
                />
              </div>

              <div className="specs-full-details">
                <span className="section-eyebrow">{product.craftTradition}</span>
                <h1 className="specs-main-title">{product.title}</h1>
                <span className="specs-artisan-line">By {product.artisan} · {product.atelier}</span>
                <div className="specs-price-tag">
                  ₹{clientPrice.toLocaleString('en-IN')}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted)' }}>
                    (₹{product.price.toLocaleString('en-IN')} base price + 5% platform fee + 5% GST)
                  </span>
                </div>

                <p className="specs-desc">{product.makingStory.summary}</p>

                <div className="specs-table-box" style={{ margin: '2rem 0' }}>
                  <div className="spec-row">
                    <span className="spec-label">Materials</span>
                    <span className="spec-value">{product.materials.join(', ')}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Dimensions</span>
                    <span className="spec-value">{product.dimensions}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Weight</span>
                    <span className="spec-value">{product.weight}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Technique</span>
                    <span className="spec-value">{product.technique}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Artisan Compensation</span>
                    <span className="spec-value highlight-green">Direct Transfer (₹{product.price.toLocaleString('en-IN')})</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Platform Maintenance Fee</span>
                    <span className="spec-value">5% (₹{platformFee.toLocaleString('en-IN')})</span>
                  </div>
                </div>

                <div className="acquire-buttons">
                  <button type="button" className="acquire-cart-btn" onClick={handleAddToCart}>
                    Add to Shopping Bag
                  </button>
                  <button
                    type="button"
                    className={`acquire-wish-btn ${isFavorited ? 'active' : ''}`}
                    onClick={() => toggleWishlist(product.id)}
                  >
                    {isFavorited ? '♥ Saved' : '♡ Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add To Bag Notification Toast */}
      {addedToast && (
        <div className="added-toast" role="alert">
          <span className="toast-icon">✓</span>
          <span className="toast-text">“{product.title}” added to your shopping bag</span>
        </div>
      )}
      {/* Scannable Provenance & Printable Tag Modal */}
      <ProvenanceTagModal
        craft={product}
        isOpen={isProvenanceModalOpen}
        onClose={() => setIsProvenanceModalOpen(false)}
      />
    </main>
  );
}
