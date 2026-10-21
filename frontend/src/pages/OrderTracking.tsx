import { useParams, Link } from 'react-router-dom';

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();

  let orderData: any = null;
  try {
    const saved = localStorage.getItem('kaarigar_orders_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      orderData = parsed.find((o: any) => o.id === id);
    }
  } catch {
    // ignore
  }

  // Fallback order info if visited directly
  const orderId = id || 'KG-ORD-84912';
  const orderDate = orderData?.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const items = orderData?.items || [
    {
      object: {
        id: 'pahari-miniature',
        title: 'Radha & Krishna in the Groves of Kangra',
        craftTradition: 'Kangra Miniature Painting',
        artisan: 'Pandit Ram Swaroop Sharma',
        price: 48500,
        image: '/images/pahari.jpg',
      },
      quantity: 1,
    },
  ];
  const totalAmount = orderData?.totalAmount || 48500;
  const directArtisanTotal = orderData?.directArtisanTotal || 42680;
  const customer = orderData?.customer || {
    name: 'Ananya Sen',
    address: '42, Gulmohar Enclave, Malabar Hill',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400006',
  };

  return (
    <main className="order-tracking-page" role="main" aria-label="Order Tracking & Provenance Status">
      <div className="order-tracking-page__inner">
        {/* Top Success Badge */}
        <div className="order-success-header">
          <div className="success-icon-badge">✓</div>
          <span className="order-eyebrow">ACQUISITION INSCRIBED IN ARCHIVE</span>
          <h1 className="order-title">Order Confirmed · {orderId}</h1>
          <p className="order-date-line">Placed on {orderDate} · Insured Archival Transit</p>
        </div>

        {/* Milestone Tracker Timeline */}
        <div className="tracking-timeline-box">
          <h3 className="timeline-heading">Atelier Custodianship Progress</h3>

          <div className="timeline-steps">
            <div className="timeline-step step--completed">
              <div className="step-circle">✓</div>
              <div className="step-content">
                <span className="step-label">Order Confirmed & Escrow Funded</span>
                <span className="step-time">Immediate</span>
              </div>
            </div>

            <div className="timeline-step step--active">
              <div className="step-circle">✦</div>
              <div className="step-content">
                <span className="step-label">Atelier Packaging & Sealing</span>
                <span className="step-time">In Progress by Master Artisan</span>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-circle">3</div>
              <div className="step-content">
                <span className="step-label">Provenance Certificate Inscribed</span>
                <span className="step-time">Pending Final Wax Stamp</span>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-circle">4</div>
              <div className="step-content">
                <span className="step-label">Insured Specialized Transit</span>
                <span className="step-time">Estimated 3–5 Business Days</span>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-circle">5</div>
              <div className="step-content">
                <span className="step-label">Delivery & Balance Disbursement</span>
                <span className="step-time">Direct release to Artisan Guild</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="order-details-grid">
          {/* Items Inscribed */}
          <div className="order-card">
            <h3 className="card-subhead">Inscribed Masterworks</h3>
            <div className="order-items-list">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="order-item-row">
                  <img src={item.object.image} alt={item.object.title} className="order-item-img" />
                  <div className="order-item-meta">
                    <span className="order-item-tradition">{item.object.craftTradition}</span>
                    <h4 className="order-item-title">{item.object.title}</h4>
                    <span className="order-item-artisan">By {item.object.artisan}</span>
                    <span className="order-item-qty">Quantity: {item.quantity}</span>
                  </div>
                  <div className="order-item-price">
                    ₹{(item.object.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total-summary">
              <div className="tot-row">
                <span>Total Acquisition:</span>
                <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="tot-row direct-green">
                <span>Direct Artisan Return (88%):</span>
                <strong>₹{directArtisanTotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* Delivery & Provenance Card */}
          <div className="order-card">
            <h3 className="card-subhead">Transit Destination & Provenance</h3>
            <div className="destination-box">
              <span className="dest-name">{customer.name}</span>
              <p className="dest-addr">
                {customer.address}, {customer.city}, {customer.state} — {customer.pinCode}
              </p>
            </div>

            <div className="provenance-guarantee-box">
              <div className="p-badge">GI SEAL</div>
              <p>
                This acquisition is accompanied by a physical certificate of authenticity, 
                witnessed by the local handicraft guild, and cataloged in the KAARIGAR Cultural Archive.
              </p>
            </div>

            <div className="order-actions-row">
              <Link to="/shop" className="hero-btn hero-btn--primary">
                Explore More Crafts
              </Link>
              <Link to="/" className="hero-btn hero-btn--ghost">
                Back to Archive
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
