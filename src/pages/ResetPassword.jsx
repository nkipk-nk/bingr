import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/errors'
import { logger } from '../lib/logger'

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session)
      setChecking(false)
    })
  }, [])

  const submit = async () => {
    setError('')
    if (!password) { setError('Please enter a new password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      logger.info('Password reset successful')
      await supabase.auth.signOut()
    } catch (err) {
      setError(friendlyAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div style={Wrap}>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Verifying reset link…</div>
    </div>
  )

  if (done) return (
    <div style={Wrap}>
      <div style={Card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={H2}>Password updated</h2>
        <p style={P}>Your password has been changed. You can now sign in with your new password.</p>
        <button onClick={onDone} style={BtnPrimary}>Go to sign in</button>
      </div>
    </div>
  )

  if (!validSession) return (
    <div style={Wrap}>
      <div style={Card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={H2}>Link expired or already used</h2>
        <p style={P}>Please request a new password reset link.</p>
        <button onClick={onDone} style={BtnPrimary}>Back to sign in</button>
      </div>
    </div>
  )

  return (
    <div style={Wrap}>
      <div style={Card}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <h2 style={H2}>Set new password</h2>
        <p style={P}>Choose a strong password — at least 6 characters.</p>

        <div style={{ marginBottom: 14 }}>
          <label style={L}>New password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password"
              autoFocus
              style={{ ...I, paddingRight: 44 }}
            />
            <button onClick={() => setShowPw(v => !v)} style={Eye} tabIndex={-1}>{showPw ? '🙈' : '👁️'}</button>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={L}>Confirm new password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showCPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Confirm password"
              style={{ ...I, paddingRight: 44 }}
            />
            <button onClick={() => setShowCPw(v => !v)} style={Eye} tabIndex={-1}>{showCPw ? '🙈' : '👁️'}</button>
          </div>
        </div>

        {error && <div style={ErrBox}>{error}</div>}

        <button onClick={submit} disabled={!password || !confirm || loading}
          style={{ ...BtnPrimary, opacity: !password || !confirm || loading ? 0.7 : 1 }}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </div>
  )
}

const Wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '1rem' }
const Card = { width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center' }
const H2 = { fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }
const P = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }
const L = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, textAlign: 'left' }
const I = { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const Eye = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }
const ErrBox = { fontSize: 13, color: '#e24b4a', padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 8, marginBottom: 12, textAlign: 'left' }
const BtnPrimary = { width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }
