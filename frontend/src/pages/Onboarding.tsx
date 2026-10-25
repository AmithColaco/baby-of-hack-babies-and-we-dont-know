import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'choose' | 'artisan' | 'buyer';
type Step = 'contact' | 'otp';

const RESEND_COOLDOWN = 30;

export default function Onboarding() {
  const navigate = useNavigate();
  const { loginWithOtp, requestOtp } = useAuth();

  const [mode, setMode] = useState<Mode>('choose');
  const [step, setStep] = useState<Step>('contact');

  // Contact
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // OTP
  const [otpBoxes, setOtpBoxes] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Loading & countdown
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Start countdown after OTP is sent
  useEffect(() => {
    if (step !== 'otp') return;
    setCountdown(RESEND_COOLDOWN);
    setCanResend(false);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const reset = () => {
    setEmail('');
    setEmailError('');
    setOtpBoxes(['', '', '', '', '', '']);
    setOtpError('');
    setStep('contact');
    setLoading(false);
  };

  const validateEmail = (v: string) => /^[^@]+@[^@]+\.[^@]{2,}$/.test(v.trim());

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(email.trim(), 'email');
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setEmailError(err?.response?.data?.detail || 'Could not send verification code. Please check your email or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = [...otpBoxes];
      cleaned.slice(0, 6 - idx).split('').forEach((d, i) => {
        if (idx + i < 6) next[idx + i] = d;
      });
      setOtpBoxes(next);
      const nextFocus = Math.min(idx + cleaned.length, 5);
      otpRefs.current[nextFocus]?.focus();
      return;
    }
    const digit = cleaned.slice(-1);
    const next = [...otpBoxes];
    next[idx] = digit;
    setOtpBoxes(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpBoxes[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split('');
    const next = [...otpBoxes];
    digits.forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtpBoxes(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const code = otpBoxes.join('');
    if (code.length < 6) {
      setOtpError('Enter the 6-digit code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      const role = mode === 'artisan' ? 'artisan' : 'buyer';
      const loggedUser = await loginWithOtp(email.trim(), code, 'email', role);

      if (loggedUser.role === 'artisan') {
        navigate('/dashboard');
      } else {
        navigate('/gallery');
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.detail || 'Invalid or expired code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #FDFBF7)',
        padding: '2rem 1rem',
      }}
      role="main"
      aria-label="Sign in"
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div
              style={{
                fontFamily: 'var(--font-display, Georgia, serif)',
                fontSize: '1.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--charcoal, #1C1C1A)',
              }}
            >
              KAARIGAR
            </div>
          </Link>
          <div
            style={{
              marginTop: '0.375rem',
              fontSize: '0.8125rem',
              color: 'var(--stone, #7A7570)',
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-ui, system-ui, sans-serif)',
            }}
          >
            Direct from master hands to conscious homes
          </div>
        </div>

        {/* ── STEP: CHOOSE ROLE ── */}
        {mode === 'choose' && (
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display, Georgia, serif)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--charcoal, #1C1C1A)',
                marginBottom: '0.5rem',
                textAlign: 'center',
              }}
            >
              Welcome
            </h1>
            <p
              style={{
                textAlign: 'center',
                color: 'var(--stone, #7A7570)',
                fontSize: '0.875rem',
                marginBottom: '2rem',
                fontFamily: 'var(--font-ui, system-ui, sans-serif)',
              }}
            >
              How would you like to continue?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                id="role-artisan"
                onClick={() => { reset(); setMode('artisan'); }}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  border: '1.5px solid var(--fog, #D4CEC5)',
                  borderRadius: '10px',
                  background: 'var(--warm-white, #FDFBF7)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 200ms, background 200ms',
                  fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--terracotta, #B85C38)';
                  (e.currentTarget as HTMLButtonElement).style.background = '#FDF8F4';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fog, #D4CEC5)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--warm-white, #FDFBF7)';
                }}
              >
                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--terracotta, #B85C38)', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Artisan / Maker
                </div>
                <div style={{ fontSize: '0.9375rem', color: 'var(--charcoal, #1C1C1A)', fontWeight: 500 }}>
                  Sell your handmade crafts directly
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--stone, #7A7570)', marginTop: '0.2rem' }}>
                  Manage listings, orders, and earnings
                </div>
              </button>

              <button
                type="button"
                id="role-buyer"
                onClick={() => { reset(); setMode('buyer'); }}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  border: '1.5px solid var(--fog, #D4CEC5)',
                  borderRadius: '10px',
                  background: 'var(--warm-white, #FDFBF7)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 200ms, background 200ms',
                  fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--terracotta, #B85C38)';
                  (e.currentTarget as HTMLButtonElement).style.background = '#FDF8F4';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fog, #D4CEC5)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--warm-white, #FDFBF7)';
                }}
              >
                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sage, #5A7A60)', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Buyer / Patron
                </div>
                <div style={{ fontSize: '0.9375rem', color: 'var(--charcoal, #1C1C1A)', fontWeight: 500 }}>
                  Discover authenticated craft objects
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--stone, #7A7570)', marginTop: '0.2rem' }}>
                  Browse, collect, and commission
                </div>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--stone, #7A7570)', textDecoration: 'none' }}>
                Return to home
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP: ENTER EMAIL ── */}
        {mode !== 'choose' && step === 'contact' && (
          <form onSubmit={handleSendOtp} noValidate>
            <button
              type="button"
              onClick={() => { reset(); setMode('choose'); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--stone, #7A7570)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                padding: '0',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontFamily: 'var(--font-ui, system-ui, sans-serif)',
              }}
            >
              ← Back
            </button>

            <h1
              style={{
                fontFamily: 'var(--font-display, Georgia, serif)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--charcoal, #1C1C1A)',
                marginBottom: '0.4rem',
              }}
            >
              {mode === 'artisan' ? 'Artisan sign-in' : 'Buyer sign-in'}
            </h1>
            <p style={{ color: 'var(--stone, #7A7570)', fontSize: '0.875rem', marginBottom: '1.75rem', fontFamily: 'var(--font-ui, system-ui, sans-serif)' }}>
              Enter your email address. We'll send a one-time code.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="email-input"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--graphite, #4A4740)',
                  marginBottom: '0.4rem',
                  fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Email address
              </label>
              <input
                id="email-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  border: `1.5px solid ${emailError ? 'var(--terracotta, #B85C38)' : 'var(--fog, #D4CEC5)'}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: 'var(--charcoal, #1C1C1A)',
                  background: 'var(--warm-white, #FDFBF7)',
                  outline: 'none',
                  fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                  boxSizing: 'border-box',
                  transition: 'border-color 200ms',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--terracotta, #B85C38)'; }}
                onBlur={e => { if (!emailError) e.currentTarget.style.borderColor = 'var(--fog, #D4CEC5)'; }}
              />
              {emailError && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--terracotta, #B85C38)', marginTop: '0.4rem', fontFamily: 'var(--font-ui, system-ui, sans-serif)' }}>
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              id="send-otp-btn"
              disabled={loading || !email}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: loading || !email ? 'var(--fog, #D4CEC5)' : 'var(--charcoal, #1C1C1A)',
                color: loading || !email ? 'var(--stone, #7A7570)' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: loading || !email ? 'not-allowed' : 'pointer',
                transition: 'background 200ms, color 200ms',
                fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? 'Sending…' : 'Send verification code'}
            </button>

          </form>
        )}

        {/* ── STEP: VERIFY OTP ── */}
        {mode !== 'choose' && step === 'otp' && (
          <form onSubmit={handleVerify}>
            <button
              type="button"
              onClick={() => setStep('contact')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--stone, #7A7570)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                padding: '0',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontFamily: 'var(--font-ui, system-ui, sans-serif)',
              }}
            >
              ← Back
            </button>

            <h1
              style={{
                fontFamily: 'var(--font-display, Georgia, serif)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--charcoal, #1C1C1A)',
                marginBottom: '0.4rem',
              }}
            >
              Check your email
            </h1>
            <p style={{ color: 'var(--stone, #7A7570)', fontSize: '0.875rem', marginBottom: '1.75rem', fontFamily: 'var(--font-ui, system-ui, sans-serif)', lineHeight: 1.55 }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--graphite, #4A4740)' }}>{email}</strong>.
            </p>

            {/* OTP input boxes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
              role="group"
              aria-label="6-digit verification code"
            >
              {otpBoxes.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${idx + 1}`}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  style={{
                    width: '100%',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                    border: `1.5px solid ${digit ? 'var(--terracotta, #B85C38)' : 'var(--fog, #D4CEC5)'}`,
                    borderRadius: '8px',
                    background: 'var(--warm-white, #FDFBF7)',
                    color: 'var(--charcoal, #1C1C1A)',
                    outline: 'none',
                    transition: 'border-color 150ms',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--terracotta, #B85C38)'; }}
                  onBlur={e => { if (!digit) e.currentTarget.style.borderColor = 'var(--fog, #D4CEC5)'; }}
                />
              ))}
            </div>

            {otpError && (
              <p
                role="alert"
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--terracotta, #B85C38)',
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                }}
              >
                {otpError}
              </p>
            )}

            <button
              type="submit"
              id="verify-otp-btn"
              disabled={loading || otpBoxes.join('').length < 6}
              style={{
                width: '100%',
                padding: '0.875rem',
                background:
                  loading || otpBoxes.join('').length < 6
                    ? 'var(--fog, #D4CEC5)'
                    : 'var(--charcoal, #1C1C1A)',
                color:
                  loading || otpBoxes.join('').length < 6
                    ? 'var(--stone, #7A7570)'
                    : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor:
                  loading || otpBoxes.join('').length < 6 ? 'not-allowed' : 'pointer',
                transition: 'background 200ms, color 200ms',
                fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                marginBottom: '1rem',
              }}
            >
              {loading ? 'Verifying…' : 'Confirm & sign in'}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={() => { setOtpBoxes(['', '', '', '', '', '']); handleSendOtp(); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--terracotta, #B85C38)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontFamily: 'var(--font-ui, system-ui, sans-serif)',
                  }}
                >
                  Resend code
                </button>
              ) : (
                <span style={{ fontSize: '0.8125rem', color: 'var(--mist, #B0AAA0)', fontFamily: 'var(--font-ui, system-ui, sans-serif)' }}>
                  Resend in {countdown}s
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
