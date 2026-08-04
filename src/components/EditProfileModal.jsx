import { useState } from 'react'
import { Pencil } from 'lucide-react'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Button from './ui/Button'
import styles from './EditProfileModal.module.css'

// Displayed profile data only — display name, bio. Username lives in
// AccountSettings.jsx instead (an account-level identifier used in login
// and URLs, not presentation data — see BINGR_UI_AUDIT.md RD11/RD12).
// Opened from UserProfilePage.jsx's "Edit profile" button so editing
// happens on the same page that IS your profile.
export default function EditProfileModal({ open, onClose, profile, onUpdate, onSaved }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canSave = displayName !== (profile?.display_name || '') || bio !== (profile?.bio || '')

  const save = async () => {
    setSaving(true); setError('')
    const patch = {}
    if (displayName !== (profile?.display_name || '')) patch.display_name = displayName.trim().slice(0, 50) || null
    if (bio !== (profile?.bio || '')) patch.bio = bio.trim().slice(0, 300) || null
    const { error } = await onUpdate(patch)
    setSaving(false)
    if (error) { setError(error); return }
    onSaved?.(patch)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <div className={styles.field}>
        <label className={styles.label}>Display name <span className={styles.labelOptional}>(optional)</span></label>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50} placeholder="How you want to appear on bingr" />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Bio <span className={styles.labelOptional}>(optional)</span></label>
        <textarea
          value={bio} onChange={e => setBio(e.target.value)}
          placeholder="A little about you and what you watch…" rows={3} maxLength={300}
          className={styles.textarea}
        />
        <div className={styles.charCount}>{bio.length}/300</div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <Button variant="primary" className={styles.fullWidthBtn} onClick={save} disabled={!canSave} loading={saving}>
        <Pencil size={14} /> Save changes
      </Button>
    </Modal>
  )
}
