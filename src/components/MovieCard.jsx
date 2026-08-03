import { IMG } from '../lib/tmdb'
import { STATUS_LABELS } from '../lib/constants'
import StatusPill from './ui/StatusPill'
import RatingBadge from './ui/RatingBadge'
import styles from './MovieCard.module.css'

export default function MovieCard({ item, entry = {}, onOpen, onSetStatus }) {
  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const rating = item.vote_average ? item.vote_average.toFixed(1) : ''
  const type = item.media_type || 'movie'
  const poster = IMG(item.poster_path)

  return (
    <div className={styles.card} onClick={() => onOpen(item)}>
      <div className={styles.posterWrap}>
        {poster
          ? <img src={poster} alt={title} loading="lazy" className={styles.posterImg} />
          : <div className={styles.posterFallback}>🎬</div>
        }

        <div className={styles.overlay}>
          {['watched', 'watching', 'watchlist'].map(s => (
            <button
              key={s}
              onClick={e => { e.stopPropagation(); onSetStatus(item, s) }}
              className={[styles.overlayBtn, entry.status === s ? styles.overlayBtnActive : '', entry.status === s ? styles[s] : ''].filter(Boolean).join(' ')}
            >{STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

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
