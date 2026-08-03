import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/errors'
import { logger } from '../lib/logger'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import styles from './AuthCardShell.module.css'

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
    <div className={styles.wrap}>
      <div className={styles.checkingText}>Verifying reset link…</div>
    </div>
  )

  if (done) return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <CheckCircle2 size={48} className={styles.iconSuccess} />
        <h2 className={styles.heading}>Password updated</h2>
        <p className={styles.body}>Your password has been changed. You can now sign in with your new password.</p>
        <Button variant="primary" onClick={onDone} className={styles.fullWidthBtn}>Go to sign in</Button>
      </div>
    </div>
  )

  if (!validSession) return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <AlertTriangle size={48} className={styles.iconWarning} />
        <h2 className={styles.heading}>Link expired or already used</h2>
        <p className={styles.body}>Please request a new password reset link.</p>
        <Button variant="primary" onClick={onDone} className={styles.fullWidthBtn}>Back to sign in</Button>
      </div>
    </div>
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <ShieldCheck size={36} className={styles.icon} />
        <h2 className={styles.heading}>Set new password</h2>
        <p className={styles.body}>Choose a strong password — at least 6 characters.</p>

        <div className={styles.field}>
          <label className={styles.label}>New password</label>
          <div className={styles.passwordWrap}>
            <Input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password"
              autoFocus
              className={styles.passwordInput}
            />
            <button onClick={() => setShowPw(v => !v)} className={styles.eyeBtn} tabIndex={-1} type="button">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Confirm new password</label>
          <div className={styles.passwordWrap}>
            <Input
              type={showCPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Confirm password"
              className={styles.passwordInput}
            />
            <button onClick={() => setShowCPw(v => !v)} className={styles.eyeBtn} tabIndex={-1} type="button">
              {showCPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <Button variant="primary" onClick={submit} disabled={!password || !confirm} loading={loading} className={styles.fullWidthBtn}>
          Update password
        </Button>
      </div>
    </div>
  )
}
