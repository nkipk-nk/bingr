import { useState } from 'react'
import { supabase } from '../lib/supabase'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function UsernamePrompt({ session, onSave }) {
  const [username, setUsername] = useState('')
  const [state, setState] = useState('idle') // idle|checking|available|taken|invalid
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    setError('')
    // Don't check empty field
    if (!clean) { setState('idle'); return }
    if (clean.length < 3) { setState('invalid'); return }
    if (!USERNAME_RE.test(clean)) { setState('invalid'); return }
    setState('checking')
    clearTimeout(window._unTimer)
    window._unTimer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .neq('id', session.user.id)
        .single()
      setState(data ? 'taken' : 'available')
    }, 500)
  }

  const hint = () => {
    if (state === 'checking') return { color: 'var(--text-muted)', msg: 'Checking…' }
    if (state === 'available') return { color: '#1d9e75', msg: '✓ Available' }
    if (state === 'taken') return { color: '#e24b4a', msg: '✗ Already taken' }
    if (state === 'invalid') return { color: '#e24b4a', msg: '3–20 characters, letters/numbers/underscores only' }
    return null
  }

  const canSave = username && state === 'available' && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true); setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase(), username_set: true, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    setSaving(false)
    if (error) { setError('Failed to save. Please try again.'); return }
    onSave(username.toLowerCase())
  }

  const h = hint()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Welcome to bingr!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Choose a username to get started. This is how others will see you on bingr. You can change it later.
          </p>
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>Username</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>@</span>
            <input
              value={username}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="your_username"
              maxLength={20}
              autoFocus
              style={{
                width: '100%', padding: '10px 12px 10px 28px', fontSize: 15,
                border: `1px solid ${state === 'taken' || state === 'invalid' ? '#e24b4a' : state === 'available' ? '#1d9e75' : 'var(--border)'}`,
                borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          {h && <div style={{ fontSize: 12, color: h.color, marginTop: 5 }}>{h.msg}</div>}
          {!h && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Letters, numbers, and underscores only. 3–20 characters.</div>}
        </div>

        {error && <div style={{ fontSize: 13, color: '#e24b4a', padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 8, marginTop: 10 }}>{error}</div>}

        <button
          onClick={save}
          disabled={!canSave}
          style={{
            width: '100%', padding: '11px', marginTop: 20,
            background: canSave ? 'var(--accent)' : 'var(--border)',
            color: canSave ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }}
        >{saving ? 'Saving…' : 'Set username →'}</button>
      </div>
    </div>
  )
}
