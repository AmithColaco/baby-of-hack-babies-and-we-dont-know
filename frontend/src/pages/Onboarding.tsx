import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { KaargarUser } from '../contexts/AuthContext';

type Mode = 'choose' | 'artisan-login' | 'artisan-signup' | 'collector-login' | 'collector-signup';

export default function Onboarding() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('choose');

  // Shared OTP state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Artisan signup extra fields
  const [name, setName] = useState('');
  const [atelier, setAtelier] = useState('');
  const [craft, setCraft] = useState('');
  const [region, setRegion] = useState('');
  const [state, setState] = useState('');
  const [bio, setBio] = useState('');

  // Collector signup extra fields
  const [collectorName, setCollectorName] = useState('');
  const [city, setCity] = useState('');

  const resetForm = () => {
    setPhone(''); setEmail(''); setOtpSent(false); setOtpCode(''); setErrorMsg('');
    setName(''); setAtelier(''); setCraft(''); setRegion(''); setState(''); setBio('');
    setCollectorName(''); setCity('');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setErrorMsg('Please enter a valid 10-digit mobile number'); return; }
    setErrorMsg('');
    setOtpSent(true);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) { setErrorMsg('Please enter the 4-digit verification code'); return; }

    const id = `kg-${Date.now()}`;

    if (mode === 'artisan-signup' || mode === 'artisan-login') {
      const user: KaargarUser = {
        id,
        role: 'artisan',
        name: name || 'Master Artisan',
        email: email || '',
        phone: `+91 ${phone}`,
        atelier: atelier || 'Independent Craft Atelier',
        craftSpecialization: craft || 'Traditional Indian Craft',
        region: region || 'India',
        state: state || '',
        bio: bio || '',
        yearsExperience: 10,
        avatarUrl: '',
      };
      login(user);
      navigate('/dashboard');
    } else {
      const user: KaargarUser = {
        id,
        role: 'collector',
        name: collectorName || 'Art Collector',
        email: email || '',
        phone: `+91 ${phone}`,
        city: city || '',
        preferredCategories: [],
      };
      login(user);
      navigate('/shop');
    }
  };

  const titles: Record<Mode, string> = {
    choose: 'Welcome to KAARIGAR',
    'artisan-login': 'Artisan Sign In',
    'artisan-signup': 'Artisan Registration',
    'collector-login': 'Collector Sign In',
    'collector-signup': 'Collector Registration',
  };

  const subtitles: Record<Mode, string> = {
    choose: 'India\'s living heritage marketplace — directly connecting master artisans with collectors.',
    'artisan-login': 'Access your Atelier Console and manage your listed masterworks.',
    'artisan-signup': 'Join our vetted network. 85%+ direct payouts, zero exploitative contracts.',
    'collector-login': 'Access your curated wishlists and acquisition history.',
    'collector-signup': 'Discover and acquire authenticated Indian masterworks directly from artisans.',
  };

  return (
    <main className="onboarding-page" role="main" aria-label="Sign In or Registration">
      <div className="onboarding-page__inner">
        <div className="onboarding-card">
          <div className="onboarding-card__header">
            <Link to="/" className="onboarding-brand-link">
              <span className="onboarding-brand-sub">कारिगर PORTAL</span>
            </Link>
            <h1 className="onboarding-title">{titles[mode]}</h1>
            <p className="onboarding-subtitle">{subtitles[mode]}</p>
          </div>

          {/* MODE: CHOOSE */}
          {mode === 'choose' && (
            <div className="onboarding-role-choice">
              <div className="role-choice-card" onClick={() => setMode('artisan-login')}>
                <div className="role-choice-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h2>Master Artisan</h2>
                <p>List your craft, manage your atelier, receive direct payouts</p>
                <div className="role-choice-actions">
                  <button type="button" className="role-action-btn role-action-btn--primary" onClick={(e) => { e.stopPropagation(); resetForm(); setMode('artisan-login'); }}>Sign In</button>
                  <button type="button" className="role-action-btn role-action-btn--secondary" onClick={(e) => { e.stopPropagation(); resetForm(); setMode('artisan-signup'); }}>Register</button>
                </div>
              </div>

              <div className="role-choice-divider">or</div>

              <div className="role-choice-card" onClick={() => setMode('collector-login')}>
                <div className="role-choice-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <h2>Art Collector</h2>
                <p>Discover, wishlist, and acquire authenticated Indian masterworks</p>
                <div className="role-choice-actions">
                  <button type="button" className="role-action-btn role-action-btn--primary" onClick={(e) => { e.stopPropagation(); resetForm(); setMode('collector-login'); }}>Sign In</button>
                  <button type="button" className="role-action-btn role-action-btn--secondary" onClick={(e) => { e.stopPropagation(); resetForm(); setMode('collector-signup'); }}>Register</button>
                </div>
              </div>
            </div>
          )}

          {/* ARTISAN LOGIN */}
          {(mode === 'artisan-login' || mode === 'collector-login') && !otpSent && (
            <form onSubmit={handleSendOtp} className="onboarding-form">
              <div className="form-group">
                <label htmlFor="login-phone">Mobile Number *</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input id="login-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))} placeholder="98160 44291" className="phone-input" maxLength={10} />
                </div>
              </div>
              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}
              <button type="submit" className="onboarding-submit-btn" id="send-otp-btn">
                <span>Send OTP</span><span className="arrow">→</span>
              </button>
              <p className="onboarding-switch-text">
                No account?{' '}
                <button type="button" className="text-link-btn" onClick={() => { resetForm(); setMode(mode === 'artisan-login' ? 'artisan-signup' : 'collector-signup'); }}>
                  Register here
                </button>
              </p>
              <button type="button" className="back-mode-btn" onClick={() => { resetForm(); setMode('choose'); }}>← Back</button>
            </form>
          )}

          {/* ARTISAN SIGNUP */}
          {mode === 'artisan-signup' && !otpSent && (
            <form onSubmit={handleSendOtp} className="onboarding-form">
              <div className="form-group">
                <label htmlFor="a-name">Artisan Name *</label>
                <input id="a-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pandit Ram Swaroop Sharma" className="form-input" />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="a-atelier">Atelier / Workshop Name *</label>
                  <input id="a-atelier" type="text" required value={atelier} onChange={(e) => setAtelier(e.target.value)} placeholder="e.g. Chamba Parampara Gurukulam" className="form-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="a-craft">Craft Specialization *</label>
                  <input id="a-craft" type="text" required value={craft} onChange={(e) => setCraft(e.target.value)} placeholder="e.g. Kangra Miniature" className="form-input" />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="a-region">District / Region *</label>
                  <input id="a-region" type="text" required value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Kangra Valley" className="form-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="a-state">State *</label>
                  <input id="a-state" type="text" required value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Himachal Pradesh" className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="a-bio">Atelier Lineage Summary</label>
                <textarea id="a-bio" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief history of your generational craft practice…" className="form-textarea" />
              </div>
              <div className="form-group">
                <label htmlFor="signup-phone">Mobile Number for OTP *</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input id="signup-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))} placeholder="98160 44291" className="phone-input" maxLength={10} />
                </div>
              </div>
              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}
              <button type="submit" className="onboarding-submit-btn">
                <span>Send OTP to Verify</span><span className="arrow">→</span>
              </button>
              <p className="onboarding-switch-text">
                Already registered?{' '}
                <button type="button" className="text-link-btn" onClick={() => { resetForm(); setMode('artisan-login'); }}>Sign in</button>
              </p>
              <button type="button" className="back-mode-btn" onClick={() => { resetForm(); setMode('choose'); }}>← Back</button>
            </form>
          )}

          {/* COLLECTOR SIGNUP */}
          {mode === 'collector-signup' && !otpSent && (
            <form onSubmit={handleSendOtp} className="onboarding-form">
              <div className="form-group">
                <label htmlFor="c-name">Your Name *</label>
                <input id="c-name" type="text" required value={collectorName} onChange={(e) => setCollectorName(e.target.value)} placeholder="e.g. Arundhati Verma" className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="c-city">City</label>
                <input id="c-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. New Delhi" className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="c-phone">Mobile Number for OTP *</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input id="c-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))} placeholder="98765 43210" className="phone-input" maxLength={10} />
                </div>
              </div>
              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}
              <button type="submit" className="onboarding-submit-btn">
                <span>Send OTP to Verify</span><span className="arrow">→</span>
              </button>
              <p className="onboarding-switch-text">
                Already registered?{' '}
                <button type="button" className="text-link-btn" onClick={() => { resetForm(); setMode('collector-login'); }}>Sign in</button>
              </p>
              <button type="button" className="back-mode-btn" onClick={() => { resetForm(); setMode('choose'); }}>← Back</button>
            </form>
          )}

          {/* OTP VERIFY (all modes) */}
          {mode !== 'choose' && otpSent && (
            <form onSubmit={handleVerify} className="onboarding-form">
              <div className="otp-sent-notice">
                <span>Passcode dispatched via SMS to <strong>+91 {phone}</strong></span>
                <button type="button" className="edit-phone-btn" onClick={() => setOtpSent(false)}>Change number</button>
              </div>
              <div className="form-group">
                <label htmlFor="otp-input">4-Digit Verification Passcode *</label>
                <input id="otp-input" type="text" maxLength={6} autoFocus required value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="e.g. 1234" className="form-input otp-input" />
                <span className="form-hint">Demo: enter any code like <strong>1234</strong></span>
              </div>
              {errorMsg && <div className="form-error-banner">{errorMsg}</div>}
              <button type="submit" className="onboarding-submit-btn" id="verify-otp-btn">
                <span>Verify & Enter {(mode === 'artisan-login' || mode === 'artisan-signup') ? 'Artisan Atelier' : 'Marketplace'}</span>
                <span className="arrow">→</span>
              </button>
            </form>
          )}

          <div className="onboarding-card__footer">
            <Link to="/" className="onboarding-back-link">
              <span aria-hidden="true">←</span>
              <span>Return to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
