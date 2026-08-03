import { lazy, Suspense } from 'react'
import Header from './Header'
import SupportButton from '../SupportButton'

// Extracted from App.jsx (behavior-preserving — no visual change). Wraps the
// logged-in main-app view: header, error banner, page content, footer,
// support button, feedback modal, and the toast — everything that surrounds
// whatever tab/detail content App.jsx passes in as children.
const FeedbackModal = lazy(() => import('../FeedbackModal'))

export default function NavShell({
  session, profile, isAdmin, syncing,
  query, setQuery, searchType, setSearchType, onSearch,
  showUserMenu, setShowUserMenu,
  tab, onSelectTab, counts, feedCount,
  onGoHome, onNavigate, onSignOut,
  libError,
  showFeedback, setShowFeedback,
  toast,
  children,
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }}>
      <Header
        session={session} profile={profile} isAdmin={isAdmin} syncing={syncing}
        query={query} setQuery={setQuery} searchType={searchType} setSearchType={setSearchType} onSearch={onSearch}
        showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu}
        tab={tab} onSelectTab={onSelectTab} counts={counts} feedCount={feedCount}
        onGoHome={onGoHome} onNavigate={onNavigate} onSignOut={onSignOut}
        onShowFeedback={() => setShowFeedback(true)}
      />

      {libError && (
        <div style={{ background: 'rgba(226,75,74,0.1)', borderBottom: '1px solid rgba(226,75,74,0.2)', padding: '10px 1.5rem', fontSize: 13, color: '#e24b4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {libError}
          <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}>Reload</button>
        </div>
      )}

      <main style={{ padding: '1.5rem' }}>
        {children}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Privacy Policy', action: () => onNavigate('privacy') },
          { label: 'Terms of Service', action: () => onNavigate('terms') },
          { label: '🌟 Supporters', action: () => onNavigate('supporters') },
          { label: 'Delete Account', action: () => onNavigate('delete-account') },
        ].map(item => (
          <span key={item.label} onClick={item.action} style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>{item.label}</span>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} bingr · Made in Nairobi 🇰🇪</span>
      </footer>

      <SupportButton session={session} profile={profile} onShowSupporters={() => onNavigate('supporters')} />

      {showFeedback && (
        <Suspense fallback={null}>
          <FeedbackModal session={session} profile={profile} onClose={() => setShowFeedback(false)} />
        </Suspense>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  )
}
