import { useState } from 'react'
import { IMG } from '../lib/tmdb'
import { STATUS_LABELS } from '../lib/constants'

const STATUSES = ['watchlist', 'watching', 'watched']
const ICONS = { watchlist: '🔖', watching: '▶️', watched: '✅' }

// RD2 (BINGR_UI_AUDIT.md) — Watchlist/Watching/Watched used to be three
// separate nav tabs around one parameterized component. Now one Library
// destination with a status segmented control doing the job all three
// tabs used to.
export default function LibraryTab({ library, onOpen, onRemove, episodeProps }) {
  const [status, setStatus] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const all = Object.values(library).filter(x => STATUSES.includes(x.status))
  const byStatus = status === 'all' ? all : all.filter(x => x.status === status)
  const movies = byStatus.filter(x => x.media_type === 'movie')
  const shows = byStatus.filter(x => x.media_type === 'tv')
  const filtered = typeFilter === 'movie' ? movies : typeFilter === 'tv' ? shows : byStatus

  const statusCount = (s) => all.filter(x => x.status === s).length

  if (!all.length) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔖</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Your library is empty</div>
      <div style={{ fontSize: 14 }}>Browse Discover to add titles</div>
    </div>
  )

  return (
    <div>
      {/* Status segmented control */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
            border: `1px solid ${status === s ? 'var(--accent)' : 'var(--border)'}`,
            background: status === s ? 'var(--accent)' : 'var(--bg-input)',
            color: status === s ? '#fff' : 'var(--text-muted)',
            fontFamily: 'inherit', fontWeight: status === s ? 600 : 400,
          }}>
            {s === 'all' ? `All (${all.length})` : `${ICONS[s]} ${STATUS_LABELS[s]} (${statusCount(s)})`}
          </button>
        ))}
      </div>

      {/* Header + type filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          {status === 'all' ? 'Library' : STATUS_LABELS[status]} ({filtered.length})
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'movie', 'tv'].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${typeFilter === f ? 'var(--accent)' : 'var(--border)'}`,
              background: typeFilter === f ? 'var(--accent)' : 'var(--bg-input)',
              color: typeFilter === f ? '#fff' : 'var(--text-muted)',
              fontFamily: 'inherit',
            }}>
              {f === 'all' ? `All (${byStatus.length})` : f === 'movie' ? `🎬 Movies (${movies.length})` : `📺 TV (${shows.length})`}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: 14 }}>Nothing here yet</div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(item => {
          const title = item.title || item.name || ''
          const year = (item.release_date || item.first_air_date || '').slice(0, 4)
          const tmdbR = item.vote_average ? item.vote_average.toFixed(1) : ''
          const poster = IMG(item.poster_path)
          const isTV = item.media_type === 'tv'

          // next episode for TV
          const nextEp = isTV && episodeProps ? episodeProps.getNextEpisodeById(item.tmdb_id) : null
          const showProg = isTV && episodeProps ? episodeProps.getShowProgressById(item.tmdb_id) : null

          return (
            <div key={item.tmdb_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <div onClick={() => onOpen({ ...item, id: item.tmdb_id })}
                style={{ width: 38, height: 56, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)', cursor: 'pointer' }}>
                {poster
                  ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{isTV ? '📺' : '🎬'}</div>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onOpen({ ...item, id: item.tmdb_id })}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {year} · {isTV ? 'TV' : 'Film'}{tmdbR ? ` · ★ ${tmdbR}` : ''}{status === 'all' ? ` · ${ICONS[item.status]} ${STATUS_LABELS[item.status]}` : ''}
                </div>
                {item.rating > 0 && (
                  <div style={{ fontSize: 11, color: '#ef9f27', marginTop: 2 }}>{'★'.repeat(item.rating)} {item.rating}/10</div>
                )}
                {/* TV progress */}
                {isTV && showProg && showProg.total > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                      {showProg.watched}/{showProg.total} eps
                      {nextEp ? <span style={{ color: '#ba7517', marginLeft: 6 }}>▶ Up next: S{String(nextEp.season).padStart(2,'0')}E{String(nextEp.episode).padStart(2,'0')}</span>
                        : showProg.watched === showProg.total ? <span style={{ color: '#1d9e75', marginLeft: 6 }}>All caught up ✓</span> : null}
                    </div>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', width: 120 }}>
                      <div style={{ height: '100%', width: `${(showProg.watched / showProg.total) * 100}%`, background: '#1d9e75', borderRadius: 3 }} />
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => { if (window.confirm(`Remove "${title}" from ${STATUS_LABELS[item.status].toLowerCase()}?`)) onRemove(item.tmdb_id) }} title="Remove" style={{
                width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)',
                background: 'var(--bg-input)', cursor: 'pointer', fontSize: 14,
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e24b4a'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >✕</button>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
