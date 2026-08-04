import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { RATING_LABELS } from '../lib/constants'
import { IMG } from '../lib/tmdb'
import Card from './ui/Card'
import Select from './ui/Select'
import PosterTile from './ui/PosterTile'
import EmptyState from './ui/EmptyState'
import RatingBadge from './ui/RatingBadge'
import styles from './RankedList.module.css'

// RD1 (BINGR_UI_AUDIT.md) — Rankings.jsx and UserProfilePage's "Top Rated"
// tab were two hand-built implementations of the same sorted-by-rating
// list. This is the single shared component both now render through.
// `showFilter` covers Rankings' own-library movie/TV toggle; a visited
// profile's Top Rated tab renders the same list read-only, no filter.
export default function RankedList({ items, onOpen, showFilter = false, onGoDiscover }) {
  const [filter, setFilter] = useState('all')

  const rated = items.filter(x => x.rating > 0)
  const filtered = showFilter && filter !== 'all' ? rated.filter(x => x.media_type === filter) : rated
  const sorted = [...filtered].sort((a, b) => b.rating - a.rating)

  if (!rated.length) return (
    <EmptyState
      icon={Trophy} title="No ratings yet" description="Open any title, rate it with stars, and it'll appear here."
      actionLabel={onGoDiscover ? 'Browse Discover' : undefined} onAction={onGoDiscover}
    />
  )

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.title}>{showFilter ? 'My Rankings' : 'Top Rated'} ({sorted.length})</div>
        {showFilter && (
          <Select className={styles.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </Select>
        )}
      </div>

      {sorted.map((item, i) => {
        const title = item.title || item.name || ''
        const year = (item.release_date || item.first_air_date || '').slice(0, 4)
        const isTop = i < 3

        return (
          <Card key={item.tmdb_id} className={styles.row} onClick={() => onOpen({ ...item, id: item.tmdb_id })}>
            <div className={[styles.rank, isTop ? styles.rankTop : ''].filter(Boolean).join(' ')}>{i + 1}</div>
            <div className={styles.poster}><PosterTile size="sm" src={item.poster_path ? IMG(item.poster_path) : null} alt="" /></div>
            <div className={styles.body}>
              <div className={styles.itemTitle}>{title}</div>
              <div className={styles.meta}>{year} · {item.media_type === 'tv' ? 'TV' : 'Film'}</div>
            </div>
            <div className={styles.ratingCol}>
              <RatingBadge rating={item.rating} />
              <div className={styles.ratingLabel}>{RATING_LABELS[item.rating]}</div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
