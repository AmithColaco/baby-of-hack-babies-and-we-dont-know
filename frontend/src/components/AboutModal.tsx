

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="curatorial-overlay" role="dialog" aria-modal="true">
      <div className="curatorial-modal-card">
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">THE KAARIGAR MANIFESTO</span>
            <h2 className="modal-title">Intangible Heritage & Dignity of the Hand</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close about">
            ✕
          </button>
        </div>

        <div className="about-content">
          <div className="about-columns">
            <div className="about-text-column">
              <h3 className="about-subheading">A Digital Archive, Not a Warehouse</h3>
              <p>
                India’s craft heritage is not an ornament of the past; it is a living, breathing reservoir of specialized knowledge developed over four millennia. Yet today, industrial mass production, opaque middleman syndicates, and ephemeral fast-consumption threaten to dissolve these lineages within a generation.
              </p>
              <p>
                <strong>Kaarigar</strong> was founded on a singular premise: to create a digital sanctuary where handcrafted masterworks are documented with the curatorial reverence of a museum and acquired through direct, unadulterated economic transparency.
              </p>

              <h3 className="about-subheading">Our Four Curatorial Principles</h3>
              <ul className="principles-list">
                <li>
                  <strong>1. Zero Intermediary Extraction:</strong> At least 85% of all acquisition capital flows directly to the master craftsman’s atelier and apprentice support funds.
                </li>
                <li>
                  <strong>2. Archival Provenance:</strong> Every piece is cataloged with its mineral recipe, workshop lineage, making duration, and regional geolocation.
                </li>
                <li>
                  <strong>3. Material Authenticity:</strong> We prohibit synthetic polymers, chemical dyes, and machine printing. Only natural pigments, wild beeswax, un-degummed silk, and pure metals are certified.
                </li>
                <li>
                  <strong>4. Living Gurukulam Continuity:</strong> Portions of proceeds fund youth apprentice fellowships so young artists can afford to spend years learning master techniques.
                </li>
              </ul>
            </div>

            <div className="about-stats-column">
              <div className="stat-card">
                <span className="stat-num">85%+</span>
                <span className="stat-label">Direct Revenue to Artisans</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">4,000</span>
                <span className="stat-label">Years of Preserved Metallurgy (Dhokra)</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">140 hrs</span>
                <span className="stat-label">Average Labor per Pahari Miniature</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">100%</span>
                <span className="stat-label">Verified Natural Mineral & Botanical Sourcing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
