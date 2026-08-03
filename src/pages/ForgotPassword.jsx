import { useState } from 'react'
import { Mail, KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/errors'
import { logger } from '../lib/logger'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import styles from './AuthCardShell.module.css'

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
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Mail size={48} className={styles.icon} />
        <h2 className={styles.heading}>Check your email</h2>
        <p className={styles.body}>We sent a password reset link to <strong className={styles.strong}>{email}</strong>.<br />Click the link in the email to set a new password.</p>
        <p className={[styles.body, styles.bodySm].join(' ')}>Check your spam folder if you don't see it within a minute.</p>
        <Button variant="primary" onClick={onBack} className={styles.fullWidthBtn}>Back to sign in</Button>
      </div>
    </div>
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <KeyRound size={36} className={styles.icon} />
        <h2 className={styles.heading}>Forgot password?</h2>
        <p className={styles.body}>Enter your email and we'll send you a reset link.</p>
        <div className={styles.field}>
          <label className={styles.label}>Email address</label>
          <Input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="you@example.com" autoFocus
          />
        </div>
        {error && <div className={styles.errorBox}>{error}</div>}
        <div className={styles.actions}>
          <Button variant="primary" onClick={submit} disabled={!email.trim()} loading={loading} className={styles.fullWidthBtn}>
            Send reset link
          </Button>
          <Button variant="ghost" onClick={onBack} className={styles.fullWidthBtn}>Back to sign in</Button>
        </div>
      </div>
    </div>
  )
}
