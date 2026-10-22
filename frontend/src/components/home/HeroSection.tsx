import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function HeroSection() {
  const { isArtisan } = useAuth();

  return (
    <section className="hero-editorial" aria-label="Kaarigar Introduction">
      <div className="hero-editorial__container">
        {/* Top Eyebrow */}
        <div className="hero-editorial__eyebrow">
          <span className="hero-editorial__badge">LIVING CRAFT ARCHIVE</span>
          <span className="hero-editorial__provenance">PRESERVING TIME-HONOURED INDIAN MASTERWORKS</span>
        </div>

        {/* Main Headline Grid */}
        <div className="hero-editorial__grid">
          <div className="hero-editorial__text-col">
            <h1 className="hero-editorial__headline">
              Every object has a maker. <br />
              <em>Every maker has a story.</em>
            </h1>

            <p className="hero-editorial__lead">
              Discover authentic handcrafted treasures directly from India’s master artisans. 
              Each creation carries generational wisdom, with 100% of every acquisition flowing directly to the makers.
            </p>

            <div className="hero-editorial__cta-group">
              <Link to="/gallery" className="hero-btn hero-btn--primary" id="hero-explore-collection">
                <span>Explore Gallery</span>
                <span className="hero-btn__arrow">→</span>
              </Link>

              {isArtisan && (
                <Link to="/dashboard" className="hero-btn hero-btn--ghost" id="hero-sell-craft">
                  <span>Artisan Atelier Portal</span>
                </Link>
              )}
            </div>

            <div className="hero-editorial__metrics">
              <div className="metric-item">
                <span className="metric-val">100%</span>
                <span className="metric-lbl">Direct Artisan Support</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-val">6</span>
                <span className="metric-lbl">Protected Traditions</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-val">4,000 Yrs</span>
                <span className="metric-lbl">Continuous Lineage</span>
              </div>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="hero-editorial__visual-col">
            <div className="hero-visual-card">
              <div className="hero-visual-card__frame">
                <img
                  src="/images/pahari.jpg"
                  alt="Pahari Miniature Painting detail"
                  className="hero-visual-card__img"
                  loading="eager"
                />
                <div className="hero-visual-card__tag">
                  <span className="tag-roman">EXHIBIT I</span>
                  <span className="tag-craft">Kangra Kalam Wasli</span>
                </div>
              </div>
              <div className="hero-visual-card__info">
                <div className="hero-visual-card__title-row">
                  <div>
                    <h3 className="hero-visual-card__title">Radha & Krishna in the Groves of Kangra</h3>
                    <span className="hero-visual-card__vernacular">काँगड़ा लघु चित्रकला</span>
                  </div>
                  <span className="hero-visual-card__price">₹48,500</span>
                </div>
                <p className="hero-visual-card__artisan">
                  By Pandit Ram Swaroop Sharma · 4th Generation Wasli Painter · Kangra Valley
                </p>
                <div className="hero-visual-card__footer">
                  <Link to="/shop/pahari-miniature" className="hero-visual-card__link">
                    Discover Its Sacred Story →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Cue */}
        <div className="hero-editorial__scroll-cue">
          <a href="#categories" className="scroll-cue-link" aria-label="Scroll to discover craft disciplines">
            <span className="scroll-cue-text">SCROLL TO DISCOVER DISCIPLINES</span>
            <span className="scroll-cue-line" />
          </a>
        </div>
      </div>
    </section>
  );
}
