import styles from './Input.module.css'

// §8 Input spec: 40px height, radius-sm, bg-input fill, border-hairline;
// focus border becomes 1.5px magenta-bright; error state + helper text.
export default function Input({ error, helperText, className = '', id, ...props }) {
  const helper = error || helperText
  return (
    <div className={styles.wrap}>
      <input
        id={id}
        className={[styles.input, error ? styles.error : '', className].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        {...props}
      />
      {helper && <span className={[styles.helper, error ? styles.helperError : ''].filter(Boolean).join(' ')}>{helper}</span>}
    </div>
  )
}
