// KalaHaat – 3D Virtual Gallery page
export default function Gallery() {
  return (
    <main className="page" style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: '3rem' }}>🏛️</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>3D Gallery</h1>
      <p style={{ color: 'var(--color-text-2)' }}>WebGL scene initialising…</p>
      <div className="spinner" />
    </main>
  );
}
