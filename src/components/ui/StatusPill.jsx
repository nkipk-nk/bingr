import { CheckCircle2, Play, Bookmark } from 'lucide-react'
import styles from './StatusPill.module.css'

const STATUS = {
  watched: { label: 'Watched', icon: CheckCircle2 },
  watching: { label: 'Watching', icon: Play },
  watchlist: { label: 'Watchlist', icon: Bookmark },
}

// §3/§8: solid-fill status colors, resolves BINGR_UI_AUDIT.md CX8.
export default function StatusPill({ status, className = '', ...props }) {
  const entry = STATUS[status]
  if (!entry) return null
  const Icon = entry.icon
  return (
    <span className={[styles.pill, styles[status], className].filter(Boolean).join(' ')} {...props}>
      <Icon size={12} />
      {entry.label}
    </span>
  )
}
