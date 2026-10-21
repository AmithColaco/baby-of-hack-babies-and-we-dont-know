import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArtisan } from '../data/productStore';

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useArtisan();
  const [role, setRole] = useState<'artisan' | 'collector'>('artisan');

  // Artisan form state
  const [name, setName] = useState(profile.name || '');
  const [atelier, setAtelier] = useState(profile.atelier || '');
  const [craftSpecialization, setCraftSpecialization] = useState(profile.craftSpecialization || '');
  const [region, setRegion] = useState(profile.region || '');
  const [state, setState] = useState(profile.state || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');

  // OTP simulation
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setErrorMsg('');
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMsg('Please enter the 4-digit verification code (e.g. 1234)');
      return;
    }

    if (role === 'artisan') {
      updateProfile({
        name: name || 'Master Artisan',
        atelier: atelier || 'Independent Craft Atelier',
        craftSpecialization: craftSpecialization || 'Traditional Indian Craft',
        region: region || 'Rajasthan',
        state: state || 'India',
        phone,
        bio: bio || 'Practitioner of indigenous material wisdom and generational craft.',
        yearsExperience: 25,
        avatarUrl: '/images/artisan.jpg',
        isLoggedIn: true,
      });
      navigate('/dashboard');
    } else {
      navigate('/shop');
    }
  };

  return (
    <main className="onboarding-page" role="main" aria-label="Sign In or Atelier Registration">
      <div className="onboarding-page__inner">
        <div className="onboarding-card">
          {/* Header */}
          <div className="onboarding-card__header">
            <span className="onboarding-brand-sub">कारिगर ATELIER PORTAL</span>
            <h1 className="onboarding-title">
              {role === 'artisan' ? 'Artisan Atelier Registration' : 'Collector Sanctuary Sign In'}
            </h1>
            <p className="onboarding-subtitle">
              {role === 'artisan'
                ? 'Join our vetted network of Indian master artisans. Guarantee 85%+ direct payouts with zero upfront fees.'
                : 'Access your curated wishlists, acquisition records, and direct master artisan dispatches.'}
            </p>

            {/* Role Switcher */}
            <div className="onboarding-role-toggle">
              <button
                type="button"
                className={`role-btn ${role === 'artisan' ? 'active' : ''}`}
                onClick={() => {
                  setRole('artisan');
                  setOtpSent(false);
                  setErrorMsg('');
                }}
              >
                Master Artisan
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'collector' ? 'active' : ''}`}
                onClick={() => {
                  setRole('collector');
                  setOtpSent(false);
                  setErrorMsg('');
                }}
              >
                Art Collector
              </button>
            </div>
          </div>

          {/* Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="onboarding-form">
              {role === 'artisan' && (
                <>
                  <div className="form-group">
                    <label htmlFor="artisan-name">Master Artisan or Guild Leader Name *</label>
                    <input
                      id="artisan-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Pandit Ram Swaroop Sharma"
                      className="form-input"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="artisan-atelier">Atelier / Workshop Name *</label>
                      <input
                        id="artisan-atelier"
                        type="text"
                        required
                        value={atelier}
                        onChange={(e) => setAtelier(e.target.value)}
                        placeholder="e.g. Chamba Parampara Gurukulam"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="artisan-craft">Craft Lineage / Specialization *</label>
                      <input
                        id="artisan-craft"
                        type="text"
                        required
                        value={craftSpecialization}
                        onChange={(e) => setCraftSpecialization(e.target.value)}
                        placeholder="e.g. Kangra Miniature & Wasli"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="artisan-region">District / Valley *</label>
                      <input
                        id="artisan-region"
                        type="text"
                        required
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="e.g. Kangra Valley"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="artisan-state">State *</label>
                      <input
                        id="artisan-state"
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Himachal Pradesh"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="artisan-bio">Atelier Lineage Summary</label>
                    <textarea
                      id="artisan-bio"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief history of your generational craft practice…"
                      className="form-textarea"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="login-phone">Mobile Number for OTP Verification *</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    id="login-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="form-input phone-input"
                  />
                </div>
              </div>

              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}

              <button type="submit" className="onboarding-submit-btn" id="send-otp-btn">
                <span>Send One-Time Passcode (OTP)</span>
                <span className="arrow">→</span>
              </button>

              <div className="onboarding-guarantee">
                <span>✓ Direct Guild Verification</span>
                <span>✓ 85%+ Payout Guarantee</span>
                <span>✓ Zero Exploitative Contracts</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="onboarding-form">
              <div className="otp-sent-notice">
                <span>Passcode dispatched via SMS to <strong>+91 {phone}</strong></span>
                <button
                  type="button"
                  className="edit-phone-btn"
                  onClick={() => setOtpSent(false)}
                >
                  Change number
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="otp-input">Enter 4-Digit Verification Passcode *</label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter code (e.g. 1234)"
                  className="form-input otp-input"
                />
                <span className="form-hint">Tip: For demo verification, enter any code like <strong>1234</strong></span>
              </div>

              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}

              <button type="submit" className="onboarding-submit-btn" id="verify-otp-btn">
                <span>Verify & Enter {role === 'artisan' ? 'Seller Atelier' : 'Marketplace'}</span>
                <span className="arrow">→</span>
              </button>
            </form>
          )}

          <div className="onboarding-card__footer">
            <Link to="/">← Return to Homepage Archive</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
