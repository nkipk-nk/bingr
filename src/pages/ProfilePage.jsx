import { useState, useEffect } from 'react'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function ProfilePage({ profile, session, onUpdate, checkUsername, onBack }) {
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [usernameState, setUsernameState] = useState('idle') // idle | checking | available | taken | invalid
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setUsername(profile?.username || '')
    setDisplayName(profile?.display_name || '')
  }, [profile])

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    setSaved(false)
    if (!clean || clean === profile?.username) { setUsernameState('idle'); return }
    if (!USERNAME_RE.test(clean)) { setUsernameState('invalid'); return }
    setUsernameState('checking')
    clearTimeout(window._unameTimer)
    window._unameTimer = setTimeout(async () => {
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
      </div>
    </div>
  )
}

const L = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }
const I = { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const BackBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 16, fontFamily: 'inherit' }
