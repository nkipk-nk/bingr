import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import { tmdb } from './lib/tmdb'
import AuthPage from './pages/AuthPage'
import MovieCard from './components/MovieCard'
import DetailPanel from './components/DetailPanel'
import LibraryTab from './pages/LibraryTab'
import Rankings from './pages/Rankings'

const TABS = [
  { id: 'discover', label: '🔍 Discover' },
  { id: 'rankings', label: '🏆 Rankings' },
  { id: 'watchlist', label: '🔖 Watchlist' },
  { id: 'watching', label: '▶ Watching' },
  { id: 'watched', label: '✅ Watched' },
]

export default function App() {
  const { session, loading: authLoading, signUp, signIn, signOut } = useAuth()
  const { library, syncing, setStatus, setRating, remove, counts } = useLibrary(session)

  const [tab, setTab] = useState('discover')
  const [trending, setTrending] = useState({ movies: [], tv: [] })
  const [searchResults, setSearchResults] = useState(null)
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('multi')
  const [detailItem, setDetailItem] = useState(null)
  const [toast, setToast] = useState('')
  const [toastTimer, setToastTimer] = useState(null)

  useEffect(() => {
    tmdb.trendingMovies().then(d => setTrending(prev => ({ ...prev, movies: (d.results || []).slice(0, 10).map(x => ({ ...x, media_type: 'movie' })) })))
    tmdb.trendingTV().then(d => setTrending(prev => ({ ...prev, tv: (d.results || []).slice(0, 10).map(x => ({ ...x, media_type: 'tv' })) })))
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer) clearTimeout(toastTimer)
    setToastTimer(setTimeout(() => setToast(''), 2400))
  }

  const handleAuth = async (mode, email, password) => {
    if (mode === 'signup') return signUp(email, password)
    return signIn(email, password)
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearchResults(null)
    setDetailItem(null)
    const data = await tmdb.search(query.trim(), searchType)
    setSearchResults((data.results || []).filter(x => x.media_type !== 'person'))
  }

  const handleSetStatus = async (item, status) => {
    await setStatus(item, status)
    showToast(status === 'watched' ? 'Marked as watched ✓' : status === 'watching' ? 'Added to watching' : 'Added to watchlist')
  }

  const handleSetRating = async (item, rating) => {
    await setRating(item, rating)
    const LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']
    const cur = library[item.id]?.rating
    if (cur === rating) showToast('Rating removed')
    else showToast(`Rated ${rating}/10 — ${LABELS[rating]}`)
  }

  const openDetail = (item) => {
    setDetailItem(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading...</div>
    </div>
  )

  if (!session) return <AuthPage onAuth={handleAuth} />

  const userInitials = session.user.email.slice(0, 2).toUpperCase()

  const tabLabel = (t) => {
    if (t.id === 'watchlist') return `🔖 Watchlist${counts.watchlist ? ` (${counts.watchlist})` : ''}`
    if (t.id === 'watching') return `▶ Watching${counts.watching ? ` (${counts.watching})` : ''}`
    if (t.id === 'watched') return `✅ Watched${counts.watched ? ` (${counts.watched})` : ''}`
    return t.label
  }

  const CardGrid = ({ items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
      {items.map(item => (
        <MovieCard
          key={item.id}
          item={item}
          entry={library[item.id] || {}}
          onOpen={openDetail}
          onSetStatus={handleSetStatus}
        />
      ))}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }}>
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            onClick={() => { setDetailItem(null); setSearchResults(null); setTab('discover') }}
            style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', letterSpacing: -0.5, flexShrink: 0 }}
          >🎬 bingr</div>

          <div style={{ flex: 1, display: 'flex', gap: 6, minWidth: 180 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search movies & TV shows..."
              style={{ flex: 1, padding: '7px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
            <select
              value={searchType}
              onChange={e => setSearchType(e.target.value)}
              style={{ padding: '7px 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <option value="multi">All</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </select>
            <button
              onClick={handleSearch}
              style={{ padding: '7px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}
            >Search</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {syncing && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Syncing...</span>}
            <div title={session.user.email} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>{userInitials}</div>
            <button
              onClick={signOut}
              style={{ padding: '6px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}
            >Sign out</button>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem', display: 'flex', overflowX: 'auto', gap: 0, borderTop: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setDetailItem(null); setSearchResults(null); setTab(t.id) }}
              style={{
                padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: 'none',
                border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'color 0.15s', flexShrink: 0,
              }}
            >{tabLabel(t)}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        {detailItem ? (
          <DetailPanel
            item={detailItem}
            entry={library[detailItem.id] || {}}
            onBack={(recItem) => recItem?.id ? openDetail(recItem) : setDetailItem(null)}
            onSetStatus={handleSetStatus}
            onSetRating={handleSetRating}
          />
        ) : tab === 'discover' ? (
          searchResults ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                Search results ({searchResults.length})
                <button onClick={() => setSearchResults(null)} style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear ✕</button>
              </div>
              {searchResults.length ? <CardGrid items={searchResults} /> : <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No results found.</div>}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>🔥 Trending movies this week</div>
              <div style={{ marginBottom: 28 }}><CardGrid items={trending.movies} /></div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>📺 Trending TV shows this week</div>
              <CardGrid items={trending.tv} />
            </div>
          )
        ) : tab === 'rankings' ? (
          <Rankings library={library} onOpen={openDetail} />
        ) : (
          <LibraryTab status={tab} library={library} onOpen={openDetail} onRemove={remove} />
        )}
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '9px 20px',
          borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999, whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}
    </div>
  )
}
