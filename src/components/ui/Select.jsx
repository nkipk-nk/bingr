import { ChevronDown } from 'lucide-react'
import styles from './Select.module.css'

// §8 Select spec: same shell as Input, custom chevron replacing the native
// browser arrow so the control looks consistent across browsers.
export default function Select({ className = '', children, ...props }) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <select className={styles.select} {...props}>
        {children}
      </select>
      <ChevronDown size={16} className={styles.chevron} />
    </div>
  )
}
