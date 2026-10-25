import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { VoiceInputField, BigButton } from '../components/artisan';
import type { CommissionRequest } from '../types';

// Pre-configured demo requests for authenticated demo users
const DEMO_COMMISSIONS: CommissionRequest[] = [
  {
    id: 'comm-kasuti-01',
    buyer_name: 'Ananya Rao',
    buyer_phone: '+91 98450 12345',
    craft_tradition: 'Dharwad Kasuti Hand Embroidery',
    description: 'Custom bridal Ilkal saree in royal deep madder red with double-pallu chariot gopura motifs and zero knots on reverse.',
    target_budget: 6500,
    deadline: '2026-11-20',
    status: 'QUOTED',
    created_at: '2026-10-22T10:00:00Z',
    quotes: [
      {
        id: 'quote-01',
        request_id: 'comm-kasuti-01',
        artisan_id: 'artisan-parvatamma',
        artisan_name: 'Parvatamma Badiger (Mahila Utkarsha Sangha)',
        artisan_phone: '+91 94481 22334',
        estimated_price: 5800,
        estimated_days: 24,
        material_breakdown: 'Handloom Ilkal pure silk warp (₹1,800), untwisted resham floss (₹650), master double-running stitch labor 36 hrs (₹3,350)',
        quote_notes: 'We can weave the double chariot motif as requested. Our women guild members will count threads under natural daylight. Knotless guarantee.',
        status: 'PENDING',
        created_at: '2026-10-23T14:30:00Z'
      }
    ]
  },
  {
    id: 'comm-dhokra-02',
    buyer_name: 'Vikramaditya Mehta',
    buyer_phone: '+91 98200 87654',
    craft_tradition: 'Bastar Dhokra Lost-Wax Metalcraft',
    description: 'Bespoke ceremonial bull figurine with spiral horn filigree and ceremonial saddle bells, approx 35 cm height.',
    target_budget: 38000,
    deadline: '2026-12-05',
    status: 'OPEN',
    created_at: '2026-10-24T08:15:00Z',
    quotes: []
  }
];

const LOCAL_STORAGE_KEY = 'kalahaat_custom_commissions';

export default function CustomCommissions() {
  const { t } = useTranslation();
  const { user, isLoggedIn, isArtisan } = useAuth();

  // Load locally saved commissions
  const [commissions, setCommissions] = useState<CommissionRequest[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Default to create tab if not logged in; browse tab if logged in
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('create');

  // Form State
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');
  const [craftTradition, setCraftTradition] = useState('Dharwad Kasuti Hand Embroidery');
  const [description, setDescription] = useState('');
  const [targetBudget, setTargetBudget] = useState<number | ''>(5000);
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize form when user signs in
  useEffect(() => {
    if (user?.name) setBuyerName(user.name);
    if (user?.phone) setBuyerPhone(user.phone);
  }, [user]);

  // Load from backend API if authenticated
  useEffect(() => {
    let isMounted = true;
    if (isLoggedIn) {
      axios.get('http://localhost:8000/commissions')
        .then((res) => {
          if (isMounted && Array.isArray(res.data)) {
            setCommissions((prev) => {
              const ids = new Set(res.data.map((c: any) => c.id));
              const localUnsaved = prev.filter((s) => !ids.has(s.id));
              return [...res.data, ...localUnsaved];
            });
          }
        })
        .catch(() => {
          // Offline / local mode
        });
    }
    return () => { isMounted = false; };
  }, [isLoggedIn]);

  // Filter commissions strictly by authentication identity
  const visibleCommissions = useMemo(() => {
    if (!isLoggedIn) {
      // Logged out visitors NEVER see other people's private commission requests
      return commissions.filter(c => buyerPhone && c.buyer_phone === buyerPhone);
    }

    if (isArtisan) {
      // Certified master artisans can see open inquiries waiting for quotes
      const allArtisanPool = [...commissions, ...DEMO_COMMISSIONS];
      const seen = new Set<string>();
      return allArtisanPool.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return c.status === 'OPEN' || c.quotes?.some(q => q.artisan_id === user?.id);
      });
    }

    // Authenticated Patron / Collector: ONLY see commissions belonging to this user
    const userPool = [...commissions];
    if (user?.name === 'Ananya Rao' || user?.phone === '+91 98450 12345') {
      userPool.push(DEMO_COMMISSIONS[0]);
    }
    if (user?.name === 'Vikramaditya Mehta' || user?.phone === '+91 98200 87654') {
      userPool.push(DEMO_COMMISSIONS[1]);
    }

    const seen = new Set<string>();
    return userPool.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      const phoneMatch = user?.phone && c.buyer_phone === user.phone;
      const nameMatch = user?.name && c.buyer_name?.trim().toLowerCase() === user.name.trim().toLowerCase();
      const idMatch = user?.id && (c as any).buyer_id === user.id;
      return phoneMatch || nameMatch || idMatch;
    });
  }, [commissions, isLoggedIn, isArtisan, user, buyerPhone]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const newRequest: CommissionRequest = {
      id: `comm-${Date.now()}`,
      buyer_name: buyerName || user?.name || 'Patron',
      buyer_phone: buyerPhone || user?.phone || '',
      craft_tradition: craftTradition,
      description,
      target_budget: targetBudget ? Number(targetBudget) : undefined,
      deadline: deadline || undefined,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      quotes: []
    };

    try {
      await axios.post('http://localhost:8000/commissions', {
        buyer_name: newRequest.buyer_name,
        buyer_phone: newRequest.buyer_phone,
        craft_tradition: craftTradition,
        description,
        target_budget: targetBudget ? Number(targetBudget) : undefined,
        deadline: deadline || undefined,
      });
    } catch {
      // Local fallback
    }

    const updated = [newRequest, ...commissions];
    setCommissions(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage quota fallback
    }

    setIsSubmitting(false);
    setSuccessMsg('Your custom commission inquiry has been broadcasted to verified master artisans! You will receive quotes with material breakdowns shortly.');
    
    // Reset form
    setDescription('');
    setTargetBudget(5000);
    setDeadline('');
    setTimeout(() => {
      setActiveTab('browse');
      setSuccessMsg('');
    }, 2000);
  };

  const handleAcceptQuote = async (requestId: string, quoteId: string) => {
    try {
      await axios.patch(`http://localhost:8000/commissions/quotes/${quoteId}/accept`);
    } catch {
      // Offline fallback
    }

    setCommissions(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'ACCEPTED' as const,
            quotes: req.quotes?.map(q => q.id === quoteId ? { ...q, status: 'ACCEPTED' as const } : q)
          };
        }
        return req;
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // quota fallback
      }
      return updated;
    });
  };

  // 3-step Artisan Quote Flow State (Rule 11)
  const [quotingCommId, setQuotingCommId] = useState<string | null>(null);
  const [quoteStep, setQuoteStep] = useState<1 | 2 | 3>(1);
  const [quotePrice, setQuotePrice] = useState<number | ''>(5000);
  const [quoteDays, setQuoteDays] = useState<number>(14);
  const [quoteNote, setQuoteNote] = useState<string>('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const handleSendArtisanQuote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quotingCommId || !quotePrice) return;
    setSubmittingQuote(true);
    const newQuote = {
      id: `quote-${Date.now()}`,
      request_id: quotingCommId,
      artisan_id: user?.id || 'artisan-current',
      artisan_name: user?.name || 'Master Artisan',
      artisan_phone: user?.phone || '+91 94481 22334',
      estimated_price: Number(quotePrice),
      estimated_days: Number(quoteDays),
      material_breakdown: 'Handmade materials & pure traditional craft technique',
      quote_notes: quoteNote || 'I can make this bespoke craft piece to your specifications.',
      status: 'PENDING' as const,
      created_at: new Date().toISOString()
    };

    try {
      await axios.post(`http://localhost:8000/commissions/${quotingCommId}/quote`, {
        quoted_price: Number(quotePrice),
        estimated_days: Number(quoteDays),
        materials_description: 'Handmade materials & pure technique',
        notes: quoteNote || 'I can make this bespoke craft piece to your specifications.',
      });
    } catch {
      // offline/demo fallback
    }

    setCommissions(prev => {
      const updated = prev.map(c => {
        if (c.id === quotingCommId) {
          return {
            ...c,
            status: 'QUOTED' as const,
            quotes: [...(c.quotes || []), newQuote]
          };
        }
        return c;
      });
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    setSubmittingQuote(false);
    setQuotingCommId(null);
    setQuoteStep(1);
    setQuoteNote('');
  };

  return (
    <main className="commissions-page">
      <div className="commissions-container">
        {/* Breadcrumb & Header */}
        <div>
          <Link to="/gallery" className="commissions-breadcrumb">
            ← Return to Curatorial Gallery
          </Link>
          <div className="commissions-header">
            <div>
              <span className="commissions-eyebrow">
                ✦ DIRECT ARTISAN PATRONAGE
              </span>
              <h1 className="commissions-title">
                {t('commissions.title')}
              </h1>
              <p className="commissions-subtitle">
                {t('commissions.subtitle')}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="commissions-tab-group">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`commissions-tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
              >
                {!isLoggedIn
                  ? 'My Commissions (Sign In Required)'
                  : isArtisan
                  ? `Guild Inquiries (${visibleCommissions.length})`
                  : `My Quotes & Requests (${visibleCommissions.length})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`commissions-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              >
                + {t('commissions.tab_request')}
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: New Commission Form */}
        {activeTab === 'create' && (
          <div className="commissions-form-card">
            <h2>Submit a Bespoke Commission</h2>
            <p>
              Our guild will route your request to certified master artisans and women-led cooperatives in the relevant geographical indication cluster.
            </p>

            {successMsg && (
              <div className="commissions-alert-success">
                ✓ {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="commissions-alert-error">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateRequest}>
              <div className="commissions-form-grid-2">
                <div className="commissions-form-group">
                  <label className="commissions-label">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Radhika Sundaram"
                    className="commissions-input"
                  />
                </div>

                <div className="commissions-form-group">
                  <label className="commissions-label">
                    Phone / WhatsApp Contact *
                  </label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="e.g. +91 98450 00000"
                    className="commissions-input"
                  />
                </div>
              </div>

              <div className="commissions-form-grid-3">
                <div className="commissions-form-group">
                  <label className="commissions-label">
                    Craft Tradition *
                  </label>
                  <select
                    value={craftTradition}
                    onChange={(e) => setCraftTradition(e.target.value)}
                    className="commissions-select"
                  >
                    <option value="Dharwad Kasuti Hand Embroidery">Dharwad Kasuti Embroidery (Women SHG)</option>
                    <option value="Handwoven Chanderi Brocade">Handwoven Chanderi Brocade</option>
                    <option value="Bastar Dhokra Lost-Wax Metalcraft">Bastar Dhokra Lost-Wax Metalcraft</option>
                    <option value="Jaipur Blue Pottery">Jaipur Blue Pottery</option>
                    <option value="Channapatna Lathe-Turned Woodcraft">Channapatna Lathe Woodcraft</option>
                    <option value="Jaipur Royal Kundan & Meenakari">Kundan & Meenakari Goldsmithing</option>
                    <option value="Pahari Miniature Painting">Pahari Miniature Painting</option>
                    <option value="Beedu Grass Mat Weaving">Beedu Grass Mat Weaving (Women SHG)</option>
                  </select>
                </div>

                <div className="commissions-form-group">
                  <label className="commissions-label">
                    Target Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 8000"
                    className="commissions-input"
                  />
                </div>

                <div className="commissions-form-group">
                  <label className="commissions-label">
                    Desired Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="commissions-input"
                  />
                </div>
              </div>

              <div className="commissions-form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="commissions-label">
                  Detailed Commission Description & Motifs *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe dimensions, natural color dyes, specific traditional motifs (e.g. lotus, chariot, dancing peacock), and any special dedication or occasion."
                  className="commissions-textarea"
                />
              </div>

              <div className="commissions-form-actions">
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="commissions-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="commissions-btn-submit"
                >
                  {isSubmitting ? 'Transmitting to Artisans...' : 'Submit Custom Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Browse Active Commissions & Quotes */}
        {activeTab === 'browse' && (
          <div>
            {!isLoggedIn ? (
              <div className="commissions-auth-card">
                <div className="commissions-auth-icon">🔒</div>
                <h2 className="commissions-auth-title">Sign In to View Your Bespoke Commissions</h2>
                <p className="commissions-auth-desc">
                  Custom commissions, itemized artisan material breakdowns, and direct escrow quotes are confidential. Please sign in to track your bespoke requests and artisan communications.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/login" className="commissions-btn-submit" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Sign In / Register →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="commissions-btn-cancel"
                  >
                    + Submit New Commission
                  </button>
                </div>
              </div>
            ) : visibleCommissions.length === 0 ? (
              <div className="commissions-auth-card">
                <div className="commissions-auth-icon">✦</div>
                <h2 className="commissions-auth-title">
                  {isArtisan ? 'No Open Guild Inquiries' : 'No Active Commissions Found'}
                </h2>
                <p className="commissions-auth-desc">
                  {isArtisan
                    ? 'There are currently no new open bespoke commission inquiries waiting for artisan quotes in your cluster.'
                    : 'You have not submitted any bespoke commission inquiries under this account yet. Directly engage certified master artisans for customized dimensions, heritage motifs, and heirloom masterworks.'}
                </p>
                {!isArtisan && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="commissions-btn-submit"
                  >
                    + Commission a Custom Piece
                  </button>
                )}
              </div>
            ) : (
              <div className="commissions-list">
                {visibleCommissions.map((comm) => (
                  <div 
                    key={comm.id}
                    className="commissions-card"
                  >
                    {/* Header row */}
                    <div className="commissions-card-head">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="commissions-card-tradition">
                            {comm.craft_tradition}
                          </span>
                          <span style={{ color: '#9C8B76', fontSize: '0.75rem' }}>•</span>
                          <span className="commissions-card-requester">Requested by {comm.buyer_name}</span>
                        </div>
                        <span className="commissions-card-ref">
                          Ref ID: #{comm.id}
                        </span>
                      </div>

                      <div className="commissions-card-badges">
                        {comm.target_budget && (
                          <span className="commissions-budget-badge">
                            Target: ₹{comm.target_budget.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className={`commissions-status-pill status-${comm.status.toLowerCase()}`}>
                          {comm.status}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="commissions-desc-box">
                      "{comm.description}"
                    </p>

                    {/* Quotes Section */}
                    <div className="commissions-quotes-sec">
                      <div className="commissions-quotes-header">
                        <h3 className="commissions-quotes-title">
                          Artisan Quotes ({comm.quotes?.length || 0})
                        </h3>
                        <span className="commissions-escrow-hint">
                          Order money is held safely until the buyer receives it
                        </span>
                      </div>

                      {/* Artisan 3-Step Quote Action Button */}
                      {isArtisan && comm.status === 'OPEN' && (
                        <div style={{ marginBottom: '1rem' }}>
                          <BigButton
                            variant="primary"
                            onClick={() => {
                              setQuotingCommId(comm.id);
                              setQuoteStep(1);
                              if (comm.target_budget) setQuotePrice(comm.target_budget);
                            }}
                          >
                            💬 Give Price & Days (Send Quote)
                          </BigButton>
                        </div>
                      )}

                      {(!comm.quotes || comm.quotes.length === 0) ? (
                        <div className="commissions-empty-quotes">
                          Broadcasting to certified master artisans. Quotes will appear here shortly.
                        </div>
                      ) : (
                        <div className="commissions-quotes-list">
                          {comm.quotes.map((quote) => (
                            <div 
                              key={quote.id}
                              className="commissions-quote-item"
                            >
                              <div className="commissions-quote-left">
                                <div className="commissions-artisan-title">
                                  <span className="commissions-artisan-name">
                                    {quote.artisan_name}
                                  </span>
                                  {quote.status === 'ACCEPTED' && (
                                    <span className="commissions-badge-accepted">
                                      ✓ QUOTE ACCEPTED
                                    </span>
                                  )}
                                </div>

                                {quote.material_breakdown && (
                                  <div className="commissions-quote-breakdown">
                                    <strong>Materials & Technique:</strong> {quote.material_breakdown}
                                  </div>
                                )}

                                {quote.quote_notes && (
                                  <p className="commissions-quote-notes">
                                    "{quote.quote_notes}"
                                  </p>
                                )}

                                <div className="commissions-quote-meta">
                                  <span>Estimated Lead Time: <strong>{quote.estimated_days} Days</strong></span>
                                  <span>•</span>
                                  <span>Craft Cluster: Dharwad / Karnataka</span>
                                </div>
                              </div>

                              <div className="commissions-quote-right">
                                <span className="commissions-quote-label">Artisan Quote</span>
                                <span className="commissions-quote-amount">
                                  ₹{quote.estimated_price.toLocaleString('en-IN')}
                                </span>

                                {quote.status !== 'ACCEPTED' ? (
                                  <button
                                    onClick={() => handleAcceptQuote(comm.id, quote.id)}
                                    className="commissions-btn-accept"
                                  >
                                    Accept & Pay Safely
                                  </button>
                                ) : (
                                  <Link
                                    to={`/cart`}
                                    className="commissions-btn-checkout"
                                  >
                                    Proceed to Checkout
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3-Step Quote Modal for Artisans (Rule 11) */}
        {quotingCommId && (
          <div
            className="a-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '16px',
                maxWidth: '480px',
                width: '100%',
                padding: '1.5rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--a-accent, #B85D19)' }}>
                  Step {quoteStep} of 3
                </span>
                <button
                  type="button"
                  onClick={() => setQuotingCommId(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {quoteStep === 1 && (
                <div>
                  <h2 id="quote-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1C1611' }}>
                    1. What is your fair price?
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: '#6B5645', marginBottom: '1.25rem' }}>
                    Enter the total price (₹) you want to receive for making this piece.
                  </p>
                  <div className="a-form-group">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={500}
                      step={100}
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value ? Number(e.target.value) : '')}
                      className="a-form-input"
                      style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}
                      placeholder="e.g. 5000"
                      autoFocus
                    />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <BigButton
                      variant="primary"
                      disabled={!quotePrice || Number(quotePrice) <= 0}
                      onClick={() => setQuoteStep(2)}
                    >
                      Next: How Many Days? →
                    </BigButton>
                  </div>
                </div>
              )}

              {quoteStep === 2 && (
                <div>
                  <h2 id="quote-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1C1611' }}>
                    2. How many days will it take?
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: '#6B5645', marginBottom: '1.25rem' }}>
                    How much time do you need to craft and pack this order?
                  </p>
                  <div className="a-stepper" style={{ marginBottom: '1rem' }}>
                    <button
                      type="button"
                      className="a-stepper__btn"
                      onClick={() => setQuoteDays(Math.max(1, quoteDays - 1))}
                      disabled={quoteDays <= 1}
                    >−</button>
                    <div>
                      <div className="a-stepper__value">{quoteDays}</div>
                      <div className="a-stepper__unit">Days</div>
                    </div>
                    <button
                      type="button"
                      className="a-stepper__btn"
                      onClick={() => setQuoteDays(quoteDays + 1)}
                    >+</button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <BigButton variant="secondary" onClick={() => setQuoteStep(1)}>
                      ← Back
                    </BigButton>
                    <BigButton variant="primary" onClick={() => setQuoteStep(3)}>
                      Next: Note to Buyer →
                    </BigButton>
                  </div>
                </div>
              )}

              {quoteStep === 3 && (
                <div>
                  <h2 id="quote-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1C1611' }}>
                    3. Short Note to Buyer
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: '#6B5645', marginBottom: '1.25rem' }}>
                    Speak or type a short note about materials, motifs, or special care.
                  </p>
                  <VoiceInputField
                    id="quote-note"
                    label="Your message (voice or type)"
                    value={quoteNote}
                    onChange={setQuoteNote}
                    placeholder="e.g. I will use handloom pure silk and traditional chariot motifs. Knotless finish guaranteed."
                    rows={4}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <BigButton variant="secondary" onClick={() => setQuoteStep(2)}>
                      ← Back
                    </BigButton>
                    <BigButton
                      variant="success"
                      disabled={submittingQuote}
                      onClick={() => handleSendArtisanQuote()}
                    >
                      {submittingQuote ? 'Sending…' : '✓ Send Quote to Buyer'}
                    </BigButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
