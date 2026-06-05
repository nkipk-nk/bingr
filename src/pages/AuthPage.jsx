import { useState } from 'react'
import { friendlyAuthError } from '../lib/errors'
import { supabase } from '../lib/supabase'

export default function AuthPage({ onAuth, onShowPrivacy, onShowTerms }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const submit = async () => {
    setError(''); setInfo('')
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return }
    if (mode === 'signup') {
      if (password !== confirm) { setError('Passwords do not match.'); return }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
      if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy to continue.'); return }
    }
    setLoading(true)
    const { error: err, data } = await onAuth(mode, email, password)
    setLoading(false)
    if (err) {
      const msg = friendlyAuthError(err.message)
      // Detect unconfirmed email on sign-in attempt
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setAwaitingConfirmation(true)
        return
      }
      setError(msg)
      return
    }
    if (mode === 'signup' && !data?.session) {
      // Supabase returned a user but no session = email confirmation required
      setAwaitingConfirmation(true)
    }
  }

  const handleResend = async () => {
    setResendLoading(true); setResendMsg('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() })
    setResendLoading(false)
    if (error) setResendMsg(friendlyAuthError(error.message))
    else setResendMsg('Confirmation email resent! Check your inbox (and spam folder).')
  }

  const handleKey = (e) => { if (e.key === 'Enter') submit() }
  const switchMode = (m) => {
    setMode(m); setError(''); setInfo('')
    setPassword(''); setConfirm(''); setAgreed(false)
    setAwaitingConfirmation(false); setResendMsg('')
  }

  // ── Email confirmation waiting screen ──
  if (awaitingConfirmation) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Check your email</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 6 }}>
          We sent a confirmation link to:
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>{email}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
          Click the link in the email to confirm your account, then come back here and sign in.
          Check your spam folder if you don't see it.
        </p>

        {resendMsg && (
          <div style={{ fontSize: 13, color: resendMsg.includes('resent') ? '#1d9e75' : '#e24b4a', padding: '8px 12px', background: resendMsg.includes('resent') ? 'rgba(29,158,117,0.08)' : 'rgba(226,75,74,0.08)', borderRadius: 8, marginBottom: 16 }}>
            {resendMsg}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resendLoading}
          style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: resendLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500, marginBottom: 12, opacity: resendLoading ? 0.7 : 1 }}
        >{resendLoading ? 'Sending...' : 'Resend confirmation email'}</button>

        <button
          onClick={() => switchMode('login')}
          style={{ width: '100%', padding: '10px', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >Back to sign in</button>
      </div>
    </div>
  )

  // ── Main auth form ──
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem 2rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', letterSpacing: -1, marginBottom: 6 }}>🎬 bingr</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Welcome back. Sign in to continue.' : 'Create your free account.'}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={L}>Email</label>
          <input style={I} type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} autoFocus autoComplete="email" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={L}>Password</label>
          <input style={I} type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </div>

        {mode === 'signup' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={L}>Confirm password</label>
              <input style={I} type="password" placeholder="Confirm password" value={confirm}
                onChange={e => setConfirm(e.target.value)} onKeyDown={handleKey} autoComplete="new-password" />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, padding: '12px', background: 'var(--bg-input)', borderRadius: 8, border: `1px solid ${agreed ? 'var(--accent)' : 'var(--border)'}` }}>
              <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }} />
              <label htmlFor="agree" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, cursor: 'pointer' }}>
                I agree to the{' '}
                <span onClick={onShowTerms} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span>
                {' '}and{' '}
                <span onClick={onShowPrivacy} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span>,
                including processing of my email to provide the bingr service.
              </label>
            </div>
          </>
        )}

        {error && (
          <div style={{ fontSize: 13, color: '#e24b4a', marginBottom: 12, padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 6 }}>{error}</div>
        )}

        <button
          style={{ width: '100%', padding: '10px', background: loading ? 'var(--border)' : 'var(--accent)', color: loading ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
          onClick={submit} disabled={loading}
        >{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
          {mode === 'login'
            ? <>No account? <span style={LK} onClick={() => switchMode('signup')}>Sign up free</span></>
            : <>Already have one? <span style={LK} onClick={() => switchMode('login')}>Sign in</span></>
          }
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
        <span style={LK} onClick={onShowPrivacy}>Privacy Policy</span>
        <span style={LK} onClick={onShowTerms}>Terms of Service</span>
      </div>
    </div>
  )
}

const L = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }
const I = { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const LK = { color: 'var(--accent)', cursor: 'pointer' }
