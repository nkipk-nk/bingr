// Extracted from App.jsx (behavior-preserving — no visual change). Owns the
// top bar: logo/search, user avatar menu, and the tab strip. See NavShell.jsx
// for how this fits into the rest of the logged-in layout.
// RD2/RD6 (BINGR_UI_AUDIT.md) — nine destinations collapsed to five:
// Watchlist/Watching/Watched merged into Library (LibraryTab.jsx owns its
// own status segmented control now), Stats/Rankings/Lists folded into the
// You hub (YouHub.jsx). Still the same horizontal strip chrome as before —
// that visual restructure is Phase 2b, kept separate from this IA change.
const TABS = [
  { id: 'discover', label: '🔍 Discover' },
  { id: 'feed', label: '🌐 Feed' },
  { id: 'library', label: '🔖 Library' },
  { id: 'diary', label: '📔 Diary' },
  { id: 'you', label: '👤 You' },
]

export default function Header({
  session, profile, isAdmin, syncing,
  query, setQuery, searchType, setSearchType, onSearch,
  showUserMenu, setShowUserMenu,
  tab, onSelectTab, counts, feedCount,
  onGoHome, onNavigate, onSignOut, onShowFeedback,
}) {
  const userDisplay = profile?.display_name || profile?.username || session.user.email.split('@')[0]
  const userInitials = userDisplay.slice(0, 2).toUpperCase()

  const tabLabel = (t) => {
    if (t.id === 'feed') return `🌐 Feed${feedCount ? ` (${feedCount})` : ''}`
    if (t.id === 'library') {
      const total = (counts.watchlist || 0) + (counts.watching || 0) + (counts.watched || 0)
      return `🔖 Library${total ? ` (${total})` : ''}`
    }
    return t.label
  }

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div onClick={onGoHome} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}><img src="/logo.png" alt="bingr" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} /><span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", letterSpacing: -0.5 }}>bingr</span></div>

        <div style={{ flex: 1, display: 'flex', gap: 6, minWidth: 200 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder="Search movies & TV shows…"
            style={{ flex: 1, padding: '7px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
          <select value={searchType} onChange={e => setSearchType(e.target.value)}
            style={{ padding: '7px 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="multi">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
          <button onClick={onSearch} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}>Search</button>
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
                { label: '👤 Edit profile', action: () => { onNavigate('profile'); setShowUserMenu(false) } },
                { label: '🪪 View public profile', action: () => { window.location.href = `/@${profile?.username}`; setShowUserMenu(false) } },
                ...(isAdmin ? [{ label: '⚙️ Admin panel', action: () => { onNavigate('admin'); setShowUserMenu(false) } }] : []),
                ...(!isAdmin ? [{ label: '💬 Send feedback', action: () => { onShowFeedback(); setShowUserMenu(false) } }] : []),
                { label: '🌟 Supporters', action: () => { onNavigate('supporters'); setShowUserMenu(false) } },
                { label: '🔒 Privacy Policy', action: () => { onNavigate('privacy'); setShowUserMenu(false) } },
                { label: '📄 Terms of Service', action: () => { onNavigate('terms'); setShowUserMenu(false) } },
                { label: '🚪 Sign out', action: () => { onSignOut(); setShowUserMenu(false) } },
                { label: '⚠️ Delete account', action: () => { onNavigate('delete-account'); setShowUserMenu(false) }, danger: true },
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
          <button key={t.id} onClick={() => onSelectTab(t.id)}
            style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`, color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'color 0.15s', flexShrink: 0, fontWeight: tab === t.id ? 600 : 400 }}>
            {tabLabel(t)}
          </button>
        ))}
      </div>
    </header>
  )
}
