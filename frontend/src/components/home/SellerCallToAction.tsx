import { Link } from 'react-router-dom';

export function SellerCallToAction() {
  return (
    <section className="seller-cta-section" aria-label="Become a Kaarigar Artisan">
      <div className="seller-cta-section__inner">
        <div className="seller-cta-section__content">
          <div className="section-eyebrow">PRESERVE YOUR LINEAGE</div>
          <h2 className="seller-cta-title">
            Are You a Custodian of an Indian Craft Tradition?
          </h2>
          <p className="seller-cta-lead">
            Kaarigar was founded to liberate artisans from unfair middlemen, exploitative tourist commissions, 
            and algorithmic discounting. We provide museum-grade presentation, verified buyer escrow, 
            and guarantee over 85% of each acquisition directly to your atelier.
          </p>

          <div className="seller-perks-grid">
            <div className="perk-card">
              <span className="perk-icon">✦</span>
              <h4 className="perk-title">85%+ Direct Payout</h4>
              <p className="perk-desc">Direct bank transfers upon delivery with transparent itemized commission disclosure.</p>
            </div>

            <div className="perk-card">
              <span className="perk-icon">✦</span>
              <h4 className="perk-title">Dedicated Story Archiving</h4>
              <p className="perk-desc">Our curatorial team photographs your atelier, documents your materials, and writes your lineage story.</p>
            </div>

            <div className="perk-card">
              <span className="perk-icon">✦</span>
              <h4 className="perk-title">Global Collector Reach</h4>
              <p className="perk-desc">Connect with galleries, interior architects, and serious connoisseurs across India and worldwide.</p>
            </div>

            <div className="perk-card">
              <span className="perk-icon">✦</span>
              <h4 className="perk-title">Zero Upfront Listing Fees</h4>
              <p className="perk-desc">List your works without subscription traps. We only thrive when your handcrafted pieces find custodians.</p>
            </div>
          </div>

          <div className="seller-cta-actions">
            <Link to="/login" className="seller-action-btn seller-action-btn--primary" id="seller-onboard-cta">
              <span>Onboard Your Atelier</span>
              <span className="arrow">→</span>
            </Link>

            <Link to="/dashboard" className="seller-action-btn seller-action-btn--secondary" id="seller-portal-cta">
              <span>Enter Seller Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
