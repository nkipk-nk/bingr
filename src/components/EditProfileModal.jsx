import { useState, useRef } from 'react'
import { Pencil } from 'lucide-react'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Button from './ui/Button'
import styles from './EditProfileModal.module.css'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

// Identity fields only (username, display name) — lifted from the page that
// used to be called "Edit profile" (now AccountSettings.jsx, which keeps
// the account-level fields: email, privacy, data export). Opened from
// UserProfilePage.jsx's "Edit profile" button so editing happens on the
// same page that IS your profile, instead of a separate settings form.
export default function EditProfileModal({ open, onClose, profile, checkUsername, onUpdate, onSaved }) {
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [usernameState, setUsernameState] = useState('idle') // idle | checking | available | taken | invalid
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const usernameTimer = useRef(null)

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    if (!clean || clean === profile?.username) { setUsernameState('idle'); return }
    if (clean.length < 3) { setUsernameState('invalid'); return }
    if (!USERNAME_RE.test(clean)) { setUsernameState('invalid'); return }
    setUsernameState('checking')
    clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(async () => {
      const available = await checkUsername(clean)
      setUsernameState(available ? 'available' : 'taken')
    }, 500)
  }

  const canSave = usernameState !== 'checking' && usernameState !== 'taken' && usernameState !== 'invalid'
    && (username !== profile?.username || displayName !== (profile?.display_name || ''))

  const save = async () => {
    setSaving(true); setError('')
    const patch = {}
    if (username !== profile?.username) patch.username = username.toLowerCase()
    if (displayName !== (profile?.display_name || '')) patch.display_name = displayName.trim().slice(0, 50) || null
    const { error } = await onUpdate(patch)
    setSaving(false)
    if (error) { setError(error); return }
    onSaved?.(patch)
    onClose()
  }

  const usernameHint = () => {
    if (usernameState === 'checking') return { cls: '', msg: 'Checking…' }
    if (usernameState === 'available') return { cls: styles.hintOk, msg: '✓ Available' }
    if (usernameState === 'taken') return { cls: styles.hintBad, msg: '✗ Already taken' }
    if (usernameState === 'invalid') return { cls: styles.hintBad, msg: 'Usernames: 3–20 chars, letters, numbers, underscores only' }
    return null
  }

  const hint = usernameHint()

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <div className={styles.field}>
        <label className={styles.label}>Username</label>
        <div className={styles.usernameWrap}>
          <span className={styles.usernameAt}>@</span>
          <Input
            className={styles.usernameInput}
            value={username} onChange={e => handleUsernameChange(e.target.value)}
            invalid={usernameState === 'taken' || usernameState === 'invalid'}
            maxLength={20} placeholder="your_username"
          />
        </div>
        {hint && <div className={`${styles.hint} ${hint.cls}`}>{hint.msg}</div>}
        <div className={styles.helperText}>Your unique identifier on bingr. Used in shared list URLs.</div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Display name <span className={styles.labelOptional}>(optional)</span></label>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50} placeholder="How you want to appear on bingr" />
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <Button variant="primary" className={styles.fullWidthBtn} onClick={save} disabled={!canSave} loading={saving}>
        <Pencil size={14} /> Save changes
      </Button>
    </Modal>
  )
}
