import { useState } from 'react'
import { ArrowLeft, Globe, Lock, Package, AlertTriangle } from 'lucide-react'
import { downloadFullExport } from '../lib/export'
import { useToast } from '../contexts/useToast'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import styles from './AccountSettings.module.css'

// Account-level controls only — email, privacy, data export, delete account.
// Not the same thing as your profile (username, display name, avatar): that
// lives on UserProfilePage.jsx (the same page others see when they visit
// you), edited there via EditProfileModal.jsx. Renamed from ProfilePage.jsx,
// which used to conflate both under one "Edit profile" label.
export default function AccountSettings({ profile, session, onUpdate, onExportAllData, onBack, onDeleteAccount }) {
  const { showToast } = useToast()
  const [privacySaving, setPrivacySaving] = useState(false)
  const [privacyError, setPrivacyError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState(null) // { kind: 'ok'|'err', msg }

  // Defaults to public — matches the profiles.profile_public column default,
  // so a profile loaded before this field existed still reads correctly.
  const isPublic = profile?.profile_public !== false

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
          <div className={styles.sectionLabel}>Email address</div>
          <div className={styles.sectionValue}>{session?.user?.email}</div>
          <div className={styles.helperText}>To change your email address, contact support@bingr.app</div>
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
