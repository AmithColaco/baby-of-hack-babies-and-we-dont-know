import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useProducts, useArtisan } from '../data/productStore';
import type { CraftCategory, CraftObject } from '../types';
import {
  createListing,
  updateListing,
  publishListing,
  uploadListingImages,
  generateAIDraft,
  getPriceSuggestion,
  getCrafts,
  type PriceBreakdownResponse,
  type CraftReferenceRecord,
} from '../api/listings';

const PRESET_IMAGES = [
  { label: 'Kasuti Embroidery Saree Pallu', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Beedu Grass Mat Weaving', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Seashell Wall Hanging Lamp', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80' },
  { label: 'Jaipur Blue Pottery Urn', url: '/images/bluepottery.jpg' },
  { label: 'Channapatna Lacquer Wood', url: '/images/woodcraft.jpg' },
  { label: 'Bastar Lost-Wax Bronze', url: '/images/dhokra.jpg' },
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
  const [vernacularTitle] = useState(existingProduct?.vernacularTitle || '');
  const [craftTradition, setCraftTradition] = useState(existingProduct?.craftTradition || 'Kasuti');
  const [category, setCategory] = useState<CraftCategory>((existingProduct?.category as CraftCategory) || 'textiles');
  const [price, setPrice] = useState<number>(existingProduct?.price || 3800);
  const [directShare, setDirectShare] = useState<number>(existingProduct?.directArtisanSharePercent || 88);
  const [region] = useState(existingProduct?.region || profile.region || 'Ankola');
  const [state] = useState(existingProduct?.state || profile.state || 'Karnataka');
  const [atelier] = useState(existingProduct?.atelier || profile.atelier || 'Ankola Kasuti Mahila Kendra');
  const [artisanName] = useState(existingProduct?.artisan || profile.name || 'Parvati Devi');
  const [dimensions, setDimensions] = useState(existingProduct?.dimensions || '120 cm × 45 cm');
  const [hoursToMake, setHoursToMake] = useState<number>(14);
  const [materialsCost, setMaterialsCost] = useState<number>(650);
  const [techniqueComplexity, setTechniqueComplexity] = useState<'low' | 'medium' | 'high' | 'very_high'>('high');
  const [stock, setStock] = useState<number>(3);
  const [materialsStr, setMaterialsStr] = useState(
    existingProduct?.materials?.join(', ') || 'Handwoven Ilkal silk-cotton, Mercerised pure cotton threads, Natural dye indigo'
  );
  const [technique, setTechnique] = useState(existingProduct?.technique || 'Gavanti (double running stitch) and Muragi (zig-zag stitch)');
  const [imageUrl, setImageUrl] = useState(existingProduct?.image || PRESET_IMAGES[0].url);

  // Story & Making stages
  const [summary, setSummary] = useState(
    existingProduct?.makingStory?.summary ||
    'Counted thread geometric needlework continuing the heritage tradition of Uttara Kannada coastal temples.'
  );
  const [step1Title] = useState(existingProduct?.makingStory?.stages?.[0]?.title || 'Fabric Marking & Thread Warp Alignment');
  const [step1Desc, setStep1Desc] = useState(existingProduct?.makingStory?.stages?.[0]?.description || 'No tracing or pencil marks are used; the artisan counts every individual warp and weft thread by eye.');
  const [step2Title] = useState(existingProduct?.makingStory?.stages?.[1]?.title || 'Geometric Needle Illumination');
  const [step2Desc, setStep2Desc] = useState(existingProduct?.makingStory?.stages?.[1]?.description || 'Stitching gopura temple tower and chariot motifs using double running and cross stitches perfectly identical on front and back.');
  const [step3Title] = useState(existingProduct?.makingStory?.stages?.[2]?.title || 'Steam Curing & Hand Pressing');
  const [step3Desc, setStep3Desc] = useState(existingProduct?.makingStory?.stages?.[2]?.description || 'Gently steam pressed with natural linen cloths to set the pure cotton tension without knotting.');

  // AI Assistant State (F3 & F10)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');

  // Pricing Calculator State (F4)
  const [pricingBreakdown, setPricingBreakdown] = useState<PriceBreakdownResponse | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Craft Reference List
  const [craftsList, setCraftsList] = useState<CraftReferenceRecord[]>([]);

  // Form Submission
  const [showPreview, setShowPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Web Speech API reference
  const recognitionRef = useRef<any>(null);

  // Load craft references on mount
  useEffect(() => {
    async function loadCrafts() {
      try {
        const crafts = await getCrafts();
        setCraftsList(crafts);
      } catch (e) {
        console.warn('Could not load crafts list:', e);
      }
    }
    loadCrafts();
  }, []);

  // Web Speech API Voice Recognition (F10)
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your description in the box.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  // AI Listing Assistant Trigger (F3)
  const handleGenerateAIDraft = async () => {
    setAiLoading(true);
    setErrorMsg('');
    setAiSuccessMessage('');

    try {
      // If user uploaded real files, send them; otherwise provide empty array
      const filesToSend = selectedFiles.length > 0 ? selectedFiles : [];
      const draft = await generateAIDraft(filesToSend, craftTradition, voiceTranscript);

      if (draft.title) setTitle(draft.title);
      if (draft.description) setSummary(draft.description);
      if (draft.materials && draft.materials.length > 0) setMaterialsStr(draft.materials.join(', '));
      if (draft.technique) setTechnique(draft.technique);
      if (draft.story) setStep2Desc(draft.story);
      if (draft.suggested_price_range?.min && draft.suggested_price_range?.max) {
        const avg = Math.round((draft.suggested_price_range.min + draft.suggested_price_range.max) / 2);
        if (avg > 0) setPrice(avg);
      }

      setAiSuccessMessage('✓ AI Assistant drafted product details from your inputs! You can review and refine any field below.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'AI Assistant could not connect. You can manually enter your craft details.');
    } finally {
      setAiLoading(false);
    }
  };

  // Transparent Pricing Calculation (F4)
  const handleCalculatePrice = async () => {
    setPricingLoading(true);
    try {
      const breakdown = await getPriceSuggestion({
        craft_type: craftTradition,
        hours_to_make: Number(hoursToMake) || 1,
        materials_cost: Number(materialsCost) || 0,
        technique_complexity: techniqueComplexity,
      });
      setPricingBreakdown(breakdown);
    } catch (err: any) {
      console.warn('Price calculation failed:', err);
    } finally {
      setPricingLoading(false);
    }
  };

  const handleApplySuggestedPrice = () => {
    if (pricingBreakdown) {
      setPrice(Math.round(pricingBreakdown.suggested_price));
    }
  };

  // Submit Listing (Local + Backend)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !craftTradition.trim()) {
      setErrorMsg('Please enter both the piece title and the craft tradition');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const materialsArray = materialsStr
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    let backendId: string | null = null;

    try {
      // 1. Create on backend
      const created = await createListing({
        title: title.trim(),
        description: summary.trim(),
        craft_type: craftTradition.trim(),
        materials: materialsStr.trim(),
        technique: technique.trim(),
        dimensions: dimensions.trim(),
        hours_to_make: Number(hoursToMake) || 8,
        price_inr: Number(price) || 2500,
        stock: Number(stock) || 1,
      });
      backendId = created.id;

      // 2. Upload images if attached
      if (selectedFiles.length > 0) {
        try {
          await uploadListingImages(backendId, selectedFiles);
        } catch (imgErr) {
          console.warn('Image upload error:', imgErr);
        }
      }

      // 3. Publish on backend
      try {
        await publishListing(backendId);
      } catch (pubErr) {
        console.warn('Publish error:', pubErr);
      }
    } catch (backendErr) {
      console.warn('Backend listing creation fallback to local store:', backendErr);
    }

    const productId = backendId || (isEditing && id ? id : `craft-${Date.now().toString(36)}`);
    const accessionNo = existingProduct?.accessionNo || `KH-2026-${Math.floor(Math.random() * 900 + 100)}`;

    const newCraftObject: CraftObject = {
      id: productId,
      accessionNo,
      romanNumeral: existingProduct?.romanNumeral || 'VII',
      title: title.trim(),
      vernacularTitle: vernacularTitle.trim() || undefined,
      craftTradition: craftTradition.trim(),
      category: category === 'all' ? 'textiles' : (category as any),
      artisan: artisanName.trim() || profile.name,
      artisanTitle: existingProduct?.artisanTitle || 'Master Craftsman · Registered Living Heritage Lineage',
      atelier: atelier.trim() || profile.atelier,
      region: region.trim(),
      state: state.trim(),
      period: 'Living Coastal Lineage',
      price: Number(price) || 2500,
      currency: 'INR',
      availability: Number(stock) > 0 ? 'Available' : 'Reserved',
      dimensions: dimensions.trim() || 'Standard Atelier Sizing',
      weight: '1.2 kg',
      materials: materialsArray.length > 0 ? materialsArray : ['Authentic Coastal Materials'],
      technique: technique.trim() || `${craftTradition} canonical guild practice`,
      image: imageUrl || PRESET_IMAGES[0].url,
      makingStory: {
        summary: summary.trim(),
        stages: [
          { step: '01', title: step1Title.trim(), description: step1Desc.trim() },
          { step: '02', title: step2Title.trim(), description: step2Desc.trim() },
          { step: '03', title: step3Title.trim(), description: step3Desc.trim() },
        ],
      },
      artisanBio: profile.bio || `Preserving indigenous coastal mastercraft passed down through generations in ${region}.`,
      artisanQuote: 'In handcraft, time is not counted in minutes, but in strokes of devotion and living tradition.',
      directArtisanSharePercent: directShare,
      position3D: [0, 0, 0],
      modelType: (category as any) || 'textile',
      colorPalette: ['#A0522D', '#D2B48C', '#2E8B57', '#DEB887'],
    };

    if (isEditing && id) {
      try {
        await updateListing(id, {
          title: title.trim(),
          description: summary.trim(),
          craft_type: craftTradition.trim(),
          materials: materialsStr.trim(),
          technique: technique.trim(),
          dimensions: dimensions.trim(),
          hours_to_make: Number(hoursToMake) || 8,
          price_inr: Number(price) || 2500,
          stock: Number(stock) || 1,
        });
      } catch (e) {
        console.warn('Backend update failed:', e);
      }
      updateProduct(id, newCraftObject);
    } else {
      addProduct(newCraftObject);
    }

    setIsSubmitting(false);
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
              <span className="editor-eyebrow">कारिगर ARCHIVAL LISTING FORM · KALAYAAN</span>
              <h1 className="editor-title">
                {isEditing ? `Edit Masterpiece: ${title}` : 'Inscribe a New Craft Piece into the Living Archive'}
              </h1>
              <p className="editor-desc">
                Provide curatorial specifications, craft provenance, and fair pricing breakdown. 
                Use the AI assistant and fair wage calculator to streamline your listing.
              </p>

              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}
              {aiSuccessMessage && <div className="form-success-banner">{aiSuccessMessage}</div>}

              {/* ────────────────── AI LISTING ASSISTANT (F3 & F10) ────────────────── */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(232, 213, 183, 0.15) 0%, rgba(205, 133, 63, 0.08) 100%)',
                  border: '1px solid rgba(205, 133, 63, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#3d2b1f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✨</span>
                    <span>AI Listing Assistant (Gemini Multimodal)</span>
                  </h3>
                  <span style={{ fontSize: '0.75rem', background: '#e8d5b7', padding: '3px 8px', borderRadius: '4px', color: '#3d2b1f', fontWeight: 600 }}>
                    AI Vision & Voice
                  </span>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#6b5847', lineHeight: 1.5 }}>
                  Take photos of your piece and speak a quick description in your own words. The assistant will analyze the craft, suggest traditional techniques, and draft your listing.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: '#4a3b32' }}>
                      Upload Piece Photos (Max 4)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files) {
                          setSelectedFiles(Array.from(e.target.files).slice(0, 4));
                        }
                      }}
                      style={{ fontSize: '0.82rem', width: '100%' }}
                    />
                    {selectedFiles.length > 0 && (
                      <span style={{ fontSize: '0.78rem', color: '#2E8B57', marginTop: '4px', display: 'block' }}>
                        ✓ {selectedFiles.length} photo(s) selected
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4a3b32' }}>
                        Artisan Voice Description
                      </label>
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        style={{
                          background: isRecording ? '#dc3545' : '#8B4513',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{isRecording ? '⏹ Stop' : '🎙️ Speak (Voice)'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Handmade Kasuti pallu with temple tower design..."
                      value={voiceTranscript}
                      onChange={(e) => setVoiceTranscript(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAIDraft}
                  disabled={aiLoading}
                  className="dash-btn dash-btn--primary"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  {aiLoading ? '✨ Analyzing craft photo and generating draft...' : '✨ Generate Listing Draft with AI Assistant'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="listing-form">
                {/* 1. Identification */}
                <fieldset className="form-section">
                  <legend className="section-legend">01. Piece Identity & Craft Tradition</legend>

                  <div className="form-group">
                    <label htmlFor="craft-title">Masterpiece Title *</label>
                    <input
                      id="craft-title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Kasuti Embroidered Chariot & Peacock Saree"
                      className="form-input"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="craft-tradition">Craft Tradition *</label>
                      <select
                        id="craft-tradition"
                        value={craftTradition}
                        onChange={(e) => setCraftTradition(e.target.value)}
                        className="form-input"
                      >
                        <option value="Kasuti">Kasuti Embroidery</option>
                        <option value="Beedu">Beedu (Grass Mat Weaving)</option>
                        <option value="Shell Craft">Shell Craft</option>
                        <option value="Bidriware">Bidriware</option>
                        <option value="Terracotta">Coastal Terracotta</option>
                        <option value="Woodcraft">Channapatna Woodcraft</option>
                        {craftsList.map((c) => (
                          <option key={c.craft_type} value={c.craft_type}>
                            {c.craft_type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="craft-category">Catalogue Category</label>
                      <select
                        id="craft-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CraftCategory)}
                        className="form-input"
                      >
                        <option value="textiles">Textiles & Embroidery</option>
                        <option value="ceramics">Ceramics & Shellcraft</option>
                        <option value="metalcraft">Metalcraft & Brass</option>
                        <option value="woodcraft">Woodcraft & Lacquer</option>
                        <option value="paintings">Traditional Paintings</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                {/* 2. Materials, Technique & Dimensions */}
                <fieldset className="form-section">
                  <legend className="section-legend">02. Curatorial Materials & Technique</legend>

                  <div className="form-group">
                    <label htmlFor="craft-materials">Authentic Materials (Comma Separated)</label>
                    <input
                      id="craft-materials"
                      type="text"
                      value={materialsStr}
                      onChange={(e) => setMaterialsStr(e.target.value)}
                      placeholder="e.g. Pure Ilkal silk, Mercerised cotton thread, Natural Indigo dye"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="craft-technique">Handmade Technique</label>
                    <input
                      id="craft-technique"
                      type="text"
                      value={technique}
                      onChange={(e) => setTechnique(e.target.value)}
                      placeholder="e.g. Gavanti and Muragi counted thread geometry without knots"
                      className="form-input"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="craft-dimensions">Dimensions</label>
                      <input
                        id="craft-dimensions"
                        type="text"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        placeholder="e.g. 5.5m Saree with 80cm Pallu"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="craft-stock">Available Stock *</label>
                      <input
                        id="craft-stock"
                        type="number"
                        min="1"
                        max="99"
                        value={stock}
                        onChange={(e) => setStock(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* 3. Transparent Fair Pricing Calculator (F4) */}
                <fieldset className="form-section" style={{ background: '#faf6f0', padding: '18px', borderRadius: '8px' }}>
                  <legend className="section-legend">03. Transparent Pricing & Fair Wage Calculator</legend>
                  <p style={{ fontSize: '0.85rem', color: '#6b5847', marginTop: '-6px', marginBottom: '14px' }}>
                    Deterministic fair wage formula: <code>suggested_price = (materials_cost + hours × fair_hourly_wage) × craft_premium + platform_fee</code>.
                  </p>

                  <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label htmlFor="hours-to-make">Hours of Labour</label>
                      <input
                        id="hours-to-make"
                        type="number"
                        min="1"
                        step="0.5"
                        value={hoursToMake}
                        onChange={(e) => setHoursToMake(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="materials-cost">Materials Cost (₹)</label>
                      <input
                        id="materials-cost"
                        type="number"
                        min="0"
                        step="50"
                        value={materialsCost}
                        onChange={(e) => setMaterialsCost(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="tech-complexity">Technique Complexity</label>
                      <select
                        id="tech-complexity"
                        value={techniqueComplexity}
                        onChange={(e) => setTechniqueComplexity(e.target.value as any)}
                        className="form-input"
                      >
                        <option value="low">Low (-0.1)</option>
                        <option value="medium">Medium (Base)</option>
                        <option value="high">High (+0.15)</option>
                        <option value="very_high">Masterwork (+0.30)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleCalculatePrice}
                      disabled={pricingLoading}
                      className="dash-btn dash-btn--secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {pricingLoading ? 'Calculating...' : 'Calculate Fair Price Breakdown'}
                    </button>
                    {pricingBreakdown && (
                      <button
                        type="button"
                        onClick={handleApplySuggestedPrice}
                        className="dash-btn dash-btn--primary"
                        style={{ fontSize: '0.85rem', backgroundColor: '#2E8B57' }}
                      >
                        Apply Suggested ₹{Math.round(pricingBreakdown.suggested_price)}
                      </button>
                    )}
                  </div>

                  {pricingBreakdown && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #d4c5b3',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                        <div><strong>Materials:</strong> ₹{pricingBreakdown.materials_cost}</div>
                        <div><strong>Labour ({pricingBreakdown.hours}h @ ₹{pricingBreakdown.fair_hourly_wage}/h):</strong> ₹{pricingBreakdown.labour_cost}</div>
                        <div><strong>Multiplier:</strong> {pricingBreakdown.craft_premium_multiplier}x</div>
                        <div><strong>Suggested:</strong> <span style={{ color: '#8B4513', fontWeight: 'bold' }}>₹{pricingBreakdown.suggested_price}</span></div>
                      </div>
                      <div style={{ color: '#555', fontStyle: 'italic' }}>
                        {pricingBreakdown.reasoning} (Fair range: ₹{pricingBreakdown.suggested_range.min} - ₹{pricingBreakdown.suggested_range.max})
                      </div>
                    </div>
                  )}

                  <div className="form-grid-2" style={{ marginTop: '14px' }}>
                    <div className="form-group">
                      <label htmlFor="craft-price">Final Selling Price (₹ INR) *</label>
                      <input
                        id="craft-price"
                        type="number"
                        required
                        min="100"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="direct-share">Artisan Direct Share (%)</label>
                      <input
                        id="direct-share"
                        type="number"
                        min="70"
                        max="100"
                        value={directShare}
                        onChange={(e) => setDirectShare(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* 4. Provenance & Living Story */}
                <fieldset className="form-section">
                  <legend className="section-legend">04. Living Provenance & Making Story</legend>

                  <div className="form-group">
                    <label htmlFor="craft-summary">Story & Cultural Origin</label>
                    <textarea
                      id="craft-summary"
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="step-1-desc">Stage 1: Raw Materials Preparation</label>
                    <input
                      id="step-1-desc"
                      type="text"
                      value={step1Desc}
                      onChange={(e) => setStep1Desc(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="step-2-desc">Stage 2: Handcrafting & Geometry</label>
                    <input
                      id="step-2-desc"
                      type="text"
                      value={step2Desc}
                      onChange={(e) => setStep2Desc(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="step-3-desc">Stage 3: Inspection & Certification</label>
                    <input
                      id="step-3-desc"
                      type="text"
                      value={step3Desc}
                      onChange={(e) => setStep3Desc(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </fieldset>

                {/* 5. Visual Preset or Upload */}
                <fieldset className="form-section">
                  <legend className="section-legend">05. Primary Display Image</legend>
                  <div className="form-group">
                    <label htmlFor="image-url">Image URL</label>
                    <input
                      id="image-url"
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.label}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        style={{
                          fontSize: '0.75rem',
                          background: imageUrl === img.url ? '#8B4513' : '#e8d5b7',
                          color: imageUrl === img.url ? '#fff' : '#3d2b1f',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="form-actions-bar" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="dash-btn dash-btn--primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
                  >
                    {isSubmitting ? 'Publishing to Living Archive...' : isEditing ? 'Update Masterpiece' : 'Inscribe & Publish Masterpiece'}
                  </button>
                  <Link to="/dashboard" className="dash-btn dash-btn--secondary" style={{ padding: '14px 20px' }}>
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Customer Preview Sidebar */}
          {showPreview && (
            <div className="editor-preview-col" style={{ width: '380px', flexShrink: 0 }}>
              <div className="editor-card" style={{ position: 'sticky', top: '20px' }}>
                <span className="editor-eyebrow">LIVE CUSTOMER DOSSIER</span>
                <img
                  src={imageUrl}
                  alt={title}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', margin: '12px 0' }}
                />
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>{title || 'Untitled Masterpiece'}</h3>
                <span style={{ fontSize: '0.8rem', color: '#8B4513', fontWeight: 600 }}>{craftTradition} · {region}</span>
                <p style={{ fontSize: '0.85rem', color: '#555', margin: '10px 0', lineHeight: 1.4 }}>
                  {summary || 'Curatorial description will appear here.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #e0d6c8', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Fair Price</span>
                    <strong style={{ fontSize: '1.25rem', color: '#3d2b1f' }}>₹{Number(price).toLocaleString('en-IN')}</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '4px' }}>
                    88% Direct to Maker
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
