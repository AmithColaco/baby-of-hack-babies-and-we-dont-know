// KalaHaat – Artisan Dashboard
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <main className="page">
      <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Dashboard</h1>
          <Link to="/dashboard/create" className="btn btn-primary" id="dashboard-add-piece">
            + Add piece
          </Link>
        </div>
        <p style={{ color: 'var(--color-text-2)' }}>No listings yet. Add your first piece above.</p>
      </div>
    </main>
  );
}
