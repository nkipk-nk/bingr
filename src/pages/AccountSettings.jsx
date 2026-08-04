import { useState, useRef } from 'react'
import { ArrowLeft, Globe, Lock, Package, AlertTriangle, KeyRound } from 'lucide-react'
import { downloadFullExport } from '../lib/export'
import { useToast } from '../contexts/useToast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Avatar from '../components/ui/Avatar'
import styles from './AccountSettings.module.css'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

// Account-level controls only — username, password, email, privacy, data
// export, delete account. Not the same thing as your profile (display name,
// bio): that lives on UserProfilePage.jsx (the same page others see when
// you visit you), edited there via EditProfileModal.jsx. Username lives
// here rather than on the profile page because it's a login/URL identifier,
// not presentation data — see BINGR_UI_AUDIT.md RD11/RD12. Renamed from
// ProfilePage.jsx, which used to conflate all of this under one "Edit
// profile" label.
export default function AccountSettings({ profile, session, onUpdate, checkUsername, onUpdatePassword, onExportAllData, onBack, onDeleteAccount }) {
  const { showToast } = useToast()
  const [username, setUsername] = useState(profile?.username || '')
  const [usernameState, setUsernameState] = useState('idle') // idle | checking | available | taken | invalid
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const usernameTimer = useRef(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [privacySaving, setPrivacySaving] = useState(false)
  const [privacyError, setPrivacyError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState(null) // { kind: 'ok'|'err', msg }

  // Defaults to public — matches the profiles.profile_public column default,
  // so a profile loaded before this field existed still reads correctly.
  const isPublic = profile?.profile_public !== false

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

  const usernameHint = () => {
    if (usernameState === 'checking') return { cls: '', msg: 'Checking…' }
    if (usernameState === 'available') return { cls: styles.hintOk, msg: '✓ Available' }
    if (usernameState === 'taken') return { cls: styles.hintBad, msg: '✗ Already taken' }
    if (usernameState === 'invalid') return { cls: styles.hintBad, msg: 'Usernames: 3–20 chars, letters, numbers, underscores only' }
    return null
  }
  const usernameHintInfo = usernameHint()
  const canSaveUsername = username !== profile?.username
    && usernameState !== 'checking' && usernameState !== 'taken' && usernameState !== 'invalid'

  const saveUsername = async () => {
    setUsernameSaving(true); setUsernameError('')
    const { error } = await onUpdate({ username: username.toLowerCase() })
    setUsernameSaving(false)
    if (error) { setUsernameError(error); return }
    showToast('Username updated', { tone: 'success' })
  }

  const canSavePassword = newPassword.length >= 6 && newPassword === confirmPassword
  const savePassword = async () => {
    setPasswordSaving(true); setPasswordError('')
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); setPasswordSaving(false); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); setPasswordSaving(false); return }
    const { error } = await onUpdatePassword(newPassword)
    setPasswordSaving(false)
    if (error) { setPasswordError(error); return }
    setNewPassword(''); setConfirmPassword('')
    showToast('Password updated', { tone: 'success' })
  }

  const togglePrivacy = async () => {
    setPrivacySaving(true); setPrivacyError('')
    const { error } = await onUpdate({ profile_public: !isPublic })
    setPrivacySaving(false)
    if (error) setPrivacyError(error)
  }

  const handleExport = async () => {
    setExporting(true); setExportNotice(null)
    const { error, bundle, incomplete } = await onExportAllData()
    setExporting(false)
    if (error) { setExportNotice({ kind: 'err', msg: error }); return }
    downloadFullExport(bundle)
    if (incomplete?.length) {
      setExportNotice({ kind: 'err', msg: `Downloaded, but couldn't include: ${incomplete.join(', ')}. Try again in a moment for the full export.` })
    } else {
      setExportNotice(null)
      showToast('Data export downloaded', { tone: 'success' })
    }
  }

  const displayLabel = profile?.display_name || profile?.username || session?.user?.email

  return (
    <div className={styles.wrap}>
      <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> Back</Button>

      <div className={styles.card}>
        <div className={styles.banner}>
          <Avatar size="md" name={displayLabel} />
          <div>
            <div className={styles.bannerName}>{profile?.display_name || profile?.username}</div>
            <div className={styles.bannerHandle}>@{profile?.username}</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Username</div>
          <div className={styles.usernameWrap}>
            <span className={styles.usernameAt}>@</span>
            <Input
              className={styles.usernameInput}
              value={username} onChange={e => handleUsernameChange(e.target.value)}
              invalid={usernameState === 'taken' || usernameState === 'invalid'}
              maxLength={20} placeholder="your_username"
            />
          </div>
          {usernameHintInfo && <div className={`${styles.hint} ${usernameHintInfo.cls}`}>{usernameHintInfo.msg}</div>}
          <div className={styles.helperText}>Your unique identifier on bingr. Used in shared list URLs.</div>
          {usernameError && <div className={`${styles.hint} ${styles.hintBad}`}>{usernameError}</div>}
          <Button variant="secondary" size="sm" className={styles.sectionBtn} onClick={saveUsername} disabled={!canSaveUsername} loading={usernameSaving}>Save username</Button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Email address</div>
          <div className={styles.sectionValue}>{session?.user?.email}</div>
          <div className={styles.helperText}>To change your email address, contact support@bingr.app</div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Password</div>
          <div className={styles.passwordFields}>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" />
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          </div>
          {passwordError && <div className={`${styles.hint} ${styles.hintBad}`}>{passwordError}</div>}
          <Button variant="secondary" size="sm" className={styles.sectionBtn} onClick={savePassword} disabled={!canSavePassword} loading={passwordSaving}>
            <KeyRound size={14} /> Update password
          </Button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Profile visibility</div>
          <div className={`${styles.visToggle} ${!isPublic ? styles.visToggleActive : ''} ${privacySaving ? styles.visToggleSaving : ''}`} onClick={togglePrivacy}>
            <div className={[styles.visSwitch, isPublic ? styles.visSwitchOn : styles.visSwitchOff].join(' ')}>
              <div className={[styles.visKnob, isPublic ? styles.visKnobOn : styles.visKnobOff].join(' ')} />
            </div>
            <div>
              <div className={styles.visLabel}>{isPublic ? <><Globe size={14} /> Public profile</> : <><Lock size={14} /> Private profile</>}</div>
              <div className={styles.visDesc}>
                {isPublic
                  ? 'Your profile page, ratings, and diary are visible to anyone with your link.'
                  : 'Only you can see your ratings and diary. Your username stays findable in search.'}
              </div>
            </div>
          </div>
          {privacyError && <div className={`${styles.hint} ${styles.hintBad}`}>{privacyError}</div>}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Your data</div>
          <div className={styles.sectionDesc}>
            Download everything bingr has stored for your account — profile, watchlist, ratings, diary,
            episode progress, lists, comments, and follows — as a single JSON file.
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}><Package size={14} /> Download all my data</Button>
          {exportNotice && (
            <div className={`${styles.exportNotice} ${exportNotice.kind === 'ok' ? styles.exportNoticeOk : styles.exportNoticeErr}`}>{exportNotice.msg}</div>
          )}
        </div>

        <div className={`${styles.section} ${styles.dangerSection}`}>
          <div className={styles.sectionTitle}>Danger zone</div>
          <div className={styles.sectionDesc}>Permanently delete your account and all associated data.</div>
          <Button variant="danger" size="sm" onClick={onDeleteAccount}><AlertTriangle size={14} /> Delete account</Button>
        </div>
      </div>
    </div>
  )
}
