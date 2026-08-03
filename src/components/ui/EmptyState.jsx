import Button from './Button'
import styles from './EmptyState.module.css'

// Shared empty-state shell — every screen currently hand-rolls its own
// (several with no real CTA at all, per BINGR_UI_AUDIT.md's gap findings).
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className={styles.wrap}>
      {Icon && <Icon size={40} className={styles.icon} />}
      {title && <div className={styles.title}>{title}</div>}
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && <Button variant="primary" onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
