import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Hoisted to module scope — was defined inside FindPeople on every render.
// Takes what it needs as props instead of closing over followsHook/onOpenProfile.
const UserRow = ({ user, isFollowing, onToggleFollow, onOpenProfile }) => {
  const initials = (user.display_name || user.username).slice(0, 2).toUpperCase()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px' }}>
      <div onClick={() => onOpenProfile(user.username)}
        style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, cursor: 'pointer' }}>
        {initials}
      </div>
      <div onClick={() => onOpenProfile(user.username)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.display_name || user.username}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{user.username}</div>
      </div>
      <button
        onClick={onToggleFollow}
        style={{
          padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          background: isFollowing ? 'var(--bg-input)' : 'var(--accent)',
          color: isFollowing ? 'var(--text)' : '#fff',
          border: isFollowing ? '1px solid var(--border)' : '1px solid transparent',
        }}>
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}

export default function FindPeople({ session, followsHook, onOpenProfile }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [suggested, setSuggested] = useState([])
  const [loading, setLoading] = useState(false)
  const searchTimer = useRef(null)

  // Load a handful of suggested users (most recently active) on mount
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username_set', true)
      .neq('id', session?.user?.id || '')
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .limit(8)
      .then(({ data }) => setSuggested(data || []))
  }, [session])

  const runSearch = async (q) => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .ilike('username', `%${q.trim().toLowerCase()}%`)
      .eq('username_set', true)
      .neq('id', session?.user?.id || '')
      .limit(20)
    setResults(data || [])
    setLoading(false)
  }

  // Debounced — was firing a query on every keystroke.
  const handleSearch = (q) => {
    setQuery(q)
    clearTimeout(searchTimer.current)
    if (!q.trim()) { setResults([]); return }
    searchTimer.current = setTimeout(() => runSearch(q), 400)
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by username..."
          style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {query.trim() ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
            {loading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(u => <UserRow key={u.id} user={u} isFollowing={followsHook.isFollowing(u.id)} onToggleFollow={() => followsHook.toggleFollow(u.id)} onOpenProfile={onOpenProfile} />)}
          </div>
          {!loading && !results.length && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: 14 }}>
              No users found matching "{query}"
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>Recently active on bingr</div>
          {suggested.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggested.map(u => <UserRow key={u.id} user={u} isFollowing={followsHook.isFollowing(u.id)} onToggleFollow={() => followsHook.toggleFollow(u.id)} onOpenProfile={onOpenProfile} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: 14 }}>
              No other users yet — invite your friends!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
