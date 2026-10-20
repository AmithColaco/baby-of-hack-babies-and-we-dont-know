import type { CraftObject } from '../types';

interface ProductCardProps {
  product: CraftObject;
  onSelect?: (product: CraftObject) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <article
      className="product-card"
      onClick={() => onSelect && onSelect(product)}
    >
      <div className="product-card__media">
        <img src={product.image} alt={product.title} className="product-card__img" />
        <span className="product-card__pill">{product.craftTradition}</span>
      </div>
      <div className="product-card__content">
        <h4 className="product-card__title">{product.title}</h4>
        <div className="product-card__artisan">{product.artisan} · {product.region}</div>
        <div className="product-card__price">₹ {product.price.toLocaleString('en-IN')}</div>
      </div>
    </article>
  );
}
