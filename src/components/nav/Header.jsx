import { Search, Lock } from 'lucide-react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import styles from './Header.module.css'

// Extracted from App.jsx (behavior-preserving — no visual change). Owns the
// top bar: logo/search, user avatar. See NavShell.jsx for how this fits
// into the rest of the logged-in layout.
//
// Phase 2b (BINGR_UI_AUDIT.md GP-nav / BINGR_DESIGN_SYSTEM.md's nav
// section) — the old nine-then-five-tab horizontal strip is gone
// entirely, replaced by BottomNav.jsx (mobile) / SideRail.jsx (desktop).
// The avatar dropdown is gone too: clicking it now navigates straight to
// the You hub's Account tab (onOpenAccount) instead of opening a second,
// partial menu — "exactly one place profile/settings lives" per the
// design doc, closing CX-adjacent header/hub duplication.
export default function Header({
  session, profile, syncing,
  query, setQuery, searchType, setSearchType, onSearch,
  onGoHome, onOpenAccount,
}) {
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
          <Input
            className={styles.searchInput}
            value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder="Search titles & shows…"
          />
          <Select className={styles.typeSelect} value={searchType} onChange={e => setSearchType(e.target.value)}>
            <option value="multi">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </Select>
          <Button variant="icon" onClick={onSearch} aria-label="Search"><Search size={18} /></Button>
        </div>

        <div className={styles.rightGroup}>
          {syncing && <span className={styles.syncing}>Syncing…</span>}
          <button className={styles.avatarBtn} onClick={onOpenAccount} title={isPrivate ? `${session.user.email} — private profile` : session.user.email}>
            <Avatar size="sm" name={userDisplay} />
            {isPrivate && <span className={styles.privacyBadge}><Lock size={10} /></span>}
          </button>
        </div>
      </div>
    </header>
  )
}
