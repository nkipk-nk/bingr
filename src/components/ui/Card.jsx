import styles from './Card.module.css'

// §8 Card spec: the single container primitive — no more per-file
// reinvention of "card-like div."
export default function Card({ roomy = false, className = '', children, ...props }) {
  return (
    <div className={[styles.card, roomy ? styles.roomy : '', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}
