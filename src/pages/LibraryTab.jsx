import { X } from 'lucide-react'
import { IMG } from '../lib/tmdb'
import { STATUS_LABELS } from '../lib/constants'
import PosterTile from '../components/ui/PosterTile'
import ProgressBar from '../components/ui/ProgressBar'
import styles from './LibraryTab.module.css'

// Pure row list — status/type/sort/filter state lives one level up in
// LibraryPage.jsx (RD2's segmented-control consolidation). `status` here
// is only used to decide whether the per-row status label is needed
// (redundant when a single status is already selected).
export default function LibraryTab({ items, status, onOpen, onRemove, episodeProps }) {
  if (!items.length) return <div className={styles.centeredMsg}>No titles match your filters</div>

  return (
    <div className={styles.list}>
      {items.map(item => {
        const title = item.title || item.name || ''
        const year = (item.release_date || item.first_air_date || '').slice(0, 4)
        const tmdbR = item.vote_average ? item.vote_average.toFixed(1) : ''
        const isTV = item.media_type === 'tv'
        const openItem = () => onOpen({ ...item, id: item.tmdb_id })

        const nextEp = isTV && episodeProps ? episodeProps.getNextEpisodeById(item.tmdb_id) : null
        const showProg = isTV && episodeProps ? episodeProps.getShowProgressById(item.tmdb_id) : null

        return (
          <div key={item.tmdb_id} className={styles.row}>
            <div className={styles.poster} onClick={openItem}>
              <PosterTile size="sm" src={item.poster_path ? IMG(item.poster_path) : null} alt="" />
            </div>

            <div className={styles.body} onClick={openItem}>
              <div className={styles.title}>{title}</div>
              <div className={styles.meta}>
                {year} · {isTV ? 'TV' : 'Film'}{tmdbR ? ` · ★ ${tmdbR}` : ''}{status === 'all' ? ` · ${STATUS_LABELS[item.status]}` : ''}
                {item.rating > 0 && <span className={styles.metaRating}> · ★ {item.rating}/10</span>}
              </div>

              {isTV && showProg && showProg.total > 0 && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressLine}>
                    {showProg.watched}/{showProg.total} eps
                    {nextEp
                      ? <span className={styles.progressNext}>▶ S{String(nextEp.season).padStart(2, '0')}E{String(nextEp.episode).padStart(2, '0')}</span>
                      : showProg.watched === showProg.total ? <span className={styles.progressDone}>All caught up ✓</span> : null}
                  </div>
                  <ProgressBar value={showProg.watched} max={showProg.total} />
                </div>
              )}
            </div>

            <button className={styles.removeBtn} title="Remove"
              onClick={() => { if (window.confirm(`Remove "${title}" from ${STATUS_LABELS[item.status].toLowerCase()}?`)) onRemove(item.tmdb_id) }}>
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
