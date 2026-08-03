import { lazy, Suspense } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'
import SideRail from './SideRail'
import Toast from '../ui/Toast'
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
  toast, onClearToast,
  children,
}) {
  return (
    <div className={styles.shell}>
      <SideRail tab={tab} onSelectTab={onSelectTab} onGoHome={onGoHome} />

      <Header
        session={session} profile={profile} syncing={syncing}
        query={query} setQuery={setQuery} searchType={searchType} setSearchType={setSearchType} onSearch={onSearch}
        onGoHome={onGoHome} onOpenAccount={onOpenAccount}
      />

      {libError && (
        <div className={styles.errorBanner}>
          {libError}
          <button onClick={() => window.location.reload()} className={styles.reloadBtn}>Reload</button>
        </div>
      )}

      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        {[
          { label: 'Privacy Policy', action: () => onNavigate('privacy') },
          { label: 'Terms of Service', action: () => onNavigate('terms') },
          { label: 'Supporters', action: () => onNavigate('supporters') },
          { label: 'Delete Account', action: () => onNavigate('delete-account') },
        ].map(item => (
          <button key={item.label} onClick={item.action} className={styles.footerLink}>{item.label}</button>
        ))}
        <span className={styles.footerCopy}>© {new Date().getFullYear()} bingr · Made in Nairobi 🇰🇪</span>
      </footer>

      {showFeedback && (
        <Suspense fallback={null}>
          <FeedbackModal session={session} profile={profile} onClose={() => setShowFeedback(false)} />
        </Suspense>
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          action={toast.action}
          onDismiss={onClearToast}
          className={styles.toastOffset}
        />
      )}

      <BottomNav tab={tab} onSelectTab={onSelectTab} />
    </div>
  )
}
