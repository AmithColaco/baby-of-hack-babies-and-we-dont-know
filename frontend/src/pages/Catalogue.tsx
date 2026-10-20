// KalaHaat – Catalogue / storefront page
export default function Catalogue() {
  return (
    <main className="page">
      <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-8)' }}>Shop</h1>
        <div className="loading-center"><div className="spinner" /></div>
      </div>
    </main>
  );
}
