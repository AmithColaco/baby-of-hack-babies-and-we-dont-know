import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function SiteFooter() {
  const { t } = useTranslation();
  const { isArtisan } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          {/* Col 1: Brand & Philosophy */}
          <div className="site-footer__col site-footer__brand-col">
            <div className="site-footer__brand">
              <span className="site-footer__brand-name">{t('nav.brand_title')}</span>
            </div>
            <p className="site-footer__philosophy">
              {t('footer.manifesto')}
            </p>
            <div className="site-footer__payout-badge">
              <span className="payout-num">100%</span>
              <span className="payout-desc">{t('footer.gi_guarantee')}</span>
            </div>
          </div>

          {/* Col 2: Traditions */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">{t('footer.curated_corridors')}</h4>
            <ul className="site-footer__links">
              <li><Link to="/gallery?category=paintings">Kangra & Tanjore Paintings</Link></li>
              <li><Link to="/gallery?category=ceramics">Jaipur Blue Pottery</Link></li>
              <li><Link to="/gallery?category=textiles">Chanderi Gossamer Weaves</Link></li>
              <li><Link to="/gallery?category=metalcraft">Bastar Lost-Wax Dhokra</Link></li>
              <li><Link to="/gallery?category=woodcraft">Channapatna Lacquer Wood</Link></li>
              <li><Link to="/gallery?category=jewellery">Kundan & Meenakari Enamel</Link></li>
            </ul>
          </div>

          {/* Col 3: Curation & Experience */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">{t('nav.gallery')}</h4>
            <ul className="site-footer__links">
              <li><Link to="/gallery">{t('nav.shop')}</Link></li>
              <li><Link to="/archive">{t('nav.gallery')} Archive</Link></li>
              <li><Link to="/#artisans">{t('nav.artisans')}</Link></li>
              <li><Link to="/#process">{t('nav.process')}</Link></li>
              {isArtisan && (
                <li><Link to="/dashboard">{t('nav.dashboard')}</Link></li>
              )}
              <li><Link to="/login">{t('nav.login')}</Link></li>
            </ul>
          </div>

          {/* Col 4: Newsletter & Provenance */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">Atelier Dispatches</h4>
            <p className="site-footer__newsletter-desc">
              Receive limited notices when a master artisan completes a museum-edition piece. Zero spam.
            </p>
            {subscribed ? (
              <div className="footer-subscribed-msg" style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '0.82rem', color: '#88d8b0', border: '1px solid rgba(136,216,176,0.3)' }}>
                ✓ Inscribed in Curatorial Dispatches.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="site-footer__form">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address…"
                  className="site-footer__input"
                  aria-label="Email address for curatorial dispatches"
                />
                <button type="submit" className="site-footer__submit-btn">
                  Inscribe
                </button>
              </form>
            )}
            <div className="site-footer__cert">
              <span>✓ Certified Indigenous Provenance</span>
              <span>✓ GI Protected Traditions</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="site-footer__divider" />

        {/* Bottom bar */}
        <div className="site-footer__bottom">
          <div className="site-footer__copyright">
            {t('footer.copyright')}
          </div>
          <div className="site-footer__legal-links">
            <span>Fair Trade Covenant</span>
            <span>Provenance Guarantee</span>
            <span>Artisan Direct Banking</span>
            <span>Terms & Ethics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
