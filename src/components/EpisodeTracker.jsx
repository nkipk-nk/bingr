import { useState, useEffect } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { tmdb } from '../lib/tmdb'
import { logger } from '../lib/logger'
import Button from './ui/Button'
import ProgressBar from './ui/ProgressBar'
import styles from './EpisodeTracker.module.css'

export default function EpisodeTracker({ show, isWatched, toggleEpisode, markSeasonWatched, getSeasonProgress }) {
  const [activeSeason, setActiveSeason] = useState(null)
  const [seasonData, setSeasonData] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [retryTick, setRetryTick] = useState(0)

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
    setLoadError(false)
    tmdb.seasonDetails(show.id, activeSeason).then(data => {
      setSeasonData(prev => ({ ...prev, [activeSeason]: data }))
      setLoading(false)
    }).catch(err => {
      // Previously unhandled — a failure here left the season permanently
      // stuck on "Loading episodes..." with no way to recover without
      // switching tabs and back.
      logger.error('Failed to load season episodes', err, { showId: show.id, season: activeSeason })
      setLoading(false)
      setLoadError(true)
    })
  }, [activeSeason, show.id, retryTick])

  const currentSeasonEps = seasonData[activeSeason]?.episodes || []
  const prog = activeSeason ? getSeasonProgress(show.id, activeSeason, currentSeasonEps.length) : { watched: 0, total: 0 }
  const allWatched = prog.total > 0 && prog.watched === prog.total

  return (
    <div>
      <div className={styles.seasonTabs}>
        {seasons.map(s => {
          const sp = getSeasonProgress(show.id, s.season_number, s.episode_count)
          const pct = s.episode_count > 0 ? Math.round((sp.watched / s.episode_count) * 100) : 0
          const isActive = activeSeason === s.season_number
          return (
            <button
              key={s.season_number}
              onClick={() => setActiveSeason(s.season_number)}
              className={[styles.seasonChip, isActive ? styles.seasonChipActive : ''].filter(Boolean).join(' ')}
            >
              S{s.season_number}
              {pct > 0 && pct < 100 && <span className={styles.seasonChipPct}>{pct}%</span>}
              {pct === 100 && <CheckCircle2 size={12} />}
            </button>
          )
        })}
      </div>

      {activeSeason && (
        <div className={styles.seasonHeader}>
          <div>
            <span className={styles.seasonTitle}>Season {activeSeason}</span>
            <span className={styles.seasonProgressText}>{prog.watched}/{prog.total} episodes watched</span>
          </div>
          <Button variant={allWatched ? 'primary' : 'secondary'} size="sm" disabled={loading} onClick={() => markSeasonWatched(show.id, activeSeason, currentSeasonEps)}>
            {allWatched ? 'Unmark all' : 'Mark all watched'}
          </Button>
        </div>
      )}

      {prog.total > 0 && <div className={styles.progressBar}><ProgressBar value={prog.watched} max={prog.total} /></div>}

      {loading ? (
        <div className={styles.loadingText}>Loading episodes...</div>
      ) : loadError ? (
        <div className={styles.errorBox}>
          <span>Couldn't load episodes for this season.</span>
          <Button variant="ghost" size="sm" onClick={() => setRetryTick(t => t + 1)}>Retry</Button>
        </div>
      ) : (
        <div className={styles.epList}>
          {currentSeasonEps.map(ep => {
            const watched = isWatched(show.id, activeSeason, ep.episode_number)
            const airDate = ep.air_date ? new Date(ep.air_date) : null
            const isUnaired = airDate && airDate > new Date()
            return (
              <div
                key={ep.episode_number}
                onClick={() => !isUnaired && toggleEpisode(show.id, activeSeason, ep.episode_number)}
                className={[styles.epRow, watched ? styles.epRowWatched : '', isUnaired ? styles.epRowUnaired : ''].filter(Boolean).join(' ')}
              >
                <div className={[styles.epCheck, watched ? styles.epCheckWatched : ''].filter(Boolean).join(' ')}>
                  {watched ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>

                <div className={styles.epCode}>S{String(activeSeason).padStart(2, '0')}E{String(ep.episode_number).padStart(2, '0')}</div>

                <div className={styles.epBody}>
                  <div className={[styles.epTitle, watched ? styles.epTitleWatched : ''].filter(Boolean).join(' ')}>{ep.name}</div>
                  {ep.air_date && (
                    <div className={styles.epMeta}>
                      {isUnaired ? `Airs ${ep.air_date}` : ep.air_date}
                      {ep.runtime ? ` · ${ep.runtime}m` : ''}
                    </div>
                  )}
                </div>

                {isUnaired && <span className={styles.epUpcoming}>Upcoming</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
