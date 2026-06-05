import { useState } from 'react'
import { filterLibrary, exportTXT, exportCSV } from '../lib/export'

export default function ExportPanel({ library }) {
  const [status, setStatus] = useState('all')
  const [mediaType, setMediaType] = useState('all')
  const [sortBy, setSortBy] = useState('added')
  const [limit, setLimit] = useState('all')
  const [open, setOpen] = useState(false)

  const preview = filterLibrary(library, {
    status, mediaType, sortBy,
    limit: limit === 'all' ? null : parseInt(limit)
  })

  const handleExport = (format) => {
    const opts = { status, mediaType }
    const items = filterLibrary(library, { status, mediaType, sortBy, limit: limit === 'all' ? null : parseInt(limit) })
    if (format === 'txt') exportTXT(items, opts)
    if (format === 'csv') exportCSV(items, opts)
  }

  const Sel = ({ value, onChange, children }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '6px 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
      {children}
    </select>
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📤</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Export my library</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </div>

      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: '1rem', display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Status</div>
              <Sel value={status} onChange={setStatus}>
                <option value="all">All</option>
                <option value="watchlist">Watchlist</option>
                <option value="watching">Watching</option>
                <option value="watched">Watched</option>
              </Sel>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Type</div>
              <Sel value={mediaType} onChange={setMediaType}>
                <option value="all">All</option>
                <option value="movie">Movies</option>
                <option value="tv">TV Shows</option>
              </Sel>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Sort by</div>
              <Sel value={sortBy} onChange={setSortBy}>
                <option value="added">Date added</option>
                <option value="rating">My rating</option>
                <option value="title">Title A–Z</option>
                <option value="year">Year</option>
              </Sel>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Limit</div>
              <Sel value={limit} onChange={setLimit}>
                <option value="all">All ({Object.keys(library).length})</option>
                <option value="10">Top 10</option>
                <option value="25">Top 25</option>
                <option value="50">Top 50</option>
              </Sel>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            {preview.length} title{preview.length !== 1 ? 's' : ''} will be exported
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleExport('txt')} disabled={!preview.length}
              style={{ flex: 1, padding: '9px', background: preview.length ? 'var(--accent)' : 'var(--border)', color: preview.length ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: preview.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Download TXT
            </button>
            <button onClick={() => handleExport('csv')} disabled={!preview.length}
              style={{ flex: 1, padding: '9px', background: preview.length ? 'var(--bg-input)' : 'var(--border)', color: 'var(--text)', border: `1px solid ${preview.length ? 'var(--border)' : 'transparent'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: preview.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Download CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
