import { useEffect } from 'react'
import { IMG } from '../lib/tmdb'

const RATING_LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']

function FeedItem({ item, onOpenItem, onOpenProfile }) {
  const poster = IMG(item.poster_path)
  const displayName = item.display_name || item.username
  const dateStr = item.date
    ? new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
    : ''

  const action = item.type === 'diary'
    ? item.rewatch ? 'rewatched' : 'watched'
    : 'rated'

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div
        onClick={() => onOpenProfile(item.username)}
        style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}>
        {displayName.slice(0, 2).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Who did what */}
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, lineHeight: 1.5 }}>
          <span
            onClick={() => onOpenProfile(item.username)}
            style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--accent)' }}>
            @{item.username}
          </span>
          {' '}<span style={{ color: 'var(--text-muted)' }}>{action}</span>{' '}
          <span
            onClick={() => onOpenItem({ id: item.tmdb_id, media_type: item.media_type, title: item.title, poster_path: item.poster_path })}
            style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>
            {item.title}
          </span>
          {item.rating > 0 && (
            <span style={{ color: '#ef9f27', marginLeft: 6 }}>★ {item.rating}/10</span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>{dateStr}</span>
        </div>

        {/* Poster + details */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div
            onClick={() => onOpenItem({ id: item.tmdb_id, media_type: item.media_type, title: item.title, poster_path: item.poster_path })}
            style={{ width: 42, height: 62, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)', cursor: 'pointer' }}>
            {poster
              ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
            }
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              {item.media_type === 'tv' ? 'TV Series' : 'Film'}
              {item.rewatch && <span style={{ marginLeft: 6, color: 'var(--accent)' }}>🔁 Rewatch</span>}
            </div>
            {item.rating > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{RATING_LABELS[item.rating]}</div>
            )}
            {item.notes && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4, lineHeight: 1.5 }}>
                "{item.notes}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ActivityFeed({ feedHook, following, onOpenItem, onOpenProfile, onDiscover }) {
  const { feed, loading, loaded, load } = feedHook

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  if (following.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Your feed is empty</div>
      <div style={{ fontSize: 14, marginBottom: 20 }}>Follow other users to see their activity here</div>
      <button onClick={onDiscover} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
        Find people to follow
      </button>
    </div>
  )

  if (loading && !feed.length) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }}>Loading feed…</div>
  )

  if (loaded && !feed.length) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Nothing yet</div>
      <div style={{ fontSize: 14 }}>The people you follow haven't logged anything recently</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>🌐 Friend Activity</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            From {following.length} user{following.length !== 1 ? 's' : ''} you follow
          </div>
        </div>
        <button onClick={load} style={{ fontSize: 12, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
