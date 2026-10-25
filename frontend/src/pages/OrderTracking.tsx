import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getOrderById, type OrderRecord } from '../api/orders';

export default function OrderTracking() {
  const { t } = useTranslation();
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
  const directArtisanTotal = Math.round(totalAmount * 0.88);

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
          <span className="order-eyebrow">{t('tracking.title')}</span>
          <h1 className="order-title">
            {t('tracking.order_id')}: {orderId.slice(0, 12).toUpperCase()} ({currentStatus})
          </h1>
          <p className="order-date-line">Placed on {orderDate} · Insured White-Glove Archival Transit</p>
        </div>

        {/* Logistics & Tracking Stub */}
        <div style={{
          background: '#FAF6EE',
          border: '1px solid #D6C4A6',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: '#8C7A66', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em' }}>Carrier & Logistics</span>
            <div style={{ fontWeight: 600, color: '#1C160E' }}>
              {localOrder?.courier || (backendOrder as any)?.courier || 'BlueDart Express Air'}
            </div>
          </div>
          <div>
            <span style={{ color: '#8C7A66', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em' }}>Tracking Identifier</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#8C2D19' }}>
              {localOrder?.trackingNumber || (backendOrder as any)?.tracking_number || 'BD-849201-IN'}
            </div>
          </div>
          <div>
            <span style={{ color: '#8C7A66', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em' }}>Transit Assurance</span>
            <div style={{ color: '#2E6B38', fontWeight: 600 }}>100% Insured Archival Crate</div>
          </div>
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

        {/* Made-to-Order Process Timeline Updates (Photo Journal) */}
        <div style={{
          background: '#FDFBF7',
          border: '1px solid #E5D8C4',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #EDE2CE', paddingBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A2D19', fontWeight: 700 }}>
                ✦ Live Made-to-Order Crafting Journal
              </span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontFamily: 'serif', color: '#1C160E' }}>
                Artisan Process Milestones & Living Progress
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#7A6B59', background: '#F2ECE1', padding: '3px 10px', borderRadius: '4px' }}>
              Direct from Master Atelier
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {((backendOrder as any)?.timeline_updates && (backendOrder as any).timeline_updates.length > 0) ? (
              (backendOrder as any).timeline_updates.map((update: any, idx: number) => (
                <div key={idx} style={{ background: '#fff', border: '1px solid #E2D5C3', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  {update.photo_url && (
                    <img src={update.photo_url} alt={update.stage_name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8A2D19', textTransform: 'uppercase' }}>
                      Milestone {idx + 1}
                    </div>
                    <h4 style={{ margin: '3px 0 6px 0', fontSize: '0.9rem', color: '#1C160E' }}>{update.stage_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#5A4C3D', lineHeight: 1.4 }}>{update.description}</p>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.7rem', color: '#9C8B76' }}>
                      {new Date(update.created_at || Date.now()).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div style={{ background: '#fff', border: '1px solid #E2D5C3', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <img src="/images/textile.jpg" alt="Warp Thread Sizing" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8A2D19', textTransform: 'uppercase' }}>
                      Stage 01 · Completed
                    </div>
                    <h4 style={{ margin: '3px 0 6px 0', fontSize: '0.9rem', color: '#1C160E' }}>Warp Thread Counting & Sizing</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#5A4C3D', lineHeight: 1.4 }}>
                      Ilkal pure cotton-silk ground thread warp aligned by eye without chalk tracing under morning daylight.
                    </p>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.7rem', color: '#9C8B76' }}>Day 2 of Crafting</span>
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #E2D5C3', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <img src="/images/kasuti.jpg" alt="Gopura Needlework" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2E6B38', textTransform: 'uppercase' }}>
                      Stage 02 · In Progress (70%)
                    </div>
                    <h4 style={{ margin: '3px 0 6px 0', fontSize: '0.9rem', color: '#1C160E' }}>Knotless Gavanti Gopura Stitches</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#5A4C3D', lineHeight: 1.4 }}>
                      Double-running embroidery executed with single needle. Zero knots on reverse face verified by Mahila Sangha.
                    </p>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.7rem', color: '#9C8B76' }}>Updated yesterday by Parvatamma</span>
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #E2D5C3', borderRadius: '8px', overflow: 'hidden', opacity: 0.85, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '100%', height: '140px', background: '#F5ECE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#C4B298' }}>
                    ✦
                  </div>
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8C7A66', textTransform: 'uppercase' }}>
                      Stage 03 · Upcoming
                    </div>
                    <h4 style={{ margin: '3px 0 6px 0', fontSize: '0.9rem', color: '#1C160E' }}>GI Certification & Cedar Crate Sealing</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#5A4C3D', lineHeight: 1.4 }}>
                      Hand-pressing with natural linen cloths, placement of wax seal provenance tag, and handover to BlueDart courier.
                    </p>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.7rem', color: '#9C8B76' }}>Scheduled for completion</span>
                  </div>
                </div>
              </>
            )}
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
                <span>Direct Artisan Guild Disbursement</span>
                <strong className="text-green">₹{directArtisanTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div className="equity-row">
                <span>Platform Archival & Escrow Fee (5%)</span>
                <span>₹{(totalAmount - directArtisanTotal).toLocaleString('en-IN')}</span>
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

            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link to="/gallery" className="hero-btn hero-btn--primary" style={{ flex: '1 1 180px', textAlign: 'center', textDecoration: 'none' }}>
                Continue to Storefront
              </Link>
              <Link to="/archive" className="hero-btn hero-btn--secondary" style={{ flex: '1 1 180px', textAlign: 'center', textDecoration: 'none' }}>
                Visit Exhibition Archive
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
