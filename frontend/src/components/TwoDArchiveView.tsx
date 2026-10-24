import type { CraftObject, CraftCategory } from '../types';
import { useProducts } from '../data/productStore';
import { handleImageError, getFallbackForCraft } from '../utils/imageFallback';

interface TwoDArchiveViewProps {
  selectedCategory: CraftCategory;
  onSelectObject: (obj: CraftObject) => void;
  products?: CraftObject[];
}

export const TwoDArchiveView = ({
  selectedCategory,
  onSelectObject,
  products,
}: TwoDArchiveViewProps) => {
  const { products: storeProducts } = useProducts();
  const source = products && products.length > 0 ? products : storeProducts;
  const visibleObjects =
    selectedCategory === 'all'
      ? source
      : source.filter((o) => o.category === selectedCategory);

  return (
    <div className="archive-2d-view">
      <div className="container">
        {/* Editorial Heading */}
        <div className="archive-intro-header">
          <div className="archive-badge">CURATORIAL ARCHIVE · DIGITAL EXHIBITION</div>
          <h2 className="archive-main-title">Permanent Collection</h2>
          <p className="archive-subtext">
            Handcrafted Indian masterworks cataloged with full material provenance, artisan lineages, and verified acquisition availability.
          </p>
        </div>

        {/* Catalog Grid */}
        <div className="archive-grid">
          {visibleObjects.map((obj) => (
            <article
              key={obj.id}
              className="archive-card"
              onClick={() => onSelectObject(obj)}
            >
              <div className="archive-card__media">
                <img
                  src={obj.image}
                  alt={obj.title}
                  className="archive-card__img"
                  loading="lazy"
                  onError={(e) => handleImageError(e, getFallbackForCraft(obj.craftTradition || obj.category))}
                />
                <span className="archive-card__num">{obj.romanNumeral}</span>
                <span className="archive-card__pill">{obj.craftTradition}</span>
              </div>

              <div className="archive-card__content">
                <div className="archive-card__geo">
                  {obj.region}, {obj.state}
                </div>

                <h3 className="archive-card__title">{obj.title}</h3>

                <p className="archive-card__artisan">
                  By <strong>{obj.artisan}</strong> · {obj.atelier}
                </p>

                <p className="archive-card__summary">
                  {obj.makingStory.summary}
                </p>

                <div className="archive-card__footer">
                  <div className="archive-card__price">
                    <span className="price-tag">Acquisition</span>
                    <span className="price-num">
                      ₹ {Math.round(obj.price * 1.10).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    className="btn btn-primary btn-sm archive-inspect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectObject(obj);
                    }}
                  >
                    Inspect Dossier →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
