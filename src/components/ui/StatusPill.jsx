import { CheckCircle2, Play, Bookmark } from 'lucide-react'
import styles from './StatusPill.module.css'

const STATUS = {
  watched: { label: 'Watched', icon: CheckCircle2 },
  watching: { label: 'Watching', icon: Play },
  watchlist: { label: 'Watchlist', icon: Bookmark },
}

// §3/§8: solid-fill status colors, resolves BINGR_UI_AUDIT.md CX8.
// iconOnly: a small round chip with just the icon (title attr carries the
// label for hover/screen readers) — for tight spaces like MovieCard's
// corner badges, where a title-cased text pill next to another one just
// repeats what the hover overlay's own buttons already say.
export default function StatusPill({ status, className = '', iconOnly = false, ...props }) {
  const entry = STATUS[status]
  if (!entry) return null
  const Icon = entry.icon
  if (iconOnly) {
    return (
      <span className={[styles.iconPill, styles[status], className].filter(Boolean).join(' ')} title={entry.label} {...props}>
        <Icon size={12} />
      </span>
    )
  }
  return (
    <span className={[styles.pill, styles[status], className].filter(Boolean).join(' ')} {...props}>
      <Icon size={12} />
      {entry.label}
    </span>
  )
}
