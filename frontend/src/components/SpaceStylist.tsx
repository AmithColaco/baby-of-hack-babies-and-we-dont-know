// KAARIGAR — Curatorial Heritage Assistant & AI Space Stylist
// Powered by Retrieval-Augmented Generation (RAG) over verified Indian craft archives,
// master artisan lineages, making stages, and platform provenance policies.

import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { handleImageError, getFallbackForCraft } from '../utils/imageFallback';
import type { CraftObject } from '../types';
import {
  analyzeSpaceWithBackend,
  sendChatbotRAGMessage,
  type ChatbotMessage,
  type ProductRecommendation,
  type RAGSource,
  type SpaceAnalysis,
} from '../api/geminiStylist';

type StylistTab = 'chat' | 'vision';

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

/**
 * Lightweight, safe Markdown renderer for curatorial assistant messages.
 */
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="rag-message-body">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="rag-line-break" />;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="rag-msg-h4">
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="rag-msg-h3">
              {trimmed.slice(3)}
            </h3>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="rag-msg-quote">
              {trimmed.slice(2)}
            </blockquote>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="rag-msg-bullet">
              <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(trimmed.slice(2)) }} />
            </li>
          );
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="rag-msg-num-item">
              <span className="rag-num-badge">{numMatch[1]}</span>
              <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(numMatch[2]) }} />
            </div>
          );
        }

        // Standard paragraph
        return (
          <p
            key={idx}
            className="rag-msg-para"
            dangerouslySetInnerHTML={{ __html: parseInlineStyles(trimmed) }}
          />
        );
      })}
    </div>
  );
}

function parseInlineStyles(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="rag-inline-code">$1</code>');
}

/**
 * Expandable verified heritage citation sources accordion.
 */
function RAGSourceViewer({ sources }: { sources: RAGSource[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="rag-sources-accordion">
      <button
        type="button"
        className="rag-sources-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="rag-sources-icon" aria-hidden="true">✦</span>
        <span>
          <strong>{sources.length}</strong> Verified Archival Source
          {sources.length > 1 ? 's' : ''}
        </span>
        <span className="rag-sources-arrow">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="rag-sources-list">
          {sources.map((src, idx) => (
            <div key={src.id || idx} className="rag-source-item">
              <div className="rag-source-header">
                <span className="rag-source-title">{src.title}</span>
                <span className="rag-source-category">{src.category.replace('_', ' ')}</span>
                {src.relevanceScore > 0 && (
                  <span className="rag-source-relevance">
                    {Math.round(src.relevanceScore * 100)}% match
                  </span>
                )}
              </div>
              <p className="rag-source-snippet">{src.snippet}</p>
              {src.productId && (
                <Link
                  to={`/shop/${src.productId}`}
                  className="rag-source-link"
                  title="View Masterpiece in Gallery"
                >
                  View Archive Piece →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Interactive recommended product card embedded directly in the chat stream.
 */
function ChatProductCard({
  product,
  onAddToCart,
}: {
  product: CraftObject;
  onAddToCart: (p: CraftObject) => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="rag-product-card">
      <div className="rag-product-card__thumb">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          onError={(e) =>
            handleImageError(
              e,
              getFallbackForCraft(product.craftTradition || product.category)
            )
          }
        />
      </div>
      <div className="rag-product-card__body">
        <span className="rag-product-card__tradition">{product.craftTradition}</span>
        <h5 className="rag-product-card__title">{product.title}</h5>
        <div className="rag-product-card__meta">
          <span className="rag-product-card__artisan">by {product.artisan}</span>
          <span className="rag-product-card__price">{formatINR(product.price)}</span>
        </div>
        <div className="rag-product-card__actions">
          <Link
            to={`/shop/${product.id}`}
            className="rag-product-card__btn rag-product-card__btn--outline"
          >
            View Story
          </Link>
          <button
            type="button"
            className={`rag-product-card__btn rag-product-card__btn--primary${added ? ' rag-product-card__btn--added' : ''
              }`}
            onClick={handleAdd}
            disabled={added}
          >
            {added ? '✓ Added' : '+ Add to Bag'}
          </button>
        </div>
      </div>
    </div>
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
          onError={(e) =>
            handleImageError(
              e,
              getFallbackForCraft(rec.product.craftTradition || rec.product.category)
            )
          }
        />
        <MatchScorePill score={rec.matchScore} />
      </div>
      <div className="stylist-rec-card__body">
        <p className="stylist-rec-card__tradition">{rec.product.craftTradition}</p>
        <h4 className="stylist-rec-card__title">{rec.product.title}</h4>
        <p className="stylist-rec-card__artisan">by {rec.product.artisan}</p>
        <p className="stylist-rec-card__price">{formatINR(rec.product.price)}</p>
        <p className="stylist-rec-card__reason">{rec.reason}</p>

        {/* Spatial Intelligence: Placement Anchor & Clearance */}
        {rec.spatialPlacement && (
          <div style={{ fontSize: '0.72rem', background: 'rgba(212, 163, 115, 0.12)', borderLeft: '2px solid #B5602A', padding: '0.25rem 0.45rem', borderRadius: '3px', margin: '0.35rem 0' }}>
            <span style={{ fontWeight: 600, color: '#B5602A' }}>📍 Spatial Placement: </span>
            <span style={{ color: '#4A4843' }}>
              {rec.spatialPlacement.anchor_reference}
              {rec.spatialPlacement.orientation_angle_deg !== undefined && ` (${rec.spatialPlacement.orientation_angle_deg}° orientation)`}
              {rec.spatialPlacement.recommended_clearance_cm !== undefined && ` · min ${rec.spatialPlacement.recommended_clearance_cm}cm clearance`}
            </span>
          </div>
        )}

        {/* Spatial Intelligence: Photometric Interaction */}
        {rec.photometricInteraction && (
          <div style={{ fontSize: '0.70rem', color: '#6A6862', fontStyle: 'italic', margin: '0.2rem 0 0.4rem' }}>
            💡 {rec.photometricInteraction}
          </div>
        )}

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
            className={`stylist-rec-card__btn stylist-rec-card__btn--primary${added ? ' stylist-rec-card__btn--added' : ''
              }`}
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

      {/* Photometric Profile */}
      {analysis.ambientCctKelvin && (
        <div className="stylist-analysis-badge__row">
          <span className="stylist-analysis-badge__label">Photometrics</span>
          <span className="stylist-analysis-badge__value">
            {analysis.ambientCctKelvin}K CCT ({analysis.diffusionLevel || 'diffused'} · {analysis.lightDirectionality || 'natural'})
          </span>
        </div>
      )}

      {/* Fixed Envelope Elements */}
      {analysis.fixedEnvelope && (analysis.fixedEnvelope.flooring || analysis.fixedEnvelope.walls) && (
        <div className="stylist-analysis-badge__row">
          <span className="stylist-analysis-badge__label">Envelope</span>
          <span className="stylist-analysis-badge__value">
            {[
              analysis.fixedEnvelope.flooring && `Floor: ${analysis.fixedEnvelope.flooring}`,
              analysis.fixedEnvelope.walls && `Walls: ${analysis.fixedEnvelope.walls}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      )}

      {analysis.suggestedPlacements && analysis.suggestedPlacements.length > 0 && (
        <div className="stylist-analysis-badge__row">
          <span className="stylist-analysis-badge__label">Best For</span>
          <span className="stylist-analysis-badge__value">
            {analysis.suggestedPlacements.join(' · ')}
          </span>
        </div>
      )}

      {/* Styling Narrative */}
      {analysis.stylingNarrative && (
        <div style={{ margin: '0.4rem 0 0.2rem', padding: '0.4rem 0.6rem', background: 'rgba(45, 106, 79, 0.08)', borderRadius: '4px', borderLeft: '2px solid #2D6A4F', fontSize: '0.74rem', color: '#1E4334', lineHeight: 1.45 }}>
          <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Architectural Narrative</strong>
          {analysis.stylingNarrative}
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
  const [activeTab, setActiveTab] = useState<StylistTab>('chat');

  // ── RAG Chat State ──
  const [chatMessages, setChatMessages] = useState<ChatbotMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content:
        'Namaste. I am your **KAARIGAR Curatorial Concierge**, powered by our verified archives of living Indian heritage crafts, master lineages, making stages, and platform provenance.\n\n' +
        'Ask me anything about our craft traditions, artisan techniques, pricing transparency, or ask for curated recommendations for your collection.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ── Vision Space Stylist State ──
  const [state, setState] = useState<AssistantState>('welcome');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [userPreference, setUserPreference] = useState('');
  const [analysis, setAnalysis] = useState<SpaceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading, activeTab]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    const handleGlobalOpen = (e?: any) => {
      setIsOpen(true);
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('open-space-stylist', handleGlobalOpen);
    return () => window.removeEventListener('open-space-stylist', handleGlobalOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  };

  // ── RAG Chat Handlers ──
  const handleSendChat = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isChatLoading) return;

    const userMsg: ChatbotMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const historyPayload = newHistory
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await sendChatbotRAGMessage(query, historyPayload);

      const assistantMsg: ChatbotMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: result.sources,
        suggestedProducts: result.suggestedProducts,
        confidenceScore: result.confidenceScore,
        objectQueryDetected: result.objectQueryDetected,
        noObjectsFound: result.noObjectsFound,
        hasReachedEnd: result.hasReachedEnd,
        endMessage: result.endMessage,
      };


      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chatbot RAG error:', err);
      const fallbackMsg: ChatbotMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content:
          'I encountered a temporary archival connection delay. Please explore our curated masterworks above or ask me about our lost-wax Dhokra, Kangra miniatures, or 4-part pricing breakdown.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        content:
          'Archival thread refreshed. How may I assist your curatorial exploration of Indian craft traditions and certified masterpieces today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // ── Vision Space Stylist Handlers ──
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

  const validateAndSetImage = useCallback(
    (file: File) => {
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
      setAnalysis(null);
      setRecommendations([]);
      setErrorMessage('');
      setState('ready');
    },
    [imagePreviewUrl]
  );

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

  const handleLoadSample = async (samplePath: string, sampleName: string) => {
    try {
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const file = new File([blob], sampleName, { type: 'image/jpeg' });
      validateAndSetImage(file);
    } catch (e) {
      console.error('Failed to load sample space image:', e);
    }
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
      const msg =
        detail ||
        err.message ||
        'Space analysis could not be completed. Please try again with a clear photo of your space.';
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
        aria-label="Open KAARIGAR AI Assistant & Space Stylist"
        title="KAARIGAR AI Assistant — Curatorial Chat & Room Stylist"
      >
        <span className="stylist-float-btn__icon" aria-hidden="true">✦</span>
        <span className="stylist-float-btn__label">Curatorial Guide</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="stylist-backdrop" onClick={handleClose} aria-hidden="true" />

      {/* Main Panel */}
      <aside
        className="stylist-panel"
        role="complementary"
        aria-label="KAARIGAR AI Curatorial Concierge & Space Stylist"
      >
        {/* ── Header ── */}
        <header className="stylist-panel__header">
          <div className="stylist-panel__header-left">
            <span className="stylist-panel__icon" aria-hidden="true">✦</span>
            <div>
              <h2 className="stylist-panel__title">KAARIGAR Curatorial Guide</h2>
              <p className="stylist-panel__subtitle">Archives & Heritage Intelligence</p>
            </div>
          </div>
          <button
            type="button"
            className="stylist-panel__close"
            onClick={handleClose}
            aria-label="Close Assistant"
          >
            ✕
          </button>
        </header>

        {/* ── Dual Mode Segmented Control Tabs ── */}
        <div className="stylist-nav-tabs">
          <button
            type="button"
            className={`stylist-tab-btn${activeTab === 'chat' ? ' stylist-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="stylist-tab-icon">✦</span> Curatorial Chat
          </button>
          <button
            type="button"
            className={`stylist-tab-btn${activeTab === 'vision' ? ' stylist-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('vision')}
          >
            <span className="stylist-tab-icon">✦</span> Craft in Your Space
          </button>
        </div>

        {/* ── TAB 1: RAG CURATORIAL CHAT ── */}
        {activeTab === 'chat' && (
          <div className="rag-chat-container">
            {/* Conversation Stream */}
            <div className="rag-chat-messages" ref={chatScrollRef}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rag-chat-bubble rag-chat-bubble--${msg.role}`}
                >
                  <div className="rag-bubble-header">
                    <span className="rag-bubble-sender">
                      {msg.role === 'assistant' ? '✦ Curatorial Concierge' : 'Patron'}
                    </span>
                    <span className="rag-bubble-time">{msg.timestamp}</span>
                  </div>

                  <div className="rag-bubble-content">
                    <FormattedMessage content={msg.content} />
                  </div>

                  {/* Render Verified Sources Accordion */}
                  {msg.sources && msg.sources.length > 0 && (
                    <RAGSourceViewer sources={msg.sources} />
                  )}

                  {/* Render Strictly Matched Products */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="rag-bubble-products">
                      <div className="rag-bubble-products-header">
                        <span className="rag-bubble-products-heading">
                          Matching Masterwork{msg.suggestedProducts.length > 1 ? 's' : ''} ({msg.suggestedProducts.length}):
                        </span>
                      </div>
                      <div className="rag-bubble-products-grid">
                        {msg.suggestedProducts.map((p) => (
                          <ChatProductCard
                            key={p.id}
                            product={p}
                            onAddToCart={handleAddToCart}
                          />
                        ))}
                      </div>
                      {msg.hasReachedEnd && (
                        <div className="rag-end-of-objects">
                          <span className="rag-end-line" />
                          <span className="rag-end-text">
                            {msg.endMessage || `✦ End of matching masterworks in collection (${msg.suggestedProducts.length} displayed) ✦`}
                          </span>
                          <span className="rag-end-line" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Empty State if Object Search Found No Pieces */}
                  {msg.noObjectsFound && (
                    <div className="rag-no-objects-card">
                      <div className="rag-no-objects-icon" aria-hidden="true">✦</div>
                      <div className="rag-no-objects-content">
                        <h6 className="rag-no-objects-title">No Matching Masterworks in Archive</h6>
                        <p className="rag-no-objects-desc">
                          {msg.endMessage ||
                            'We could not find any masterworks in our archives matching this specific object search. Our collection is strictly limited to authenticated living heritage pieces.'}
                        </p>
                        <div className="rag-no-objects-suggestions">
                          <span className="rag-no-objects-hint">Explore available master craftworks:</span>
                          <div className="rag-no-objects-chips">
                            <button
                              type="button"
                              className="rag-mini-chip"
                              onClick={() => handleSendChat('Show Bastar Dhokra lost-wax metalcraft')}
                            >
                              Dhokra Bronze
                            </button>
                            <button
                              type="button"
                              className="rag-mini-chip"
                              onClick={() => handleSendChat('Show Jaipur Blue Pottery')}
                            >
                              Blue Pottery
                            </button>
                            <button
                              type="button"
                              className="rag-mini-chip"
                              onClick={() => handleSendChat('Show Chanderi handwoven silk')}
                            >
                              Chanderi Silk
                            </button>
                            <button
                              type="button"
                              className="rag-mini-chip"
                              onClick={() => handleSendChat('Show Pahari miniature paintings')}
                            >
                              Kangra Wasli
                            </button>
                            <button
                              type="button"
                              className="rag-mini-chip"
                              onClick={() => handleSendChat('Show Channapatna woodcraft')}
                            >
                              Wood Totems
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {/* Thinking / Streaming Indicator */}
              {isChatLoading && (
                <div className="rag-chat-bubble rag-chat-bubble--assistant rag-bubble--loading">
                  <div className="rag-bubble-header">
                    <span className="rag-bubble-sender">✦ Curatorial Concierge</span>
                  </div>
                  <div className="rag-loading-indicator">
                    <span className="rag-loading-dot" />
                    <span className="rag-loading-dot" />
                    <span className="rag-loading-dot" />
                    <span className="rag-loading-text">
                      Consulting living craft archives and lineage records...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              className="rag-chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
            >
              <button
                type="button"
                className="rag-clear-btn"
                onClick={handleClearChat}
                title="Start new curatorial thread"
                aria-label="Start new curatorial thread"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <input
                ref={chatInputRef}
                type="text"
                className="rag-chat-input"
                placeholder="Ask about Bastar Dhokra, Kasuti, pricing breakdown..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
              />
              <button
                type="submit"
                className="rag-send-btn"
                disabled={isChatLoading || !chatInput.trim()}
                title="Send inquiry"
                aria-label="Send inquiry"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 2: VISION SPACE STYLIST ── */}
        {activeTab === 'vision' && (
          <div className="stylist-panel__body">
            {/* ── WELCOME STATE ── */}
            {state === 'welcome' && (
              <div className="stylist-state stylist-state--welcome">
                <div className="stylist-welcome-hero">
                  <span className="stylist-welcome-badge">✦ Spatial AI Curation</span>
                  <h3 className="stylist-welcome-heading">Find Living Heritage For Your Room</h3>
                  <p className="stylist-welcome-body">
                    Upload a photograph of your living room, desk, shelf, or wall. Our AI vision
                    analyzes room lighting, color palette, and architectural style to recommend
                    authentic pieces from our master artisans.
                  </p>
                </div>

                <div className="stylist-welcome-steps">
                  <div className="stylist-step-card">
                    <span className="stylist-step-num">1</span>
                    <div>
                      <strong>Photograph Your Space</strong>
                      <p>Capture your wall, console table, or corner in natural light.</p>
                    </div>
                  </div>
                  <div className="stylist-step-card">
                    <span className="stylist-step-num">2</span>
                    <div>
                      <strong>Aesthetic Space Reading</strong>
                      <p>Our vision model detects tones, lighting warmth, and textures.</p>
                    </div>
                  </div>
                  <div className="stylist-step-card">
                    <span className="stylist-step-num">3</span>
                    <div>
                      <strong>Curated Masterworks</strong>
                      <p>Receive pieces that harmonise with your interior with match scores.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="stylist-btn stylist-btn--primary stylist-btn--full"
                  onClick={() => setState('upload')}
                >
                  Begin Space Analysis →
                </button>
              </div>
            )}

            {/* ── UPLOAD STATE ── */}
            {state === 'upload' && (
              <div className="stylist-state stylist-state--upload">
                <div
                  className={`stylist-dropzone${isDraggingOver ? ' stylist-dropzone--drag' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={handleFileInput}
                    className="stylist-file-input"
                  />
                  <div className="stylist-dropzone__icon" aria-hidden="true">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block', color: 'var(--copper, #B5602A)' }}>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <h4 className="stylist-dropzone__title">Drop your room photograph here</h4>
                  <p className="stylist-dropzone__hint">or click to browse from your device</p>
                  <span className="stylist-dropzone__specs">
                    Supports JPEG, PNG, WebP · Max {MAX_FILE_SIZE_MB} MB
                  </span>
                </div>

                <div className="stylist-samples">
                  <p className="stylist-samples__label">Or try with curated architectural spaces:</p>
                  <div className="stylist-samples__row">
                    <button
                      type="button"
                      className="stylist-sample-btn"
                      onClick={() => handleLoadSample('/images/room_sample1.jpg', 'living-room.jpg')}
                    >
                      Living Room
                    </button>
                    <button
                      type="button"
                      className="stylist-sample-btn"
                      onClick={() => handleLoadSample('/images/room_sample2.jpg', 'dining-credenza.jpg')}
                    >
                      Dining Credenza
                    </button>
                    <button
                      type="button"
                      className="stylist-sample-btn"
                      onClick={() => handleLoadSample('/images/room_sample3.jpg', 'study-nook.jpg')}
                    >
                      Study Nook
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── READY / PREVIEW STATE ── */}
            {state === 'ready' && imagePreviewUrl && (
              <div className="stylist-state stylist-state--ready">
                <div className="stylist-preview-wrap">
                  <img
                    src={imagePreviewUrl}
                    alt="Your uploaded space"
                    className="stylist-preview-img"
                  />
                  <button
                    type="button"
                    className="stylist-preview-change"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={handleFileInput}
                    className="stylist-file-input"
                  />
                </div>

                <div className="stylist-pref-wrap">
                  <label htmlFor="stylist-pref" className="stylist-pref-label">
                    Optional: Specify budget or placement preferences
                  </label>
                  <input
                    id="stylist-pref"
                    type="text"
                    className="stylist-pref-input"
                    placeholder="e.g. budget under ₹35,000, entryway console, warm tones"
                    value={userPreference}
                    onChange={(e) => setUserPreference(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="stylist-btn stylist-btn--primary stylist-btn--full"
                  onClick={handleAnalyze}
                >
                  Analyze & Recommend Pieces ✦
                </button>
              </div>
            )}

            {/* ── ANALYZING STATE ── */}
            {state === 'analyzing' && (
              <div className="stylist-state stylist-state--analyzing">
                <div className="stylist-loader">
                  <div className="stylist-loader__spinner" />
                  <span className="stylist-loader__sparkle">✦</span>
                </div>
                <h3 className="stylist-loader__title">Reading Your Interior Space</h3>
                <p className="stylist-loader__body">
                  Examining light temperature, architectural lines, and tonal balances across our
                  living artisanal archives...
                </p>
              </div>
            )}

            {/* ── UNSUITABLE IMAGE STATE ── */}
            {state === 'unsuitable' && (
              <div className="stylist-state stylist-state--error">
                <div className="stylist-error-icon" aria-hidden="true">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h3 className="stylist-error-title">Not an Interior Space</h3>
                <p className="stylist-error-body">
                  {analysis?.unsuitableMessage ||
                    'Please upload a clear photograph of an interior space (living room, wall, desk, or shelf) so we can recommend matching artisanal pieces.'}
                </p>
                <div className="stylist-error-actions">
                  <button
                    type="button"
                    className="stylist-btn stylist-btn--primary"
                    onClick={handleReset}
                  >
                    Upload an Interior Photo
                  </button>
                </div>
              </div>
            )}

            {/* ── RESULTS STATE ── */}
            {state === 'results' && analysis && (
              <div className="stylist-state stylist-state--results">
                <SpaceAnalysisBadge analysis={analysis} />

                <div className="stylist-recs-section">
                  <h4 className="stylist-recs-heading">Curated Artisanal Recommendations</h4>
                  <div className="stylist-recs-list">
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
                  Analyze a Different Space
                </button>
              </div>
            )}

            {/* ── NO MATCH STATE ── */}
            {state === 'no-match' && (
              <div className="stylist-state stylist-state--empty">
                <div className="stylist-empty-icon" aria-hidden="true">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block', color: 'var(--copper, #B5602A)' }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
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
                <div className="stylist-error-icon" aria-hidden="true">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
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
        )}
      </aside>
    </>
  );
}
