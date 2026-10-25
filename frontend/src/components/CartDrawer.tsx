import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { handleImageError, getFallbackForCraft } from '../utils/imageFallback';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    totalItems,
    platformFeeTotal,
    taxTotal,
    directArtisanTotal,
  } = useCart();

  const [isReserved, setIsReserved] = useState(false);
  const [reservationCode, setReservationCode] = useState('');

  if (!isCartOpen) return null;

  const handleReserve = () => {
    const code = 'KG-' + Math.floor(100000 + Math.random() * 900000);
    setReservationCode(code);
    setIsReserved(true);
  };

  const handleFinish = () => {
    clearCart();
    setIsReserved(false);
    setIsCartOpen(false);
    navigate('/shop');
  };

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <div
        className="cart-drawer"
        role="dialog"
        aria-labelledby="cart-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart__header">
          <div>
            <span className="cart__eyebrow">ACQUISITION RESERVATIONS</span>
            <h3 id="cart-title" className="cart__title">
              Curatorial Bag ({totalItems})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="cart__close-btn"
            aria-label="Close bag"
          >
            ✕
          </button>
        </div>

        {isReserved ? (
          <div className="cart__confirmation">
            <div className="confirmation__icon">✦</div>
            <h4 className="confirmation__title">Acquisition Dossier Reserved</h4>
            <p className="confirmation__code">
              RESERVATION № <strong>{reservationCode}</strong>
            </p>
            <p className="confirmation__desc">
              Your inquiry has been placed directly with the master artisans' guilds. An archival custodian will prepare the certified provenance documentation and coordinate insured museum white-glove transit.
            </p>
            <div className="confirmation__share-notice">
              Direct artisan transfer: <strong>₹{directArtisanTotal.toLocaleString('en-IN')}</strong> allocated directly to atelier funds.
            </div>
            <button
              onClick={handleFinish}
              className="btn btn-primary btn-block"
              style={{ marginTop: '1.5rem' }}
            >
              Return to Gallery
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="cart__empty">
            <div className="cart__empty-icon" style={{ fontSize: '2.5rem', color: 'var(--terracotta)' }}>✦</div>
            <h4 className="cart__empty-title">Your Curatorial Bag is Empty</h4>
            <p className="cart__empty-desc">
              Explore the digital exhibition space and select any handcrafted masterwork to inspect its provenance and reserve for acquisition.
            </p>
            <Link
              to="/gallery"
              onClick={() => setIsCartOpen(false)}
              className="btn btn-outline"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Explore the Collection
            </Link>
          </div>
        ) : (
          <>
            <div className="cart__items-list">
              {cart.map(({ object, quantity }) => (
                <article key={object.id} className="cart-item">
                  <img
                    src={object.image}
                    alt={object.title}
                    className="cart-item__thumb"
                    onError={(e) => handleImageError(e, getFallbackForCraft(object.craftTradition || object.category))}
                  />
                  <div className="cart-item__info">
                    <div className="cart-item__tradition">
                      {object.craftTradition}
                    </div>
                    <h5 className="cart-item__title">{object.title}</h5>
                    <div className="cart-item__artisan">
                      By {object.artisan} · {object.state}
                    </div>
                    <div className="cart-item__price">
                      ₹ {(Math.round(object.price * 1.05) * quantity).toLocaleString('en-IN')}
                      <span style={{ fontSize: '0.7rem', color: '#8a7a6a', display: 'block' }}>incl. 5% platform fee</span>
                    </div>

                    <div className="cart-item__controls">
                      <div className="quantity-stepper">
                        <button
                          onClick={() => updateQuantity(object.id, quantity - 1)}
                          aria-label="Decrease quantity"
                          className="stepper-btn"
                        >
                          –
                        </button>
                        <span className="stepper-val">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(object.id, quantity + 1)}
                          aria-label="Increase quantity"
                          className="stepper-btn"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(object.id)}
                        className="cart-item__remove"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Economic Equity Summary */}
            <div className="cart__footer">
              <div className="cart__equity-card">
                <div className="equity-card__header">
                  <span>Direct Artisan Compensation</span>
                  <span className="equity-card__amount">
                    ₹ {directArtisanTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="equity-card__note">
                  Over 85% of acquisition fees transfer unhindered to artisan families, guild welfare funds, and apprentice stipends.
                </p>
              </div>

              <div className="cart__total-row">
                <span className="total-label">Actual Price</span>
                <span className="total-value">₹ {directArtisanTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="cart__total-row" style={{ fontSize: '0.82rem', color: '#7A7570' }}>
                <span className="total-label">Platform Fee (5%)</span>
                <span className="total-value">₹ {platformFeeTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="cart__total-row" style={{ fontSize: '0.82rem', color: '#7A7570' }}>
                <span className="total-label">Tax (5% GST)</span>
                <span className="total-value">₹ {taxTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="cart__total-row" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.6rem', marginTop: '0.25rem' }}>
                <span className="total-label"><strong>Total</strong></span>
                <span className="total-value"><strong>₹ {totalAmount.toLocaleString('en-IN')}</strong></span>
              </div>

              <p className="cart__shipping-note">
                Includes museum-grade insured packaging & provenance certificate signed by master craftsman.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="btn btn-primary btn-block btn-reserve"
                  id="btn-go-to-cart"
                  style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}
                >
                  Proceed to Secure Checkout →
                </Link>
                <button
                  onClick={handleReserve}
                  className="btn btn-outline btn-block"
                  id="btn-reserve-acquisition"
                >
                  Quick Reserve Inquiry
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
