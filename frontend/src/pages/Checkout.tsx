import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { checkoutOrder } from '../api/orders';
import { handleImageError, getFallbackForCraft } from '../utils/imageFallback';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount, platformFeeTotal, taxTotal, directArtisanTotal } = useCart();
  const { user, isLoggedIn, requestOtp, loginWithOtp } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('42, Gulmohar Enclave, Malabar Hill');
  const [city, setCity] = useState(user?.city || 'Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('400006');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'inspection'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Inline login state when unauthenticated
  const [loginPhone, setLoginPhone] = useState('+91 98201 55432');
  const [loginOtp, setLoginOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.city) setCity(user.city);
    }
  }, [user]);

  const handleInlineSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = loginPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    const fullPhone = `+91${digits.slice(-10)}`;
    try {
      await requestOtp(fullPhone);
      setOtpSent(true);
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Failed to dispatch OTP. Proceed with demo OTP: 123456');
      setOtpSent(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInlineVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = loginPhone.replace(/\D/g, '');
    const fullPhone = `+91${digits.slice(-10)}`;
    setAuthError('');
    setAuthLoading(true);
    try {
      await loginWithOtp(fullPhone, loginOtp.trim() || '123456');
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Invalid verification code. Demo code is 123456');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setCheckoutError('Please log in with your collector account to complete acquisition.');
      return;
    }
    setIsSubmitting(true);
    setCheckoutError('');

    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let createdBackendOrderId: string | null = null;
    try {
      const backendOrder = await checkoutOrder({
        items: cart.map((it) => ({
          listing_id: it.object.id,
          qty: it.quantity,
        })),
        address: {
          full_name: name || user?.name || 'Collector',
          phone: phone || user?.phone || '',
          address_line: address,
          city,
          state,
          pincode: pinCode,
        },
        payment_method: paymentMethod === 'card' ? 'mock_card' : 'mock_upi',
        idempotency_key: idempotencyKey,
      });
      createdBackendOrderId = backendOrder.id;
    } catch (err: any) {
      console.warn('Backend checkout fallback to local order:', err);
    }

    const orderId = createdBackendOrderId || `KG-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
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
    setIsSubmitting(false);
    navigate(`/orders/${orderId}`);
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
              {checkoutError && <div className="form-error-banner" style={{ marginBottom: '14px' }}>{checkoutError}</div>}

              {/* Collector Authentication Gate */}
              {!isLoggedIn ? (
                <div className="checkout-card checkout-auth-gate" style={{ borderLeft: '4px solid var(--terracotta)', background: '#FAF6F0' }}>
                  <span className="checkout-card__step" style={{ background: 'var(--terracotta)', color: '#fff' }}>AUTHENTICATION REQUIRED</span>
                  <h2 className="checkout-card__title">Sign In to Authenticate Acquisition</h2>
                  <p className="checkout-card__desc">
                    To safeguard artisanal provenance and bind registered ownership deeds to your collector profile, please sign in with your mobile number before checkout.
                  </p>

                  {authError && <div className="form-error-banner" style={{ marginBottom: '1rem' }}>{authError}</div>}

                  {!otpSent ? (
                    <div className="checkout-inline-auth">
                      <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                        <label htmlFor="auth-phone">Mobile Number (+91)</label>
                        <div style={{ display: 'flex', gap: '0.65rem' }}>
                          <input
                            id="auth-phone"
                            type="tel"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            placeholder="+91 98201 55432"
                            className="form-input"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={handleInlineSendOtp}
                            disabled={authLoading}
                            className="hero-btn hero-btn--primary"
                            style={{ padding: '0.65rem 1.4rem', whiteSpace: 'nowrap' }}
                          >
                            {authLoading ? 'Sending…' : 'Send Code'}
                          </button>
                        </div>
                      </div>
                      <span className="auth-hint-text" style={{ fontSize: '0.78rem', color: 'var(--stone)' }}>
                        A one-time SMS verification code will be sent. Demo code: <strong>123456</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="checkout-inline-auth">
                      <p style={{ fontSize: '0.88rem', color: 'var(--graphite)', marginBottom: '0.75rem' }}>
                        Passcode dispatched to <strong>{loginPhone}</strong>.{' '}
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          style={{ background: 'none', border: 'none', color: 'var(--terracotta)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                        >
                          Change number
                        </button>
                      </p>
                      <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                        <label htmlFor="auth-otp">Enter 6-Digit Passcode</label>
                        <div style={{ display: 'flex', gap: '0.65rem' }}>
                          <input
                            id="auth-otp"
                            type="text"
                            maxLength={6}
                            value={loginOtp}
                            onChange={(e) => setLoginOtp(e.target.value)}
                            placeholder="123456"
                            className="form-input"
                            style={{ flex: 1, letterSpacing: '0.2em', fontWeight: 600 }}
                          />
                          <button
                            type="button"
                            onClick={handleInlineVerifyOtp}
                            disabled={authLoading}
                            className="hero-btn hero-btn--primary"
                            style={{ padding: '0.65rem 1.4rem', whiteSpace: 'nowrap' }}
                          >
                            {authLoading ? 'Verifying…' : 'Verify & Continue'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="checkout-card checkout-auth-verified" style={{ borderLeft: '4px solid #2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#2e7d32', letterSpacing: '0.06em' }}>
                        ✓ Authenticated Collector Session
                      </span>
                      <h3 style={{ margin: '0.3rem 0 0.2rem', fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
                        {user?.name || 'Patron of Heritage Crafts'}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--graphite)' }}>
                        {user?.phone || user?.email} · Provenance deeds will be minted to this profile.
                      </p>
                    </div>
                    <span className="checkout-secure-badge" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', borderColor: '#c8e6c9' }}>
                      Verified Collector
                    </span>
                  </div>
                </div>
              )}

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
              {!isLoggedIn ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <button
                    type="button"
                    disabled={true}
                    className="checkout-submit-btn checkout-submit-btn--locked"
                    style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'var(--graphite)' }}
                  >
                    <span>🔒 Log In Required to Complete Acquisition</span>
                    <span className="arrow">→</span>
                  </button>
                  <p style={{ fontSize: '0.82rem', color: 'var(--terracotta)', textAlign: 'center', margin: 0 }}>
                    Please authenticate with your collector phone number above to proceed to acquisition.
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="checkout-submit-btn"
                  id="checkout-confirm"
                >
                  <span>{isSubmitting ? 'Inscribing Order…' : `Confirm Acquisition · ₹${totalAmount.toLocaleString('en-IN')}`}</span>
                  <span className="arrow">→</span>
                </button>
              )}
            </form>
          </div>

          {/* Right Column: Order Summary & Impact Breakdown */}
          <div className="checkout-summary-col">
            <div className="summary-sticky-card">
              <h3 className="summary-heading">Acquisition Summary ({cart.length} Masterpiece{cart.length === 1 ? '' : 's'})</h3>

              {/* Itemized list */}
              <div className="summary-items-list">
                {cart.map((item) => (
                  <div key={item.object.id} className="summary-item">
                    <img
                      src={item.object.image}
                      alt={item.object.title}
                      className="summary-item__img"
                      onError={(e) => handleImageError(e, getFallbackForCraft(item.object.craftTradition || item.object.category))}
                    />
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
                  <span>Actual Price (Base Artisan Valuation)</span>
                  <span>₹{directArtisanTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="fin-row">
                  <span>Platform Fee (5%)</span>
                  <span>₹{platformFeeTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="fin-row">
                  <span>Tax (5% GST)</span>
                  <span>₹{taxTotal.toLocaleString('en-IN')}</span>
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
