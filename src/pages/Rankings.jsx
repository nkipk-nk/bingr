import { useState } from 'react'
import { IMG } from '../lib/tmdb'

const LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']

export default function Rankings({ library, onOpen }) {
  const [filter, setFilter] = useState('all')

  const rated = Object.values(library).filter(x => x.rating > 0)
  const filtered = filter === 'all' ? rated : rated.filter(x => x.media_type === filter)
  const sorted = [...filtered].sort((a, b) => b.rating - a.rating)

  if (!rated.length) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>No ratings yet</div>
      <div style={{ fontSize: 14 }}>Open any title, rate it with stars, and it'll appear here.</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          🏆 My Rankings ({sorted.length})
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ fontSize: 13, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
      </div>

      {sorted.map((item, i) => {
        const title = item.title || item.name || ''
        const year = (item.release_date || item.first_air_date || '').slice(0, 4)
        const poster = IMG(item.poster_path)
        const isTop = i < 3

        return (
          <div
            key={item.tmdb_id}
            onClick={() => onOpen({ ...item, id: item.tmdb_id })}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 8,
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {/* Rank number */}
            <div style={{ fontSize: 20, fontWeight: 700, minWidth: 32, textAlign: 'center', flexShrink: 0, color: isTop ? 'var(--accent)' : 'var(--text-muted)' }}>
              {i + 1}
            </div>

            {/* Poster */}
            <div style={{ width: 38, height: 56, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)' }}>
              {poster
                ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{year} · {item.media_type === 'tv' ? 'TV' : 'Film'}</div>
            </div>

            {/* Rating */}
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ef9f27' }}>
                {'★'.repeat(Math.min(item.rating, 10))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {item.rating}/10 · {LABELS[item.rating]}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
