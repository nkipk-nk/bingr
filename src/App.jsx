import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import { useEpisodes } from './hooks/useEpisodes'
import { useLists } from './hooks/useLists'
import { useDiary } from './hooks/useDiary'
import { useFollows } from './hooks/useFollows'
import { useFeed } from './hooks/useFeed'
import { useProfile } from './hooks/useProfile'
import { useAdmin } from './hooks/useAdmin'
import { tmdb, mapWithConcurrency } from './lib/tmdb'
import { logger } from './lib/logger'
import { supabase } from './lib/supabase'
import { RATING_LABELS } from './lib/constants'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DetailPanel from './components/DetailPanel'
import DiscoverPage from './pages/DiscoverPage'
import FeedPage from './pages/FeedPage'
import LibraryPage from './pages/LibraryPage'
import OnboardingModal from './components/OnboardingModal'
import NavShell from './components/nav/NavShell'

// Code-split everything that isn't on the landing → auth → discover path.
// Before this the whole app — admin panel, both legal pages, public profile
// page, etc. — shipped in one ~1.1MB bundle to every visitor, including
// anonymous ones who will never see most of it.
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PublicListPage = lazy(() => import('./pages/PublicListPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const SupportersPage = lazy(() => import('./pages/SupportersPage'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const DiaryPage = lazy(() => import('./pages/DiaryPage'))
const YouHub = lazy(() => import('./pages/YouHub'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'))

const PageFallback = () => (
  <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading…</div>
  </div>
)

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
  const { library, syncing, error: libError, setStatus, setRating, remove } = useLibrary(session)
  const episodeHook = useEpisodes(session)
  const listsHook = useLists(session)
  const diaryHook = useDiary(session)
  const followsHook = useFollows(session)
  const feedHook = useFeed(session, followsHook.following)
  const { profile, updateProfile, checkUsername, exportAllData } = useProfile(session)
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
  const [showFeedback, setShowFeedback] = useState(false)
  const [youTab, setYouTab] = useState('stats')

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
    const shows = Object.values(library).filter(x => x.media_type === 'tv' && !seasonsCache[x.tmdb_id])
    if (!shows.length) return
    // Bounded concurrency instead of firing one request per TV show at once —
    // a library of any real size could trip TMDB's rate limit, and failures
    // were previously swallowed by an empty .catch(), so a 429 silently made
    // episode progress vanish from the Watchlist with no explanation.
    mapWithConcurrency(shows, 4, show =>
      tmdb.tvDetails(show.tmdb_id).then(d => {
        if (d?.seasons) seasonsCache[show.tmdb_id] = d.seasons
      }).catch(err => {
        logger.warn('Failed to load season list for library show', { tmdbId: show.tmdb_id, message: err?.message })
      })
    )
  }, [library])

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
    const cur = library[item.id]?.rating
    await setRating(item, rating)
    if (cur === rating) showToast('Rating removed')
    else showToast(`Rated ${rating}/10 — ${RATING_LABELS[rating]}`)
  }

  const openDetail = (item) => {
    setDetailItem(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setDetailItem(null); setSearchResults(null); setTab('discover')
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
  if (page === 'public-list') return (
    <Suspense fallback={<PageFallback />}>
      <PublicListPage listId={pageParam} onSignUp={() => { setAuthMode('signup'); navigate('auth') }} onGoHome={() => navigate('app')} />
    </Suspense>
  )
  if (page === 'user-profile') return (
    <Suspense fallback={<PageFallback />}>
      <UserProfilePage
        username={pageParam}
        currentUserId={session?.user?.id || null}
        followsHook={session ? followsHook : null}
        onOpenItem={(item) => { navigate('app'); setTab('discover'); openDetail(item) }}
        onSignUp={() => { setAuthMode('signup'); navigate('auth') }}
        onGoHome={() => navigate('app')}
      />
    </Suspense>
  )
  if (page === 'supporters') return <Suspense fallback={<PageFallback />}><SupportersPage onBack={() => navigate('app')} /></Suspense>
  if (page === 'privacy') return <Suspense fallback={<PageFallback />}><PrivacyPolicy onBack={() => navigate(session ? 'app' : 'landing')} /></Suspense>
  if (page === 'terms') return <Suspense fallback={<PageFallback />}><TermsOfService onBack={() => navigate(session ? 'app' : 'landing')} /></Suspense>
  if (page === 'reset') return <Suspense fallback={<PageFallback />}><ResetPassword onDone={() => { navigate('auth'); setAuthMode('login') }} /></Suspense>
  if (page === 'forgot') return <Suspense fallback={<PageFallback />}><ForgotPassword onBack={() => navigate('auth')} /></Suspense>

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
  if (page === 'delete-account') return <Suspense fallback={<PageFallback />}><DeleteAccount userEmail={session.user.email} onBack={() => navigate('app')} onDelete={deleteAccount} /></Suspense>
  if (page === 'profile') return <Suspense fallback={<PageFallback />}><ProfilePage profile={profile} session={session} onUpdate={updateProfile} checkUsername={checkUsername} onExportAllData={exportAllData} onBack={() => navigate('app')} /></Suspense>
  if (page === 'admin') return adminHook.isAdmin
    ? <Suspense fallback={<PageFallback />}><AdminPanel adminHook={adminHook} onBack={() => navigate('app')} /></Suspense>
    : <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Access denied.</div>

  // ── Main app ──
  return (
    <>
      {/* Onboarding for Google OAuth users — shown until profile is complete */}
      {profile && !profile.username_set && (
        <OnboardingModal
          session={session}
          onComplete={() => { window.location.reload() }}
        />
      )}

      <NavShell
        session={session} profile={profile} syncing={syncing}
        query={query} setQuery={setQuery} searchType={searchType} setSearchType={setSearchType} onSearch={handleSearch}
        tab={tab} onSelectTab={(id) => { setDetailItem(null); setSearchResults(null); setTab(id) }}
        onOpenAccount={() => { setDetailItem(null); setSearchResults(null); setTab('you'); setYouTab('account') }}
        onGoHome={goHome} onNavigate={navigate}
        libError={libError}
        showFeedback={showFeedback} setShowFeedback={setShowFeedback}
        toast={toast}
      >
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
            session={session}
            profile={profile}
            onShowAuth={() => { setAuthMode('login'); navigate('auth') }}
          />
        ) : tab === 'discover' ? (
          <DiscoverPage
            library={library} trending={trending} trendingError={trendingError}
            searchResults={searchResults} searchLoading={searchLoading} query={query}
            onClearSearch={() => setSearchResults(null)}
            onOpen={openDetail} onSetStatus={handleSetStatus}
            onFindPeople={() => { setSearchResults(null); setTab('feed'); setTimeout(() => document.getElementById('find-people')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }}
          />
        ) : tab === 'feed' ? (
          <FeedPage
            feedHook={feedHook} following={followsHook.following}
            session={session} followsHook={followsHook}
            onOpenItem={openDetail}
            onOpenProfile={(username) => { window.location.href = `/@${username}` }}
          />
        ) : tab === 'diary' ? (
          <Suspense fallback={<PageFallback />}><DiaryPage diaryHook={diaryHook} onOpen={openDetail} /></Suspense>
        ) : tab === 'library' ? (
          <LibraryPage library={library} onOpen={openDetail} onRemove={remove} episodeProps={episodeProps} />
        ) : tab === 'you' ? (
          <Suspense fallback={<PageFallback />}>
            <YouHub
              session={session} profile={profile} library={library}
              diaryHook={diaryHook} episodeHook={episodeHook} listsHook={listsHook}
              onOpenItem={openDetail} onShowSupporters={() => navigate('supporters')}
              tab={youTab} onTabChange={setYouTab}
              onNavigate={navigate} onSignOut={signOut} onShowFeedback={() => setShowFeedback(true)}
              isAdmin={adminHook.isAdmin}
            />
          </Suspense>
        ) : null}
      </NavShell>
    </>
  )
}
