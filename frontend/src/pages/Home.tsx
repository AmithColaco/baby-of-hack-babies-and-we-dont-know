import { useTranslation } from 'react-i18next';
import { HeroSection } from '../components/home/HeroSection';
import { CraftCategories } from '../components/home/CraftCategories';
import { FeaturedCarousel } from '../components/home/FeaturedCarousel';
import { ArtisanHighlights } from '../components/home/ArtisanHighlights';
import { MakingJourney } from '../components/home/MakingJourney';
import { SellerCallToAction } from '../components/home/SellerCallToAction';

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="kaarigar-home-editorial" role="main">
      {/* Section A: The Introduction */}
      <HeroSection />

      {/* Section A2: Verified Guild Impact Counters */}
      <section className="home-impact-metrics" style={{
        backgroundColor: '#FAF6EE',
        borderTop: '1px solid #E5D8C4',
        borderBottom: '1px solid #E5D8C4',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EFE6D5', padding: '4px 14px', borderRadius: '999px', color: '#8A2D19', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
            <span>✦</span> {t('women_shg.badge')}
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', color: '#1C160E', margin: '0 0 0.5rem 0' }}>
            {t('home.impact_title')}
          </h2>
          <p style={{ color: '#705F4D', fontSize: '0.95rem', maxWidth: '650px', margin: '0 auto 2.5rem auto', lineHeight: 1.55 }}>
            {t('home.impact_subtitle')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '10px', border: '1px solid #E2D5C3', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ display: 'block', fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#8A2D19', lineHeight: 1.1 }}>
                148+
              </span>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1C160E', marginTop: '6px' }}>
                {t('home.impact_artisans')}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#7A6B59', marginTop: '4px', display: 'block' }}>
                6 GI clusters across Karnataka, MP, Bastar & Rajasthan
              </span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '10px', border: '1px solid #E2D5C3', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ display: 'block', fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#2E6B38', lineHeight: 1.1 }}>
                ₹42.8 Lakhs
              </span>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1C160E', marginTop: '6px' }}>
                {t('home.impact_disbursed')}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#7A6B59', marginTop: '4px', display: 'block' }}>
                92% paid straight to artisan accounts via UPI escrow
              </span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '10px', border: '1px solid #E2D5C3', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ display: 'block', fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#1C2E4A', lineHeight: 1.1 }}>
                +280%
              </span>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1C160E', marginTop: '6px' }}>
                {t('home.impact_uplift')}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#7A6B59', marginTop: '4px', display: 'block' }}>
                Compared to conventional wholesale trader procurement
              </span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '10px', border: '1px solid #E2D5C3', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ display: 'block', fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#9C3826', lineHeight: 1.1 }}>
                68%
              </span>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1C160E', marginTop: '6px' }}>
                {t('home.impact_women')}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#7A6B59', marginTop: '4px', display: 'block' }}>
                {t('women_shg.kasuti_coop')}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.76rem', color: '#8C7A66', fontStyle: 'italic' }}>
            * {t('home.projections_note')}
          </div>
        </div>
      </section>

      {/* Section B: Discover the Crafts */}
      <CraftCategories />

      {/* Section C: The Featured Interactive Product Carousel */}
      <FeaturedCarousel />

      {/* Section D: Meet the Makers */}
      <ArtisanHighlights />

      {/* Section E: From Raw Material to Finished Object */}
      <MakingJourney />

      {/* Section F: Become a Seller */}
      <SellerCallToAction />

      {/* Section G: Closing Statement */}
      <section className="home-closing-statement">
        <div className="home-closing-statement__inner">
          <blockquote className="closing-quote">
            “Craft is not history trapped behind museum glass; it is prayer made visible with hands.”
          </blockquote>
          <div className="closing-provenance">
            <span>KAARIGAR ARCHIVAL COVENANT · GUARANTEED INDIGENOUS CUSTODIANSHIP</span>
          </div>
        </div>
      </section>
    </main>
  );
}
