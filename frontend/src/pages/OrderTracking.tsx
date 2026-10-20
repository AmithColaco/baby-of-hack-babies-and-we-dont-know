// KalaHaat – Order tracking page
export default function OrderTracking() {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 600, paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Order confirmed 🎉</h1>
        <p style={{ color: 'var(--color-text-2)' }}>Your order is being prepared by the artisan.</p>
      </div>
    </main>
  );
}
