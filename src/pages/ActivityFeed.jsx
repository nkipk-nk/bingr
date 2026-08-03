import { Rss, Satellite, Moon, RefreshCw, Repeat2 } from 'lucide-react'
import { IMG } from '../lib/tmdb'
import { RATING_LABELS } from '../lib/constants'
import Avatar from '../components/ui/Avatar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PosterTile from '../components/ui/PosterTile'
import styles from './ActivityFeed.module.css'

function FeedItem({ item, onOpenItem, onOpenProfile }) {
  const displayName = item.display_name || item.username
  const dateStr = item.date
    ? new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
    : ''

  const action = item.type === 'diary'
    ? item.rewatch ? 'rewatched' : 'watched'
    : 'rated'

  const openTitle = () => onOpenItem({ id: item.tmdb_id, media_type: item.media_type, title: item.title, poster_path: item.poster_path })

  return (
    <Card className={styles.item}>
      <div className={styles.avatar} onClick={() => onOpenProfile(item.username)}>
        <Avatar size="sm" name={displayName} />
      </div>

      <div className={styles.body}>
        <div className={styles.actionLine}>
          <span className={styles.handle} onClick={() => onOpenProfile(item.username)}>@{item.username}</span>
          {' '}{action}{' '}
          <span className={styles.itemTitle} onClick={openTitle}>{item.title}</span>
          {item.rating > 0 && <span className={styles.rating}>★ {item.rating}/10</span>}
          <span className={styles.timestamp}>{dateStr}</span>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.poster} onClick={openTitle}>
            <PosterTile size="sm" src={item.poster_path ? IMG(item.poster_path) : null} alt="" />
          </div>
          <div>
            <div className={styles.metaLine}>
              {item.media_type === 'tv' ? 'TV Series' : 'Film'}
              {item.rewatch && <span className={styles.rewatchTag}><Repeat2 size={11} className={styles.rewatchIcon} /> Rewatch</span>}
            </div>
            {item.rating > 0 && <div className={styles.ratingLabel}>{RATING_LABELS[item.rating]}</div>}
            {item.notes && <div className={styles.notes}>"{item.notes}"</div>}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function ActivityFeed({ feedHook, following, onOpenItem, onOpenProfile, onDiscover }) {
  const { feed, loading, loaded, error, load } = feedHook

  // useFeed now loads itself and reloads when `following` changes, so there is
  // no mount-time fetch here. Doing it here previously latched loaded=true
  // against an empty follow list and the feed never recovered.

  if (error) return (
    <EmptyState icon={Satellite} title="Couldn't load your feed" description={error} actionLabel="Try again" onAction={load} />
  )

  if (following.length === 0) return (
    <EmptyState icon={Rss} title="Your feed is empty" description="Follow other users to see their activity here" actionLabel="Find people to follow" onAction={onDiscover} />
  )

  if (loading && !feed.length) return (
    <div className={styles.centeredMsg}>Loading feed…</div>
  )

  if (loaded && !feed.length) return (
    <EmptyState icon={Moon} title="Nothing yet" description="The people you follow haven't logged anything recently" />
  )

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerTitle}><Rss size={18} /> Friend Activity</div>
          <div className={styles.headerSub}>From {following.length} user{following.length !== 1 ? 's' : ''} you follow</div>
        </div>
        <Button variant="secondary" size="sm" onClick={load}><RefreshCw size={14} /> Refresh</Button>
      </div>

      <div className={styles.list}>
        {feed.map(item => (
          <FeedItem
            key={item.id}
            item={item}
            onOpenItem={onOpenItem}
            onOpenProfile={onOpenProfile}
          />
        ))}
      </div>
    </div>
  )
}
