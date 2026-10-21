import { useNavigate, Link } from 'react-router-dom';
import { useWishlist, useProducts } from '../data/productStore';
import { useCart } from '../contexts/CartContext';

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const wishlistedItems = products.filter((p) => wishlist.includes(p.id));
  // Price with platform fee: artisan price + 5%
  const displayPrice = (price: number) => Math.round(price * 1.05);

  return (
    <main className="shop-page" role="main" aria-label="Your Wishlist">
      <section className="shop-header">
        <div className="shop-header__inner">
          <span className="section-eyebrow">✦ KAARIGAR · CURATED WISHLIST ✦</span>
          <h1 className="shop-header__title">Your Saved Masterworks</h1>
          <p className="shop-header__desc">
            {wishlistedItems.length === 0
              ? 'Your wishlist is empty. Browse the collection and save pieces that speak to you.'
              : `${wishlistedItems.length} masterwork${wishlistedItems.length > 1 ? 's' : ''} saved to your private collection.`}
          </p>
        </div>
      </section>

      <section className="shop-grid-section">
        <div className="shop-grid-section__inner">
          {wishlistedItems.length === 0 ? (
            <div className="shop-empty-state">
              <div className="empty-icon">♡</div>
              <h3>No masterworks saved yet</h3>
              <p>Explore the curated collection and save pieces to your wishlist.</p>
              <Link to="/shop" className="dash-btn dash-btn--primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                Browse Collection
              </Link>
            </div>
          ) : (
            <div className="craft-grid">
              {wishlistedItems.map((prod) => {
                const finalPrice = displayPrice(prod.price);
                const platformFee = finalPrice - prod.price;
                return (
                  <article key={prod.id} className="shop-craft-card">
                    <div className="shop-craft-card__media">
                      <Link to={`/shop/${prod.id}`} className="media-link">
                        <img src={prod.image} alt={prod.title} className="craft-card-img" loading="lazy" />
                      </Link>
                      <button
                        type="button"
                        className="wishlist-heart-btn active"
                        onClick={() => toggleWishlist(prod.id)}
                        aria-label="Remove from wishlist"
                      >
                        ♥
                      </button>
                      <div className="craft-payout-pill">
                        <span>{prod.directArtisanSharePercent || 85}% Direct Payout</span>
                      </div>
                    </div>

                    <div className="shop-craft-card__body">
                      <div className="card-top-meta">
                        <span className="card-tradition">{prod.craftTradition}</span>
                        <span className="card-region">{prod.region}</span>
                      </div>
                      <h3 className="card-title">
                        <Link to={`/shop/${prod.id}`}>{prod.title}</Link>
                      </h3>
                      {prod.vernacularTitle && <span className="card-vernacular">{prod.vernacularTitle}</span>}
                      <p className="card-artisan-by">By <strong>{prod.artisan}</strong></p>

                      <div className="card-price-row">
                        <div className="card-price">
                          <span className="cur">₹</span>
                          <span className="val">{finalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#8a7a6a' }}>incl. ₹{platformFee.toLocaleString('en-IN')} platform fee</span>
                      </div>

                      <div className="card-actions">
                        <Link to={`/shop/${prod.id}`} className="card-btn-story">
                          <span>Discover Story</span><span className="arrow">→</span>
                        </Link>
                        <button type="button" className="card-btn-cart" onClick={() => { addToCart(prod); navigate('/shop'); }}>
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
