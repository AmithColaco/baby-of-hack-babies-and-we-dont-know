interface HeroIntroProps {
  onEnterGallery: () => void;
  onEnter2DArchive: () => void;
}

export const HeroIntro = ({
  onEnterGallery,
  onEnter2DArchive,
}: HeroIntroProps) => {
  return (
    <section className="hero-intro" aria-label="Kaarigar Exhibition Entrance">
      <div className="hero-intro__backdrop" aria-hidden="true" />

      <div className="hero-intro__content">
        {/* Vernacular Seal */}
        <div className="hero-intro__seal">
          <span className="seal__devanagari">कारीगर</span>
          <span className="seal__dot">·</span>
          <span className="seal__sub">EST. 2026 · ARCHIVE OF LIVING CRAFT</span>
        </div>

        {/* Brand Master Title */}
        <h1 className="hero-intro__title">
          KAARIGAR
        </h1>

        {/* Philosophical Statement */}
        <p className="hero-intro__statement">
          An archival sanctuary of living Indian craft traditions — hand-spun, fire-glazed, hand-beaten, and hand-painted across centuries. Every artifact carries the memory and breath of the master who shaped it.
        </p>

        {/* Restrained Actions */}
        <div className="hero-intro__actions">
          <button
            onClick={onEnterGallery}
            className="btn btn-primary btn-enter"
            id="btn-enter-gallery"
          >
            <span>Enter the 3D Gallery</span>
            <span className="btn-arrow">↓</span>
          </button>

          <button
            onClick={onEnter2DArchive}
            className="btn btn-ghost btn-archive-entry"
            id="btn-enter-archive"
          >
            <span>Curatorial 2D Archive</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>

        {/* Exhibition Curatorial Metadata */}
        <div className="hero-intro__footer-meta">
          <div className="meta-col">
            <span className="meta-label">CURATION</span>
            <span className="meta-val">6 Master Traditions</span>
          </div>
          <div className="meta-sep" />
          <div className="meta-col">
            <span className="meta-label">PROVENANCE</span>
            <span className="meta-val">Kangra · Jaipur · Chanderi · Bastar · Channapatna</span>
          </div>
          <div className="meta-sep" />
          <div className="meta-col">
            <span className="meta-label">ARTISAN EQUITY</span>
            <span className="meta-val">85%+ Direct Payout</span>
          </div>
        </div>
      </div>
    </section>
  );
};
