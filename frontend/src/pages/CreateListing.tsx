// KalaHaat – Create / Edit Listing page
export default function CreateListing() {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 640, paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-8)' }}>Add a piece</h1>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="listing-title">Title</label>
            <input id="listing-title" type="text" className="input-field" placeholder="e.g. Kasuti hand-embroidered dupatta" />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="listing-desc">Description</label>
            <textarea id="listing-desc" className="input-field" placeholder="Describe your piece…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="listing-price">Price (₹)</label>
              <input id="listing-price" type="number" className="input-field" placeholder="0" />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="listing-stock">Stock</label>
              <input id="listing-stock" type="number" className="input-field" placeholder="1" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" id="listing-publish">
            Publish listing
          </button>
        </form>
      </div>
    </main>
  );
}
