import { useState, useRef } from 'react'
import { Mail, Eye, EyeOff } from 'lucide-react'
import { friendlyAuthError } from '../lib/errors'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/countries'
import { IMG } from '../lib/tmdb'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import styles from './AuthPage.module.css'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/
const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" className={styles.googleIconSvg}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function CollageStrip({ trending }) {
  const posters = [...(trending?.movies || []), ...(trending?.tv || [])]
    .filter(x => x.poster_path)
    .slice(0, 16)
  if (!posters.length) return null
  return (
    <div className={styles.collageStrip}>
      <div className={styles.collageGrid}>
        {posters.map((p, i) => (
          <div key={`${p.id}-${i}`} className={styles.collageTile}>
            <img src={IMG(p.poster_path)} alt="" loading="lazy" />
          </div>
        ))}
      </div>
      <div className={styles.collageScrim} />
    </div>
  )
}

export default function AuthPage({ onAuth, onShowPrivacy, onShowTerms, onForgotPassword, initialMode = 'login', trending }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
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
  // A local ref instead of the previous window._unTimer — that name was
  // shared with OnboardingModal, so having both mounted (e.g. mid-onboarding
  // in another tab) let one component's debounce clear the other's timer.
  const usernameTimer = useRef(null)

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(clean)
    if (!clean) { setUsernameState('idle'); return }
    if (!USERNAME_RE.test(clean)) { setUsernameState('invalid'); return }
    setUsernameState('checking')
    clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(async () => {
      // .maybeSingle() — .single() throws (and logs a 406) for the expected
      // "no row" case, which is the common outcome of an availability check.
      const { data } = await supabase.from('profiles').select('id').eq('username', clean).maybeSingle()
      setUsernameState(data ? 'taken' : 'available')
    }, 500)
  }

  const usernameHint = () => {
    if (usernameState === 'checking') return { cls: styles.hintNeutral, msg: 'Checking availability…' }
    if (usernameState === 'available') return { cls: styles.hintOk, msg: '✓ Available' }
    if (usernameState === 'taken') return { cls: styles.hintBad, msg: '✗ Already taken' }
    if (usernameState === 'invalid') return { cls: styles.hintBad, msg: '3–20 characters, letters/numbers/underscores only' }
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
      if (!country) { setError('Please select your country.'); return }
      if (password !== confirm) { setError('Passwords do not match.'); return }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
      if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy.'); return }
    }
    setLoading(true)
    const { error: err, data } = await onAuth(mode, email, password, username, country)
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

  const switchMode = (m) => { setMode(m); setError(''); setPassword(''); setConfirm(''); setUsername(''); setCountry(''); setUsernameState('idle'); setAgreed(false); setShowPw(false); setShowCPw(false); setAwaitingConfirmation(false); setResendMsg('') }
  const hint = usernameHint()

  if (awaitingConfirmation) return (
    <div className={styles.page}>
      <CollageStrip trending={trending} />
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.centerIcon}><Mail size={40} /></div>
          <div className={styles.centerText}>We sent a confirmation link to:</div>
          <div className={styles.centerEmail}>{email}</div>
          <div className={`${styles.centerText} ${styles.centerTextSpaced}`}>Click the link to activate your account, then come back and sign in. Check spam if needed.</div>
          {resendMsg && <div className={`${styles.resendBox} ${resendMsg.includes('resent') ? styles.resendOk : styles.resendErr}`}>{resendMsg}</div>}
          <Button variant="primary" className={styles.fullWidthBtn} onClick={handleResend} loading={resendLoading}>Resend confirmation email</Button>
          <Button variant="ghost" className={styles.fullWidthBtn} onClick={() => switchMode('login')}>Back to sign in</Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <CollageStrip trending={trending} />
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.brandRow}>
            <div className={styles.brandLogoRow}>
              <img src="/logo.png" alt="bingr" className={styles.brandLogo} />
              <span className={styles.brandName}>bingr</span>
            </div>
            <div className={styles.brandSub}>{mode === 'login' ? 'Welcome back.' : 'Create your free account.'}</div>
          </div>

          <button className={styles.googleBtn} onClick={handleGoogle} disabled={googleLoading}>
            {GOOGLE_ICON} {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div>

          {mode === 'signup' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Username *</label>
                <div className={styles.usernameWrap}>
                  <span className={styles.usernameAt}>@</span>
                  <Input
                    className={styles.usernameInput}
                    value={username} onChange={e => handleUsernameChange(e.target.value)}
                    placeholder="your_username" maxLength={20} autoFocus
                    invalid={usernameState === 'taken' || usernameState === 'invalid'}
                  />
                </div>
                {hint ? <div className={`${styles.hint} ${hint.cls}`}>{hint.msg}</div> : <div className={`${styles.hint} ${styles.hintNeutral}`}>This is how others will see you. You can change it later.</div>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Country *</label>
                <Select value={country} onChange={e => setCountry(e.target.value)}>
                  <option value="">Select your country...</option>
                  {COUNTRIES.map((c, i) =>
                    c.disabled
                      ? <option key={i} disabled value="">──────────────</option>
                      : <option key={c.code} value={c.code}>{c.name}</option>
                  )}
                </Select>
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <Input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus={mode === 'login'} autoComplete="email" />
          </div>

          <div className={mode === 'login' ? styles.fieldTight : styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <Input
                type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={styles.passwordInput}
              />
              <button className={styles.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1} type="button">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <div className={styles.forgotRow}>
              <button className={styles.forgotLink} onClick={onForgotPassword}>Forgot password?</button>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Confirm password</label>
                <div className={styles.passwordWrap}>
                  <Input
                    type={showCPw ? 'text' : 'password'} placeholder="Confirm password" value={confirm}
                    onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
                    autoComplete="new-password"
                    className={styles.passwordInput}
                  />
                  <button className={styles.eyeBtn} onClick={() => setShowCPw(v => !v)} tabIndex={-1} type="button">
                    {showCPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className={`${styles.agreeRow} ${agreed ? styles.agreeRowChecked : ''}`}>
                <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} className={styles.agreeCheckbox} />
                <label htmlFor="agree" className={styles.agreeLabel}>
                  I agree to the <span className={styles.agreeLink} onClick={onShowTerms}>Terms of Service</span> and <span className={styles.agreeLink} onClick={onShowPrivacy}>Privacy Policy</span>
                </label>
              </div>
            </>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          <Button variant="primary" className={styles.fullWidthBtn} onClick={submit} loading={loading}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>

          <div className={styles.switchRow}>
            {mode === 'login'
              ? <>No account? <span className={styles.switchLink} onClick={() => switchMode('signup')}>Sign up free</span></>
              : <>Already have one? <span className={styles.switchLink} onClick={() => switchMode('login')}>Sign in</span></>
            }
          </div>
        </div>
        <div className={styles.footerLinks}>
          <span className={styles.footerLink} onClick={onShowPrivacy}>Privacy Policy</span>
          <span className={styles.footerLink} onClick={onShowTerms}>Terms of Service</span>
        </div>
      </div>
    </div>
  )
}
