import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, isLoggedIn, isArtisan, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [atelier, setAtelier] = useState(user?.atelier || '');
  const [craft, setCraft] = useState(user?.craftSpecialization || '');
  const [region, setRegion] = useState(user?.region || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');

  if (!isLoggedIn) {
    return (
      <main className="onboarding-page" role="main">
        <div className="onboarding-page__inner">
          <div className="onboarding-card">
            <div className="onboarding-card__header">
              <h1 className="onboarding-title">Sign In Required</h1>
              <p className="onboarding-subtitle">Please sign in to access your account settings.</p>
            </div>
            <Link to="/login" className="onboarding-submit-btn" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              <span>Sign In / Register</span><span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name, email, phone,
      ...(isArtisan ? { atelier, craftSpecialization: craft, region, bio } : { city }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <main className="dashboard-page" role="main" aria-label="Account Settings">
      <section className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__left">
            <span className="dashboard-eyebrow">ACCOUNT SETTINGS</span>
            <h1 className="dashboard-title">{user?.name}</h1>
            <p className="dashboard-subtitle">
              {isArtisan ? 'Master Artisan' : 'Art Collector'} · {user?.role === 'artisan' ? user?.atelier || 'Artisan Portal' : user?.city || 'Collector Portal'}
            </p>
          </div>
          <div className="dashboard-header__actions">
            {isArtisan && (
              <Link to="/dashboard" className="dash-btn dash-btn--secondary">
                Atelier Console
              </Link>
            )}
            <button
              type="button"
              className="dash-btn dash-btn--danger"
              onClick={() => setShowLogoutConfirm(true)}
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-content__inner">
          <form onSubmit={handleSave} className="atelier-profile-form" style={{ maxWidth: '680px' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', marginBottom: '1.5rem', color: '#1C1C1A' }}>
              Personal Details
            </h2>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="s-name">Full Name</label>
                <input id="s-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="s-phone">Mobile Number</label>
                <input id="s-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" placeholder="+91 98xxx xxxxx" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="s-email">Email Address</label>
              <input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="your@email.com" />
            </div>

            {isArtisan && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '1.5rem 0' }} />
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', marginBottom: '1.5rem', color: '#1C1C1A' }}>
                  Atelier Details
                </h2>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="s-atelier">Atelier / Workshop</label>
                    <input id="s-atelier" type="text" value={atelier} onChange={(e) => setAtelier(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="s-craft">Craft Specialization</label>
                    <input id="s-craft" type="text" value={craft} onChange={(e) => setCraft(e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="s-region">Region</label>
                  <input id="s-region" type="text" value={region} onChange={(e) => setRegion(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="s-bio">Biography / Lineage Summary</label>
                  <textarea id="s-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="form-textarea" />
                </div>
              </>
            )}

            {!isArtisan && (
              <div className="form-group">
                <label htmlFor="s-city">City</label>
                <input id="s-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="form-input" placeholder="e.g. Mumbai" />
              </div>
            )}

            {saved && (
              <div className="form-success-banner">
                ✓ Settings saved successfully.
              </div>
            )}

            <button type="submit" className="dash-btn dash-btn--primary">
              Save Changes
            </button>
          </form>
        </div>
      </section>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#FDFBF7', borderRadius: '12px', padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Sign Out?</h3>
            <p style={{ color: '#6B6560', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              You will be signed out of your {isArtisan ? 'Artisan Atelier' : 'Collector'} account.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" className="dash-btn dash-btn--danger" onClick={handleLogout}>Yes, Sign Out</button>
              <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
