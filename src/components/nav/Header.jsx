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
  const userInitials = userDisplay.slice(0, 2).toUpperCase()

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div onClick={onGoHome} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}><img src="/logo.png" alt="bingr" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} /><span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", letterSpacing: -0.5 }}>bingr</span></div>

        <div style={{ flex: 1, display: 'flex', gap: 6, minWidth: 200 }}>
          {/* RD8 (BINGR_UI_AUDIT.md) — this searches titles only (a genuinely
              different domain from FindPeople's username search, still on
              the Feed tab); the label says so explicitly rather than
              leaving the scope ambiguous. See the "No results" hint below
              for the people-search pointer. */}
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder="Search titles & shows…"
            style={{ flex: 1, padding: '7px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
          <select value={searchType} onChange={e => setSearchType(e.target.value)}
            style={{ padding: '7px 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="multi">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
          <button onClick={onSearch} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}>Search</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {syncing && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Syncing…</span>}
          <div onClick={onOpenAccount}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
            title={session.user.email}>{userInitials}</div>
        </div>
      </div>
    </header>
  )
}
