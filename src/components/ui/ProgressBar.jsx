import styles from './ProgressBar.module.css'

// Small reusable primitive, not in the §8 spec by name but needed by
// several screens (Title Detail, Library, Diary progress lines) that all
// hand-rolled the same two-div bar — encapsulates the one genuinely
// dynamic value (fill %) so consuming screens can stay fully off inline
// styles themselves.
export default function ProgressBar({ value, max, color = 'var(--status-watched)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
