import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, type OrderRecord } from '../api/orders';

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [backendOrder, setBackendOrder] = useState<OrderRecord | null>(null);

  // Read local cached order if available
  let localOrder: any = null;
  try {
    const saved = localStorage.getItem('kaarigar_orders_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      localOrder = parsed.find((o: any) => o.id === id);
    }
  } catch {
    // ignore
  }

  // Poll/fetch live backend order
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    async function fetchOrder() {
      try {
        const ord = await getOrderById(id!);
        if (isMounted) setBackendOrder(ord);
      } catch (e) {
        // order may be in local storage only
      }
    }
    fetchOrder();
    return () => { isMounted = false; };
  }, [id]);

  const orderId = id || 'KG-ORD-84912';
  const currentStatus = backendOrder ? backendOrder.status : (localOrder?.status || 'PLACED');

  const orderDate = backendOrder
    ? new Date(backendOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : (localOrder?.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));

  const items = localOrder?.items || [
    {
      object: {
        id: 'kasuti-saree',
        title: 'Kasuti Embroidered Chariot & Peacock Saree',
        craftTradition: 'Kasuti Embroidery',
        artisan: 'Parvati Devi',
        price: 5200,
        image: '/images/kasuti.jpg',
      },
      quantity: 1,
    },
  ];

  const totalAmount = backendOrder ? backendOrder.total_inr : (localOrder?.totalAmount || 5200);
  const directArtisanTotal = localOrder?.directArtisanTotal || Math.round(totalAmount / 1.10);
  const platformFee = Math.round(directArtisanTotal * 0.05);
  const taxTotal = Math.round(directArtisanTotal * 0.05);

  // Status mapping to timeline steps (0..3)
  // PLACED -> 0
  // CONFIRMED -> 1
  // SHIPPED -> 2
  // DELIVERED -> 3
  const getStepState = (stepIndex: number) => {
    let currentStep = 0;
    if (currentStatus === 'CONFIRMED') currentStep = 1;
    else if (currentStatus === 'SHIPPED') currentStep = 2;
    else if (currentStatus === 'DELIVERED') currentStep = 3;
    else if (currentStatus === 'CANCELLED') return 'cancelled';

    if (stepIndex < currentStep) return 'step--completed';
    if (stepIndex === currentStep) return 'step--active';
    return '';
  };

  return (
    <main className="order-tracking-page" role="main" aria-label="Order Tracking & Provenance Status">
      <div className="order-tracking-page__inner">
        {/* Top Success Badge */}
        <div className="order-success-header">
          <div className="success-icon-badge">✓</div>
          <span className="order-eyebrow">ACQUISITION INSCRIBED IN LIVING ARCHIVE</span>
          <h1 className="order-title">
            Order Status: {currentStatus} · {orderId.slice(0, 12).toUpperCase()}
          </h1>
          <p className="order-date-line">Placed on {orderDate} · Insured White-Glove Archival Transit</p>
        </div>

        {/* Milestone Tracker Timeline */}
        <div className="tracking-timeline-box">
          <h3 className="timeline-heading">Atelier Custodianship Progress</h3>

          <div className="timeline-steps">
            <div className={`timeline-step ${getStepState(0)}`}>
              <div className="step-circle">{getStepState(0) === 'step--completed' ? '✓' : '1'}</div>
              <div className="step-content">
                <span className="step-label">Order Placed & Escrow Funded</span>
                <span className="step-time">Immediate</span>
              </div>
            </div>

            <div className={`timeline-step ${getStepState(1)}`}>
              <div className="step-circle">{getStepState(1) === 'step--completed' ? '✓' : '2'}</div>
              <div className="step-content">
                <span className="step-label">Atelier Packaging & Sealing</span>
                <span className="step-time">
                  {currentStatus === 'PLACED' ? 'Awaiting Artisan Confirmation' : 'Confirmed by Master Artisan'}
                </span>
              </div>
            </div>

            <div className={`timeline-step ${getStepState(2)}`}>
              <div className="step-circle">{getStepState(2) === 'step--completed' ? '✓' : '3'}</div>
              <div className="step-content">
                <span className="step-label">Dispatched & Transit Carrier Handover</span>
                <span className="step-time">
                  {currentStatus === 'SHIPPED' || currentStatus === 'DELIVERED' ? 'En Route with White-Glove Logistics' : 'Scheduled upon packaging'}
                </span>
              </div>
            </div>

            <div className={`timeline-step ${getStepState(3)}`}>
              <div className="step-circle">{getStepState(3) === 'step--completed' ? '✓' : '4'}</div>
              <div className="step-content">
                <span className="step-label">Delivered & Escrow Disbursed</span>
                <span className="step-time">
                  {currentStatus === 'DELIVERED' ? 'Delivered to Patron' : 'Upon white-glove arrival'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="order-summary-card">
          <div className="summary-left">
            <h3 className="summary-heading">Acquired Masterworks</h3>
            <div className="summary-items-list">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="summary-item-row">
                  <img
                    src={item.object?.image || '/images/textile.jpg'}
                    alt={item.object?.title}
                    className="summary-thumb"
                  />
                  <div className="summary-item-info">
                    <h4 className="item-title">{item.object?.title}</h4>
                    <span className="item-tradition">{item.object?.craftTradition}</span>
                    <span className="item-maker">Maker: {item.object?.artisan}</span>
                  </div>
                  <div className="summary-item-price">
                    <span className="qty-tag">Qty: {item.quantity}</span>
                    <span className="val-tag">₹{(item.object?.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-right">
            <h3 className="summary-heading">Equity & Disbursal Breakdown</h3>
            <div className="equity-breakdown-list">
              <div className="equity-row">
                <span>Total Acquisition Amount</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="equity-row highlight-row">
                <span>Direct Artisan Guild Disbursement (100% Base)</span>
                <strong className="text-green">₹{directArtisanTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div className="equity-row">
                <span>Platform Archival & Escrow Fee (5%)</span>
                <span>₹{platformFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="equity-row">
                <span>Statutory Goods & Services Tax (5% GST)</span>
                <span>₹{taxTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="equity-row">
                <span>Insured White-Glove Delivery</span>
                <span className="text-free">Complimentary</span>
              </div>
            </div>

            <div className="provenance-security-seal">
              <span className="seal-icon">✦</span>
              <div>
                <strong>Certified Living Heritage Provenance</strong>
                <p>An archival certificate with cryptographic verification is enclosed within your crate.</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <Link to="/shop" className="hero-btn hero-btn--primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                Continue to Storefront
              </Link>
              <Link to="/gallery" className="hero-btn hero-btn--secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                Visit Exhibition Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
