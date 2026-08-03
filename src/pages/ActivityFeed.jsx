import { Rss, Satellite, Moon, RefreshCw } from 'lucide-react'
import WatchLogCard from '../components/WatchLogCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import styles from './ActivityFeed.module.css'

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
        {feed.map(item => {
          const displayName = item.display_name || item.username
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''
          const action = item.type === 'diary' ? (item.rewatch ? 'rewatched' : 'watched') : 'rated'
          const openTitle = () => onOpenItem({ id: item.tmdb_id, media_type: item.media_type, title: item.title, poster_path: item.poster_path })
          return (
            <WatchLogCard
              key={item.id}
              variant="feed"
              username={item.username}
              displayName={displayName}
              action={action}
              timestamp={dateStr}
              posterPath={item.poster_path}
              title={item.title}
              year={(item.release_date || '').slice(0, 4)}
              mediaType={item.media_type}
              rating={item.rating}
              notes={item.notes}
              rewatch={item.rewatch}
              onOpenTitle={openTitle}
              onOpenProfile={() => onOpenProfile(item.username)}
            />
          )
        })}
      </div>
    </div>
  )
}
