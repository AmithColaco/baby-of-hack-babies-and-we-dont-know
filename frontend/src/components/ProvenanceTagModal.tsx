import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { CraftObject } from '../types';
import { generateQRDataUrl, getProvenanceUrl } from '../utils/qrCode';

interface ProvenanceTagModalProps {
  craft: CraftObject;
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceTagModal: React.FC<ProvenanceTagModalProps> = ({ craft, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const provenanceUrl = getProvenanceUrl(craft.accessionNo);

  useEffect(() => {
    if (isOpen) {
      generateQRDataUrl(provenanceUrl, { width: 240, margin: 1 }).then(setQrUrl);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    }
  }, [isOpen, provenanceUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(provenanceUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.error('Audio playback error:', err);
      });
    }
  };

  return (
    <div className="prov-modal-overlay">
      <div 
        className="prov-modal-card"
        role="dialog"
        aria-labelledby="provenance-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="prov-modal-close"
          aria-label="Close provenance modal"
        >
          ✕
        </button>

        {/* Header */}
        <div className="prov-modal-header">
          <div className="prov-modal-eyebrow">
            <span>✦</span> {t('provenance.tag_title')}
          </div>
          <h2 id="provenance-title" className="prov-modal-title">
            {craft.title}
          </h2>
          <div className="prov-modal-subtitle">
            <span>{t('provenance.accession')}: <strong>{craft.accessionNo}</strong></span>
            <span>•</span>
            <span>{craft.craftTradition}</span>
            {craft.isWomenSHG && (
              <>
                <span>•</span>
                <span className="prov-shg-badge">♀ {t('women_shg.badge')}</span>
              </>
            )}
          </div>
        </div>

        {/* Printable Artisan Tag Card */}
        <div id="printable-artisan-tag" className="prov-tag-card">
          <div className="prov-tag-row">
            {/* QR Code Container */}
            <div className="prov-qr-box">
              {qrUrl ? (
                <img 
                  src={qrUrl} 
                  alt={`QR code for provenance of ${craft.title}`}
                  className="prov-qr-img"
                />
              ) : (
                <div className="prov-qr-placeholder">
                  Generating QR...
                </div>
              )}
              <span className="prov-qr-code">
                {craft.accessionNo}
              </span>
              <span className="prov-qr-hint">SCAN FOR LIVING PROVENANCE</span>
            </div>

            {/* Tag Information */}
            <div className="prov-tag-info">
              <div>
                <span className="prov-artisan-role">Master Artisan</span>
                <h3 className="prov-artisan-name">{craft.artisan}</h3>
                <p className="prov-artisan-cluster">{craft.atelier} · {craft.region}, {craft.state}</p>
              </div>

              {craft.isWomenSHG && (
                <div>
                  <span className="prov-shg-badge">
                    ✦ <strong>{craft.shgName || "Women's Self-Help Guild"}</strong>
                  </span>
                </div>
              )}

              <div className="prov-meta-box">
                <div><strong>Materials:</strong> {craft.materials.slice(0, 3).join(', ')}</div>
                <div><strong>Technique:</strong> {craft.technique}</div>
                <div><strong>GI Origin:</strong> {craft.region}, {craft.state}</div>
              </div>

              <p className="prov-tag-hint-note">
                "Artisan tag ready for physical thread attachment to garment or craft."
              </p>
            </div>
          </div>
        </div>

        {/* Artisan Voice Clip Section */}
        <div className="prov-voice-box">
          <div className="prov-voice-head">
            <div className="prov-voice-title">
              <span style={{ fontSize: '1.1rem' }}>🎙</span>
              <span>Artisan’s Voice Note & Spoken Oral History</span>
            </div>
            <span className="prov-voice-tag">Vernacular Recording</span>
          </div>
          <p className="prov-voice-quote">
            "{craft.artisanQuote}" — {craft.artisan}
          </p>
          
          <div className="prov-voice-player">
            <button
              onClick={toggleAudio}
              className="prov-voice-btn"
            >
              <span>{isPlayingAudio ? '❚❚ Pause Voice Clip' : '▶ Play Voice Note (Audio)'}</span>
            </button>
            <span className="prov-voice-status">
              {isPlayingAudio ? 'Audio playing · direct master voice' : 'Click to hear artisan describe this piece'}
            </span>
          </div>
          <audio 
            ref={audioRef} 
            src={craft.voiceClipUrl || "https://actions.google.com/sounds/v1/ambiences/temple_bell_and_flute.ogg"} 
            onEnded={() => setIsPlayingAudio(false)}
            preload="metadata"
          />
        </div>

        {/* Process Making Photos */}
        <div className="prov-stages-section">
          <h3 className="prov-stages-heading">
            Making Process & Living Documentation
          </h3>
          <div className="prov-stages-grid">
            {craft.makingStory.stages.map((stage, idx) => (
              <div key={idx} className="prov-stage-card">
                <div className="prov-stage-badge-row">
                  <span>STAGE {stage.step}</span>
                  <span style={{ fontSize: '0.68rem', color: '#8C7A66', textTransform: 'uppercase' }}>Handcrafted</span>
                </div>
                <h4>{stage.title}</h4>
                <p>{stage.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hang-tag Explanation & Action Buttons (Rule 12) */}
        <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#F8F5F0', borderRadius: '12px', border: '1px solid #E5DCD0' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#5A4636', lineHeight: 1.5 }}>
            🏷️ <strong>{t('provenance.hangtag_help_title', 'Hang-tag for your craft piece:')}</strong>{' '}
            {t('provenance.hangtag_help_desc', 'Print this tag and attach it to your finished product. When the buyer receives the parcel, they scan the QR code with their phone to hear your voice and verify it was genuinely handmade by you.')}
          </p>

          <button
            onClick={handlePrint}
            style={{
              width: '100%',
              minHeight: '56px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--a-accent, #B85D19)',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 12px rgba(184, 93, 25, 0.25)',
              marginBottom: '0.75rem',
            }}
          >
            <span>🖨️</span>
            <span>{t('provenance.print_tag', 'Print Physical Tag')}</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
            <button
              onClick={handleCopyLink}
              style={{
                flex: 1,
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid #D6C8B8',
                background: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#3B2A1E',
              }}
            >
              {copiedLink ? `✓ ${t('provenance.copy_link', 'Copied Link')}` : `⎘ ${t('provenance.copy_link', 'Copy Story Link')}`}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid #D6C8B8',
                background: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#3B2A1E',
              }}
            >
              {t('common.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
