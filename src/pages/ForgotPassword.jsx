import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/errors'
import { logger } from '../lib/logger'

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email.trim()) return
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )
      if (error) throw error
      setSent(true)
      logger.info('Password reset email sent')
    } catch (err) {
      setError(friendlyAuthError(err.message))
      logger.warn('Password reset failed', { message: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div style={Wrap}>
      <div style={Card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={H2}>Check your email</h2>
        <p style={P}>We sent a password reset link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.<br />Click the link in the email to set a new password.</p>
        <p style={{ ...P, fontSize: 13, marginBottom: 24 }}>Check your spam folder if you don't see it within a minute.</p>
        <button onClick={onBack} style={BtnPrimary}>Back to sign in</button>
      </div>
    </div>
  )

  return (
    <div style={Wrap}>
      <div style={Card}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
        <h2 style={H2}>Forgot password?</h2>
        <p style={P}>Enter your email and we'll send you a reset link.</p>
        <div style={{ marginBottom: 14 }}>
          <label style={L}>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="you@example.com" autoFocus style={I} />
        </div>
        {error && <div style={ErrBox}>{error}</div>}
        <button onClick={submit} disabled={!email.trim() || loading}
          style={{ ...BtnPrimary, opacity: loading ? 0.7 : 1, cursor: !email.trim() || loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <button onClick={onBack} style={BtnGhost}>Back to sign in</button>
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
const ErrBox = { fontSize: 13, color: '#e24b4a', padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 6, marginBottom: 12 }
const BtnPrimary = { width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, marginBottom: 10 }
const BtnGhost = { width: '100%', padding: '10px', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }
