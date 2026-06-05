import { useState, useEffect } from 'react'
import { tmdb } from '../lib/tmdb'

export default function EpisodeTracker({ show, episodes, isWatched, toggleEpisode, markSeasonWatched, getSeasonProgress }) {
  const [activeSeason, setActiveSeason] = useState(null)
  const [seasonData, setSeasonData] = useState({})
  const [loading, setLoading] = useState(false)

  const seasons = (show.seasons || []).filter(s => s.season_number > 0)

  useEffect(() => {
    if (seasons.length > 0 && activeSeason === null) {
      setActiveSeason(seasons[0].season_number)
    }
  }, [show.id])

  useEffect(() => {
    if (activeSeason === null) return
    if (seasonData[activeSeason]) return
    setLoading(true)
    tmdb.seasonDetails(show.id, activeSeason).then(data => {
      setSeasonData(prev => ({ ...prev, [activeSeason]: data }))
      setLoading(false)
    })
  }, [activeSeason, show.id])

  const currentSeasonEps = seasonData[activeSeason]?.episodes || []
  const prog = activeSeason ? getSeasonProgress(show.id, activeSeason, currentSeasonEps.length) : { watched: 0, total: 0 }
  const allWatched = prog.total > 0 && prog.watched === prog.total

  return (
    <div>
      {/* Season tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {seasons.map(s => {
          const sp = getSeasonProgress(show.id, s.season_number, s.episode_count)
          const pct = s.episode_count > 0 ? Math.round((sp.watched / s.episode_count) * 100) : 0
          const isActive = activeSeason === s.season_number
          return (
            <button
              key={s.season_number}
              onClick={() => setActiveSeason(s.season_number)}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                background: isActive ? 'var(--accent)' : 'var(--bg-input)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontFamily: 'inherit', fontWeight: isActive ? 600 : 400,
                position: 'relative',
              }}
            >
              S{s.season_number}
              {pct > 0 && pct < 100 && (
                <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.85 }}>{pct}%</span>
              )}
              {pct === 100 && <span style={{ marginLeft: 4 }}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* Season header */}
      {activeSeason && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Season {activeSeason}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
              {prog.watched}/{prog.total} episodes watched
            </span>
          </div>
          <button
            onClick={() => markSeasonWatched(show.id, activeSeason, currentSeasonEps)}
            disabled={loading}
            style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              border: '1px solid var(--border)', fontFamily: 'inherit',
              background: allWatched ? '#1d9e75' : 'var(--bg-input)',
              color: allWatched ? '#fff' : 'var(--text-muted)',
            }}
          >{allWatched ? 'Unmark all' : 'Mark all watched'}</button>
        </div>
      )}

      {/* Progress bar */}
      {prog.total > 0 && (
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(prog.watched / prog.total) * 100}%`, background: '#1d9e75', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      )}

      {/* Episode list */}
      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '1rem 0' }}>Loading episodes...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {currentSeasonEps.map(ep => {
            const watched = isWatched(show.id, activeSeason, ep.episode_number)
            const airDate = ep.air_date ? new Date(ep.air_date) : null
            const isUnaired = airDate && airDate > new Date()
            return (
              <div
                key={ep.episode_number}
                onClick={() => !isUnaired && toggleEpisode(show.id, activeSeason, ep.episode_number)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  background: watched ? 'rgba(29,158,117,0.08)' : 'var(--bg-input)',
                  border: `1px solid ${watched ? 'rgba(29,158,117,0.25)' : 'var(--border)'}`,
                  cursor: isUnaired ? 'default' : 'pointer',
                  opacity: isUnaired ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${watched ? '#1d9e75' : 'var(--border-strong)'}`,
                  background: watched ? '#1d9e75' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#fff',
                }}>{watched ? '✓' : ''}</div>

                {/* Episode label */}
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0, minWidth: 48 }}>
                  S{String(activeSeason).padStart(2,'0')}E{String(ep.episode_number).padStart(2,'0')}
                </div>

                {/* Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: watched ? '#1d9e75' : 'var(--text)', fontWeight: watched ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ep.name}
                  </div>
                  {ep.air_date && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {isUnaired ? `Airs ${ep.air_date}` : ep.air_date}
                      {ep.runtime ? ` · ${ep.runtime}m` : ''}
                    </div>
                  )}
                </div>

                {isUnaired && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>Upcoming</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
