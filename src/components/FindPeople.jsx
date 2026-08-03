import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from './ui/Avatar'
import Input from './ui/Input'
import FollowButton from './ui/FollowButton'
import styles from './FindPeople.module.css'

// Deliberate deviation from BINGR_DESIGN_SYSTEM.md's Feed redesign: the doc
// calls for removing this search box entirely in favor of the unified
// header search (RD8) surfacing People results. That combined typeahead is
// still open (deferred as new-feature scope during the Phase 2b nav pass —
// see BINGR_UI_AUDIT.md RD8's note), so removing this now would leave
// username search unreachable anywhere in the app. Keeping it until the
// replacement actually exists.
const UserRow = ({ user, isFollowing, onToggleFollow, onOpenProfile }) => (
  <div className={styles.row}>
    <div className={styles.rowAvatar} onClick={() => onOpenProfile(user.username)}>
      <Avatar size="md" name={user.display_name || user.username} />
    </div>
    <div className={styles.rowBody} onClick={() => onOpenProfile(user.username)}>
      <div className={styles.rowName}>{user.display_name || user.username}</div>
      <div className={styles.rowHandle}>@{user.username}</div>
    </div>
    <FollowButton following={isFollowing} onToggle={onToggleFollow} />
  </div>
)

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
      <div className={styles.searchWrap}>
        <Input value={query} onChange={e => handleSearch(e.target.value)} placeholder="Search by username..." />
      </div>

      {query.trim() ? (
        <div>
          <div className={styles.sectionLabel}>{loading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''}`}</div>
          <div className={styles.list}>
            {results.map(u => <UserRow key={u.id} user={u} isFollowing={followsHook.isFollowing(u.id)} onToggleFollow={() => followsHook.toggleFollow(u.id)} onOpenProfile={onOpenProfile} />)}
          </div>
          {!loading && !results.length && (
            <div className={styles.centeredMsg}>No users found matching "{query}"</div>
          )}
        </div>
      ) : (
        <div>
          <div className={styles.sectionLabel}>Recently active on bingr</div>
          {suggested.length ? (
            <div className={styles.list}>
              {suggested.map(u => <UserRow key={u.id} user={u} isFollowing={followsHook.isFollowing(u.id)} onToggleFollow={() => followsHook.toggleFollow(u.id)} onOpenProfile={onOpenProfile} />)}
            </div>
          ) : (
            <div className={styles.centeredMsg}>No other users yet — invite your friends!</div>
          )}
        </div>
      )}
    </div>
  )
}
