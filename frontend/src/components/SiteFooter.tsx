import { useState } from 'react';
import { Link } from 'react-router-dom';

export function SiteFooter() {
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
              <span className="site-footer__brand-hindi">कारिगर</span>
              <span className="site-footer__brand-name">KAARIGAR</span>
            </div>
            <p className="site-footer__philosophy">
              An archival digital sanctuary connecting India’s living masters directly with custodians of culture. 
              We operate on an uncompromising standard of radical compensation, verifiable provenance, and reverence for traditional craftsmanship.
            </p>
            <div className="site-footer__payout-badge">
              <span className="payout-num">85%+</span>
              <span className="payout-desc">Direct revenue distributed into master artisan atelier accounts.</span>
            </div>
          </div>

          {/* Col 2: Traditions */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">Craft Traditions</h4>
            <ul className="site-footer__links">
              <li><Link to="/shop?category=paintings">Kangra & Tanjore Paintings</Link></li>
              <li><Link to="/shop?category=ceramics">Jaipur Blue Pottery</Link></li>
              <li><Link to="/shop?category=textiles">Chanderi Gossamer Weaves</Link></li>
              <li><Link to="/shop?category=metalcraft">Bastar Lost-Wax Dhokra</Link></li>
              <li><Link to="/shop?category=woodcraft">Channapatna Lacquer Wood</Link></li>
              <li><Link to="/shop?category=jewellery">Kundan & Meenakari Enamel</Link></li>
            </ul>
          </div>

          {/* Col 3: Curation & Experience */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">Curatorial Archive</h4>
            <ul className="site-footer__links">
              <li><Link to="/shop">Complete Collection</Link></li>
              <li><Link to="/gallery">3D Spatial Exhibition</Link></li>
              <li><Link to="/#artisans">Master Artisan Roster</Link></li>
              <li><Link to="/#process">Material Alchemy & Stages</Link></li>
              <li><Link to="/dashboard">Artisan Atelier Portal</Link></li>
              <li><Link to="/login">Onboard Your Guild</Link></li>
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
            © 2026 KAARIGAR Cultural Trust & Independent Guilds. All rights reserved.
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
