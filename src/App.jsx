import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import { useEpisodes } from './hooks/useEpisodes'
import { useLists } from './hooks/useLists'
import { useDiary } from './hooks/useDiary'
import { useFollows } from './hooks/useFollows'
import { useFeed } from './hooks/useFeed'
import { useProfile } from './hooks/useProfile'
import { useAdmin } from './hooks/useAdmin'
import { useToast } from './contexts/useToast'
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
import WelcomeTour from './components/WelcomeTour'
import NavShell from './components/nav/NavShell'
import styles from './App.module.css'

// Code-split everything that isn't on the landing → auth → discover path.
// Before this the whole app — admin panel, both legal pages, public profile
// page, etc. — shipped in one ~1.1MB bundle to every visitor, including
// anonymous ones who will never see most of it.
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const AccountSettings = lazy(() => import('./pages/AccountSettings'))
const PublicListPage = lazy(() => import('./pages/PublicListPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const SupportersPage = lazy(() => import('./pages/SupportersPage'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const DiaryPage = lazy(() => import('./pages/DiaryPage'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'))

const PageFallback = () => (
  <div className={styles.pageFallback}>
    <div className={styles.centeredMsg}>Loading…</div>
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
  const { session, loading: authLoading, signUp, signIn, signOut, updatePassword, deleteAccount } = useAuth()
  const { library, syncing, error: libError, setStatus, toggleWatchlist, setRating, remove } = useLibrary(session)
  const episodeHook = useEpisodes(session)
  const listsHook = useLists(session)
  const diaryHook = useDiary(session)
  const followsHook = useFollows(session)
  const feedHook = useFeed(session, followsHook.following)
  const { profile, updateProfile, checkUsername, exportAllData, reload: reloadProfile } = useProfile(session)
  const adminHook = useAdmin(profile)
  const justSignedUpRef = useRef(false)

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
  const { toast, showToast, clearToast } = useToast()
  const [showFeedback, setShowFeedback] = useState(false)
  const [showTour, setShowTour] = useState(false)

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

  // GP2 (BINGR_UI_AUDIT.md) — orient first-time users once onboarding
  // (username/country) is done. localStorage, not account data — this is
  // presentational, not worth a DB column or a cross-device sync guarantee.
  useEffect(() => {
    if (!profile?.username_set) return
    if (localStorage.getItem('bingr_tour_seen')) return
    setShowTour(true)
  }, [profile?.username_set])

  const dismissTour = () => {
    localStorage.setItem('bingr_tour_seen', '1')
    setShowTour(false)
  }

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
      // 'user-profile' isn't a static entry — its URL carries the username
      // (matches getPageFromURL()'s /^\/@([a-z0-9_]+)$/ parse on reload).
      const url = newPage === 'user-profile' && param ? `/@${param}` : (urlMap[newPage] || '/')
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

  // Real bug found via browser testing, not one of the tracked audit
  // findings: handle_new_user() always inserts a placeholder row
  // (username_set: false) — signUp() then fixes it up with an awaited
  // retry-write, but useProfile's own session-triggered SELECT fires at the
  // same time and has no delay, so it almost always wins the race and
  // caches the pre-fixup row. The DB ends up correct; React's `profile`
  // doesn't, so a freshly-onboarded user sees the onboarding modal again.
  // Setting the ref before signUp() runs (not after) matters — session
  // changes well before signUp()'s retry loop finishes, so the effect
  // below needs the flag already true when that happens.
  const handleAuth = async (mode, email, password, username, country) => {
    if (mode === 'signup') {
      if (username) justSignedUpRef.current = true
      const result = await signUp(email, password, username, country)
      if (result.error) justSignedUpRef.current = false
      return result
    }
    return signIn(email, password)
  }

  useEffect(() => {
    if (session && justSignedUpRef.current) {
      justSignedUpRef.current = false
      reloadProfile()
    }
  }, [session, reloadProfile])

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearchResults(null); setDetailItem(null); setSearchLoading(true)
    try {
      const data = await tmdb.search(query.trim(), searchType)
      setSearchResults((data.results || []).filter(x => x.media_type !== 'person'))
    } catch (err) {
      logger.error('Search failed', err)
      showToast('Search failed. Please try again.', { tone: 'error' })
    } finally { setSearchLoading(false) }
  }

  const handleSetStatus = async (item, status) => {
    const cur = library[item.id]
    await setStatus(item, status)
    if (cur?.status === status) showToast('Status removed')
    else showToast(status === 'watched' ? 'Marked as watched ✓' : 'Added to watching', { tone: 'success' })
  }

  // Independent of watched/watching — see useLibrary.js's setStatus comment.
  const handleToggleWatchlist = async (item) => {
    const wasWatchlisted = !!library[item.id]?.watchlisted
    await toggleWatchlist(item)
    showToast(wasWatchlisted ? 'Removed from watchlist' : 'Added to watchlist', { tone: 'success' })
  }

  const handleSetRating = async (item, rating) => {
    const cur = library[item.id]?.rating
    await setRating(item, rating)
    if (cur === rating) showToast('Rating removed')
    else showToast(`Rated ${rating}/10 — ${RATING_LABELS[rating]}`, { tone: 'success' })
  }

  const openDetail = (item) => {
    setDetailItem(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setDetailItem(null); setSearchResults(null); setTab('discover')
    navigate('app')
  }

  // Standalone pages (profile/admin/supporters/user-profile) were found to
  // render outside NavShell entirely — no persistent nav, and critically no
  // <Toast>, so showToast() calls there (profile save, follow/unfollow)
  // silently updated context state with nothing mounted to display it. Now
  // wrapped in NavShell (see the routes below), which means their nav/search
  // controls need to actually leave the standalone page and land on the
  // main tabbed app — the main NavShell instance's own handlers don't do
  // this because they're already on 'app'. Kept as separate handlers so
  // that already-working instance isn't touched.
  // "You" no longer opens a separate hub — it navigates straight to your own
  // profile page (RD13, BINGR_UI_AUDIT.md), same destination as the account
  // dropdown's "My Profile".
  const goToTabFromHere = (id) => {
    if (id === 'you') { navigate('user-profile', profile?.username); return }
    navigate('app'); setDetailItem(null); setSearchResults(null); setTab(id)
  }
  const searchFromHere = async () => { navigate('app'); setTab('discover'); await handleSearch() }
  const wrapInShell = (children, activeTab = 'you') => (
    <NavShell
      session={session} profile={profile} syncing={syncing} isAdmin={adminHook.isAdmin}
      query={query} setQuery={setQuery} searchType={searchType} setSearchType={setSearchType} onSearch={searchFromHere}
      tab={activeTab} onSelectTab={goToTabFromHere}
      onGoHome={goHome} onNavigate={navigate} onSignOut={signOut}
      libError={libError}
      showFeedback={showFeedback} setShowFeedback={setShowFeedback}
      toast={toast} onClearToast={clearToast}
    >
      {children}
    </NavShell>
  )


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
    <div className={styles.loadingScreen}>
      <div className={styles.loadingInner}>
        <div className={styles.loadingBrand}>
          <img src="/logo.png" alt="bingr" className={styles.loadingLogo} />
          <span className={styles.loadingName}>bingr</span>
        </div>
        <div className={styles.centeredMsg}>Loading…</div>
      </div>
    </div>
  )

  // ── Public pages (no auth needed) ──
  if (page === 'public-list') return (
    <Suspense fallback={<PageFallback />}>
      <PublicListPage listId={pageParam} onSignUp={() => { setAuthMode('signup'); navigate('auth') }} onGoHome={() => navigate('app')} />
    </Suspense>
  )
  if (page === 'user-profile') {
    // Reached anonymously (a shared link) as often as from inside the app —
    // NavShell only wraps it when a session exists, so an anonymous visitor
    // keeps today's focused, chrome-free page (their session-less state
    // never triggers a toast anyway — no follow button without a session).
    const userProfileContent = (
      <Suspense fallback={<PageFallback />}>
        <UserProfilePage
          username={pageParam}
          currentUserId={session?.user?.id || null}
          followsHook={session ? followsHook : null}
          onOpenItem={(item) => { navigate('app'); setTab('discover'); openDetail(item) }}
          onSignUp={() => { setAuthMode('signup'); navigate('auth') }}
          onGoHome={() => navigate('app')}
          embedded={!!session}
          onUpdateProfile={updateProfile}
          episodes={episodeHook.episodes}
          listsHook={listsHook}
          onGoDiscover={goHome}
        />
      </Suspense>
    )
    return session ? wrapInShell(userProfileContent, pageParam === profile?.username ? 'you' : null) : userProfileContent
  }
  if (page === 'supporters') {
    const supportersContent = <Suspense fallback={<PageFallback />}><SupportersPage onBack={() => navigate('app')} /></Suspense>
    return session ? wrapInShell(supportersContent) : supportersContent
  }
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
        trending={trending}
      />
    )
    return (
      <LandingPage
        onSignUp={() => { setAuthMode('signup'); navigate('auth') }}
        onSignIn={() => { setAuthMode('login'); navigate('auth') }}
        onShowPrivacy={() => navigate('privacy')}
        onShowTerms={() => navigate('terms')}
        trending={trending}
      />
    )
  }

  // ── Logged in — protected pages ──
  if (page === 'delete-account') return <Suspense fallback={<PageFallback />}><DeleteAccount userEmail={session.user.email} onBack={() => navigate('app')} onDelete={deleteAccount} /></Suspense>
  if (page === 'account-settings') return wrapInShell(
    <Suspense fallback={<PageFallback />}>
      <AccountSettings
        profile={profile} session={session} onUpdate={updateProfile} checkUsername={checkUsername}
        onUpdatePassword={updatePassword} onExportAllData={exportAllData}
        onBack={() => navigate('app')} onDeleteAccount={() => navigate('delete-account')}
      />
    </Suspense>
  )
  if (page === 'admin') return adminHook.isAdmin
    ? wrapInShell(<Suspense fallback={<PageFallback />}><AdminPanel adminHook={adminHook} onBack={() => navigate('app')} /></Suspense>)
    : <div className={styles.denied}>Access denied.</div>

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

      {showTour && <WelcomeTour onDone={dismissTour} />}

      <NavShell
        session={session} profile={profile} syncing={syncing} isAdmin={adminHook.isAdmin}
        query={query} setQuery={setQuery} searchType={searchType} setSearchType={setSearchType} onSearch={handleSearch}
        tab={tab} onSelectTab={(id) => {
          if (id === 'you') { navigate('user-profile', profile?.username); return }
          setDetailItem(null); setSearchResults(null); setTab(id)
        }}
        onGoHome={goHome} onNavigate={navigate} onSignOut={signOut}
        libError={libError}
        showFeedback={showFeedback} setShowFeedback={setShowFeedback}
        toast={toast} onClearToast={clearToast}
      >
        {detailItem ? (
          <DetailPanel
            item={detailItem}
            entry={library[detailItem.id] || {}}
            onBack={(recItem) => recItem?.id ? openDetail(recItem) : setDetailItem(null)}
            onSetStatus={handleSetStatus}
            onToggleWatchlist={handleToggleWatchlist}
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
            onOpen={openDetail} onSetStatus={handleSetStatus} onToggleWatchlist={handleToggleWatchlist}
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
          <Suspense fallback={<PageFallback />}><DiaryPage diaryHook={diaryHook} onOpen={openDetail} onGoDiscover={goHome} /></Suspense>
        ) : tab === 'library' ? (
          <LibraryPage library={library} onOpen={openDetail} onRemove={remove} episodeProps={episodeProps} onGoDiscover={goHome} />
        ) : null}
      </NavShell>
    </>
  )
}
