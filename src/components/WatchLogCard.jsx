import { X, Repeat2 } from 'lucide-react'
import { IMG } from '../lib/tmdb'
import Card from './ui/Card'
import Avatar from './ui/Avatar'
import PosterTile from './ui/PosterTile'
import styles from './WatchLogCard.module.css'

// RD5/RD9 (BINGR_UI_AUDIT.md) — Diary rows and Feed items were two
// independently-coded card designs for the same underlying fact ("user
// watched/rated a title on a date"), each with its own rewatch-badge
// implementation. One card, two variants: `feed` adds the avatar +
// "@user watched" line (redundant on Diary, where it's already "yours");
// `diary` adds the day-of-month numeral and a delete action.
export default function WatchLogCard({
  variant, posterPath, title, year, mediaType, rating, notes, rewatch,
  onOpenTitle,
  // feed variant
  username, displayName, action, timestamp, onOpenProfile,
  // diary variant
  day, onDelete,
}) {
  return (
    <Card className={styles.card}>
      {variant === 'diary' && (
        <div className={styles.dayCol}><span className={styles.day}>{day}</span></div>
      )}
      {variant === 'feed' && (
        <div className={styles.avatar} onClick={onOpenProfile}>
          <Avatar size="sm" name={displayName || username} />
        </div>
      )}

      <div className={styles.poster} onClick={onOpenTitle}>
        <PosterTile size="sm" src={posterPath ? IMG(posterPath) : null} alt="" />
      </div>

      <div className={styles.body} onClick={onOpenTitle}>
        {variant === 'feed' && (
          <div className={styles.actionLine}>
            <span className={styles.handle} onClick={e => { e.stopPropagation(); onOpenProfile() }}>@{username}</span>
            {' '}{action}
            {timestamp && <span className={styles.timestamp}>{timestamp}</span>}
          </div>
        )}
        <div className={styles.titleLine}>
          {title}
          {rewatch && <span className={styles.rewatchTag}><Repeat2 size={11} /> Rewatch</span>}
        </div>
        <div className={styles.metaLine}>
          {year} · {mediaType === 'tv' ? 'TV' : 'Film'}
          {rating > 0 && <span className={styles.metaRating}> · ★ {rating}/10</span>}
        </div>
        {notes && <div className={styles.notes}>"{notes}"</div>}
      </div>

      {variant === 'diary' && (
        <button className={styles.deleteBtn} title="Remove entry" onClick={e => { e.stopPropagation(); onDelete() }}>
          <X size={14} />
        </button>
      )}
    </Card>
  )
}
