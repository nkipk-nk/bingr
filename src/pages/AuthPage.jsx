import { useState } from 'react'
import { friendlyAuthError } from '../lib/errors'
import { supabase } from '../lib/supabase'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/
const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function AuthPage({ onAuth, onShowPrivacy, onShowTerms, onForgotPassword }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [usernameState, setUsernameState] = useState('idle') // idle|checking|available|taken|invalid
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    if (!clean) { setUsernameState('idle'); return }
    if (!USERNAME_RE.test(clean)) { setUsernameState('invalid'); return }
    setUsernameState('checking')
    clearTimeout(window._unTimer)
    window._unTimer = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').eq('username', clean).single()
      setUsernameState(data ? 'taken' : 'available')
    }, 500)
  }

  const usernameHint = () => {
    if (usernameState === 'checking') return { color: 'var(--text-muted)', msg: 'Checking availability…' }
    if (usernameState === 'available') return { color: '#1d9e75', msg: '✓ Available' }
    if (usernameState === 'taken') return { color: '#e24b4a', msg: '✗ Already taken' }
    if (usernameState === 'invalid') return { color: '#e24b4a', msg: '3–20 characters, letters/numbers/underscores only' }
    return null
  }

  const submit = async () => {
    setError('')
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return }
    if (mode === 'signup') {
      if (!username) { setError('Please choose a username.'); return }
      if (!USERNAME_RE.test(username)) { setError('Username: 3–20 characters, letters, numbers, underscores only.'); return }
      if (usernameState === 'taken') { setError('That username is taken. Please choose another.'); return }
      if (password !== confirm) { setError('Passwords do not match.'); return }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
      if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy.'); return }
    }
    setLoading(true)
    const { error: err, data } = await onAuth(mode, email, password, username)
    setLoading(false)
    if (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) { setAwaitingConfirmation(true); return }
      setError(friendlyAuthError(err.message)); return
    }
    if (mode === 'signup' && !data?.session) setAwaitingConfirmation(true)
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) { setError(friendlyAuthError(error.message)); setGoogleLoading(false) }
  }

  const handleResend = async () => {
    setResendLoading(true); setResendMsg('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() })
    setResendLoading(false)
    setResendMsg(error ? friendlyAuthError(error.message) : 'Confirmation email resent! Check your inbox and spam folder.')
  }

  const switchMode = (m) => { setMode(m); setError(''); setPassword(''); setConfirm(''); setUsername(''); setUsernameState('idle'); setAgreed(false); setShowPw(false); setShowCPw(false); setAwaitingConfirmation(false); setResendMsg('') }
  const hint = usernameHint()

  if (awaitingConfirmation) return (
    <div style={Wrap}>
      <div style={Card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={H2}>Check your email</h2>
        <p style={Muted}>We sent a confirmation link to:</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>{email}</p>
        <p style={{ ...Muted, marginBottom: 24 }}>Click the link to activate your account, then come back and sign in. Check spam if needed.</p>
        {resendMsg && <div style={{ fontSize: 13, color: resendMsg.includes('resent') ? '#1d9e75' : '#e24b4a', padding: '8px 12px', background: resendMsg.includes('resent') ? 'rgba(29,158,117,0.08)' : 'rgba(226,75,74,0.08)', borderRadius: 8, marginBottom: 14 }}>{resendMsg}</div>}
        <button onClick={handleResend} disabled={resendLoading} style={{ ...BtnFull, marginBottom: 10, opacity: resendLoading ? 0.7 : 1 }}>{resendLoading ? 'Sending…' : 'Resend confirmation email'}</button>
        <button onClick={() => switchMode('login')} style={BtnGhost}>Back to sign in</button>
      </div>
    </div>
  )

  return (
    <div style={Wrap}>
      <div style={Card}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
            <img src="/android-chrome-192x192.png" alt="bingr" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', letterSpacing: -1 }}>bingr</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{mode === 'login' ? 'Welcome back.' : 'Create your free account.'}</div>
        </div>

        <button onClick={handleGoogle} disabled={googleLoading} style={{ width: '100%', padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', cursor: googleLoading ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, fontWeight: 500 }}>
          {GOOGLE_ICON} {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Username (signup only) */}
        {mode === 'signup' && (
          <div style={{ marginBottom: 14 }}>
            <label style={L}>Username *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>@</span>
              <input value={username} onChange={e => handleUsernameChange(e.target.value)} placeholder="your_username" maxLength={20} autoFocus
                style={{ ...I, paddingLeft: 28, borderColor: usernameState === 'taken' || usernameState === 'invalid' ? '#e24b4a' : usernameState === 'available' ? '#1d9e75' : 'var(--border)' }} />
            </div>
            {hint && <div style={{ fontSize: 12, color: hint.color, marginTop: 4 }}>{hint.msg}</div>}
            {!hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>This is how others will see you. You can change it later.</div>}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={L}>Email</label>
          <input style={I} type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus={mode === 'login'} autoComplete="email" />
        </div>

        <div style={{ marginBottom: mode === 'login' ? 4 : 14 }}>
          <label style={L}>Password</label>
          <div style={{ position: 'relative' }}>
            <input style={{ ...I, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            <button onClick={() => setShowPw(v => !v)} style={Eye} tabIndex={-1}>{showPw ? '🙈' : '👁️'}</button>
          </div>
        </div>

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <span onClick={onForgotPassword} style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>Forgot password?</span>
          </div>
        )}

        {mode === 'signup' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={L}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...I, paddingRight: 44 }} type={showCPw ? 'text' : 'password'} placeholder="Confirm password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="new-password" />
                <button onClick={() => setShowCPw(v => !v)} style={Eye} tabIndex={-1}>{showCPw ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, padding: '12px', background: 'var(--bg-input)', borderRadius: 8, border: `1px solid ${agreed ? 'var(--accent)' : 'var(--border)'}` }}>
              <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }} />
              <label htmlFor="agree" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, cursor: 'pointer' }}>
                I agree to the <span onClick={onShowTerms} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span> and <span onClick={onShowPrivacy} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span>
              </label>
            </div>
          </>
        )}

        {error && <div style={{ fontSize: 13, color: '#e24b4a', marginBottom: 12, padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 6 }}>{error}</div>}

        <button style={{ ...BtnFull, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} onClick={submit} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
          {mode === 'login'
            ? <>No account? <span style={Lk} onClick={() => switchMode('signup')}>Sign up free</span></>
            : <>Already have one? <span style={Lk} onClick={() => switchMode('login')}>Sign in</span></>
          }
        </div>
      </div>
      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
        <span style={Lk} onClick={onShowPrivacy}>Privacy Policy</span>
        <span style={Lk} onClick={onShowTerms}>Terms of Service</span>
      </div>
    </div>
  )
}

const Wrap = { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '1rem' }
const Card = { width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem 2rem' }
const H2 = { fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8, textAlign: 'center' }
const Muted = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 8, textAlign: 'center' }
const L = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }
const I = { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const Eye = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }
const BtnFull = { width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', fontWeight: 500 }
const BtnGhost = { width: '100%', padding: '10px', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }
const Lk = { color: 'var(--accent)', cursor: 'pointer' }
