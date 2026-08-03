import { lazy, Suspense } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'
import SideRail from './SideRail'
import styles from './NavShell.module.css'

// Extracted from App.jsx (behavior-preserving — no visual change origin;
// Phase 2b added the BottomNav/SideRail visual layer on top). Wraps the
// logged-in main-app view: header, primary nav, error banner, page
// content, footer, feedback modal, and the toast — everything that
// surrounds whatever tab/detail content App.jsx passes in as children.
//
// The floating support button used to live here too — retired per
// BINGR_DESIGN_SYSTEM.md's nav section (it sat in the same bottom-right
// thumb zone the bottom nav needs) and folded into the You hub's Support
// tab (see SupportSection.jsx / YouHub.jsx) instead of being repositioned.
const FeedbackModal = lazy(() => import('../FeedbackModal'))

export default function NavShell({
  session, profile, syncing,
  query, setQuery, searchType, setSearchType, onSearch,
  tab, onSelectTab, onOpenAccount,
  onGoHome, onNavigate,
  libError,
  showFeedback, setShowFeedback,
  toast,
  children,
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }} className={styles.shell}>
      <SideRail tab={tab} onSelectTab={onSelectTab} onGoHome={onGoHome} />

      <Header
        session={session} profile={profile} syncing={syncing}
        query={query} setQuery={setQuery} searchType={searchType} setSearchType={setSearchType} onSearch={onSearch}
        onGoHome={onGoHome} onOpenAccount={onOpenAccount}
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

      {showFeedback && (
        <Suspense fallback={null}>
          <FeedbackModal session={session} profile={profile} onClose={() => setShowFeedback(false)} />
        </Suspense>
      )}

      {toast && (
        <div className={styles.toast} style={{ background: '#1a1a1a', color: '#fff', padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>{toast}</div>
      )}

      <BottomNav tab={tab} onSelectTab={onSelectTab} />
    </div>
  )
}
