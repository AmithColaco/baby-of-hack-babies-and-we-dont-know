import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { changeLanguage } from '../i18n';
import { OfflineBanner } from '../components/artisan';
import '../artisan.css';

type Mode = 'choose' | 'artisan-login' | 'artisan-signup' | 'collector-login' | 'collector-signup';

const RESEND_COUNTDOWN = 30;

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { loginWithOtp, requestOtp, updateProfileOnBackend } = useAuth();
  const [mode, setMode] = useState<Mode>('choose');

  // Phone & OTP state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpBoxes, setOtpBoxes] = useState<string[]>(['1', '2', '3', '4', '5', '6']);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  // Artisan signup extra fields (plain everyday language)
  const [name, setName] = useState('');
  const [craft, setCraft] = useState('');
  const [village, setVillage] = useState('');
  const [bio, setBio] = useState('');

  // Collector signup extra fields
  const [collectorName, setCollectorName] = useState('');

  // OTP input refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (!otpSent) return;
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent]);

  // Web OTP API integration for supported mobile browsers
  useEffect(() => {
    if (!otpSent || typeof window === 'undefined' || !('OTPCredential' in window)) return;

    const ac = new AbortController();
    (navigator.credentials as any)
      .get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      })
      .then((otp: any) => {
        if (otp?.code) {
          const digits = otp.code.replace(/\D/g, '').slice(0, 6).split('');
          const padded = [...digits, ...Array(6 - digits.length).fill('')];
          setOtpBoxes(padded);
        }
      })
      .catch(() => {
        // Fallback gracefully on rejection or timeout
      });

    return () => ac.abort();
  }, [otpSent]);

  const resetForm = () => {
    setPhone('');
    setOtpSent(false);
    setOtpBoxes(['1', '2', '3', '4', '5', '6']);
    setErrorMsg('');
    setName('');
    setCraft('');
    setVillage('');
    setBio('');
    setCollectorName('');
    setLoading(false);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg(t('artisan.phone_error', 'Please enter your 10-digit mobile number.'));
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const fullPhone = `+91${digits.slice(-10)}`;
    try {
      await requestOtp(fullPhone);
      setOtpSent(true);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch {
      // Local fallback / friendly error
      setOtpSent(true);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    const char = val.slice(-1).replace(/\D/g, '');
    const newBoxes = [...otpBoxes];
    newBoxes[index] = char;
    setOtpBoxes(newBoxes);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split('');
    const newBoxes = [...otpBoxes];
    digits.forEach((d, i) => {
      if (i < 6) newBoxes[i] = d;
    });
    setOtpBoxes(newBoxes);
    const nextIdx = Math.min(digits.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpBoxes.join('').trim();
    if (fullCode.length < 4) {
      setErrorMsg(t('artisan.otp_error', 'Please enter the 6-digit code sent to your phone. (Demo code: 123456)'));
      return;
    }

    const cleanOtp = fullCode.length === 4 ? `${fullCode}00` : fullCode;
    const digits = phone.replace(/\D/g, '');
    const fullPhone = `+91${digits.slice(-10)}`;
    setErrorMsg('');
    setLoading(true);

    try {
      const loggedUser = await loginWithOtp(fullPhone, cleanOtp);

      if (mode === 'artisan-signup') {
        await updateProfileOnBackend({
          name: name || 'Master Artisan',
          craft_types: craft || 'Traditional Crafts',
          village: village || 'Karnataka',
          bio: bio || '',
          role: 'artisan',
        });
        navigate('/dashboard');
      } else if (mode === 'artisan-login') {
        if (loggedUser.role !== 'artisan') {
          await updateProfileOnBackend({ role: 'artisan' });
        }
        navigate('/dashboard');
      } else if (mode === 'collector-signup') {
        await updateProfileOnBackend({
          name: collectorName || 'Art Lover',
          role: 'buyer',
        });
        navigate('/catalogue');
      } else {
        navigate('/catalogue');
      }
    } catch {
      setErrorMsg(t('artisan.verify_error', 'Verification code did not match. Please try again or use 123456.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="artisan-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OfflineBanner />

      {/* Language Switcher Bar — Reachable on all screens */}
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1rem', gap: '0.5rem' }}>
        {(['en', 'kn', 'hi'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => changeLanguage(lang)}
            style={{
              background: i18n.language === lang ? 'var(--a-accent, #B85D19)' : 'var(--a-card-bg, #fff)',
              color: i18n.language === lang ? '#fff' : 'var(--a-text, #1C1611)',
              border: '2px solid var(--a-border, #d1c7bd)',
              borderRadius: '999px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {lang === 'en' ? 'English' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '520px', padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--a-accent, #B85D19)', letterSpacing: '0.05em' }}>
            KAARIGAR
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--a-muted, #7A6958)', marginTop: '0.25rem' }}>
            {t('artisan.tagline', 'Direct from master hands to conscious homes')}
          </div>
        </div>

        {/* MODE: CHOOSE ROLE */}
        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => { resetForm(); setMode('artisan-login'); }}
              style={{
                width: '100%',
                minHeight: '88px',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '3px solid var(--a-accent, #B85D19)',
                background: 'var(--a-card-bg, #FFF)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🎨</span>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--a-text, #1C1611)' }}>
                  {t('artisan.role_artisan', 'I am an Artisan / Maker')}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--a-muted, #7A6958)' }}>
                  {t('artisan.role_artisan_desc', 'Sell your handmade crafts directly. Keep fair earnings.')}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { resetForm(); setMode('collector-login'); }}
              style={{
                width: '100%',
                minHeight: '88px',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '2px solid var(--a-border, #D6C8B8)',
                background: 'var(--a-card-bg, #FFF)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🛍️</span>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--a-text, #1C1611)' }}>
                  {t('artisan.role_buyer', 'I am a Buyer / Patron')}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--a-muted, #7A6958)' }}>
                  {t('artisan.role_buyer_desc', 'Buy authenticated handmade crafts directly from artisans.')}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* STEP 1: PHONE INPUT */}
        {mode !== 'choose' && !otpSent && (
          <form onSubmit={handleSendOtp} style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '2px solid var(--a-border, #D6C8B8)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--a-text, #1C1611)' }}>
              {mode.startsWith('artisan') ? t('artisan.artisan_login', 'Artisan Login') : t('artisan.buyer_login', 'Buyer Login')}
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--a-muted, #7A6958)', marginBottom: '1.25rem' }}>
              {t('artisan.enter_phone_hint', 'Enter your mobile number. We will send a 6-digit code via SMS.')}
            </p>

            {mode === 'artisan-signup' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="art-name" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '1rem' }}>
                    {t('artisan.your_name', 'Your Full Name')} *
                  </label>
                  <input
                    id="art-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Parvatamma Badiger"
                    className="a-form-input"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="art-craft" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '1rem' }}>
                    {t('artisan.craft_specialty', 'What craft do you make?')} *
                  </label>
                  <input
                    id="art-craft"
                    type="text"
                    required
                    value={craft}
                    onChange={(e) => setCraft(e.target.value)}
                    placeholder="e.g. Kasuti Hand Embroidery, Pottery, Weaving"
                    className="a-form-input"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="art-village" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '1rem' }}>
                    {t('artisan.village_district', 'Village / Town & District')} *
                  </label>
                  <input
                    id="art-village"
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Dharwad, Karnataka"
                    className="a-form-input"
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="phone-input" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '1rem' }}>
                {t('artisan.phone_label', 'Mobile Number (10 digits)')} *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--a-border, #D6C8B8)', borderRadius: '12px', overflow: 'hidden' }}>
                <span style={{ padding: '0.75rem 1rem', background: '#F5EFE6', fontWeight: 700, fontSize: '1.1rem', color: '#1C1611', borderRight: '2px solid var(--a-border, #D6C8B8)' }}>
                  +91
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  style={{
                    flex: 1,
                    border: 'none',
                    padding: '0.85rem 1rem',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="a-form-error" role="alert" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              id="send-otp-btn"
              style={{
                width: '100%',
                minHeight: '56px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--a-accent, #B85D19)',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 700,
                cursor: loading || phone.length < 10 ? 'not-allowed' : 'pointer',
                opacity: loading || phone.length < 10 ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? t('artisan.sending', 'Sending code…') : t('artisan.send_code', 'Send Verification Code →')}
            </button>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('choose'); }}
                style={{ background: 'none', border: 'none', color: 'var(--a-muted, #7A6958)', fontSize: '0.95rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                ← {t('common.back', 'Back')}
              </button>

              {mode === 'artisan-login' && (
                <button
                  type="button"
                  onClick={() => setMode('artisan-signup')}
                  style={{ background: 'none', border: 'none', color: 'var(--a-accent, #B85D19)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {t('artisan.new_artisan_register', 'New artisan? Register here')}
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY OTP (BIG BOXES, NUMBER PAD, AUTO-ADVANCE, COUNTDOWN) */}
        {mode !== 'choose' && otpSent && (
          <form onSubmit={handleVerify} style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '2px solid var(--a-border, #D6C8B8)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--a-text, #1C1611)' }}>
              {t('artisan.enter_code', 'Enter Verification Code')}
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--a-muted, #7A6958)', marginBottom: '1.25rem' }}>
              {t('artisan.code_sent_to', 'We sent a 6-digit code to')} <strong>+91 {phone}</strong>.{' '}
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                style={{ background: 'none', border: 'none', color: 'var(--a-accent, #B85D19)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {t('artisan.change_number', 'Change')}
              </button>
            </p>

            {/* 6 Big OTP boxes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
              role="group"
              aria-label={t('artisan.otp_boxes', '6-digit code')}
            >
              {otpBoxes.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  aria-label={`${t('artisan.digit', 'Digit')} ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '60px',
                    textAlign: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    border: '2px solid var(--a-border, #D6C8B8)',
                    background: '#FAFAF7',
                    color: 'var(--a-text, #1C1611)',
                    outline: 'none',
                  }}
                />
              ))}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--a-muted, #7A6958)', textAlign: 'center', marginBottom: '1rem' }}>
              💡 {t('artisan.demo_hint', 'Demo mode: you can use code 123456 to sign in instantly.')}
            </p>

            {errorMsg && (
              <div className="a-form-error" role="alert" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="verify-otp-btn"
              style={{
                width: '100%',
                minHeight: '56px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--a-green, #1E7E34)',
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {loading ? t('artisan.verifying', 'Checking code…') : `✓ ${t('artisan.verify_and_enter', 'Confirm & Enter')}`}
            </button>

            {/* Countdown timer & Resend button */}
            <div style={{ textAlign: 'center' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--a-accent, #B85D19)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  🔄 {t('artisan.send_again', 'Send code again')}
                </button>
              ) : (
                <span style={{ fontSize: '0.95rem', color: 'var(--a-muted, #7A6958)' }}>
                  ⏳ {t('artisan.resend_countdown', 'Send code again in {{sec}}s', { sec: countdown })}
                </span>
              )}
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: 'var(--a-muted, #7A6958)', fontSize: '0.95rem', textDecoration: 'none' }}>
            ← {t('artisan.return_home', 'Return to Home')}
          </Link>
        </div>
      </div>
    </main>
  );
}
