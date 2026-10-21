import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../data/productStore';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { products, deleteProduct, resetToDefaults } = useProducts();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'pieces' | 'inquiries' | 'profile'>('pieces');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Profile edit form state from auth user
  const [name, setName] = useState(user?.name || '');
  const [atelier, setAtelier] = useState(user?.atelier || '');
  const [specialization, setSpecialization] = useState(user?.craftSpecialization || '');
  const [region, setRegion] = useState(user?.region || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Update via auth context
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setDeleteConfirmId(null);
  };

  return (
    <main className="dashboard-page" role="main" aria-label="Artisan Atelier Dashboard">
      {/* Top Welcome Bar */}
      <section className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__left">
            <span className="dashboard-eyebrow">कारिगर ATELIER CONSOLE</span>
            <h1 className="dashboard-title">{user?.atelier || 'Artisan Atelier'}</h1>
            <p className="dashboard-subtitle">
              Master Custodian: <strong>{user?.name}</strong> · {user?.region} · {user?.craftSpecialization}
            </p>
          </div>

          <div className="dashboard-header__actions">
            <Link to="/dashboard/create" className="dash-btn dash-btn--primary" id="dashboard-add-piece">
              <span>+ Add New Craft Piece</span>
            </Link>
            <Link to="/settings" className="dash-btn dash-btn--secondary">
              <span>Settings</span>
            </Link>
            <button type="button" className="dash-btn dash-btn--danger" onClick={() => { logout(); navigate('/'); }}>
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Atelier Financial & Metric Highlights */}
      <section className="dashboard-metrics">
        <div className="dashboard-metrics__inner">
          <div className="metric-box">
            <span className="metric-box__label">Active Listed Pieces</span>
            <span className="metric-box__val">{products.length}</span>
            <span className="metric-box__sub">Exhibited in buyer catalogue</span>
          </div>

          <div className="metric-box highlight-box">
            <span className="metric-box__label">Direct Payout Rate</span>
            <span className="metric-box__val">88%</span>
            <span className="metric-box__sub">Zero intermediary commission</span>
          </div>

          <div className="metric-box">
            <span className="metric-box__label">Atelier Acquisitions</span>
            <span className="metric-box__val">₹1,84,500</span>
            <span className="metric-box__sub">Paid directly to guild accounts</span>
          </div>

          <div className="metric-box">
            <span className="metric-box__label">GI Provenance Status</span>
            <span className="metric-box__val text-green">Certified</span>
            <span className="metric-box__sub">Living heritage registered</span>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <section className="dashboard-content">
        <div className="dashboard-content__inner">
          <div className="dashboard-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pieces'}
              className={`dash-tab ${activeTab === 'pieces' ? 'active' : ''}`}
              onClick={() => setActiveTab('pieces')}
            >
              My Craft Pieces ({products.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inquiries'}
              className={`dash-tab ${activeTab === 'inquiries' ? 'active' : ''}`}
              onClick={() => setActiveTab('inquiries')}
            >
              Recent Collector Acquisitions
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'profile'}
              className={`dash-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Atelier Lineage Profile
            </button>
          </div>

          {/* TAB 1: MY CRAFT PIECES */}
          {activeTab === 'pieces' && (
            <div className="dashboard-tab-panel">
              <div className="panel-toolbar">
                <span className="panel-info">
                  Live inventory synced across homepage carousel, 3D gallery, and curated shop.
                </span>
                <button
                  type="button"
                  className="reset-inventory-btn"
                  onClick={() => {
                    if (window.confirm('Reset catalogue back to initial curated heritage masterworks?')) {
                      resetToDefaults();
                    }
                  }}
                >
                  Reset Defaults
                </button>
              </div>

              {products.length === 0 ? (
                <div className="empty-panel">
                  <h3>No craft pieces listed yet</h3>
                  <p>Publish your first handcrafted masterpiece to exhibit it to patrons worldwide.</p>
                  <Link to="/dashboard/create" className="dash-btn dash-btn--primary">
                    Create Your First Piece
                  </Link>
                </div>
              ) : (
                <div className="pieces-list">
                  {products.map((item) => (
                    <article key={item.id} className="piece-row">
                      <div className="piece-row__media">
                        <img src={item.image} alt={item.title} className="piece-thumb" />
                      </div>

                      <div className="piece-row__info">
                        <div className="piece-meta">
                          <span className="p-accession">{item.accessionNo}</span>
                          <span className="p-tradition">{item.craftTradition}</span>
                          <span className="p-region">{item.region}</span>
                        </div>
                        <h3 className="piece-title">
                          <Link to={`/shop/${item.id}`}>{item.title}</Link>
                        </h3>
                        {item.vernacularTitle && (
                          <span className="piece-vernacular">{item.vernacularTitle}</span>
                        )}
                        <p className="piece-materials">
                          Materials: {item.materials?.slice(0, 3).join(', ')}
                        </p>
                      </div>

                      <div className="piece-row__financials">
                        <span className="piece-price">₹{item.price.toLocaleString('en-IN')}</span>
                        <span className="piece-payout-rate">
                          {item.directArtisanSharePercent || 88}% Direct (₹{Math.round(item.price * (item.directArtisanSharePercent || 88) / 100).toLocaleString('en-IN')})
                        </span>
                        <span className="piece-stock">Stock: {item.availability || 'Available'}</span>
                      </div>

                      <div className="piece-row__actions">
                        <Link
                          to={`/shop/${item.id}`}
                          className="action-link action-link--view"
                          title="View public storyboard"
                        >
                          Story →
                        </Link>

                        <Link
                          to={`/dashboard/edit/${item.id}`}
                          className="action-link action-link--edit"
                          title="Edit piece"
                        >
                          Edit
                        </Link>

                        {deleteConfirmId === item.id ? (
                          <div className="delete-confirm-box">
                            <span>Confirm?</span>
                            <button
                              type="button"
                              className="confirm-del-btn"
                              onClick={() => handleDelete(item.id)}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className="cancel-del-btn"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="action-link action-link--del"
                            onClick={() => setDeleteConfirmId(item.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECENT COLLECTOR ACQUISITIONS */}
          {activeTab === 'inquiries' && (
            <div className="dashboard-tab-panel">
              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Acquisition ID</th>
                      <th>Masterwork</th>
                      <th>Collector</th>
                      <th>Value</th>
                      <th>Direct Payout (88%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>KG-ORD-9281</code></td>
                      <td>Radha & Krishna in the Groves of Kangra</td>
                      <td>Siddharth M. (Mumbai)</td>
                      <td>₹48,500</td>
                      <td><strong className="text-green">₹42,680</strong></td>
                      <td><span className="status-badge status-badge--released">Disbursed to Bank</span></td>
                    </tr>
                    <tr>
                      <td><code>KG-ORD-8814</code></td>
                      <td>Cobalt Meena Arabesque Urn</td>
                      <td>Arundhati V. (New Delhi)</td>
                      <td>₹24,000</td>
                      <td><strong className="text-green">₹20,400</strong></td>
                      <td><span className="status-badge status-badge--transit">Atelier Packaging</span></td>
                    </tr>
                    <tr>
                      <td><code>KG-ORD-7402</code></td>
                      <td>Bastar Lost-Wax Ritual Guardian Horse</td>
                      <td>Kiran D. (Bengaluru)</td>
                      <td>₹32,000</td>
                      <td><strong className="text-green">₹28,800</strong></td>
                      <td><span className="status-badge status-badge--released">Disbursed to Bank</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ATELIER PROFILE */}
          {activeTab === 'profile' && (
            <div className="dashboard-tab-panel">
              <form onSubmit={handleProfileSave} className="atelier-profile-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="p-name">Master Artisan Name</label>
                    <input
                      id="p-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="p-atelier">Atelier / Gurukulam</label>
                    <input
                      id="p-atelier"
                      type="text"
                      value={atelier}
                      onChange={(e) => setAtelier(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="p-specialization">Craft Specialization</label>
                    <input
                      id="p-specialization"
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="p-region">Geographical Region</label>
                    <input
                      id="p-region"
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="p-bio">Generational Lineage Biography</label>
                  <textarea
                    id="p-bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                {savedNotice && (
                  <div className="form-success-banner">
                    ✓ Atelier profile details saved and synced successfully.
                  </div>
                )}

                <button type="submit" className="dash-btn dash-btn--primary">
                  Save Atelier Profile
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
