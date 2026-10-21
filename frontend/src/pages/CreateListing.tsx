import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useProducts, useArtisan } from '../data/productStore';
import type { CraftCategory, CraftObject } from '../types';

const PRESET_IMAGES = [
  { label: 'Pahari Miniature Painting', url: '/images/pahari.jpg' },
  { label: 'Jaipur Blue Pottery Urn', url: '/images/bluepottery.jpg' },
  { label: 'Chanderi Handwoven Silk', url: '/images/textile.jpg' },
  { label: 'Bastar Lost-Wax Bronze', url: '/images/dhokra.jpg' },
  { label: 'Channapatna Lacquer Wood', url: '/images/woodcraft.jpg' },
  { label: 'Kundan Meenakari Jewel', url: '/images/jewellery.jpg' },
];

export default function CreateListing() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useProducts();
  const { profile } = useArtisan();

  const isEditing = Boolean(id);
  const existingProduct = isEditing ? products.find((p) => p.id === id) : undefined;

  // Form Fields
  const [title, setTitle] = useState(existingProduct?.title || '');
  const [vernacularTitle, setVernacularTitle] = useState(existingProduct?.vernacularTitle || '');
  const [craftTradition, setCraftTradition] = useState(existingProduct?.craftTradition || '');
  const [category, setCategory] = useState<CraftCategory>((existingProduct?.category as CraftCategory) || 'paintings');
  const [price, setPrice] = useState<number>(existingProduct?.price || 28000);
  const [directShare, setDirectShare] = useState<number>(existingProduct?.directArtisanSharePercent || 88);
  const [region, setRegion] = useState(existingProduct?.region || profile.region || 'Kangra Valley');
  const [state, setState] = useState(existingProduct?.state || profile.state || 'Himachal Pradesh');
  const [atelier, setAtelier] = useState(existingProduct?.atelier || profile.atelier || 'Chamba Parampara Gurukulam');
  const [artisanName, setArtisanName] = useState(existingProduct?.artisan || profile.name || 'Pandit Ram Swaroop Sharma');
  const [dimensions, setDimensions] = useState(existingProduct?.dimensions || '32.0 cm × 24.5 cm');
  const [weight, setWeight] = useState(existingProduct?.weight || '1.8 kg');
  const [materialsStr, setMaterialsStr] = useState(existingProduct?.materials?.join(', ') || 'Wasli paper, Lapis lazuli, Malachite, 24K Gold foil');
  const [imageUrl, setImageUrl] = useState(existingProduct?.image || '/images/pahari.jpg');

  // Story & Making stages
  const [summary, setSummary] = useState(
    existingProduct?.makingStory?.summary ||
    'Crafted through meticulous traditional methods preserving centuries of sacred material memory.'
  );
  const [step1Title, setStep1Title] = useState(existingProduct?.makingStory?.stages?.[0]?.title || 'Material Gathering & Raw Compounding');
  const [step1Desc, setStep1Desc] = useState(existingProduct?.makingStory?.stages?.[0]?.description || 'Natural earth and mineral pigments are gathered from indigenous geological sites and ground by hand.');
  const [step2Title, setStep2Title] = useState(existingProduct?.makingStory?.stages?.[1]?.title || 'Precision Handcrafting');
  const [step2Desc, setStep2Desc] = useState(existingProduct?.makingStory?.stages?.[1]?.description || 'Using time-honored artisanal tools passed down through generations without artificial machinery.');
  const [step3Title, setStep3Title] = useState(existingProduct?.makingStory?.stages?.[2]?.title || 'Final Burnish & Curing');
  const [step3Desc, setStep3Desc] = useState(existingProduct?.makingStory?.stages?.[2]?.description || 'Sealed with organic resin or burnished with agate stone to attain a permanent archival luster.');

  // Live preview drawer
  const [showPreview, setShowPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (existingProduct) {
      setTitle(existingProduct.title);
      setVernacularTitle(existingProduct.vernacularTitle || '');
      setCraftTradition(existingProduct.craftTradition);
      setCategory(existingProduct.category as CraftCategory);
      setPrice(existingProduct.price);
      setDirectShare(existingProduct.directArtisanSharePercent || 88);
      setRegion(existingProduct.region);
      setState(existingProduct.state);
      setAtelier(existingProduct.atelier);
      setArtisanName(existingProduct.artisan);
      setDimensions(existingProduct.dimensions);
      setWeight(existingProduct.weight);
      setMaterialsStr(existingProduct.materials?.join(', ') || '');
      setImageUrl(existingProduct.image);
      setSummary(existingProduct.makingStory?.summary || '');
      if (existingProduct.makingStory?.stages?.[0]) {
        setStep1Title(existingProduct.makingStory.stages[0].title);
        setStep1Desc(existingProduct.makingStory.stages[0].description);
      }
      if (existingProduct.makingStory?.stages?.[1]) {
        setStep2Title(existingProduct.makingStory.stages[1].title);
        setStep2Desc(existingProduct.makingStory.stages[1].description);
      }
      if (existingProduct.makingStory?.stages?.[2]) {
        setStep3Title(existingProduct.makingStory.stages[2].title);
        setStep3Desc(existingProduct.makingStory.stages[2].description);
      }
    }
  }, [existingProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !craftTradition.trim()) {
      setErrorMsg('Please enter both the piece title and the craft tradition');
      return;
    }

    const materialsArray = materialsStr
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const productId = isEditing && id ? id : `craft-${Date.now().toString(36)}`;
    const accessionNo = existingProduct?.accessionNo || `KG-2026-${Math.floor(Math.random() * 900 + 100)}`;

    const newCraftObject: CraftObject = {
      id: productId,
      accessionNo,
      romanNumeral: existingProduct?.romanNumeral || 'VII',
      title: title.trim(),
      vernacularTitle: vernacularTitle.trim() || undefined,
      craftTradition: craftTradition.trim(),
      category: category === 'all' ? 'paintings' : (category as any),
      artisan: artisanName.trim() || profile.name,
      artisanTitle: existingProduct?.artisanTitle || 'Master Craftsman · Registered Living Heritage Lineage',
      atelier: atelier.trim() || profile.atelier,
      region: region.trim(),
      state: state.trim(),
      period: 'Living Contemporary Lineage',
      price: Number(price) || 15000,
      currency: 'INR',
      availability: 'Available',
      dimensions: dimensions.trim() || 'Standard Atelier Sizing',
      weight: weight.trim() || '1.5 kg',
      materials: materialsArray.length > 0 ? materialsArray : ['Natural Mineral Pigments', 'Pure Handcrafted Base'],
      technique: `${craftTradition} canonical guild practice`,
      image: imageUrl || '/images/pahari.jpg',
      makingStory: {
        summary: summary.trim(),
        stages: [
          { step: '01', title: step1Title.trim(), description: step1Desc.trim() },
          { step: '02', title: step2Title.trim(), description: step2Desc.trim() },
          { step: '03', title: step3Title.trim(), description: step3Desc.trim() },
        ],
      },
      artisanBio: profile.bio || 'Preserving indigenous mastercraft passed down through family generations.',
      artisanQuote: 'In handcraft, time is not counted in minutes, but in strokes of devotion.',
      directArtisanSharePercent: directShare,
      position3D: [0, 0, 0],
      modelType: (category as any) || 'pottery',
      colorPalette: ['#1C2E4A', '#E2A838', '#8A2D23', '#2D5A3A'],
    };

    if (isEditing && id) {
      updateProduct(id, newCraftObject);
    } else {
      addProduct(newCraftObject);
    }

    // Navigate to the newly created piece's public storyboard!
    navigate(`/shop/${productId}`);
  };

  return (
    <main className="listing-editor-page" role="main" aria-label="Craft Piece Editor">
      <div className="listing-editor-page__inner">
        {/* Header Breadcrumb */}
        <div className="editor-topbar">
          <Link to="/dashboard" className="editor-back-link">
            ← Back to Atelier Dashboard
          </Link>
          <div className="editor-topbar__actions">
            <button
              type="button"
              className="preview-toggle-btn"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Live Preview' : 'View Live Customer Preview'}
            </button>
          </div>
        </div>

        <div className="editor-main-layout">
          {/* Main Form Form */}
          <div className="editor-form-col">
            <div className="editor-card">
              <span className="editor-eyebrow">ARCHIVAL LISTING FORM</span>
              <h1 className="editor-title">
                {isEditing ? `Edit Masterpiece: ${title}` : 'Inscribe a New Craft Piece into the Archive'}
              </h1>
              <p className="editor-desc">
                Provide comprehensive curatorial specifications and the step-by-step making process. 
                This information directly populates the customer’s interactive storyboard experience.
              </p>

              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}

              <form onSubmit={handleSubmit} className="listing-form">
                {/* 1. Identification */}
                <fieldset className="form-section">
                  <legend className="section-legend">01. Piece Identity & Discipline</legend>

                  <div className="form-group">
                    <label htmlFor="craft-title">Masterpiece Title *</label>
                    <input
                      id="craft-title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Cobalt Meena Arabesque Lotus Urn"
                      className="form-input"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="craft-vernacular">Vernacular Title (Hindi / Regional Script)</label>
                      <input
                        id="craft-vernacular"
                        type="text"
                        value={vernacularTitle}
                        onChange={(e) => setVernacularTitle(e.target.value)}
                        placeholder="e.g. जयपुर नीली मृद्भाण्ड"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="craft-category">Primary Craft Discipline *</label>
                      <select
                        id="craft-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CraftCategory)}
                        className="form-select"
                      >
                        <option value="paintings">Paintings & Miniature Wasli</option>
                        <option value="ceramics">Glazed Quartz Blue Pottery</option>
                        <option value="textiles">Handwoven Silk & Brocades</option>
                        <option value="metalcraft">Lost-Wax Bronze & Bidri</option>
                        <option value="woodcraft">Lathe-Turned Lacquer Wood</option>
                        <option value="jewellery">Kundan & Meenakari Enamel</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="craft-tradition">Specific Tradition / Lineage *</label>
                    <input
                      id="craft-tradition"
                      type="text"
                      required
                      value={craftTradition}
                      onChange={(e) => setCraftTradition(e.target.value)}
                      placeholder="e.g. Jaipur Glazed Quartz Faience or Bastar Lost-Wax"
                      className="form-input"
                    />
                  </div>
                </fieldset>

                {/* 2. Commercials & Direct Payout */}
                <fieldset className="form-section">
                  <legend className="section-legend">02. Value & Direct Artisan Guarantee</legend>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="craft-price">Acquisition Value (₹ INR) *</label>
                      <input
                        id="craft-price"
                        type="number"
                        min={100}
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="craft-share">Direct Artisan Payout: <strong>{directShare}%</strong></label>
                      <input
                        id="craft-share"
                        type="range"
                        min={80}
                        max={95}
                        value={directShare}
                        onChange={(e) => setDirectShare(Number(e.target.value))}
                        className="form-range"
                      />
                      <span className="form-hint">
                        Artisan receives <strong>₹{Math.round(price * directShare / 100).toLocaleString('en-IN')}</strong> directly upon collector delivery.
                      </span>
                    </div>
                  </div>
                </fieldset>

                {/* 3. Provenance & Artisan Info */}
                <fieldset className="form-section">
                  <legend className="section-legend">03. Provenance & Origin Details</legend>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="craft-artisan">Master Artisan Name *</label>
                      <input
                        id="craft-artisan"
                        type="text"
                        required
                        value={artisanName}
                        onChange={(e) => setArtisanName(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="craft-atelier">Atelier / Workshop *</label>
                      <input
                        id="craft-atelier"
                        type="text"
                        required
                        value={atelier}
                        onChange={(e) => setAtelier(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="craft-region">Valley / District *</label>
                      <input
                        id="craft-region"
                        type="text"
                        required
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="craft-state">State *</label>
                      <input
                        id="craft-state"
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* 4. Physical Specifications */}
                <fieldset className="form-section">
                  <legend className="section-legend">04. Physical Dimensions & Materials</legend>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="craft-dim">Dimensions</label>
                      <input
                        id="craft-dim"
                        type="text"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        placeholder="e.g. 38.0 cm Height × 22.5 cm Diameter"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="craft-weight">Net Weight</label>
                      <input
                        id="craft-weight"
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 3.6 kg"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="craft-materials">Key Materials (Comma separated) *</label>
                    <input
                      id="craft-materials"
                      type="text"
                      required
                      value={materialsStr}
                      onChange={(e) => setMaterialsStr(e.target.value)}
                      placeholder="e.g. Ground Quartz Rock, Cobalt Oxide, Katira Gum, Borax Glaze"
                      className="form-input"
                    />
                  </div>
                </fieldset>

                {/* 5. Imagery */}
                <fieldset className="form-section">
                  <legend className="section-legend">05. Archival Photography</legend>

                  <div className="preset-image-picker">
                    <span className="preset-label">Choose Authentic Preset Imagery:</span>
                    <div className="preset-thumbnails">
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          className={`preset-thumb-btn ${imageUrl === preset.url ? 'active' : ''}`}
                          onClick={() => setImageUrl(preset.url)}
                        >
                          <img src={preset.url} alt={preset.label} />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label htmlFor="craft-image-url">Or Custom Image URL</label>
                    <input
                      id="craft-image-url"
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="/images/pahari.jpg or https://..."
                      className="form-input"
                    />
                  </div>
                </fieldset>

                {/* 6. The Making Story */}
                <fieldset className="form-section">
                  <legend className="section-legend">06. The Making Story & Interactive Steps</legend>

                  <div className="form-group">
                    <label htmlFor="craft-summary">Curatorial Summary *</label>
                    <textarea
                      id="craft-summary"
                      rows={3}
                      required
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  <div className="stages-form-stack">
                    <div className="stage-input-box">
                      <span className="stage-tag">STAGE 01</span>
                      <div className="form-group">
                        <label>Stage 01 Title</label>
                        <input
                          type="text"
                          value={step1Title}
                          onChange={(e) => setStep1Title(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Stage 01 Description</label>
                        <textarea
                          rows={2}
                          value={step1Desc}
                          onChange={(e) => setStep1Desc(e.target.value)}
                          className="form-textarea"
                        />
                      </div>
                    </div>

                    <div className="stage-input-box">
                      <span className="stage-tag">STAGE 02</span>
                      <div className="form-group">
                        <label>Stage 02 Title</label>
                        <input
                          type="text"
                          value={step2Title}
                          onChange={(e) => setStep2Title(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Stage 02 Description</label>
                        <textarea
                          rows={2}
                          value={step2Desc}
                          onChange={(e) => setStep2Desc(e.target.value)}
                          className="form-textarea"
                        />
                      </div>
                    </div>

                    <div className="stage-input-box">
                      <span className="stage-tag">STAGE 03</span>
                      <div className="form-group">
                        <label>Stage 03 Title</label>
                        <input
                          type="text"
                          value={step3Title}
                          onChange={(e) => setStep3Title(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Stage 03 Description</label>
                        <textarea
                          rows={2}
                          value={step3Desc}
                          onChange={(e) => setStep3Desc(e.target.value)}
                          className="form-textarea"
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* Submit Controls */}
                <div className="editor-submit-row">
                  <button type="submit" className="dash-btn dash-btn--primary" id="listing-publish">
                    <span>{isEditing ? 'Save Changes' : 'Publish to Curatorial Marketplace'}</span>
                    <span className="arrow">→</span>
                  </button>

                  <Link to="/dashboard" className="dash-btn dash-btn--ghost">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Live Customer Preview Column */}
          {showPreview && (
            <div className="editor-preview-col">
              <div className="preview-sticky-card">
                <div className="preview-header">
                  <span className="preview-badge">LIVE CUSTOMER PREVIEW</span>
                  <span className="preview-note">As it appears in Collection</span>
                </div>

                <div className="shop-craft-card preview-craft-card">
                  <div className="shop-craft-card__media">
                    <img src={imageUrl || '/images/pahari.jpg'} alt={title} className="craft-card-img" />
                    <div className="craft-payout-pill">
                      <span>{directShare}% Direct Payout</span>
                    </div>
                  </div>

                  <div className="shop-craft-card__body">
                    <div className="card-top-meta">
                      <span className="card-tradition">{craftTradition || 'Craft Tradition'}</span>
                      <span className="card-region">{region}</span>
                    </div>
                    <h3 className="card-title">{title || 'Untitled Masterpiece'}</h3>
                    {vernacularTitle && <span className="card-vernacular">{vernacularTitle}</span>}
                    <p className="card-artisan-by">By <strong>{artisanName}</strong></p>
                    <div className="card-price-row">
                      <div className="card-price">
                        <span className="cur">₹</span>
                        <span className="val">{price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <span className="card-btn-story">Discover Story →</span>
                      <span className="card-btn-cart">Add to Bag</span>
                    </div>
                  </div>
                </div>

                <div className="preview-storyboard-hint">
                  <strong>Interactive Storyboard will also generate:</strong>
                  <ul>
                    <li>✓ Scene 01: High-res object presentation</li>
                    <li>✓ Scene 02: Artisan bio & atelier lineage</li>
                    <li>✓ Scene 03: Materials breakdown ({materialsStr.slice(0, 30)}…)</li>
                    <li>✓ Scene 04: 3-Stage Making process ({step1Title})</li>
                    <li>✓ Scene 05: Archival dimensions ({dimensions})</li>
                    <li>✓ Scene 06: Direct acquisition & provenance seal</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
