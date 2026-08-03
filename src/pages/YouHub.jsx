import { useState } from 'react'
import StatsPage from './StatsPage'
import Rankings from './Rankings'
import ListsPage from './ListsPage'
import SupportSection from '../components/SupportSection'

const TABS = [
  { id: 'stats', label: '📊 Stats' },
  { id: 'rankings', label: '🏆 Rankings' },
  { id: 'lists', label: '📋 Lists' },
  { id: 'support', label: '☕ Support' },
]

// RD6 (BINGR_UI_AUDIT.md) — Stats and Rankings used to be siblings of
// Discover in the main nav; they're about *your* data, not things to
// browse, so they live here instead. Lists folds in for the same reason.
// Support (formerly a floating button — see SupportSection.jsx) lives here
// too now that it no longer needs its own thumb-zone real estate.
export default function YouHub({ session, profile, library, diaryHook, episodeHook, listsHook, onOpenItem, onShowSupporters }) {
  const [tab, setTab] = useState('stats')
  const userDisplay = profile?.display_name || profile?.username || session.user.email.split('@')[0]
  const userInitials = userDisplay.slice(0, 2).toUpperCase()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, flexShrink: 0 }}>
          {userInitials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userDisplay}</div>
          {profile?.username && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{profile.username}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`, color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: tab === t.id ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsPage library={library} diary={diaryHook.entries} episodes={episodeHook.episodes} />}
      {tab === 'rankings' && <Rankings library={library} onOpen={onOpenItem} />}
      {tab === 'lists' && <ListsPage listsHook={listsHook} onOpenItem={onOpenItem} />}
      {tab === 'support' && <SupportSection session={session} profile={profile} onShowSupporters={onShowSupporters} />}
    </div>
  )
}
