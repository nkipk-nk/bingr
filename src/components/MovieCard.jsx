import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { IMG } from '../lib/tmdb'
import { STATUS_LABELS } from '../lib/constants'
import PosterTile from './ui/PosterTile'
import StatusPill from './ui/StatusPill'
import RatingBadge from './ui/RatingBadge'
import styles from './MovieCard.module.css'

// CX1 (BINGR_UI_AUDIT.md) — poster now goes through the shared PosterTile
// primitive (size="md" for grid contexts) instead of a hand-rolled
// equivalent, closing the grid-tile side of the poster-size consolidation.
export default function MovieCard({ item, entry = {}, onOpen, onSetStatus }) {
  // GP2 (BINGR_UI_AUDIT.md) — the overlay used to be pure CSS :hover, which
  // has no touch equivalent: quick actions were literally unreachable on
  // mobile. The toggle button is a real tap target on every input type;
  // desktop keeps the hover reveal as a shortcut on top of it.
  const [showActions, setShowActions] = useState(false)
  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const rating = item.vote_average ? item.vote_average.toFixed(1) : ''
  const type = item.media_type || 'movie'
  const poster = IMG(item.poster_path)

  return (
    <div className={styles.card} onClick={() => onOpen(item)}>
      <PosterTile size="md" src={poster} alt={title}>
        <div className={[styles.overlay, showActions ? styles.overlayOpen : ''].filter(Boolean).join(' ')}>
          {['watched', 'watching', 'watchlist'].map(s => (
            <button
              key={s}
              onClick={e => { e.stopPropagation(); onSetStatus(item, s); setShowActions(false) }}
              className={[styles.overlayBtn, entry.status === s ? styles.overlayBtnActive : '', entry.status === s ? styles[s] : ''].filter(Boolean).join(' ')}
            >{STATUS_LABELS[s]}</button>
          ))}
        </div>
        <button
          className={styles.actionsToggle}
          onClick={e => { e.stopPropagation(); setShowActions(v => !v) }}
          aria-label="Quick actions"
        >
          <MoreHorizontal size={14} />
        </button>
      </PosterTile>

      {entry.status && <div className={styles.statusBadge}><StatusPill status={entry.status} /></div>}
      {entry.rating > 0 && <div className={styles.ratingBadge}><RatingBadge rating={entry.rating} /></div>}

      <div className={styles.body}>
        <div className={styles.title}>{title}</div>
        <div className={styles.metaRow}>
          <span>{year} · {type === 'tv' ? 'TV' : 'Film'}</span>
          {rating && <span className={styles.tmdbRating}>★ {rating}</span>}
        </div>
      </div>
    </div>
  )
}
