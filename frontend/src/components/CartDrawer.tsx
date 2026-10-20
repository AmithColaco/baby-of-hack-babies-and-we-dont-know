import { useState } from 'react';
import { useCart } from '../contexts/CartContext';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    totalItems,
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
            <div className="cart__empty-icon">🏛️</div>
            <h4 className="cart__empty-title">Your Curatorial Bag is Empty</h4>
            <p className="cart__empty-desc">
              Explore the 3D exhibition space and select any handcrafted masterwork to inspect its provenance and reserve for acquisition.
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="btn btn-outline"
            >
              Explore the Collection
            </button>
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
                      ₹ {(object.price * quantity).toLocaleString('en-IN')}
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
                <span className="total-label">Total Value</span>
                <span className="total-value">
                  ₹ {totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <p className="cart__shipping-note">
                Includes museum-grade insured packaging & provenance certificate signed by master craftsman.
              </p>

              <button
                onClick={handleReserve}
                className="btn btn-primary btn-block btn-reserve"
                id="btn-reserve-acquisition"
              >
                Place Acquisition Reservation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
