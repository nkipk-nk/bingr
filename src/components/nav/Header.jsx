import { useState } from 'react'
import { Search, Lock } from 'lucide-react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import AccountMenu from './AccountMenu'
import styles from './Header.module.css'

// Extracted from App.jsx (behavior-preserving — no visual change). Owns the
// top bar: logo/search, user avatar. See NavShell.jsx for how this fits
// into the rest of the logged-in layout.
//
// Phase 2b (BINGR_UI_AUDIT.md GP-nav / BINGR_DESIGN_SYSTEM.md's nav
// section) originally made the avatar navigate straight to the You hub's
// Account tab instead of opening a dropdown. Real user testing on the
// deployed app found that reads as a mobile pattern spilling onto desktop
// — brought back a real anchored dropdown (AccountMenu.jsx) for both.
export default function Header({
  session, profile, syncing, isAdmin,
  query, setQuery, searchType, setSearchType, onSearch,
  onGoHome, onNavigate, onShowFeedback, onSignOut,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const userDisplay = profile?.display_name || profile?.username || session.user.email.split('@')[0]
  // GP11 (BINGR_UI_AUDIT.md) — profile privacy was invisible outside
  // Settings. Only surfaced for the private case — public is the default,
  // so a persistent glyph there would just be noise for most users.
  const isPrivate = profile?.profile_public === false

  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <button className={styles.brand} onClick={onGoHome}>
          <img src="/logo.png" alt="bingr" className={styles.brandLogo} />
          <span className={styles.brandName}>bingr</span>
        </button>

        <div className={styles.searchGroup}>
          {/* RD8 (BINGR_UI_AUDIT.md) — this searches titles only (a genuinely
              different domain from FindPeople's username search, still on
              the Feed tab); the label says so explicitly rather than
              leaving the scope ambiguous. See DiscoverPage's "No results"
              hint for the people-search pointer. */}
          <div className={styles.searchInputWrap}>
            <Input
              value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()}
              placeholder="Search titles & shows…"
            />
          </div>
          <Select className={styles.typeSelect} value={searchType} onChange={e => setSearchType(e.target.value)}>
            <option value="multi">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </Select>
          <Button variant="icon" onClick={onSearch} aria-label="Search"><Search size={18} /></Button>
        </div>

        <div className={styles.rightGroup}>
          {syncing && <span className={styles.syncing}>Syncing…</span>}
          <div className={styles.avatarWrap}>
            <button className={styles.avatarBtn} onClick={() => setMenuOpen(v => !v)} title={isPrivate ? `${session.user.email} — private profile` : session.user.email}>
              <Avatar size="sm" name={userDisplay} />
              {isPrivate && <span className={styles.privacyBadge}><Lock size={10} /></span>}
            </button>
            {menuOpen && (
              <AccountMenu
                profile={profile} session={session} isAdmin={isAdmin}
                onClose={() => setMenuOpen(false)}
                onNavigate={onNavigate} onShowFeedback={onShowFeedback} onSignOut={onSignOut}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
