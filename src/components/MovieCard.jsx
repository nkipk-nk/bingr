import { IMG } from '../lib/tmdb'

const STATUS_COLORS = { watched: '#1d9e75', watching: '#ba7517', watchlist: '#378add' }
const STATUS_LABELS = { watched: 'Watched', watching: 'Watching', watchlist: 'Watchlist' }

export default function MovieCard({ item, entry = {}, onOpen, onSetStatus }) {
  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const rating = item.vote_average ? item.vote_average.toFixed(1) : ''
  const type = item.media_type || 'movie'
  const poster = IMG(item.poster_path)

  return (
    <div
      className="card"
      onClick={() => onOpen(item)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        position: 'relative', transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Poster */}
      <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg-input)', position: 'relative', overflow: 'hidden' }}>
        {poster
          ? <img src={poster} alt={title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--text-muted)' }}>🎬</div>
        }

        {/* Hover overlay */}
        <div className="card-overlay" style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: 0, transition: 'opacity 0.18s',
        }}>
          {['watched', 'watching', 'watchlist'].map(s => (
            <button
              key={s}
              onClick={e => { e.stopPropagation(); onSetStatus(item, s) }}
              style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                background: entry.status === s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.15)',
                color: '#fff', transition: 'background 0.15s',
              }}
            >{STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

      {/* Status badge */}
      {entry.status && (
        <div style={{
          position: 'absolute', top: 7, left: 7,
          background: STATUS_COLORS[entry.status], color: '#fff',
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
        }}>{STATUS_LABELS[entry.status]}</div>
      )}

      {/* User rating badge */}
      {entry.rating > 0 && (
        <div style={{
          position: 'absolute', top: 7, right: 7,
          background: 'rgba(0,0,0,0.75)', color: '#ef9f27',
          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
        }}>★ {entry.rating}</div>
      )}

      {/* Card body */}
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{year} · {type === 'tv' ? 'TV' : 'Film'}</span>
          {rating && <span style={{ color: '#ba7517' }}>★ {rating}</span>}
        </div>
      </div>

      <style>{`.card:hover .card-overlay { opacity: 1 !important; }`}</style>
    </div>
  )
}
