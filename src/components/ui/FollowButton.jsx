import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import styles from './FollowButton.module.css'

// §6 motion spec: background crossfade duration-fast + check-icon
// scale-pulse 200ms ease-spring on toggle — a signature spring moment,
// deliberately not overused (see StarRating for the other one).
export default function FollowButton({ following, onToggle, className = '', ...props }) {
  const [justToggled, setJustToggled] = useState(false)

  const handleClick = () => {
    setJustToggled(true)
    onToggle?.()
  }

  return (
    <button
      className={[styles.button, following ? styles.following : styles.notFollowing, className].filter(Boolean).join(' ')}
      onClick={handleClick}
      onAnimationEnd={() => setJustToggled(false)}
      {...props}
    >
      {following
        ? <Check key={justToggled ? 'in' : 'still'} size={14} className={justToggled ? styles.icon : ''} />
        : <Plus key={justToggled ? 'in' : 'still'} size={14} className={justToggled ? styles.icon : ''} />}
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
