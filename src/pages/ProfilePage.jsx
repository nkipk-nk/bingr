import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Globe, Lock, Package } from 'lucide-react'
import { downloadFullExport } from '../lib/export'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Avatar from '../components/ui/Avatar'
import styles from './ProfilePage.module.css'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function ProfilePage({ profile, session, onUpdate, checkUsername, onExportAllData, onBack }) {
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [usernameState, setUsernameState] = useState('idle') // idle | checking | available | taken | invalid
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [privacySaving, setPrivacySaving] = useState(false)
  const [privacyError, setPrivacyError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState(null) // { kind: 'ok'|'err', msg }
  const usernameTimer = useRef(null)

  useEffect(() => {
    setUsername(profile?.username || '')
    setDisplayName(profile?.display_name || '')
  }, [profile])

  // Defaults to public — matches the profiles.profile_public column default,
  // so a profile loaded before this field existed still reads correctly.
  const isPublic = profile?.profile_public !== false

  // Saved on toggle, independent of the username/display-name form below —
  // a privacy change shouldn't wait on unrelated validation (e.g. a pending
  // username availability check) before it takes effect.
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
    setExportNotice(
      incomplete?.length
        ? { kind: 'err', msg: `Downloaded, but couldn't include: ${incomplete.join(', ')}. Try again in a moment for the full export.` }
        : { kind: 'ok', msg: '✓ Downloaded' }
    )
  }

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    setSaved(false)
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
    if (error) setError(error)
    else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const usernameHint = () => {
    if (usernameState === 'checking') return { cls: '', msg: 'Checking…' }
    if (usernameState === 'available') return { cls: styles.hintOk, msg: '✓ Available' }
    if (usernameState === 'taken') return { cls: styles.hintBad, msg: '✗ Already taken' }
    if (usernameState === 'invalid') return { cls: styles.hintBad, msg: 'Usernames: 3–20 chars, letters, numbers, underscores only' }
    return null
  }

  const hint = usernameHint()
  const displayLabel = profile?.display_name || profile?.username || session?.user?.email

  return (
    <div className={styles.wrap}>
      <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> Back</Button>

      <div className={styles.card}>
        <div className={styles.avatarBanner}>
          <Avatar size="lg" name={displayLabel} />
          <div>
            <div className={styles.bannerName}>{profile?.display_name || profile?.username}</div>
            <div className={styles.bannerHandle}>@{profile?.username}</div>
            <div className={styles.bannerEmail}>{session?.user?.email}</div>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.formTitle}>Edit profile</div>

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

          <div className={styles.field}>
            <label className={styles.label}>Profile visibility</label>
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

          {error && <div className={styles.errorBox}>{error}</div>}
          {saved && <div className={styles.successBox}>✓ Profile saved</div>}

          <Button variant="primary" className={styles.fullWidthBtn} onClick={save} disabled={!canSave} loading={saving}>Save changes</Button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Email address</div>
          <div className={styles.sectionValue}>{session?.user?.email}</div>
          <div className={styles.helperText}>To change your email address, contact support@bingr.app</div>
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
      </div>
    </div>
  )
}
