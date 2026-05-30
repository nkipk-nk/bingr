import { IMG } from '../lib/tmdb'

const STATUS_LABELS = { watched: 'Watched', watching: 'Watching', watchlist: 'Watchlist' }
const ICONS = { watchlist: '🔖', watching: '▶️', watched: '✅' }

export default function LibraryTab({ status, library, onOpen, onRemove }) {
  const items = Object.values(library).filter(x => x.status === status)

  if (!items.length) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{ICONS[status]}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
        {status === 'watchlist' ? 'Your watchlist is empty' : status === 'watching' ? 'Nothing in progress' : 'Nothing watched yet'}
      </div>
      <div style={{ fontSize: 14 }}>Browse Discover to add titles</div>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
        {STATUS_LABELS[status]} ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => {
          const title = item.title || item.name || ''
          const year = (item.release_date || item.first_air_date || '').slice(0, 4)
          const tmdbR = item.vote_average ? item.vote_average.toFixed(1) : ''
          const poster = IMG(item.poster_path)

          return (
            <div
              key={item.tmdb_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '10px 14px',
              }}
            >
              <div
                onClick={() => onOpen({ ...item, id: item.tmdb_id })}
                style={{ width: 38, height: 56, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)', cursor: 'pointer' }}
              >
                {poster
                  ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onOpen({ ...item, id: item.tmdb_id })}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {year} · {item.media_type === 'tv' ? 'TV' : 'Film'}{tmdbR ? ` · ★ ${tmdbR}` : ''}
                </div>
                {item.rating > 0 && (
                  <div style={{ fontSize: 12, color: '#ef9f27', marginTop: 3 }}>
                    {'★'.repeat(item.rating)} <span style={{ color: 'var(--text-muted)' }}>{item.rating}/10</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onRemove(item.tmdb_id)}
                title="Remove"
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-input)', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e24b4a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
