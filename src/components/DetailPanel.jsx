import { useEffect, useState } from 'react'
import { tmdb, IMG } from '../lib/tmdb'
import StarRating from './StarRating'
import EpisodeTracker from './EpisodeTracker'

const STATUS_COLORS = { watched: '#1d9e75', watching: '#ba7517', watchlist: '#378add' }
const STATUS_LABELS = { watched: 'Watched ✓', watching: 'Watching', watchlist: 'Watchlist' }

export default function DetailPanel({ item, entry = {}, onBack, onSetStatus, onSetRating, episodeProps }) {
  const [details, setDetails] = useState(null)
  const [providers, setProviders] = useState({})
  const [recs, setRecs] = useState([])
  const [epTab, setEpTab] = useState(false)
  const type = item.media_type || 'movie'
  const isTV = type === 'tv'

  useEffect(() => {
    setDetails(null); setProviders({}); setRecs([]); setEpTab(false)
    Promise.all([
      isTV ? tmdb.tvDetails(item.id) : tmdb.movieDetails(item.id),
      tmdb.providers(type, item.id),
      tmdb.recommendations(type, item.id),
    ]).then(([d, p, r]) => {
      setDetails(d)
      setProviders(p.results || {})
      setRecs((r.results || []).slice(0, 8).map(x => ({ ...x, media_type: type })))
    })
  }, [item.id, type])

  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const tmdbRating = item.vote_average ? item.vote_average.toFixed(1) : ''
  const poster = IMG(item.poster_path, 'w342')
  const genres = (details?.genres || []).map(g => g.name).join(', ')
  const extra = details?.runtime ? `${details.runtime} min`
    : details?.number_of_seasons ? `${details.number_of_seasons} season${details.number_of_seasons > 1 ? 's' : ''} · ${details.number_of_episodes} eps` : ''

  const regionData = providers.KE || providers.US || providers.GB || {}
  const flat = regionData.flatrate || []
  const rent = regionData.rent || []
  const buy = regionData.buy || []

  // Next episode up
  const nextEp = isTV && details?.seasons && episodeProps
    ? episodeProps.getNextEpisode(item.id, details.seasons)
    : null
  const showProgress = isTV && details?.seasons && episodeProps
    ? episodeProps.getShowProgress(item.id, details.seasons)
    : null

  const ProviderChips = ({ items, label }) => items.length ? (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {items.map(p => (
          <div key={p.provider_id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-input)', fontSize: 13 }}>
            {p.logo_path && <img src={IMG(p.logo_path, 'w45')} alt="" style={{ width: 18, height: 18, borderRadius: 4 }} />}
            {p.provider_name}
          </div>
        ))}
      </div>
    </div>
  ) : null

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 16, fontFamily: 'inherit' }}>
        ← Back
      </button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        {/* Hero */}
        <div style={{ display: 'flex', gap: 20, padding: '1.5rem' }}>
          <div style={{ width: 110, height: 165, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-input)', flexShrink: 0 }}>
            {poster
              ? <img src={poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎬</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', lineHeight: 1.3 }}>{title}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
              {[year, isTV ? 'TV Series' : 'Movie', genres, extra].filter(Boolean).join(' · ')}
              {tmdbRating && ` · TMDB ★ ${tmdbRating}`}
            </div>

            {/* Overall progress for TV */}
            {showProgress && showProgress.total > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {showProgress.watched}/{showProgress.total} episodes watched
                  {nextEp && <span style={{ marginLeft: 8, color: '#ba7517', fontWeight: 500 }}>▶ Next: S{String(nextEp.season).padStart(2,'0')}E{String(nextEp.episode).padStart(2,'0')}</span>}
                  {!nextEp && showProgress.watched === showProgress.total && <span style={{ marginLeft: 8, color: '#1d9e75', fontWeight: 500 }}>All caught up ✓</span>}
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(showProgress.watched / showProgress.total) * 100}%`, background: '#1d9e75', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Status buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {['watched', 'watching', 'watchlist'].map(s => (
                <button key={s} onClick={() => onSetStatus(item, s)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                  background: entry.status === s ? STATUS_COLORS[s] : 'var(--bg-input)',
                  color: entry.status === s ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${entry.status === s ? 'transparent' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}>{STATUS_LABELS[s]}</button>
              ))}
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              {details?.overview || item.overview || ''}
            </p>
          </div>
        </div>

        {/* Sub-tabs for TV: Overview / Episodes */}
        {isTV && (
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {['Overview', 'Episodes'].map(t => (
              <button key={t} onClick={() => setEpTab(t === 'Episodes')} style={{
                flex: 1, padding: '10px', fontSize: 13, cursor: 'pointer',
                background: 'none', border: 'none', fontFamily: 'inherit',
                borderBottom: `2px solid ${(t === 'Episodes') === epTab ? 'var(--accent)' : 'transparent'}`,
                color: (t === 'Episodes') === epTab ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: (t === 'Episodes') === epTab ? 600 : 400,
              }}>{t}</button>
            ))}
          </div>
        )}

        {epTab && isTV && details ? (
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <EpisodeTracker
              show={details}
              episodes={episodeProps?.episodes || {}}
              isWatched={(sid, s, e) => episodeProps?.isWatched(sid, s, e)}
              toggleEpisode={(sid, s, e) => episodeProps?.toggleEpisode(sid, s, e)}
              markSeasonWatched={(sid, s, eps) => episodeProps?.markSeasonWatched(sid, s, eps)}
              getSeasonProgress={(sid, s, count) => episodeProps?.getSeasonProgress(sid, s, count)}
            />
          </div>
        ) : (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Streaming */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>🎥 Where to watch</div>
              {flat.length || rent.length || buy.length ? (
                <><ProviderChips items={flat} label="Stream" /><ProviderChips items={rent} label="Rent" /><ProviderChips items={buy} label="Buy" /></>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{details ? 'No streaming info available for your region.' : 'Loading...'}</div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Rating */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>⭐ Your rating</div>
              <StarRating value={entry.rating || 0} onChange={r => onSetRating(item, r)} />
            </div>
          </>
        )}
      </div>

      {/* Recommendations */}
      {!epTab && recs.length > 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>✨ You might also like</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {recs.map(r => (
              <div key={r.id} onClick={() => onBack(r)} style={{ cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2/3', background: 'var(--bg-input)', overflow: 'hidden' }}>
                  {r.poster_path
                    ? <img src={IMG(r.poster_path)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎬</div>
                  }
                </div>
                <div style={{ padding: '7px 9px 9px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.title || r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{(r.release_date || r.first_air_date || '').slice(0, 4)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
