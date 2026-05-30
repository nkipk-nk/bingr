import { useState } from 'react'

const RATING_LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(''); setInfo('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match.'); return }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error: err, data } = await onAuth(mode, email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    if (mode === 'signup' && !data?.session) {
      setInfo('Account created! Check your email to confirm, then sign in.')
      setMode('login')
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') submit() }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', letterSpacing: -1, marginBottom: 6 }}>
            🎬 bingr
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Welcome back. Sign in to continue.' : 'Create your free account.'}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} autoFocus />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Password</label>
          <input style={inputStyle} type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
        </div>
        {mode === 'signup' && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Confirm password</label>
            <input style={inputStyle} type="password" placeholder="Confirm password" value={confirm}
              onChange={e => setConfirm(e.target.value)} onKeyDown={handleKey} />
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: '#e24b4a', marginBottom: 10 }}>{error}</div>}
        {info && <div style={{ fontSize: 13, color: '#1d9e75', marginBottom: 10 }}>{info}</div>}

        <button style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }} onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
          {mode === 'login' ? (
            <>No account? <span style={linkStyle} onClick={() => { setMode('signup'); setError(''); setInfo('') }}>Sign up free</span></>
          ) : (
            <>Already have one? <span style={linkStyle} onClick={() => { setMode('login'); setError(''); setInfo('') }}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }
const inputStyle = {
  width: '100%', padding: '9px 12px', fontSize: 14,
  border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--bg-input)', color: 'var(--text)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const btnStyle = {
  width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
  fontFamily: 'inherit', fontWeight: 500,
}
const linkStyle = { color: 'var(--accent)', cursor: 'pointer' }
