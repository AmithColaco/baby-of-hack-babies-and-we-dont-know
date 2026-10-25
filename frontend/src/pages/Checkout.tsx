import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { checkoutOrder } from '../api/orders';
import { handleImageError, getFallbackForCraft } from '../utils/imageFallback';
import { generateQRDataUrl } from '../utils/qrCode';

export default function Checkout() {
  const { t } = useTranslation();
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
  const [courier, setCourier] = useState<'bluedart' | 'delhivery' | 'indiapost'>('bluedart');
  const [trackingNumberStub] = useState(() => 'BD-' + Math.floor(100000 + Math.random() * 900000));
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiRefId, setUpiRefId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Inline login state when unauthenticated
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
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

  // Generate dynamic Mock UPI QR code
  useEffect(() => {
    const upiUri = `upi://pay?pa=kaarigar@guild&pn=KAARIGAR%20Escrow&am=${totalAmount}&cu=INR&tn=Artisan%20Direct%20Acquisition`;
    generateQRDataUrl(upiUri, { width: 220, margin: 1 }).then(setUpiQrUrl);
    setUpiRefId(`UPI-REF-${Math.floor(10000000 + Math.random() * 90000000)}`);
  }, [totalAmount]);

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
      await requestOtp(fullPhone, 'phone');
      setOtpSent(true);
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Failed to dispatch verification code. Please try again.');
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
      await loginWithOtp(fullPhone, loginOtp.trim(), 'phone');
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Invalid verification code. Please check and try again.');
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
        courier: courier === 'bluedart' ? 'BlueDart Express' : courier === 'delhivery' ? 'Delhivery' : 'India Post SpeedPost',
        tracking_number: trackingNumberStub,
        upi_ref: paymentMethod === 'upi' ? upiRefId : undefined,
      } as any);
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
      courier: courier === 'bluedart' ? 'BlueDart Express' : courier === 'delhivery' ? 'Delhivery' : 'India Post SpeedPost',
      trackingNumber: trackingNumberStub,
      upiRef: paymentMethod === 'upi' ? upiRefId : undefined,
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
          <Link to="/gallery" className="hero-btn hero-btn--primary">
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
          <Link to="/gallery" className="checkout-back-link">
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
                        A one-time verification code will be sent to your phone.
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
                            placeholder="••••••"
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
                <span className="checkout-card__step">{t('checkout.step1')}</span>
                <h2 className="checkout-card__title">{t('checkout.step1')}</h2>
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

              {/* Step 02: Logistics & Courier Selection Stub */}
              <div className="checkout-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="checkout-card__step">{t('checkout.step2')}</span>
                  <span style={{ fontSize: '0.72rem', background: '#F0ECE1', color: '#5C4C3B', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Mock Logistics Stub (Prod: Delhivery / BlueDart API)
                  </span>
                </div>
                <h2 className="checkout-card__title">{t('checkout.step2')}</h2>
                <p className="checkout-card__desc">
                  Select courier network. White-glove insured delivery is complimentary for all masterworks.
                </p>

                <div className="payment-options">
                  <label className={`payment-option ${courier === 'bluedart' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="courier"
                      value="bluedart"
                      checked={courier === 'bluedart'}
                      onChange={() => setCourier('bluedart')}
                    />
                    <div className="option-content">
                      <span className="option-title">{t('checkout.courier_bluedart')}</span>
                      <span className="option-sub">Tracking AWB: <code>{trackingNumberStub}</code></span>
                    </div>
                  </label>

                  <label className={`payment-option ${courier === 'delhivery' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="courier"
                      value="delhivery"
                      checked={courier === 'delhivery'}
                      onChange={() => setCourier('delhivery')}
                    />
                    <div className="option-content">
                      <span className="option-title">{t('checkout.courier_delhivery')}</span>
                      <span className="option-sub">Fragile Craft Safe Transit</span>
                    </div>
                  </label>

                  <label className={`payment-option ${courier === 'indiapost' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="courier"
                      value="indiapost"
                      checked={courier === 'indiapost'}
                      onChange={() => setCourier('indiapost')}
                    />
                    <div className="option-content">
                      <span className="option-title">{t('checkout.courier_speedpost')}</span>
                      <span className="option-sub">Direct access to remote tribal & artisan village clusters</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 03: Payment Method */}
              <div className="checkout-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="checkout-card__step">{t('checkout.step3')}</span>
                  <span style={{ fontSize: '0.72rem', background: '#FDF0ED', color: '#9C2819', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {t('checkout.mock_notice')}
                  </span>
                </div>
                <h2 className="checkout-card__title">{t('checkout.step3')}</h2>
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
                      <span className="option-title">UPI Instant Settlement (QR Code Screen)</span>
                      <span className="option-sub">GPay, PhonePe, Paytm, BHIM, CRED or any UPI App</span>
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

                {/* Mock UPI Interactive QR Screen */}
                {paymentMethod === 'upi' && (
                  <div style={{
                    marginTop: '1.25rem',
                    background: '#FDFBF7',
                    border: '1px solid #D6C4A6',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'inline-block', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #E2D5C3', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      {upiQrUrl ? (
                        <img src={upiQrUrl} alt="UPI Payment QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                      ) : (
                        <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#888' }}>
                          Generating UPI QR...
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#1C160E', marginTop: '6px' }}>
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#55483B' }}>
                      <span>UPI ID: <strong>kaarigar@guild</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('kaarigar@guild');
                          setUpiCopied(true);
                          setTimeout(() => setUpiCopied(false), 2000);
                        }}
                        style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          background: '#EFE8DC',
                          border: '1px solid #D6C4A6',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {upiCopied ? '✓ Copied' : 'Copy VPA'}
                      </button>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#8C7A66', marginTop: '4px' }}>
                      Ref: <code>{upiRefId}</code> · <em>Mock UPI for demo; production plan: Razorpay/UPI escrow</em>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setUpiVerified(true);
                        }}
                        style={{
                          background: upiVerified ? '#2E6B38' : '#8C2D19',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        {upiVerified ? '✓ Bank Authorized (Mock Verified)' : '⚡ Simulate Bank Authorization (Demo)'}
                      </button>
                    </div>
                  </div>
                )}
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
                  <span>{isSubmitting ? t('checkout.processing') : `${t('checkout.pay_btn')} · ₹${totalAmount.toLocaleString('en-IN')}`}</span>
                  <span className="arrow">→</span>
                </button>
              )}
            </form>
          </div>

          {/* Right Column: Order Summary & Impact Breakdown */}
          <div className="checkout-summary-col">
            <div className="summary-sticky-card">
              <h3 className="summary-heading">{t('checkout.order_summary')} ({cart.length})</h3>

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
