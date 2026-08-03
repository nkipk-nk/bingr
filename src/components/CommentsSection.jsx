import { useState } from 'react'
import { MessageCircle, MoreHorizontal, Trash2, Flag } from 'lucide-react'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import ConfirmDialog from './ui/ConfirmDialog'
import { formatDate } from '../lib/dates'
import styles from './CommentsSection.module.css'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr, 'full')
}

function CommentRow({ comment, session, onDelete, onFlag, onOpenProfile }) {
  const [showMenu, setShowMenu] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const [flagResult, setFlagResult] = useState(null) // null | 'ok' | error string
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    <div className={styles.row}>
      <div className={styles.avatar} onClick={() => onOpenProfile(comment.username)}>
        <Avatar size="sm" name={comment.username} />
      </div>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          <span className={styles.handle} onClick={() => onOpenProfile(comment.username)}>@{comment.username}</span>
          <span className={styles.timestamp}>{timeAgo(comment.created_at)}</span>
        </div>
        <p className={styles.text}>{comment.comment}</p>
      </div>
      <div className={styles.menuWrap}>
        {flagResult ? (
          <span className={[styles.flagResult, flagResult === 'ok' ? styles.flagResultOk : styles.flagResultErr].join(' ')}>
            {flagResult === 'ok' ? '✓ Reported' : flagResult}
          </span>
        ) : (
          <button onClick={() => setShowMenu(v => !v)} className={styles.menuBtn}><MoreHorizontal size={18} /></button>
        )}
        {showMenu && (
          <div onClick={e => e.stopPropagation()} className={styles.menu}>
            {isOwn ? (
              <button onClick={() => { setConfirmDelete(true); setShowMenu(false) }} className={`${styles.menuItem} ${styles.menuItemDanger}`}>
                <Trash2 size={13} /> Delete
              </button>
            ) : (
              <button onClick={handleFlag} disabled={flagging} className={styles.menuItem}>
                <Flag size={13} /> {flagging ? 'Reporting…' : 'Report'}
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { onDelete(comment.id); setConfirmDelete(false) }}
        title="Delete this comment?"
        message="This cannot be undone."
      />
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
    <div className={styles.wrap}>
      <div className={styles.title}><MessageCircle size={18} /> Comments {comments.length > 0 && `(${comments.length})`}</div>

      {session ? (
        <div className={styles.composeWrap}>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError('') }}
            placeholder="Share your thoughts…"
            rows={2}
            maxLength={1000}
            className={styles.textarea}
          />
          <div className={styles.composeFooter}>
            <div className={styles.charCount}>{text.length}/1000</div>
            <Button variant="primary" size="sm" onClick={submit} disabled={!text.trim()} loading={posting}>Post comment</Button>
          </div>
          {error && <div className={styles.errorBox}>{error}</div>}
        </div>
      ) : (
        <div onClick={onShowAuth} className={styles.signInPrompt}>Sign in to join the conversation</div>
      )}

      {loading ? (
        <div className={styles.centeredMsg}>Loading comments…</div>
      ) : comments.length === 0 ? (
        <div className={styles.centeredMsg}>No comments yet. Be the first to share your thoughts.</div>
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
