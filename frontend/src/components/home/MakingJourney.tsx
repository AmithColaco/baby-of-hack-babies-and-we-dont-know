import { useState } from 'react';

interface Stage {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  materials: string[];
  traditionExample: string;
}

const STAGES: Stage[] = [
  {
    number: '01',
    title: 'Earth & Mineral Alchemy',
    subtitle: 'Reclaiming Nature’s Raw Pigments',
    description: 'Before a single brushstroke is laid, stones and earth must be ground. Himalayan lapis lazuli, malachite, riverbed clay, and natural acacia resins are hand-mortared for up to 14 hours until a velvety emulsion is born.',
    materials: ['Lapis Lazuli (Afghan Ultramarine)', 'Malachite Green', 'Aravalli Quartz Rock', 'Katira Tree Gum'],
    traditionExample: 'Kangra Miniature & Jaipur Blue Faience',
  },
  {
    number: '02',
    title: 'Gossamer & Structural Preparation',
    subtitle: 'Wasli Paper, Pit Looms & Wax Filigree',
    description: 'Cotton and rice straw are layered into acid-free Wasli sheets and burnished with hot agate stones until glossy like ivory. Subterranean trenches maintain humidity for silk thread, while honeycomb wax is drawn into hair-thin cording.',
    materials: ['Handmade Wasli Sheets', 'Mulberry Silk Yarns', 'Forest Honey Beeswax', 'River Alluvium'],
    traditionExample: 'Chanderi Brocade & Bastar Lost-Wax',
  },
  {
    number: '03',
    title: 'The Hand of the Master',
    subtitle: 'Micro-Illumination & Fire Transformation',
    description: 'Guided by muscle memory inherited over centuries, the maker works without preliminary stencils. Single-squirrel-hair kalams illuminate eyelashes on Radha; pit kilns consume wax while molten bronze claims its eternal shape.',
    materials: ['Squirrel Throat Hair Brush', '24K Beaten Gold Leaf (Varq)', 'Charcoal Pit Kiln', 'Bell Metal Ingot'],
    traditionExample: 'Kundan Meenakari & Dhokra Bronze',
  },
  {
    number: '04',
    title: 'The Living Heirloom',
    subtitle: 'Direct Provenance & Cultural Continuity',
    description: 'Each piece leaves the atelier accompanied by an archival provenance certificate signed by the master artist, direct banking disbursement records, and an indelible digital record guaranteeing its authenticity forever.',
    materials: ['Teak & Archival Mount', 'GI Verification Seal', 'Artisan Authenticity Certificate'],
    traditionExample: 'KAARIGAR Verified Masterwork',
  },
];

export function MakingJourney() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section id="process" className="making-journey" aria-label="Making Process">
      <div className="making-journey__inner">
        <div className="making-journey__header">
          <div className="section-eyebrow">UNBROKEN TRANSMISSION</div>
          <h2 className="section-title">From Raw Earth to Sacred Object</h2>
          <p className="section-subtitle">
            An Indian craft object is never merely assembled; it is transformed through patience, 
            natural alchemical reactions, and devotional discipline.
          </p>
        </div>

        {/* Stage Timeline Navigation Tabs */}
        <div className="making-journey__tabs">
          {STAGES.map((stg, idx) => (
            <button
              key={stg.number}
              type="button"
              className={`journey-tab ${idx === activeStage ? 'active' : ''}`}
              onClick={() => setActiveStage(idx)}
            >
              <span className="journey-tab__num">{stg.number}</span>
              <span className="journey-tab__title">{stg.title}</span>
            </button>
          ))}
        </div>

        {/* Active Stage Display Card */}
        <div className="making-journey__card">
          <div className="journey-card__left">
            <span className="journey-card__stage-tag">STAGE {STAGES[activeStage].number} OF 04</span>
            <h3 className="journey-card__headline">{STAGES[activeStage].title}</h3>
            <span className="journey-card__subtitle">{STAGES[activeStage].subtitle}</span>
            <p className="journey-card__desc">{STAGES[activeStage].description}</p>

            <div className="journey-card__materials">
              <span className="materials-title">Key Elements & Ingredients:</span>
              <div className="materials-tags">
                {STAGES[activeStage].materials.map((mat) => (
                  <span key={mat} className="material-pill">{mat}</span>
                ))}
              </div>
            </div>

            <div className="journey-card__tradition">
              <span>Practiced in: <strong>{STAGES[activeStage].traditionExample}</strong></span>
            </div>
          </div>

          <div className="journey-card__right">
            <div className="journey-card__image-box">
              <img
                src={
                  activeStage === 0 ? '/images/pahari.jpg' :
                  activeStage === 1 ? '/images/textile.jpg' :
                  activeStage === 2 ? '/images/dhokra.jpg' : '/images/jewellery.jpg'
                }
                alt={STAGES[activeStage].title}
                className="journey-card__img"
              />
              <div className="journey-card__overlay-badge">
                <span>{STAGES[activeStage].subtitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
