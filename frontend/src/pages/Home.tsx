import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '\u{1F916}', title: 'AI Listing Assistant', desc: 'Photograph a piece — Gemini drafts the title, story, and fair price in seconds.' },
  { icon: '\u{1F3DB}\uFE0F', title: '3D Virtual Gallery', desc: 'Walk through an immersive gallery where every craft hangs in its own wing.' },
  { icon: '\u{1F4D6}', title: 'Craft Provenance', desc: "Every listing carries a verified story: who made it, how, and why it's priced that way." },
  { icon: '\u{1F399}\uFE0F', title: 'Voice First', desc: 'Artisans describe their piece in Kannada or English — the app does the rest.' },
];

export default function Home() {
  return (
    <main className="page">
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero__bg" aria-hidden="true" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, width: '100%' }}>
          <span className="hero__eyebrow">🌊 Coastal Karnataka · Kasuti · Beedu</span>

          <h1 className="hero__title" id="hero-heading">
            Where every craft<br />
            tells its own <em>story</em>
          </h1>

          <p className="hero__sub">
            KalaHaat is a voice-friendly platform where artisans photograph a piece,
            get an AI-drafted listing with a craft story and fair price, and sell directly to buyers.
          </p>

          <div className="hero__cta">
            <Link to="/shop" className="btn btn-primary btn-lg" id="hero-browse">
              Browse Shop
            </Link>
            <Link to="/gallery" className="btn btn-ghost btn-lg" id="hero-gallery">
              Enter Gallery
            </Link>
          </div>
        </div>

        <div className="hero__scroll-hint" aria-hidden="true">
          <span>Scroll</span>
          <span>↓</span>
        </div>
      </section>

      {/* Features */}
      <section className="features" aria-labelledby="features-heading">
        <div className="container">
          <h2
            id="features-heading"
            style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-10)', letterSpacing: '-0.02em' }}
          >
            Built for artisans, loved by buyers
          </h2>

          <div className="features__grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="feature-card">
                <div className="feature-card__icon" aria-hidden="true">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <div className="container">
          <p style={{ color: 'var(--color-text-2)', marginBottom: 'var(--space-5)' }}>
            Ready to set up your shop?
          </p>
          <Link to="/login" className="btn btn-accent btn-lg" id="home-seller-cta">
            Start selling — it&apos;s free
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          &copy; 2026 KalaHaat &middot; Built for PS 4.2 &middot; Digital Market Access for Local Artisans
        </div>
      </footer>
    </main>
  );
}
