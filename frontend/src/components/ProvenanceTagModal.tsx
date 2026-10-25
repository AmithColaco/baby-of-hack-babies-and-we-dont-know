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

        {/* Action Buttons */}
        <div className="prov-modal-actions">
          <button
            onClick={handleCopyLink}
            className="prov-btn-secondary"
          >
            {copiedLink ? `✓ ${t('provenance.copy_link')}` : `⎘ ${t('provenance.copy_link')}`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              className="prov-btn-primary"
            >
              <span>🖨 {t('provenance.print_tag')}</span>
            </button>
            <button
              onClick={onClose}
              className="prov-btn-secondary"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
