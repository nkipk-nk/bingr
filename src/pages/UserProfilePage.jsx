import { useState, useEffect, useMemo } from 'react'
import { Search, Clapperboard, Tv, Play, Clock, Star, BookOpen, Layers, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { computeStats, formatHours } from '../lib/stats'
import RankedList from '../components/RankedList'
import WatchLogCard from '../components/WatchLogCard'
import FollowerListSheet from '../components/FollowerListSheet'
import Avatar from '../components/ui/Avatar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FollowButton from '../components/ui/FollowButton'
import EmptyState from '../components/ui/EmptyState'
import { PageTabBar } from '../components/ui/Tab'
import { StatTileGrid } from '../components/stats/StatTile'
import ActivityChart from '../components/stats/ActivityChart'
import styles from './UserProfilePage.module.css'

export default function UserProfilePage({ username, onOpenItem, onSignUp, onGoHome, currentUserId, followsHook }) {
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 })
  const [followLoading, setFollowLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [library, setLibrary] = useState([])
  const [libraryMap, setLibraryMap] = useState({})
  const [diary, setDiary] = useState([])
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('rankings')
  const [followSheet, setFollowSheet] = useState(null) // 'followers' | 'following' | null

  // Must stay below the useState declarations above — referencing `diary` in the
  // dependency array before its `const` binding is initialised throws a
  // ReferenceError (temporal dead zone) and crashes every /@username page.
  const stats = useMemo(() => computeStats(diary, libraryMap, {}), [diary, libraryMap])

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return }

    let cancelled = false

    async function loadProfile() {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()

        if (cancelled) return
        if (error || !profileData) { setNotFound(true); setLoading(false); return }
        if (profileData.profile_public === false) { setNotFound(true); setLoading(false); return }
        setProfile(profileData)

        // Each query independently fault-tolerant — one failing shouldn't crash the page
        const [libRes, diaryRes, listsRes] = await Promise.allSettled([
          supabase.from('bingr_library').select('*').eq('user_id', profileData.id).order('rating', { ascending: false }),
          supabase.from('bingr_diary').select('*').eq('user_id', profileData.id).order('watched_date', { ascending: false }).limit(20),
          supabase.from('bingr_lists').select('*, bingr_list_items(count)').eq('user_id', profileData.id).eq('is_public', true).order('updated_at', { ascending: false }),
        ])

        if (cancelled) return

        const libData = (libRes.status === 'fulfilled' ? libRes.value.data : null) || []
        setLibrary(libData.filter(x => x.rating > 0).sort((a, b) => b.rating - a.rating))
        const map = {}
        libData.forEach(row => { map[row.tmdb_id] = row })
        setLibraryMap(map)

        setDiary((diaryRes.status === 'fulfilled' ? diaryRes.value.data : null) || [])
        setLists((listsRes.status === 'fulfilled' ? listsRes.value.data : null) || [])

        // Follow counts — independently safe, never throws
        if (followsHook) {
          followsHook.getCounts(profileData.id).then(counts => { if (!cancelled) setFollowCounts(counts) })
        }

        setLoading(false)
      } catch (err) {
        logger.error('UserProfilePage load failed', err, { username })
        if (!cancelled) {
          setNotFound(true)
          setLoading(false)
        }
      }
    }

    loadProfile()
    return () => { cancelled = true }
  }, [username])

  if (loading) return (
    <div className={styles.centered}><div className={styles.centeredText}>Loading profile…</div></div>
  )

  if (notFound) return (
    <div className={styles.centered}>
      <div className={styles.notFoundWrap}>
        <Search size={40} className={styles.notFoundIcon} />
        <div className={styles.notFoundTitle}>Profile not found</div>
        <div className={styles.notFoundDesc}>This user doesn't exist or has a private profile.</div>
        <Button variant="primary" onClick={onGoHome}>Go to bingr</Button>
      </div>
    </div>
  )

  const movieCount = library.filter(x => x.media_type === 'movie' && x.status === 'watched').length
  const tvCount = library.filter(x => x.media_type === 'tv' && x.status === 'watched').length
  const isOwnProfile = currentUserId === profile.id
  const amFollowing = followsHook ? followsHook.isFollowing(profile.id) : false
  const displayName = profile.display_name || profile.username

  const handleFollow = async () => {
    if (!followsHook || followLoading) return
    setFollowLoading(true)
    await followsHook.toggleFollow(profile.id)
    setFollowCounts(prev => ({
      ...prev,
      followers: amFollowing ? prev.followers - 1 : prev.followers + 1
    }))
    setFollowLoading(false)
  }

  const openProfile = (u) => { window.location.href = `/@${u}` }

  const TABS = [
    { id: 'rankings', label: `Top Rated (${library.length})` },
    { id: 'stats', label: 'Stats' },
    { id: 'diary', label: `Recent Activity (${diary.length})` },
    { id: 'lists', label: `Lists (${lists.length})` },
  ]

  const statTiles = [
    { icon: Clapperboard, value: stats.totalMovies, label: 'Movies watched' },
    { icon: Tv, value: stats.totalShows, label: 'TV shows tracked' },
    { icon: Play, value: stats.totalEpisodes, label: 'Episodes watched' },
    { icon: Clock, value: formatHours(stats.totalHours), label: 'Watch time est.' },
    { icon: Star, value: stats.avgRating > 0 ? `${stats.avgRating}/10` : '—', label: 'Avg rating' },
    { icon: BookOpen, value: stats.diaryTotal, label: 'Diary entries' },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onGoHome}><ArrowLeft size={16} /> Back</Button>
          <button className={styles.brand} onClick={onGoHome}>
            <img src="/logo.png" alt="bingr" className={styles.brandLogo} />
            <span className={styles.brandName}>bingr</span>
          </button>
        </div>
        {!currentUserId && <Button variant="primary" size="sm" onClick={onSignUp}>Sign up free</Button>}
      </header>

      <div className={styles.body}>
        <Card className={styles.profileCard}>
          <Avatar size="lg" name={displayName} />
          <div className={styles.profileInfo}>
            <div className={styles.displayName}>{displayName}</div>
            <div className={styles.handle}>@{profile.username}{isOwnProfile && ' (you)'}</div>
            <div className={styles.counts}>
              <button className={styles.countBtn} onClick={() => setFollowSheet('followers')}>
                <strong>{followCounts.followers}</strong> follower{followCounts.followers !== 1 ? 's' : ''}
              </button>
              <button className={styles.countBtn} onClick={() => setFollowSheet('following')}>
                <strong>{followCounts.following}</strong> following
              </button>
            </div>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            {!isOwnProfile && currentUserId && followsHook && (
              <FollowButton following={amFollowing} onToggle={handleFollow} disabled={followLoading} />
            )}
          </div>
          <div className={styles.statsRow}>
            <div className={styles.statItem}><div className={styles.statValue}>{movieCount}</div><div className={styles.statLabel}>Movies</div></div>
            <div className={styles.statItem}><div className={styles.statValue}>{tvCount}</div><div className={styles.statLabel}>TV Shows</div></div>
            <div className={styles.statItem}><div className={styles.statValue}>{library.length}</div><div className={styles.statLabel}>Rated</div></div>
          </div>
        </Card>

        <PageTabBar className={styles.tabs} value={tab} onChange={setTab} items={TABS} />

        {tab === 'rankings' && <RankedList items={library} onOpen={onOpenItem} />}

        {tab === 'stats' && (
          <div>
            <div className={styles.statsTiles}><StatTileGrid tiles={statTiles} /></div>
            {stats.monthlyActivity.some(m => m.count > 0) && (
              <Card><ActivityChart months={stats.monthlyActivity} height={70} barHeight={50} /></Card>
            )}
          </div>
        )}

        {tab === 'diary' && (
          diary.length === 0 ? <EmptyState icon={BookOpen} title="No activity yet" /> : (
            <div className={styles.diaryList}>
              {diary.map(e => (
                <WatchLogCard
                  key={e.id}
                  variant="diary"
                  day={new Date(e.watched_date).getDate()}
                  posterPath={e.poster_path}
                  title={e.title}
                  year={(e.release_date || '').slice(0, 4)}
                  mediaType={e.media_type}
                  rating={e.rating}
                  rewatch={e.rewatch}
                  onOpenTitle={() => onOpenItem({ id: e.tmdb_id, media_type: e.media_type, title: e.title, poster_path: e.poster_path, release_date: e.release_date })}
                />
              ))}
            </div>
          )
        )}

        {tab === 'lists' && (
          lists.length === 0 ? <EmptyState icon={Layers} title="No public lists yet" /> : (
            <div className={styles.listsGrid}>
              {lists.map(list => (
                <Card key={list.id} className={styles.listCard} onClick={() => { window.location.href = `/list/${list.id}` }}>
                  <div className={styles.listTitle}>{list.name}</div>
                  {list.description && <div className={styles.listDesc}>{list.description}</div>}
                  <div className={styles.listCount}>{list.bingr_list_items?.[0]?.count ?? 0} titles</div>
                </Card>
              ))}
            </div>
          )
        )}

        {!currentUserId && (
          <Card roomy className={styles.ctaCard}>
            <div className={styles.ctaTitle}>Track your own watch life</div>
            <p className={styles.ctaDesc}>bingr is free. Rate movies, track episodes, build your own profile.</p>
            <Button variant="primary" onClick={onSignUp}>Sign up free →</Button>
          </Card>
        )}
      </div>

      {followsHook && (
        <FollowerListSheet
          open={!!followSheet}
          onClose={() => setFollowSheet(null)}
          userId={profile.id}
          type={followSheet}
          getUsers={followsHook.getUsers}
          onOpenProfile={openProfile}
        />
      )}
    </div>
  )
}
