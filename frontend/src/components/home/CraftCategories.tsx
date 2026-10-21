import { Link } from 'react-router-dom';

interface CategoryItem {
  id: string;
  category: string;
  title: string;
  vernacular: string;
  region: string;
  image: string;
  description: string;
  accessionCount: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'paintings',
    category: 'paintings',
    title: 'Traditional Miniature Paintings',
    vernacular: 'लघु चित्रकला एवं तंजौर',
    region: 'Kangra Valley & Thanjavur',
    image: '/images/pahari.jpg',
    description: 'Rendered on acid-free handmade wasli paper using lapis lazuli, malachite, and single-hair squirrel tail brushes.',
    accessionCount: 'Kangra & Tanjore Lineage',
  },
  {
    id: 'ceramics',
    category: 'ceramics',
    title: 'Glazed Quartz Blue Pottery',
    vernacular: 'जयपुर नीली मृद्भाण्ड',
    region: 'Sanganer, Rajasthan',
    image: '/images/bluepottery.jpg',
    description: 'Zero clay formulation derived from crushed quartz crystal, glass cullet, and natural cobalt oxide brushwork.',
    accessionCount: 'Kripal Kumbh Guild',
  },
  {
    id: 'textiles',
    category: 'textiles',
    title: 'Handwoven Gossamer Brocades',
    vernacular: 'चंदेरी जरी रेशम वस्त्र',
    region: 'Chanderi, Madhya Pradesh',
    image: '/images/textile.jpg',
    description: 'Un-degummed pure mulberry silk woven on subterranean pit looms with real silver electroplated zari thread.',
    accessionCount: 'Pranpur Handloom Guild',
  },
  {
    id: 'metalcraft',
    category: 'metalcraft',
    title: 'Bastar Lost-Wax Bronze & Bidri',
    vernacular: 'बस्तर ढोकरा कांस्य शिल्पकला',
    region: 'Kondagaon, Bastar & Bidar',
    image: '/images/dhokra.jpg',
    description: '4,000-year Harappan cire-perdue casting using forest beeswax filigree and single-use riverbed clay molds.',
    accessionCount: 'Ghadwa Indigenous Clan',
  },
  {
    id: 'woodcraft',
    category: 'woodcraft',
    title: 'Lathe-Turned Lacquer Woodcraft',
    vernacular: 'चन्नपट्टण काष्ठ शिल्पकला',
    region: 'Channapatna, Karnataka',
    image: '/images/woodcraft.jpg',
    description: 'Turned from seasoned Ivory Wood (Wrightia tinctoria) and sealed with frictional heat of natural vegetable lac.',
    accessionCount: 'Tipu Sultan Atelier Lineage',
  },
  {
    id: 'jewellery',
    category: 'jewellery',
    title: 'Royal Kundan & Champlevé Enamel',
    vernacular: 'कुंदन मीनाकारी शाही आभूषण',
    region: 'Old Walled City, Jaipur',
    image: '/images/jewellery.jpg',
    description: 'Natural polki diamonds cold-fused in hyper-pure 24K gold foil, with secret champlevé enamel gardens on reverse.',
    accessionCount: 'Johari Bazaar Meenakar Darbar',
  },
];

export function CraftCategories() {
  return (
    <section id="categories" className="craft-categories" aria-label="Craft Disciplines">
      <div className="craft-categories__inner">
        <div className="craft-categories__header">
          <div className="section-eyebrow">DISCIPLINES OF MASTERY</div>
          <h2 className="section-title">Six Living Pillars of Indian Craftsmanship</h2>
          <p className="section-subtitle">
            Each category represents a preserved vernacular language where materials, geographical memory, 
            and spiritual devotion coalesce into singular collector objects.
          </p>
        </div>

        <div className="craft-categories__grid">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.category}`}
              className="cat-card"
              id={`cat-card-${cat.id}`}
            >
              <div className="cat-card__media">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="cat-card__img"
                  loading="lazy"
                />
                <div className="cat-card__overlay" />
                <span className="cat-card__num">0{idx + 1}</span>
              </div>
              <div className="cat-card__content">
                <div className="cat-card__meta">
                  <span className="cat-card__region">{cat.region}</span>
                  <span className="cat-card__badge">{cat.accessionCount}</span>
                </div>
                <h3 className="cat-card__title">{cat.title}</h3>
                <span className="cat-card__vernacular">{cat.vernacular}</span>
                <p className="cat-card__desc">{cat.description}</p>
                <div className="cat-card__cta">
                  <span>Explore Discipline</span>
                  <span className="cat-card__arrow">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
