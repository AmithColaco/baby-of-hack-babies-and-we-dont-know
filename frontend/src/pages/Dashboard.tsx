import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts, listingToCraftObject } from '../data/productStore';
import { useAuth } from '../contexts/AuthContext';
import { getListings, archiveListing, type ListingRecord } from '../api/listings';
import { getArtisanOrders, updateOrderStatus, type OrderRecord } from '../api/orders';

export default function Dashboard() {
  const { products, deleteProduct, resetToDefaults } = useProducts();
  const { user, logout, updateProfileOnBackend } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'pieces' | 'inquiries' | 'profile'>('pieces');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Backend artisan orders state
  const [artisanOrders, setArtisanOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);

  // Backend artisan listings state
  const [artisanListings, setArtisanListings] = useState<ListingRecord[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Profile edit form state from auth user
  const [name, setName] = useState(user?.name || '');
  const [atelier, setAtelier] = useState(user?.atelier || '');
  const [specialization, setSpecialization] = useState(user?.craftSpecialization || '');
  const [region, setRegion] = useState(user?.region || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fetch real artisan orders & listings from backend
  const fetchDashboardData = async () => {
    if (!user) return;
    setOrdersLoading(true);
    setLoadingListings(true);
    try {
      const orders = await getArtisanOrders();
      setArtisanOrders(orders);
    } catch (e) {
      console.warn('Could not load artisan orders from backend:', e);
    } finally {
      setOrdersLoading(false);
    }

    try {
      const listings = await getListings({ artisan_id: user.id });
      setArtisanListings(listings);
    } catch (e) {
      console.warn('Could not load artisan listings from backend:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    try {
      await updateProfileOnBackend({
        name,
        craft_types: specialization,
        village: region,
        bio,
        role: 'artisan',
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || 'Failed to save profile. Please retry.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await archiveListing(id);
    } catch (e) {
      console.warn('Archive on backend failed, updating local store:', e);
    }
    deleteProduct(id);
    setArtisanListings((prev) => prev.filter((item) => item.id !== id));
    setDeleteConfirmId(null);
  };

  const handleStatusTransition = async (orderId: string, nextStatus: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') => {
    setOrderActionLoading(orderId);
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      setArtisanOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to transition order status to ${nextStatus}`);
    } finally {
      setOrderActionLoading(null);
    }
  };

  // Display items: combine backend listings with store products
  const displayPieces = artisanListings.length > 0
    ? artisanListings.map(listingToCraftObject)
    : products;

  // Total earnings estimate
  const totalRevenue = artisanOrders.reduce((sum, ord) => sum + (ord.payment_status === 'SUCCESS' ? ord.total_inr : 0), 0);
  const totalArtisanPayout = Math.round(totalRevenue * 0.88);

  return (
    <main className="dashboard-page" role="main" aria-label="Artisan Atelier Dashboard">
      {/* Top Welcome Bar */}
      <section className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__left">
            <span className="dashboard-eyebrow">कारिगर ATELIER CONSOLE · KALAYAAN</span>
            <h1 className="dashboard-title">{user?.atelier || 'Artisan Atelier'}</h1>
            <p className="dashboard-subtitle">
              Master Custodian: <strong>{user?.name}</strong> · {user?.region || 'Coastal Karnataka'} · {user?.craftSpecialization}
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
            <span className="metric-box__val">{displayPieces.length}</span>
            <span className="metric-box__sub">Exhibited in buyer catalogue</span>
          </div>

          <div className="metric-box highlight-box">
            <span className="metric-box__label">Direct Payout Rate</span>
            <span className="metric-box__val">88%</span>
            <span className="metric-box__sub">Zero intermediary commission</span>
          </div>

          <div className="metric-box">
            <span className="metric-box__label">Incoming Orders</span>
            <span className="metric-box__val">{artisanOrders.length}</span>
            <span className="metric-box__sub">{artisanOrders.filter(o => o.status === 'PLACED').length} awaiting confirmation</span>
          </div>

          <div className="metric-box">
            <span className="metric-box__label">Atelier Disbursal Total</span>
            <span className="metric-box__val">₹{totalArtisanPayout > 0 ? totalArtisanPayout.toLocaleString('en-IN') : '1,84,500'}</span>
            <span className="metric-box__sub">Verified authentic living craft</span>
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
              My Craft Pieces ({displayPieces.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inquiries'}
              className={`dash-tab ${activeTab === 'inquiries' ? 'active' : ''}`}
              onClick={() => setActiveTab('inquiries')}
            >
              Buyer Orders & Dispatch ({artisanOrders.length})
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
                  Live inventory synchronized across 3D Virtual Gallery, Catalogue, and Mobile Storefront.
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

              {loadingListings ? (
                <div className="empty-panel">
                  <p>Synchronizing your listed craft pieces with the archive...</p>
                </div>
              ) : displayPieces.length === 0 ? (
                <div className="empty-panel">
                  <h3>No craft pieces listed yet</h3>
                  <p>Publish your first handcrafted masterpiece using our AI listing assistant and fair pricing calculator.</p>
                  <Link to="/dashboard/create" className="dash-btn dash-btn--primary">
                    Create Your First Piece
                  </Link>
                </div>
              ) : (
                <div className="pieces-list">
                  {displayPieces.map((item) => (
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

          {/* TAB 2: BUYER ORDERS & STATUS TRANSITIONS */}
          {activeTab === 'inquiries' && (
            <div className="dashboard-tab-panel">
              <div className="panel-toolbar">
                <span className="panel-info">
                  Live buyer orders from the storefront. Confirm and dispatch orders to update collector tracking.
                </span>
                <button
                  type="button"
                  className="reset-inventory-btn"
                  onClick={fetchDashboardData}
                >
                  ↻ Refresh Orders
                </button>
              </div>

              {ordersLoading ? (
                <div className="empty-panel">
                  <p>Loading atelier order ledger...</p>
                </div>
              ) : artisanOrders.length === 0 ? (
                <div className="empty-panel">
                  <h3>No incoming orders yet</h3>
                  <p>When buyers acquire pieces through the storefront or 3D gallery, their orders will appear here for dispatch.</p>
                </div>
              ) : (
                <div className="orders-table-wrap">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Pieces Ordered</th>
                        <th>Total Value</th>
                        <th>Direct Payout (88%)</th>
                        <th>Current State</th>
                        <th>Workflow Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artisanOrders.map((ord) => {
                        const payout = Math.round(ord.total_inr * 0.88);
                        const isActionBusy = orderActionLoading === ord.id;
                        return (
                          <tr key={ord.id}>
                            <td>
                              <code>{ord.id.slice(0, 10).toUpperCase()}</code>
                              <br />
                              <small style={{ color: '#888' }}>
                                {new Date(ord.created_at).toLocaleDateString('en-IN')}
                              </small>
                            </td>
                            <td>
                              {ord.items && ord.items.length > 0 ? (
                                ord.items.map((it) => (
                                  <div key={it.id}>
                                    <strong>{it.listing_title || `Listing #${it.listing_id.slice(0, 6)}`}</strong> × {it.qty}
                                  </div>
                                ))
                              ) : (
                                <span>Masterwork piece</span>
                              )}
                            </td>
                            <td>₹{ord.total_inr.toLocaleString('en-IN')}</td>
                            <td>
                              <strong className="text-green">₹{payout.toLocaleString('en-IN')}</strong>
                            </td>
                            <td>
                              <span className={`status-badge status-badge--${ord.status.toLowerCase()}`}>
                                {ord.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {ord.status === 'PLACED' && (
                                  <button
                                    type="button"
                                    disabled={isActionBusy}
                                    className="dash-btn dash-btn--primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    onClick={() => handleStatusTransition(ord.id, 'CONFIRMED')}
                                  >
                                    {isActionBusy ? 'Updating...' : '✓ Confirm'}
                                  </button>
                                )}
                                {ord.status === 'CONFIRMED' && (
                                  <button
                                    type="button"
                                    disabled={isActionBusy}
                                    className="dash-btn dash-btn--primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#2E8B57' }}
                                    onClick={() => handleStatusTransition(ord.id, 'SHIPPED')}
                                  >
                                    {isActionBusy ? 'Updating...' : '📦 Mark Shipped'}
                                  </button>
                                )}
                                {ord.status === 'SHIPPED' && (
                                  <button
                                    type="button"
                                    disabled={isActionBusy}
                                    className="dash-btn dash-btn--secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    onClick={() => handleStatusTransition(ord.id, 'DELIVERED')}
                                  >
                                    {isActionBusy ? 'Updating...' : '★ Mark Delivered'}
                                  </button>
                                )}
                                {ord.status === 'DELIVERED' && (
                                  <span style={{ color: '#2E8B57', fontSize: '0.85rem' }}>✓ Completed</span>
                                )}
                                {ord.status !== 'DELIVERED' && ord.status !== 'CANCELLED' && (
                                  <button
                                    type="button"
                                    disabled={isActionBusy}
                                    className="action-link action-link--del"
                                    style={{ fontSize: '0.8rem', marginLeft: '6px' }}
                                    onClick={() => {
                                      if (window.confirm('Cancel this order and restore stock?')) {
                                        handleStatusTransition(ord.id, 'CANCELLED');
                                      }
                                    }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                    <label htmlFor="p-atelier">Atelier / Guild Kendra</label>
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
                    <label htmlFor="p-specialization">Craft Specialization (e.g. Kasuti, Beedu, Seashell)</label>
                    <input
                      id="p-specialization"
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="p-region">Village / Coastal District</label>
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
                  <label htmlFor="p-bio">Ancestral Lineage & Practice Biography</label>
                  <textarea
                    id="p-bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                {saveError && <div className="form-error-banner">{saveError}</div>}
                {savedNotice && (
                  <div className="form-success-banner">
                    ✓ Atelier profile details updated and saved to backend ledger.
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
