import styles from './Skeleton.module.css'

// §8 Skeleton spec: shapes match the real content exactly rather than
// generic grey bars — poster-tile skeletons are poster-tile-shaped, etc.
export default function Skeleton({ shape = 'rect', width, height, className = '', style, ...props }) {
  return (
    <div
      className={[styles.skeleton, styles[shape], className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}
