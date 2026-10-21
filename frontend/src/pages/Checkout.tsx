import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount, directArtisanTotal } = useCart();

  const [name, setName] = useState('Ananya Sen');
  const [email, setEmail] = useState('ananya.sen@example.com');
  const [phone, setPhone] = useState('+91 98201 55432');
  const [address, setAddress] = useState('42, Gulmohar Enclave, Malabar Hill');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('400006');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'inspection'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderId = `KG-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderData = {
      id: orderId,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      items: cart,
      totalAmount,
      directArtisanTotal,
      customer: { name, email, phone, address, city, state, pinCode },
      paymentMethod,
      status: 'Confirmed & Sent to Atelier',
    };

    try {
      const existing = localStorage.getItem('kaarigar_orders_v1');
      const orders = existing ? JSON.parse(existing) : [];
      orders.unshift(orderData);
      localStorage.setItem('kaarigar_orders_v1', JSON.stringify(orders));
    } catch {
      // ignore
    }

    clearCart();
    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/orders/${orderId}`);
    }, 600);
  };

  if (cart.length === 0) {
    return (
      <main className="checkout-page" role="main">
        <div className="container" style={{ maxWidth: 700, padding: '6rem 1rem', textAlign: 'center' }}>
          <div className="empty-cart-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--terracotta)' }}>✦</div>
          <h1 className="checkout-title" style={{ marginBottom: '1rem' }}>Your Curatorial Bag is Empty</h1>
          <p style={{ color: 'var(--graphite)', marginBottom: '2rem' }}>
            You haven't reserved any masterworks yet. Explore our protected craft disciplines to begin your collection.
          </p>
          <Link to="/shop" className="hero-btn hero-btn--primary">
            Explore Collection →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page" role="main" aria-label="Acquisition Checkout">
      <div className="checkout-page__inner">
        {/* Top Header */}
        <div className="checkout-topbar">
          <Link to="/shop" className="checkout-back-link">
            ← Continue Exploring Collection
          </Link>
          <span className="checkout-secure-badge">
            256-Bit Encrypted Archival Escrow
          </span>
        </div>

        <div className="checkout-grid">
          {/* Left Column: Delivery & Payment Details */}
          <div className="checkout-form-col">
            <form onSubmit={handlePlaceOrder} className="checkout-form">
              {/* Shipping Address */}
              <div className="checkout-card">
                <span className="checkout-card__step">STEP 01</span>
                <h2 className="checkout-card__title">Archival Transit Destination</h2>
                <p className="checkout-card__desc">
                  Where should the master artisan atelier dispatch your insured crate?
                </p>

                <div className="form-group">
                  <label htmlFor="c-name">Full Collector Name *</label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="c-email">Email for Provenance Deeds *</label>
                    <input
                      id="c-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-phone">Contact Mobile (+91) *</label>
                    <input
                      id="c-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="c-address">Street Address / Estate *</label>
                  <input
                    id="c-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="c-city">City *</label>
                    <input
                      id="c-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-state">State *</label>
                    <input
                      id="c-state"
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-pin">Postal Code *</label>
                    <input
                      id="c-pin"
                      type="text"
                      required
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-card">
                <span className="checkout-card__step">STEP 02</span>
                <h2 className="checkout-card__title">Payment Settlement Method</h2>
                <p className="checkout-card__desc">
                  Funds are held in secure escrow and released directly to the artisan upon safe delivery.
                </p>

                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                    />
                    <div className="option-content">
                      <span className="option-title">UPI Instant Settlement</span>
                      <span className="option-sub">GPay, PhonePe, Paytm, BHIM, or any UPI App</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <div className="option-content">
                      <span className="option-title">Netbanking & Credit / Debit Card</span>
                      <span className="option-sub">HDFC, ICICI, SBI, Axis, Amex, Visa, Mastercard</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'inspection' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="inspection"
                      checked={paymentMethod === 'inspection'}
                      onChange={() => setPaymentMethod('inspection')}
                    />
                    <div className="option-content">
                      <span className="option-title">Archival Reserve upon Delivery</span>
                      <span className="option-sub">Inspect physical craftsmanship before releasing balance</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="checkout-submit-btn"
                id="checkout-confirm"
              >
                <span>{isSubmitting ? 'Inscribing Order…' : `Confirm Acquisition · ₹${totalAmount.toLocaleString('en-IN')}`}</span>
                <span className="arrow">→</span>
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary & Payout Breakdown */}
          <div className="checkout-summary-col">
            <div className="summary-sticky-card">
              <h3 className="summary-heading">Acquisition Summary ({cart.length} Masterpiece{cart.length === 1 ? '' : 's'})</h3>

              {/* Itemized list */}
              <div className="summary-items-list">
                {cart.map((item) => (
                  <div key={item.object.id} className="summary-item">
                    <img src={item.object.image} alt={item.object.title} className="summary-item__img" />
                    <div className="summary-item__details">
                      <span className="summary-item__tradition">{item.object.craftTradition}</span>
                      <h4 className="summary-item__title">{item.object.title}</h4>
                      <span className="summary-item__artisan">By {item.object.artisan}</span>

                      <div className="summary-item__qty-row">
                        <div className="qty-picker">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.object.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.object.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => removeFromCart(item.object.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="summary-item__price">
                      ₹{(item.object.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="summary-financials">
                <div className="fin-row">
                  <span>Gross Masterpiece Value</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="fin-row">
                  <span>Insured Archival Courier</span>
                  <span className="text-green">Complimentary</span>
                </div>
                <div className="fin-row total-row">
                  <span>Total Acquisition Due</span>
                  <span className="total-val">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Direct Artisan Impact Note */}
              <div className="direct-artisan-callout">
                <div className="callout-icon">✦</div>
                <div className="callout-content">
                  <strong>Direct Financial Return:</strong>
                  <p>
                    <strong>₹{directArtisanTotal.toLocaleString('en-IN')}</strong> of this order will be disbursed directly to the master artisans’ guild bank accounts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
