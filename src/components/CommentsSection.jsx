import { useState } from 'react'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CommentRow({ comment, session, onDelete, onFlag, onOpenProfile }) {
  const [showMenu, setShowMenu] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const [flagResult, setFlagResult] = useState(null) // null | 'ok' | error string
  const isOwn = session?.user?.id === comment.user_id

  const handleFlag = async () => {
    setFlagging(true)
    const { error } = await onFlag(comment.id)
    setFlagging(false)
    setShowMenu(false)
    // Comment removal from the list (if it crosses the auto-hide threshold,
    // see migration p1b) is driven by the reload, not this state — this is
    // only local feedback so the reporter isn't left wondering if anything
    // happened, since flagComment previously gave no confirmation at all.
    setFlagResult(error ? error : 'ok')
    setTimeout(() => setFlagResult(null), 3000)
  }

  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => onOpenProfile(comment.username)}
        style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: 'pointer' }}>
        {comment.username.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span onClick={() => onOpenProfile(comment.username)} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
            @{comment.username}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{comment.comment}</p>
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {flagResult ? (
          <span style={{ fontSize: 11, color: flagResult === 'ok' ? '#1d9e75' : '#e24b4a', whiteSpace: 'nowrap' }}>
            {flagResult === 'ok' ? '✓ Reported' : flagResult}
          </span>
        ) : (
          <button onClick={() => setShowMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '0 4px' }}>⋯</button>
        )}
        {showMenu && (
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, minWidth: 140, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 50 }}>
            {isOwn ? (
              <button onClick={() => { if (window.confirm('Delete this comment? This cannot be undone.')) onDelete(comment.id); setShowMenu(false) }}
                style={{ display: 'block', width: '100%', padding: '7px 10px', background: 'none', border: 'none', borderRadius: 6, textAlign: 'left', fontSize: 12, color: '#e24b4a', cursor: 'pointer', fontFamily: 'inherit' }}>
                🗑️ Delete
              </button>
            ) : (
              <button onClick={handleFlag} disabled={flagging}
                style={{ display: 'block', width: '100%', padding: '7px 10px', background: 'none', border: 'none', borderRadius: 6, textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {flagging ? 'Reporting…' : '🚩 Report'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentsSection({ commentsHook, session, onOpenProfile, onShowAuth }) {
  const { comments, loading, posting, postComment, deleteComment, flagComment } = commentsHook
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const submit = async () => {
    if (!text.trim()) return
    setError('')
    const { error } = await postComment(text)
    if (error) setError(error)
    else setText('')
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem 1.5rem', marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
        💬 Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      {/* Compose box */}
      {session ? (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError('') }}
            placeholder="Share your thoughts…"
            rows={2}
            maxLength={1000}
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{text.length}/1000</div>
            <button onClick={submit} disabled={!text.trim() || posting}
              style={{ padding: '7px 18px', background: text.trim() ? 'var(--accent)' : 'var(--border)', color: text.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
          {error && <div style={{ fontSize: 12, color: '#e24b4a', marginTop: 8, padding: '7px 10px', background: 'rgba(226,75,74,0.08)', borderRadius: 8 }}>{error}</div>}
        </div>
      ) : (
        <div onClick={onShowAuth} style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 16 }}>
          Sign in to join the conversation
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: 13 }}>Loading comments…</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: 13 }}>No comments yet. Be the first to share your thoughts.</div>
      ) : (
        <div>
          {comments.map(c => (
            <CommentRow key={c.id} comment={c} session={session} onDelete={deleteComment} onFlag={flagComment} onOpenProfile={onOpenProfile} />
          ))}
        </div>
      )}
    </div>
  )
}
