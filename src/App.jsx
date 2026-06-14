import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import { useEpisodes } from './hooks/useEpisodes'
import { useLists } from './hooks/useLists'
import { useDiary } from './hooks/useDiary'
import { useProfile } from './hooks/useProfile'
import { useAdmin } from './hooks/useAdmin'
import { tmdb } from './lib/tmdb'
import { logger } from './lib/logger'
import { supabase } from './lib/supabase'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProfilePage from './pages/ProfilePage'
import PublicListPage from './pages/PublicListPage'
import UserProfilePage from './pages/UserProfilePage'
import SupportersPage from './pages/SupportersPage'
import AdminPanel from './pages/AdminPanel'
import MovieCard from './components/MovieCard'
import DetailPanel from './components/DetailPanel'
import LibraryTab from './pages/LibraryTab'
import Rankings from './pages/Rankings'
import StatsPage from './pages/StatsPage'
import ListsPage from './pages/ListsPage'
import DiaryPage from './pages/DiaryPage'
import ExportPanel from './components/ExportPanel'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import DeleteAccount from './pages/DeleteAccount'
import SupportButton from './components/SupportButton'
import FeedbackModal from './components/FeedbackModal'
import OnboardingModal from './components/OnboardingModal'


const TABS = [
  { id: 'discover', label: '🔍 Discover' },
  { id: 'stats', label: '📊 Stats' },
  { id: 'rankings', label: '🏆 Rankings' },
  { id: 'diary', label: '📔 Diary' },
  { id: 'lists', label: '📋 Lists' },
  { id: 'watchlist', label: '🔖 Watchlist' },
  { id: 'watching', label: '▶ Watching' },
  { id: 'watched', label: '✅ Watched' },
]

const seasonsCache = {}

// Simple URL-based router
function getPageFromURL() {
  const path = window.location.pathname
  const hash = window.location.hash
  if (hash.includes('type=recovery') || path.includes('reset-password')) return { page: 'reset', param: null }
  const listMatch = path.match(/^\/list\/([a-f0-9-]+)$/)
  if (listMatch) return { page: 'public-list', param: listMatch[1] }
  const userMatch = path.match(/^\/@([a-z0-9_]+)$/)
  if (userMatch) return { page: 'user-profile', param: userMatch[1] }
  if (path === '/supporters') return { page: 'supporters', param: null }
  return { page: null, param: null }
}

export default function App() {
  const { session, loading: authLoading, signUp, signIn, signOut, deleteAccount } = useAuth()
  const { library, syncing, error: libError, setStatus, setRating, remove, counts } = useLibrary(session)
  const episodeHook = useEpisodes(session)
  const listsHook = useLists(session)
  const diaryHook = useDiary(session)
  const { profile, updateProfile, checkUsername } = useProfile(session)
  const adminHook = useAdmin(profile)

  const [tab, setTab] = useState('discover')
  const [page, setPage] = useState('loading')
  const [pageParam, setPageParam] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [trending, setTrending] = useState({ movies: [], tv: [] })
  const [trendingError, setTrendingError] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('multi')
  const [detailItem, setDetailItem] = useState(null)
  const [toast, setToast] = useState('')
  const [toastTimer, setToastTimer] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  // URL routing on mount
  useEffect(() => {
    const { page: urlPage, param } = getPageFromURL()
    if (urlPage) { setPage(urlPage); setPageParam(param) }
  }, [])

  // Auth → page routing
  useEffect(() => {
    if (authLoading) return
    if (page === 'reset' || page === 'public-list' || page === 'supporters' || page === 'user-profile') return
    if (session) {
      if (page === 'loading' || page === 'landing' || page === 'auth' || page === 'forgot') setPage('app')
    } else {
      if (page === 'loading' || page === 'app') setPage('landing')
    }
  }, [session, authLoading])

  // Handle PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPage('reset')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Navigate with history so back button works
  const navigate = useCallback((newPage, param = null, pushHistory = true) => {
    setPage(newPage)
    setPageParam(param)
    if (pushHistory) {
      const urlMap = {
        'app': '/', 'landing': '/', 'auth': '/',
        'privacy': '/privacy', 'terms': '/terms',
        'supporters': '/supporters',
      }
      const url = urlMap[newPage] || '/'
      window.history.pushState({ page: newPage, param }, '', url)
    }
  }, [])

  // Handle browser back button
  useEffect(() => {
    const handlePop = (e) => {
      const state = e.state
      if (state?.page) {
        setPage(state.page)
        setPageParam(state.param || null)
      } else {
        // No state — go to appropriate default
        if (session) setPage('app')
        else setPage('landing')
      }
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [session])

  useEffect(() => {
    tmdb.trendingMovies()
      .then(d => setTrending(prev => ({ ...prev, movies: (d.results || []).slice(0, 12).map(x => ({ ...x, media_type: 'movie' })) })))
      .catch(err => { logger.error('Failed to load trending movies', err); setTrendingError(true) })
    tmdb.trendingTV()
      .then(d => setTrending(prev => ({ ...prev, tv: (d.results || []).slice(0, 12).map(x => ({ ...x, media_type: 'tv' })) })))
      .catch(err => { logger.error('Failed to load trending TV', err); setTrendingError(true) })
  }, [])

  useEffect(() => {
    Object.values(library)
      .filter(x => x.media_type === 'tv' && !seasonsCache[x.tmdb_id])
      .forEach(show => {
        tmdb.tvDetails(show.tmdb_id)
          .then(d => { if (d?.seasons) seasonsCache[show.tmdb_id] = d.seasons })
          .catch(() => {})
      })
  }, [library])

  useEffect(() => {
    if (!showUserMenu) return
    const close = () => setShowUserMenu(false)
    setTimeout(() => document.addEventListener('click', close), 0)
    return () => document.removeEventListener('click', close)
  }, [showUserMenu])

  const showToast = useCallback((msg) => {
    setToast(msg)
    if (toastTimer) clearTimeout(toastTimer)
    setToastTimer(setTimeout(() => setToast(''), 2400))
  }, [toastTimer])

  const handleAuth = async (mode, email, password, username, country) =>
    mode === 'signup' ? signUp(email, password, username, country) : signIn(email, password)

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearchResults(null); setDetailItem(null); setSearchLoading(true)
    try {
      const data = await tmdb.search(query.trim(), searchType)
      setSearchResults((data.results || []).filter(x => x.media_type !== 'person'))
    } catch (err) {
      logger.error('Search failed', err)
      showToast('Search failed. Please try again.')
    } finally { setSearchLoading(false) }
  }

  const handleSetStatus = async (item, status) => {
    const cur = library[item.id]
    await setStatus(item, status)
    if (cur?.status === status) showToast('Status removed')
    else showToast(status === 'watched' ? 'Marked as watched ✓' : status === 'watching' ? 'Added to watching' : 'Added to watchlist')
  }

  const handleSetRating = async (item, rating) => {
    const LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']
    const cur = library[item.id]?.rating
    await setRating(item, rating)
    if (cur === rating) showToast('Rating removed')
    else showToast(`Rated ${rating}/10 — ${LABELS[rating]}`)
  }

  const openDetail = (item) => {
    setDetailItem(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setDetailItem(null); setSearchResults(null); setTab('discover')
    navigate('app')
  }

  const goBack = () => {
    if (detailItem) { setDetailItem(null); return }
    if (searchResults) { setSearchResults(null); return }
    navigate('app')
  }

  const episodeProps = {
    episodes: episodeHook.episodes,
    isWatched: episodeHook.isWatched,
    toggleEpisode: episodeHook.toggleEpisode,
    markSeasonWatched: episodeHook.markSeasonWatched,
    getNextEpisode: episodeHook.getNextEpisode,
    getShowProgress: episodeHook.getShowProgress,
    getSeasonProgress: episodeHook.getSeasonProgress,
    getNextEpisodeById: (id) => { const s = seasonsCache[id]; return s ? episodeHook.getNextEpisode(id, s) : null },
    getShowProgressById: (id) => { const s = seasonsCache[id]; return s ? episodeHook.getShowProgress(id, s) : null },
  }

  // ── Loading ──
  if (page === 'loading' || authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <img src="/logo.png" alt="bingr" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain' }} />
          <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>bingr</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    </div>
  )

  // ── Public pages (no auth needed) ──
  if (page === 'public-list') return <PublicListPage listId={pageParam} onSignUp={() => { setAuthMode('signup'); navigate('auth') }} />
  if (page === 'user-profile') return (
    <UserProfilePage
      username={pageParam}
      currentUserId={session?.user?.id || null}
      onOpenItem={(item) => { navigate('app'); setTab('discover'); openDetail(item) }}
      onSignUp={() => { setAuthMode('signup'); navigate('auth') }}
    />
  )
  if (page === 'supporters') return <SupportersPage onBack={() => navigate('app')} />
  if (page === 'privacy') return <PrivacyPolicy onBack={() => navigate(session ? 'app' : 'landing')} />
  if (page === 'terms') return <TermsOfService onBack={() => navigate(session ? 'app' : 'landing')} />
  if (page === 'reset') return <ResetPassword onDone={() => { navigate('auth'); setAuthMode('login') }} />
  if (page === 'forgot') return <ForgotPassword onBack={() => navigate('auth')} />

  // ── Not logged in ──
  if (!session) {
    if (page === 'auth') return (
      <AuthPage
        onAuth={handleAuth}
        onShowPrivacy={() => navigate('privacy')}
        onShowTerms={() => navigate('terms')}
        onForgotPassword={() => navigate('forgot')}
        initialMode={authMode}
      />
    )
    return (
      <LandingPage
        onSignUp={() => { setAuthMode('signup'); navigate('auth') }}
        onSignIn={() => { setAuthMode('login'); navigate('auth') }}
        onShowPrivacy={() => navigate('privacy')}
        onShowTerms={() => navigate('terms')}
      />
    )
  }

  // ── Logged in — protected pages ──
  if (page === 'delete-account') return <DeleteAccount userEmail={session.user.email} onBack={() => navigate('app')} onDelete={deleteAccount} />
  if (page === 'profile') return <ProfilePage profile={profile} session={session} onUpdate={updateProfile} checkUsername={checkUsername} onBack={() => navigate('app')} />
  if (page === 'admin') return adminHook.isAdmin
    ? <AdminPanel adminHook={adminHook} onBack={() => navigate('app')} />
    : <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Access denied.</div>

  // ── Main app ──
  const userDisplay = profile?.display_name || profile?.username || session.user.email.split('@')[0]
  const userInitials = userDisplay.slice(0, 2).toUpperCase()

  const tabLabel = (t) => {
    if (t.id === 'watchlist') return `🔖 Watchlist${counts.watchlist ? ` (${counts.watchlist})` : ''}`
    if (t.id === 'watching') return `▶ Watching${counts.watching ? ` (${counts.watching})` : ''}`
    if (t.id === 'watched') return `✅ Watched${counts.watched ? ` (${counts.watched})` : ''}`
    return t.label
  }

  const CardGrid = ({ items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
      {items.map(item => (
        <MovieCard key={item.id} item={item} entry={library[item.id] || {}} onOpen={openDetail} onSetStatus={handleSetStatus} />
      ))}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }}>

      {/* Onboarding for Google OAuth users — shown until profile is complete */}
      {profile && !profile.username_set && (
        <OnboardingModal
          session={session}
          onComplete={() => { window.location.reload() }}
        />
      )}

      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div onClick={goHome} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}><img src="/logo.png" alt="bingr" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} /><span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", letterSpacing: -0.5 }}>bingr</span></div>

          <div style={{ flex: 1, display: 'flex', gap: 6, minWidth: 200 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search movies & TV shows…"
              style={{ flex: 1, padding: '7px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
            <select value={searchType} onChange={e => setSearchType(e.target.value)}
              style={{ padding: '7px 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="multi">All</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </select>
            <button onClick={handleSearch} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}>Search</button>
          </div>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {syncing && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Syncing…</span>}
              <div onClick={e => { e.stopPropagation(); setShowUserMenu(v => !v) }}
                style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
                title={session.user.email}>{userInitials}</div>
            </div>

            {showUserMenu && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '8px', minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 200 }}>
                <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{userDisplay}</div>
                  {profile?.username && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{profile.username}</div>}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{session.user.email}</div>
                </div>
                {[
                  { label: '👤 Edit profile', action: () => { navigate('profile'); setShowUserMenu(false) } },
                  { label: '🪪 View public profile', action: () => { window.location.href = `/@${profile?.username}`; setShowUserMenu(false) } },
                  ...(adminHook.isAdmin ? [{ label: '⚙️ Admin panel', action: () => { navigate('admin'); setShowUserMenu(false) } }] : []),
                  ...(!adminHook.isAdmin ? [{ label: '💬 Send feedback', action: () => { setShowFeedback(true); setShowUserMenu(false) } }] : []),
                  { label: '🌟 Supporters', action: () => { navigate('supporters'); setShowUserMenu(false) } },
                  { label: '🔒 Privacy Policy', action: () => { navigate('privacy'); setShowUserMenu(false) } },
                  { label: '📄 Terms of Service', action: () => { navigate('terms'); setShowUserMenu(false) } },
                  { label: '🚪 Sign out', action: () => { signOut(); setShowUserMenu(false) } },
                  { label: '⚠️ Delete account', action: () => { navigate('delete-account'); setShowUserMenu(false) }, danger: true },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{ display: 'block', width: '100%', padding: '9px 12px', background: 'none', border: 'none', borderRadius: 8, textAlign: 'left', fontSize: 13, color: item.danger ? '#e24b4a' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 1.5rem', display: 'flex', overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setDetailItem(null); setSearchResults(null); setTab(t.id) }}
              style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`, color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'color 0.15s', flexShrink: 0, fontWeight: tab === t.id ? 600 : 400 }}>
              {tabLabel(t)}
            </button>
          ))}
        </div>
      </header>

      {libError && (
        <div style={{ background: 'rgba(226,75,74,0.1)', borderBottom: '1px solid rgba(226,75,74,0.2)', padding: '10px 1.5rem', fontSize: 13, color: '#e24b4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {libError}
          <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}>Reload</button>
        </div>
      )}

      <main style={{ padding: '1.5rem' }}>
        {detailItem ? (
          <DetailPanel
            item={detailItem}
            entry={library[detailItem.id] || {}}
            onBack={(recItem) => recItem?.id ? openDetail(recItem) : setDetailItem(null)}
            onSetStatus={handleSetStatus}
            onSetRating={handleSetRating}
            episodeProps={episodeProps}
            lists={listsHook.lists}
            onAddToList={listsHook.addToList}
            onLogDiary={diaryHook.logEntry}
            diaryEntries={detailItem ? diaryHook.getEntriesForItem(detailItem.id) : []}
          />
        ) : tab === 'discover' ? (
          searchLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }}>Searching…</div>
          ) : searchResults ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                Search results ({searchResults.length})
                <button onClick={() => setSearchResults(null)} style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear ✕</button>
              </div>
              {searchResults.length ? <CardGrid items={searchResults} /> : <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '2rem 0' }}>No results for "{query}".</div>}
            </div>
          ) : trendingError ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Couldn't load trending</div>
              <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Retry</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>🔥 Trending movies this week</div>
              <div style={{ marginBottom: 32 }}><CardGrid items={trending.movies} /></div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>📺 Trending TV shows this week</div>
              <CardGrid items={trending.tv} />
            </div>
          )
        ) : tab === 'stats' ? (
          <StatsPage library={library} diary={diaryHook.entries} episodes={episodeHook.episodes} />
        ) : tab === 'rankings' ? (
          <Rankings library={library} onOpen={openDetail} />
        ) : tab === 'diary' ? (
          <DiaryPage diaryHook={diaryHook} onOpen={openDetail} />
        ) : tab === 'lists' ? (
          <ListsPage listsHook={listsHook} onOpenItem={openDetail} />
        ) : (
          <>
            <ExportPanel library={library} />
            <LibraryTab status={tab} library={library} onOpen={openDetail} onRemove={remove} episodeProps={episodeProps} />
          </>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Privacy Policy', action: () => navigate('privacy') },
          { label: 'Terms of Service', action: () => navigate('terms') },
          { label: '🌟 Supporters', action: () => navigate('supporters') },
          { label: 'Delete Account', action: () => navigate('delete-account') },
        ].map(item => (
          <span key={item.label} onClick={item.action} style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>{item.label}</span>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} bingr · Made in Nairobi 🇰🇪</span>
      </footer>

      <SupportButton session={session} profile={profile} onShowSupporters={() => navigate('supporters')} />

      {showFeedback && <FeedbackModal session={session} profile={profile} onClose={() => setShowFeedback(false)} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  )
}
