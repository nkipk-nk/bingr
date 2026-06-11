import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/countries'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function OnboardingModal({ session, onComplete }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState(
    // Pre-fill display name from Google profile if available
    session?.user?.user_metadata?.full_name || ''
  )
  const [country, setCountry] = useState('')
  const [usernameState, setUsernameState] = useState('idle') // idle|checking|available|taken|invalid
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    setError('')
    if (!clean) { setUsernameState('idle'); return }
    if (clean.length < 3) { setUsernameState('invalid'); return }
    if (!USERNAME_RE.test(clean)) { setUsernameState('invalid'); return }
    setUsernameState('checking')
    clearTimeout(window._unTimer)
    window._unTimer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .neq('id', session.user.id)
        .single()
      setUsernameState(data ? 'taken' : 'available')
    }, 500)
  }

  const usernameHint = () => {
    if (usernameState === 'checking') return { color: 'var(--text-muted)', msg: 'Checking availability…' }
    if (usernameState === 'available') return { color: '#1d9e75', msg: '✓ Available' }
    if (usernameState === 'taken') return { color: '#e24b4a', msg: '✗ Already taken — choose another' }
    if (usernameState === 'invalid') return { color: '#e24b4a', msg: '3–20 characters, letters/numbers/underscores only' }
    return null
  }

  const canSave = username &&
    usernameState === 'available' &&
    country &&
    !saving

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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 460,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '2rem',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          {avatarUrl && (
            <img src={avatarUrl} alt="" style={{ width: 60, height: 60, borderRadius: '50%', marginBottom: 12, border: '3px solid var(--accent)' }} />
          )}
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Welcome to bingr! 🎬
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Set up your profile to get started. Takes 30 seconds.
          </p>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 16 }}>
          <label style={L}>Username <span style={{ color: '#e24b4a' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>@</span>
            <input
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              placeholder="your_username"
              maxLength={20}
              autoFocus
              style={{
                ...I,
                paddingLeft: 28,
                borderColor: usernameState === 'taken' || usernameState === 'invalid'
                  ? '#e24b4a'
                  : usernameState === 'available'
                  ? '#1d9e75'
                  : 'var(--border)',
              }}
            />
          </div>
          {hint
            ? <div style={{ fontSize: 12, color: hint.color, marginTop: 5 }}>{hint.msg}</div>
            : <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Unique identifier on bingr. Letters, numbers, underscores.</div>
          }
        </div>

        {/* Display name */}
        <div style={{ marginBottom: 16 }}>
          <label style={L}>Display name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="How you want to appear on bingr"
            maxLength={50}
            style={I}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Defaults to your username if left blank.
          </div>
        </div>

        {/* Country */}
        <div style={{ marginBottom: 20 }}>
          <label style={L}>Country <span style={{ color: '#e24b4a' }}>*</span></label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{ ...I, cursor: 'pointer' }}
          >
            <option value="">Select your country...</option>
            {COUNTRIES.map((c, i) =>
              c.disabled
                ? <option key={i} disabled value="">──────────────</option>
                : <option key={c.code} value={c.code}>{c.name}</option>
            )}
          </select>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Used to show the right payment options. Cannot be changed later.
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#e24b4a', padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 8, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button
          onClick={save}
          disabled={!canSave}
          style={{
            width: '100%', padding: '12px',
            background: canSave ? 'var(--accent)' : 'var(--border)',
            color: canSave ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
        >
          {saving ? 'Saving…' : 'Complete setup →'}
        </button>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
          You can edit your username and display name later in your profile settings.
        </p>
      </div>
    </div>
  )
}

const L = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }
const I = {
  width: '100%', padding: '9px 12px', fontSize: 14,
  border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--bg-input)', color: 'var(--text)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
