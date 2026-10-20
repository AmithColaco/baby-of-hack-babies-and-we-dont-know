// KalaHaat – Cart + Checkout page
export default function Checkout() {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 640, paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-8)' }}>Your Cart</h1>
        <p style={{ color: 'var(--color-text-2)' }}>Cart is empty.</p>
      </div>
    </main>
  );
}
