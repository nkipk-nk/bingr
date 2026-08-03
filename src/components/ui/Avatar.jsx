import styles from './Avatar.module.css'

// §8 Avatar spec: 3 sizes only, radius-full, initials fallback on
// magenta-deep. Real image avatars use the same sizes with object-fit cover.
export default function Avatar({ size = 'md', src, name = '', className = '', ...props }) {
  const initials = name.trim().slice(0, 2).toUpperCase()
  return (
    <div className={[styles.avatar, styles[size], className].filter(Boolean).join(' ')} {...props}>
      {src ? <img className={styles.img} src={src} alt={name} /> : initials}
    </div>
  )
}
