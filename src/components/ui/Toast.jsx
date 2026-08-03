import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import styles from './Toast.module.css'

const ICONS = { success: CheckCircle2, error: XCircle, neutral: Info }
const DISMISS_MS = 3500

// §8 Toast spec: auto-dismiss 3.5s, pauses on hover/touch, optional inline
// action (e.g. Undo — resolves BINGR_UI_AUDIT.md CX10's action-less toasts).
export default function Toast({ message, tone = 'neutral', action, onDismiss }) {
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef(null)

  const startTimer = () => {
    timerRef.current = setTimeout(() => setLeaving(true), DISMISS_MS)
  }

  useEffect(() => {
    startTimer()
    return () => clearTimeout(timerRef.current)
  }, [message])

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => onDismiss?.(), 150)
    return () => clearTimeout(t)
  }, [leaving, onDismiss])

  if (!message) return null
  const Icon = ICONS[tone]

  return (
    <div
      className={[styles.toast, leaving ? styles.leaving : ''].filter(Boolean).join(' ')}
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={startTimer}
      role="status"
    >
      <Icon size={18} className={[styles.icon, styles[tone]].join(' ')} />
      <span className={styles.message}>{message}</span>
      {action && <button className={styles.action} onClick={action.onClick}>{action.label}</button>}
    </div>
  )
}
