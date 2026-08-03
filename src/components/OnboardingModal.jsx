import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/countries'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Select from './ui/Select'
import Button from './ui/Button'
import styles from './OnboardingModal.module.css'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

// CX9 (BINGR_UI_AUDIT.md) — this was the app's one remaining centered
// dialog; everything else is a bottom sheet. Nothing about onboarding's
// content demanded the different treatment, so it's on the same Modal
// primitive now. Non-dismissible by design (mandatory setup step) — same
// as before, just now explicit via a no-op onClose instead of the old
// markup simply having no dismiss affordance at all.
export default function OnboardingModal({ session, onComplete }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState(
    session?.user?.user_metadata?.full_name || ''
  )
  const [country, setCountry] = useState('')
  const [usernameState, setUsernameState] = useState('idle') // idle|checking|available|taken|invalid
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // A local ref instead of the previous window._unTimer — that name was
  // shared with AuthPage, so having both able to mount could let one
  // component's debounce clear the other's timer.
  const usernameTimer = useRef(null)

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    setError('')
    if (!clean) { setUsernameState('idle'); return }
    if (clean.length < 3) { setUsernameState('invalid'); return }
    if (!USERNAME_RE.test(clean)) { setUsernameState('invalid'); return }
    setUsernameState('checking')
    clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(async () => {
      // .maybeSingle() — .single() throws (and logs a 406) for the expected
      // "no row" case, which is the common outcome of an availability check.
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .neq('id', session.user.id)
        .maybeSingle()
      setUsernameState(data ? 'taken' : 'available')
    }, 500)
  }

  const usernameHint = () => {
    if (usernameState === 'checking') return { cls: styles.hintNeutral, msg: 'Checking availability…' }
    if (usernameState === 'available') return { cls: styles.hintOk, msg: '✓ Available' }
    if (usernameState === 'taken') return { cls: styles.hintBad, msg: '✗ Already taken — choose another' }
    if (usernameState === 'invalid') return { cls: styles.hintBad, msg: '3–20 characters, letters/numbers/underscores only' }
    return null
  }

  const canSave = username && usernameState === 'available' && country && !saving

  const save = async () => {
    if (!canSave) return
    if (!country) { setError('Please select your country.'); return }
    setSaving(true)
    setError('')
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        username: username.toLowerCase().trim(),
        display_name: displayName.trim() || null,
        country_code: country,
        username_set: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
    setSaving(false)
    if (updateErr) {
      setError('Something went wrong. Please try again.')
      return
    }
    onComplete()
  }

  const hint = usernameHint()
  const avatarUrl = session?.user?.user_metadata?.avatar_url

  return (
    <Modal open onClose={() => {}} size="full">
      <div className={styles.header}>
        {avatarUrl && <img src={avatarUrl} alt="" className={styles.avatar} />}
        <div className={styles.title}>Welcome to bingr! 🎬</div>
        <p className={styles.subtitle}>Set up your profile to get started. Takes 30 seconds.</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Username <span className={styles.required}>*</span></label>
        <div className={styles.usernameWrap}>
          <span className={styles.usernameAt}>@</span>
          <Input
            className={styles.usernameInput}
            value={username} onChange={e => handleUsernameChange(e.target.value)}
            placeholder="your_username" maxLength={20} autoFocus
            invalid={usernameState === 'taken' || usernameState === 'invalid'}
          />
        </div>
        {hint
          ? <div className={`${styles.hint} ${hint.cls}`}>{hint.msg}</div>
          : <div className={`${styles.hint} ${styles.hintNeutral}`}>Unique identifier on bingr. Letters, numbers, underscores.</div>
        }
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Display name <span className={styles.optional}>(optional)</span></label>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How you want to appear on bingr" maxLength={50} />
        <div className={`${styles.hint} ${styles.hintNeutral}`}>Defaults to your username if left blank.</div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Country <span className={styles.required}>*</span></label>
        <Select value={country} onChange={e => setCountry(e.target.value)}>
          <option value="">Select your country...</option>
          {COUNTRIES.map((c, i) =>
            c.disabled
              ? <option key={i} disabled value="">──────────────</option>
              : <option key={c.code} value={c.code}>{c.name}</option>
          )}
        </Select>
        <div className={`${styles.hint} ${styles.hintNeutral}`}>Used to show the right payment options. Cannot be changed later.</div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <Button variant="primary" className={styles.fullWidthBtn} onClick={save} disabled={!canSave} loading={saving}>Complete setup →</Button>

      <p className={styles.footnote}>You can edit your username and display name later in your profile settings.</p>
    </Modal>
  )
}
