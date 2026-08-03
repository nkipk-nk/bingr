import { useState, useEffect, useRef } from 'react'
import { downloadFullExport } from '../lib/export'

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
    if (usernameState === 'checking') return { color: 'var(--text-muted)', msg: 'Checking…' }
    if (usernameState === 'available') return { color: '#1d9e75', msg: '✓ Available' }
    if (usernameState === 'taken') return { color: '#e24b4a', msg: '✗ Already taken' }
    if (usernameState === 'invalid') return { color: '#e24b4a', msg: 'Usernames: 3–20 chars, letters, numbers, underscores only' }
    return null
  }

  const hint = usernameHint()
  const initials = (profile?.display_name || profile?.username || session?.user?.email || '?').slice(0, 2).toUpperCase()

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={onBack} style={BackBtn}>← Back</button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Avatar area */}
        <div style={{ background: 'linear-gradient(135deg, var(--accent), #b52c1f)', padding: '2rem', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{profile?.display_name || profile?.username}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>@{profile?.username}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{session?.user?.email}</div>
          </div>
        </div>

        {/* Edit form */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Edit profile</div>

          <div style={{ marginBottom: 16 }}>
            <label style={L}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>@</span>
              <input value={username} onChange={e => handleUsernameChange(e.target.value)}
                style={{ ...I, paddingLeft: 28, borderColor: usernameState === 'taken' || usernameState === 'invalid' ? '#e24b4a' : usernameState === 'available' ? '#1d9e75' : 'var(--border)' }}
                maxLength={20} placeholder="your_username" />
            </div>
            {hint && <div style={{ fontSize: 12, color: hint.color, marginTop: 5 }}>{hint.msg}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Your unique identifier on bingr. Used in shared list URLs.</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={L}>Display name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={I}
              maxLength={50} placeholder="How you want to appear on bingr" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={L}>Profile visibility</label>
            <div
              onClick={togglePrivacy}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                background: 'var(--bg-input)', borderRadius: 10,
                border: `1px solid ${isPublic ? 'var(--border)' : 'var(--accent)'}`,
                cursor: privacySaving ? 'wait' : 'pointer', opacity: privacySaving ? 0.7 : 1,
              }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: isPublic ? 'var(--accent)' : 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 2, left: isPublic ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{isPublic ? '🌐 Public profile' : '🔒 Private profile'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {isPublic
                    ? 'Your profile page, ratings, and diary are visible to anyone with your link.'
                    : 'Only you can see your ratings and diary. Your username stays findable in search.'}
                </div>
              </div>
            </div>
            {privacyError && <div style={{ fontSize: 12, color: '#e24b4a', marginTop: 6 }}>{privacyError}</div>}
          </div>

          {error && <div style={{ fontSize: 13, color: '#e24b4a', padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 8, marginBottom: 14 }}>{error}</div>}
          {saved && <div style={{ fontSize: 13, color: '#1d9e75', padding: '8px 12px', background: 'rgba(29,158,117,0.08)', borderRadius: 8, marginBottom: 14 }}>✓ Profile saved</div>}

          <button onClick={save} disabled={!canSave || saving}
            style={{ width: '100%', padding: '10px', background: canSave ? 'var(--accent)' : 'var(--border)', color: canSave ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, fontSize: 14, cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 500 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Read-only info */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Email address</div>
          <div style={{ fontSize: 14, color: 'var(--text)' }}>{session?.user?.email}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>To change your email address, contact support@bingr.app</div>
        </div>

        {/* Data export */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Your data</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
            Download everything bingr has stored for your account — profile, watchlist, ratings, diary,
            episode progress, lists, comments, and follows — as a single JSON file.
          </div>
          <button onClick={handleExport} disabled={exporting}
            style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', cursor: exporting ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
            {exporting ? 'Preparing export…' : '📦 Download all my data'}
          </button>
          {exportNotice && (
            <div style={{ fontSize: 12, marginTop: 8, color: exportNotice.kind === 'ok' ? '#1d9e75' : '#e24b4a' }}>
              {exportNotice.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const L = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }
const I = { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const BackBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 16, fontFamily: 'inherit' }
