import { Link } from 'react-router-dom';
import { handleImageError } from '../../utils/imageFallback';

interface ArtisanItem {
  id: string;
  name: string;
  title: string;
  tradition: string;
  region: string;
  image: string;
  quote: string;
  bio: string;
  directShare: number;
  productSlug: string;
}

const ARTISANS: ArtisanItem[] = [
  {
    id: 'ram-swaroop-sharma',
    name: 'Pandit Ram Swaroop Sharma',
    title: 'National Master Artist · 4th Generation Wasli Painter',
    tradition: 'Kangra Miniature Kalam',
    region: 'Kangra Valley, Himachal Pradesh',
    image: '/images/artisan.jpg',
    quote: 'In Kangra painting, we do not paint with the brush; we breathe through the squirrel hair onto the wasli. When the stone burnishes the paper, the light wakes up.',
    bio: 'Preserving the late-18th century Gita Govinda lineage. His works reside in the Victoria & Albert Museum and private royal collections.',
    directShare: 88,
    productSlug: 'pahari-miniature',
  },
  {
    id: 'bismillah-ansari',
    name: 'Master Weaver Bismillah Ansari',
    title: 'Sant Kabir National Awardee · 5th Generation Weaver',
    tradition: 'Handwoven Chanderi Brocade',
    region: 'Chanderi, Madhya Pradesh',
    image: '/images/artisan_weaver.jpg',
    quote: 'A true Chanderi should pass through a ring and reflect the moonlight like running river water. It is not cloth; it is woven breath.',
    bio: 'Leads an atelier of twenty master pit loom weavers in Pranpur village dedicated to preserving pure silver-gilt zari techniques.',
    directShare: 86,
    productSlug: 'chanderi-handwoven-silk',
  },
  {
    id: 'sukhruram-ghadwa',
    name: 'Sukhruram Ghadwa',
    title: 'Tribal Master Sculptor · Ghadwa Indigenous Community',
    tradition: 'Bastar Lost-Wax Dhokra',
    region: 'Kondagaon, Bastar, Chhattisgarh',
    image: '/images/artisan_metalcraft.jpg',
    quote: 'When the clay mold breaks open, what emerges has lived in the fire. No two pieces ever breathe the same spirit.',
    bio: 'Practices the primordial 4,000-year Harappan lost-wax casting where single-use riverbed clay molds are destroyed forever during the bronze pour.',
    directShare: 90,
    productSlug: 'bastar-dhokra-brass',
  },
];

export function ArtisanHighlights() {
  return (
    <section id="artisans" className="artisan-highlights" aria-label="Meet the Master Artisans">
      <div className="artisan-highlights__inner">
        <div className="artisan-highlights__header">
          <div className="section-eyebrow">THE LIVING HANDS</div>
          <h2 className="section-title">Meet the Masters Behind the Craft</h2>
          <p className="section-subtitle">
            Every piece on Kaarigar bears the unbroken lineage of a family and guild. 
            We bypass middlemen so that honors, recognition, and direct compensation flow directly to the artisan.
          </p>
        </div>

        <div className="artisan-highlights__cards">
          {ARTISANS.map((artisan) => (
            <article key={artisan.id} className="artisan-card">
              <div className="artisan-card__media">
                <img
                  src={artisan.image}
                  alt={artisan.name}
                  className="artisan-card__img"
                  loading="lazy"
                  onError={(e) => handleImageError(e, '/images/artisan.jpg')}
                />
                <div className="artisan-card__payout-tag">
                  <span>Master Artisan</span>
                </div>
              </div>

              <div className="artisan-card__body">
                <div className="artisan-card__meta">
                  <span className="artisan-card__tradition">{artisan.tradition}</span>
                  <span className="artisan-card__region">{artisan.region}</span>
                </div>

                <h3 className="artisan-card__name">{artisan.name}</h3>
                <span className="artisan-card__title">{artisan.title}</span>

                <blockquote className="artisan-card__quote">
                  “{artisan.quote}”
                </blockquote>

                <p className="artisan-card__bio">{artisan.bio}</p>

                <div className="artisan-card__footer">
                  <Link
                    to={`/shop/${artisan.productSlug}`}
                    className="artisan-card__link"
                  >
                    <span>Inspect Masterpiece & Story</span>
                    <span className="arrow">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
