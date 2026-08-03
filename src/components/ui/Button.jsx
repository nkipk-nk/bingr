import { Loader2 } from 'lucide-react'
import styles from './Button.module.css'

// §8 Button spec (BINGR_DESIGN_SYSTEM.md): 5 variants × 2 sizes, optional
// pill radius, loading state that keeps the button's width stable by hiding
// (not removing) the label rather than swapping it out.
export default function Button({
  variant = 'primary',
  size = 'md',
  pill = false,
  loading = false,
  confirming = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const classes = [
    styles.button,
    styles[variant],
    variant !== 'icon' ? styles[size === 'sm' ? 'sizeSm' : 'sizeMd'] : '',
    pill ? styles.pill : '',
    loading ? styles.loading : '',
    confirming ? styles.confirming : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading} {...props}>
      <span className={loading ? styles.labelHidden : undefined}>{children}</span>
      {loading && (
        <span className={styles.spinner}>
          <Loader2 size={16} className={styles.spin} />
        </span>
      )}
    </button>
  )
}
