// KalaHaat – Onboarding / login page (mock OTP)
export default function Onboarding() {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 440, paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Welcome back</h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: 'var(--space-8)' }}>Enter your phone number to continue.</p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="phone">Phone number</label>
            <input id="phone" type="tel" className="input-field" placeholder="+91 98765 43210" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" id="login-submit">
            Send OTP
          </button>
        </form>
      </div>
    </main>
  );
}
